import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
import cors from "cors";
import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
// Modelos (deben importarse antes de sync)
import "../features/business/customers/customer.model";
import { Routes } from "../routes/index";

dotenv.config({ quiet: true });

/**
 * Aplicación Express de TextilClean.
 *
 * Orden de arranque: settings → middlewares → routes → manejo de errores.
 */
export class App {
  public app: Application;
  public routePrv: Routes = new Routes();

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
    this.errorHandling();
  }

  private settings(): void {
    this.app.set("port", this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan("dev"));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.get("/api", (_req, res) => {
      res.json({ name: "TextilClean API", status: "ok" });
    });
    this.routePrv.customersRoutes.routes(this.app);
  }

  private errorHandling(): void {
    const bodyErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ error: "Malformed JSON body" });
        return;
      }
      next(err);
    };
    this.app.use(bodyErrorHandler);
  }

  /**
   * Conecta y sincroniza el esquema.
   *
   * `sync({ alter })` es cómodo en desarrollo pero NO es una migración de
   * producción: con DB_SYNC_FORCE=true se borran y recrean las tablas.
   */
  private async dbConnection(): Promise<void> {
    try {
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Conectando a ${dbInfo.connectionString}`);

      if (!(await testConnection())) {
        throw new Error(`No se pudo conectar a ${dbInfo.engine.toUpperCase()}`);
      }

      const force = process.env.DB_SYNC_FORCE === "true";
      const isMysql = sequelize.getDialect() === "mysql";

      if (isMysql) await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      try {
        await sequelize.sync({ force, alter: !force });
      } finally {
        if (isMysql) await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
      }

      console.log(force ? "📦 Base de datos recreada (DB_SYNC_FORCE=true)" : "📦 Base de datos sincronizada");
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1);
    }
  }

  async listen(): Promise<void> {
    await this.dbConnection();
    this.app.listen(this.app.get("port"));
    console.log(`🚀 TextilClean API en el puerto ${this.app.get("port")}`);
  }
}

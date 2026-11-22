import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
import cors from "cors";
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

  async listen(): Promise<void> {
    this.app.listen(this.app.get("port"));
    console.log(`🚀 TextilClean API en el puerto ${this.app.get("port")}`);
  }
}

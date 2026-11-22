import { Dialect, Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

interface DatabaseConfig {
  dialect: Dialect;
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
}

/**
 * Motores soportados por TextilClean. SQL Server y Oracle tienen variables en
 * `.env.example` pero todavía no tienen adaptador.
 */
const dbConfigurations: Record<string, DatabaseConfig> = {
  mysql: {
    dialect: "mysql",
    host: process.env.MYSQL_HOST || "localhost",
    username: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_NAME || "textilclean_db",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  },
  postgres: {
    dialect: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "",
    database: process.env.POSTGRES_NAME || "textilclean_db",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  },
};

const selectedEngine = process.env.DB_ENGINE || "mysql";
const selectedConfig = dbConfigurations[selectedEngine];

if (!selectedConfig) {
  throw new Error(`Motor de base de datos no soportado: ${selectedEngine}`);
}

export const sequelize = new Sequelize(
  selectedConfig.database,
  selectedConfig.username,
  selectedConfig.password,
  {
    host: selectedConfig.host,
    port: selectedConfig.port,
    dialect: selectedConfig.dialect,
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  }
);

export const getDatabaseInfo = () => ({
  engine: selectedEngine,
  database: selectedConfig.database,
  connectionString: `${selectedConfig.dialect}://${selectedConfig.username}@${selectedConfig.host}:${selectedConfig.port}/${selectedConfig.database}`,
});

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${selectedEngine.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error de conexión a ${selectedEngine.toUpperCase()}:`, error);
    return false;
  }
};

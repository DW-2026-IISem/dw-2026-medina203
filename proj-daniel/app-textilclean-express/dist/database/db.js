"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.getDatabaseInfo = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfigurations = {
    mysql: {
        dialect: "mysql",
        host: process.env.MYSQL_HOST || "localhost",
        username: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_NAME || "test",
        port: parseInt(process.env.MYSQL_PORT || "3306")
    },
    postgres: {
        dialect: "postgres",
        host: process.env.POSTGRES_HOST || "localhost",
        username: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "",
        database: process.env.POSTGRES_NAME || "test",
        port: parseInt(process.env.POSTGRES_PORT || "5432")
    }
};
const selectedEngine = process.env.DB_ENGINE || "mysql";
const selectedConfig = dbConfigurations[selectedEngine];
if (!selectedConfig) {
    throw new Error(`Motor de base de datos no soportado: ${selectedEngine}`);
}
console.log(`🔌 Conectando a base de datos: ${selectedEngine.toUpperCase()}`);
exports.sequelize = new sequelize_1.Sequelize(selectedConfig.database, selectedConfig.username, selectedConfig.password, {
    host: selectedConfig.host,
    port: selectedConfig.port,
    dialect: selectedConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
const getDatabaseInfo = () => {
    return {
        engine: selectedEngine,
        config: selectedConfig,
        connectionString: `${selectedConfig.dialect}://${selectedConfig.username}@${selectedConfig.host}:${selectedConfig.port}/${selectedConfig.database}`
    };
};
exports.getDatabaseInfo = getDatabaseInfo;
const testConnection = async () => {
    try {
        await exports.sequelize.authenticate();
        console.log(`✅ Conexión exitosa a ${selectedEngine.toUpperCase()}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error de conexión a ${selectedEngine.toUpperCase()}:`, error);
        return false;
    }
};
exports.testConnection = testConnection;
//# sourceMappingURL=db.js.map
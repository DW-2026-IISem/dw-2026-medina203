"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../../../database/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class Client extends sequelize_1.Model {
}
exports.Client = Client;
Client.init({
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: { msg: "Phone cannot be empty" },
        },
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: { msg: "Email must be a valid email address" },
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "inactive"),
        // Fail-safe: una fila insertada sin estado explícito NO queda visible en la API.
        // La vía de creación de la API siempre envía "active".
        defaultValue: "inactive",
        allowNull: false,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: "Client",
    tableName: "clients",
    timestamps: true,
    hooks: {
        beforeCreate: async (client) => {
            if (client.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                client.password = await bcryptjs_1.default.hash(client.password, salt);
            }
        },
        beforeUpdate: async (client) => {
            if (client.changed("password") && client.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                client.password = await bcryptjs_1.default.hash(client.password, salt);
            }
        },
        beforeBulkCreate: async (clients) => {
            for (const client of clients) {
                if (client.password) {
                    const salt = await bcryptjs_1.default.genSalt(10);
                    client.password = await bcryptjs_1.default.hash(client.password, salt);
                }
            }
        },
    },
});
//# sourceMappingURL=client.model.js.map
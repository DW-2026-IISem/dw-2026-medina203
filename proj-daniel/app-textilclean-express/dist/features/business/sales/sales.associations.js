"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_model_1 = require("../clients/client.model");
const sale_model_1 = require("./sale.model");
sale_model_1.Sale.belongsTo(client_model_1.Client, { foreignKey: "client_id", as: "client" });
client_model_1.Client.hasMany(sale_model_1.Sale, { foreignKey: "client_id", as: "sales" });
//# sourceMappingURL=sales.associations.js.map
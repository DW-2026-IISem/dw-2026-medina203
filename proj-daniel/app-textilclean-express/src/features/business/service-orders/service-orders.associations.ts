import { Customer } from "../customers/customer.model";
import { ServiceOrder } from "./service-order.model";

/** Un cliente tiene muchas órdenes de servicio. */
ServiceOrder.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
Customer.hasMany(ServiceOrder, { foreignKey: "customer_id", as: "service_orders" });

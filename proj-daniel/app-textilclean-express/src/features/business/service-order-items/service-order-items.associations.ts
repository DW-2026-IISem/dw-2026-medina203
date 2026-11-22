import { LaundryService } from "../laundry-services/laundry-service.model";
import { ServiceOrder } from "../service-orders/service-order.model";
import { ServiceOrderItem } from "./service-order-item.model";

/** Orden 1:N líneas; servicio 1:N líneas. */
ServiceOrderItem.belongsTo(ServiceOrder, { foreignKey: "service_order_id", as: "service_order" });
ServiceOrderItem.belongsTo(LaundryService, { foreignKey: "laundry_service_id", as: "laundry_service" });
ServiceOrder.hasMany(ServiceOrderItem, { foreignKey: "service_order_id", as: "items" });
LaundryService.hasMany(ServiceOrderItem, { foreignKey: "laundry_service_id", as: "order_items" });

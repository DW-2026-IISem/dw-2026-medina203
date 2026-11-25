import { fakerES_MX as faker } from "@faker-js/faker";
import { Op } from "sequelize";
import { LaundryService } from "../laundry-services/laundry-service.model";
import { ServiceOrder } from "../service-orders/service-order.model";
import { ServiceOrderItemsService } from "./service-order-items.service";

/**
 * Seeder de ServiceOrderItems: agrega líneas extra a órdenes que aún no se han
 * entregado, usando el service (recalcula totales en la misma transacción).
 * Se ejecuta después de `seedServiceOrders`.
 */
export async function seedServiceOrderItems(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  service_order_items: count=0, se omite");
    return 0;
  }
  const orders = await ServiceOrder.findAll({
    where: { status: "active", process_status: { [Op.ne]: "delivered" } },
  });
  const services = await LaundryService.findAll({ where: { status: "active" } });
  if (orders.length === 0 || services.length === 0) {
    console.log("⏭️  service_order_items: no hay órdenes abiertas o servicios activos");
    return 0;
  }

  const itemsService = new ServiceOrderItemsService();
  for (let i = 0; i < count; i += 1) {
    const laundryService = faker.helpers.arrayElement(services);
    await itemsService.create({
      service_order_id: faker.helpers.arrayElement(orders).id,
      laundry_service_id: laundryService.id,
      quantity: faker.number.int({ min: 2, max: 30 }),
      weight_kg:
        laundryService.billing_unit === "kg" ? faker.number.float({ min: 2, max: 25, fractionDigits: 1 }) : null,
    });
  }
  console.log(`✅ service_order_items: ${count} línea(s) extra insertadas`);
  return count;
}

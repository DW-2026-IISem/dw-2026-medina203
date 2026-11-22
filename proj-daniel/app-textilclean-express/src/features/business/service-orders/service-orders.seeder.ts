import { fakerES_MX as faker } from "@faker-js/faker";
import { Customer } from "../customers/customer.model";
import { LaundryService } from "../laundry-services/laundry-service.model";
import { ServiceOrder, ProcessStatus } from "./service-order.model";
import { ServiceOrdersService } from "./service-orders.service";

const PROGRESS: ProcessStatus[] = ["in_process", "ready", "delivered"];

/**
 * Seeder de ServiceOrders. Crea cada orden **a través del service** (misma
 * transacción, precios congelados y totales que usa la API) con 1 a 3 líneas,
 * y luego avanza algunas órdenes en el proceso. Idempotente.
 */
export async function seedServiceOrders(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  service_orders: count=0, se omite");
    return 0;
  }
  const existing = await ServiceOrder.count();
  if (existing > 0) {
    console.log(`⏭️  service_orders: ya hay ${existing} registro(s), se omite`);
    return 0;
  }
  const customers = await Customer.findAll({ where: { status: "active" } });
  const services = await LaundryService.findAll({ where: { status: "active" } });
  if (customers.length === 0 || services.length === 0) {
    console.log("⏭️  service_orders: faltan clientes o servicios activos");
    return 0;
  }

  const service = new ServiceOrdersService();
  for (let i = 0; i < count; i += 1) {
    const lines = faker.helpers.arrayElements(services, { min: 1, max: Math.min(3, services.length) });
    const order = await service.create({
      customer_id: faker.helpers.arrayElement(customers).id,
      received_at: faker.date.recent({ days: 20 }),
      tax: 0,
      discount: 0,
      notes: faker.helpers.maybe(() => "Entregar en recepción", { probability: 0.3 }) ?? null,
      items: lines.map((s) => ({
        laundry_service_id: s.id,
        quantity: faker.number.int({ min: 5, max: 60 }),
        weight_kg: s.billing_unit === "kg" ? faker.number.float({ min: 3, max: 45, fractionDigits: 1 }) : null,
      })),
    });

    // Avance aleatorio del proceso: 0 a 3 pasos.
    const steps = faker.number.int({ min: 0, max: PROGRESS.length });
    for (const next of PROGRESS.slice(0, steps)) {
      await service.changeProcessStatus(order.id!, { process_status: next });
    }
  }
  console.log(`✅ service_orders: ${count} orden(es) insertadas`);
  return count;
}

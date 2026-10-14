import { faker } from "@faker-js/faker";
import { Client } from "../clients/client.model";
import { Sale } from "./sale.model";

export async function seedSales(count: number): Promise<number> {
  if (count <= 0 || (await Sale.count()) > 0) return 0;

  const clients = await Client.findAll({ where: { status: "active" } });
  if (clients.length === 0) return 0;

  const rows = Array.from({ length: count }, () => {
    const client = clients[Math.floor(Math.random() * clients.length)];
    return {
      client_id: client.id,
      sale_date: faker.date.recent({ days: 30 }),
      subtotal: 0,
      tax: 0,
      discounts: 0,
      total: 0,
      status: "active" as const,
    };
  });
  await Sale.bulkCreate(rows);
  return rows.length;
}
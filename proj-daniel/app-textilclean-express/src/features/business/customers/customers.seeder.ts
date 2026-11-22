import { fakerES_MX as faker } from "@faker-js/faker";
import { Customer } from "./customer.model";

/** Sectores típicos que contratan lavandería industrial. */
const SECTORS = ["Hotel", "Clínica", "Restaurante", "Gimnasio", "Spa", "Hostal", "Centro Médico"];

/** NIT colombiano aleatorio: 9 dígitos + dígito de verificación. */
function fakeNit(): string {
  return `${faker.string.numeric({ length: 9, allowLeadingZeros: false })}-${faker.string.numeric(1)}`;
}

/**
 * Seeder de Customers (datos falsos con Faker, locale es_MX).
 * Idempotente: si la tabla ya tiene filas, no inserta.
 */
export async function seedCustomers(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️  customers: count=0, se omite");
    return 0;
  }
  const existing = await Customer.count();
  if (existing > 0) {
    console.log(`⏭️  customers: ya hay ${existing} registro(s), se omite`);
    return 0;
  }

  const rows = Array.from({ length: count }, (_, i) => {
    const sector = faker.helpers.arrayElement(SECTORS);
    const name = `${sector} ${faker.person.lastName()} ${faker.helpers.arrayElement(["S.A.S.", "Ltda.", "S.A."])}`;
    return {
      business_name: name,
      tax_id: fakeNit(),
      contact_name: faker.person.fullName(),
      phone: faker.string.numeric({ length: 10, allowLeadingZeros: false }).replace(/^./, "3"),
      email: `compras.${i}.${faker.string.alphanumeric(5)}@example.com`.toLowerCase(),
      address: faker.location.streetAddress(),
      status: "active" as const,
    };
  });

  await Customer.bulkCreate(rows);
  console.log(`✅ customers: ${count} registro(s) insertados`);
  return count;
}

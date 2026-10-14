import { faker } from "@faker-js/faker";
import { User } from "./user.model";

export const SEED_USERS = [
  { username: "admin", email: "admin@textilclean.local", password: "Admin123!" },
  { username: "seller", email: "seller@textilclean.local", password: "Seller123!" },
] as const;

export async function seedUsers(count: number): Promise<number> {
  if (count <= 0) return 0;

  let created = 0;
  for (const item of SEED_USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { username: item.username },
      defaults: { ...item, avatar: null, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (user.status !== "active") await user.update({ status: "active" });
  }

  const extras = Math.max(0, count - SEED_USERS.length);
  for (let index = 0; index < extras; index += 1) {
    const username = `user.${index}.${faker.string.alphanumeric(6)}`.toLowerCase();
    await User.create({
      username,
      email: `${username}@example.com`,
      password: "Password123!",
      avatar: null,
      status: "active",
    });
    created += 1;
  }
  return created;
}
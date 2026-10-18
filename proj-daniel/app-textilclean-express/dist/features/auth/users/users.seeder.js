"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_USERS = void 0;
exports.seedUsers = seedUsers;
const faker_1 = require("@faker-js/faker");
const user_model_1 = require("./user.model");
exports.SEED_USERS = [
    { username: "admin", email: "admin@textilclean.local", password: "Admin123!" },
    { username: "seller", email: "seller@textilclean.local", password: "Seller123!" },
];
async function seedUsers(count) {
    if (count <= 0)
        return 0;
    let created = 0;
    for (const item of exports.SEED_USERS) {
        const [user, wasCreated] = await user_model_1.User.findOrCreate({
            where: { username: item.username },
            defaults: { ...item, avatar: null, status: "active" },
        });
        if (wasCreated)
            created += 1;
        else if (user.status !== "active")
            await user.update({ status: "active" });
    }
    const extras = Math.max(0, count - exports.SEED_USERS.length);
    for (let index = 0; index < extras; index += 1) {
        const username = `user.${index}.${faker_1.faker.string.alphanumeric(6)}`.toLowerCase();
        await user_model_1.User.create({
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
//# sourceMappingURL=users.seeder.js.map
import { App } from "./config/index";

async function main(): Promise<void> {
  const app = new App();
  await app.listen();
}

main();

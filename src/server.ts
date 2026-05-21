import app from "./app.js";
import config from "./config/index.js";
import { initializeDatabase } from "./database/init.js";

async function bootstrap() {
  try {
    await initializeDatabase();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to boot", error);
  }
}
bootstrap();

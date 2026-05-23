import { Pool } from "pg";
import config from "../config/index.js";

const pool = new Pool({ connectionString: config.database_url });

pool.on("error", (err) => {
  console.error("Unexpected error", err);
  process.exit(-1);
});

export default pool;

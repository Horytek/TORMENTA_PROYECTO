import { SYNC_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(SYNC_DATABASE, "sync");
export { pool, getConnection };
export default pool;

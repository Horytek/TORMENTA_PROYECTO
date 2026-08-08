import { MAYORISTA_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(MAYORISTA_DATABASE, "mayorista");
export { pool, getConnection };
export default pool;

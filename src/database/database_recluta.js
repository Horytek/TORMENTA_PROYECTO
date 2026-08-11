import { RECLUTA_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(RECLUTA_DATABASE, "recluta");
export { pool, getConnection };
export default pool;

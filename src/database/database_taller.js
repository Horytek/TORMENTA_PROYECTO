import { TALLER_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(TALLER_DATABASE, "taller");
export { pool, getConnection };
export default pool;

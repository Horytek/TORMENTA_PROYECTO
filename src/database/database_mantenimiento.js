import { MANTENIMIENTO_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(MANTENIMIENTO_DATABASE, "mantenimiento");
export { pool, getConnection };
export default pool;

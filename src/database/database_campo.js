import { CAMPO_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(CAMPO_DATABASE, "campo");
export { pool, getConnection };
export default pool;

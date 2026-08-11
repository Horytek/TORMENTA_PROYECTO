import { ATELIER_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(ATELIER_DATABASE, "atelier");
export { pool, getConnection };
export default pool;

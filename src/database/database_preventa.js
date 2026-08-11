import { PREVENTA_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(PREVENTA_DATABASE, "preventa");
export { pool, getConnection };
export default pool;

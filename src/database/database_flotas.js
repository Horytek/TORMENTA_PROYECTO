import { FLOTAS_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(FLOTAS_DATABASE, "flotas");
export { pool, getConnection };
export default pool;

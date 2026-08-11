import { ACADEMIA_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(ACADEMIA_DATABASE, "academia");
export { pool, getConnection };
export default pool;

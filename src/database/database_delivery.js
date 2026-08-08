import { DELIVERY_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(DELIVERY_DATABASE, "delivery");
export { pool, getConnection };
export default pool;

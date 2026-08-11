import { TAXI_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(TAXI_DATABASE, "taxi");
export { pool, getConnection };
export default pool;

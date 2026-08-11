import { ENVIOS_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(ENVIOS_DATABASE, "envios");
export { pool, getConnection };
export default pool;

import { DESPACHO_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(DESPACHO_DATABASE, "despacho");
export { pool, getConnection };
export default pool;

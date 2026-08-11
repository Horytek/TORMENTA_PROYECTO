import { AGENDA_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(AGENDA_DATABASE, "agenda");
export { pool, getConnection };
export default pool;

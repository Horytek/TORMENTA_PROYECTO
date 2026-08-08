import { CRM_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(CRM_DATABASE, "crm");
export { pool, getConnection };
export default pool;

import { WMS_DATABASE } from "../config.js";
import { createProductPool } from "./createProductPool.js";

const { pool, getConnection } = createProductPool(WMS_DATABASE, "wms");
export { pool, getConnection };
export default pool;

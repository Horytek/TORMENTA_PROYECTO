
import { BaseRepository } from "./BaseRepository.js";

export class LogsRepository extends BaseRepository {
    constructor() {
        super("log_sistema");
    }

    async create(logData) {
        const query = `INSERT INTO ${this.tableName} SET ?`;
        return await this.query(query, logData);
    }

    async deleteOldLogs(cutoffDate, actions, exclude = true) {
        const operator = exclude ? 'NOT IN' : 'IN';
        const placeholders = actions.map(() => '?').join(',');

        const query = `
      DELETE FROM ${this.tableName}
      WHERE fecha < ? 
      AND accion ${operator} (${placeholders})
    `;

        return await this.query(query, [cutoffDate, ...actions]);
    }

    async getStats(id_tenant) {
        let tenantFilter = "";
        let params = [];

        if (id_tenant) {
            tenantFilter = "WHERE id_tenant = ?";
            params.push(id_tenant);
        }

        const query = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT id_usuario) as unique_users,
        COUNT(DISTINCT ip) as unique_ips,
        MIN(fecha) as oldest_log,
        MAX(fecha) as newest_log,
        COUNT(CASE WHEN fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as logs_last_24h,
        COUNT(CASE WHEN fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as logs_last_week,
        COUNT(CASE WHEN accion IN ('LOGIN_OK', 'LOGIN_FAIL', 'LOGOUT') THEN 1 END) as access_logs
      FROM ${this.tableName} 
      ${tenantFilter}
    `;

        const results = await this.query(query, params);
        return results[0];
    }

    async getActionStats(id_tenant, limit = 10) {
        let tenantFilter = "";
        let params = [];

        if (id_tenant) {
            tenantFilter = "WHERE id_tenant = ?";
            params.push(id_tenant);
        }

        const query = `
      SELECT 
        accion, 
        COUNT(*) as count,
        MAX(fecha) as last_occurrence
      FROM ${this.tableName} 
      ${tenantFilter}
      GROUP BY accion 
      ORDER BY count DESC 
      LIMIT ?
    `;

        return await this.query(query, [...params, limit]);
    }

    async findAll({ from, to, usuario, accion, modulo, id_tenant, limit, offset }) {
        const filtros = [];
        const params = [];

        if (id_tenant) {
            filtros.push("l.id_tenant = ?");
            params.push(id_tenant);
        }

        if (from) {
            filtros.push("l.fecha >= ?");
            params.push(from + " 00:00:00");
        }
        if (to) {
            filtros.push("l.fecha <= ?");
            params.push(to + " 23:59:59");
        }

        if (usuario) {
            filtros.push("l.id_usuario = ?");
            params.push(usuario);
        }
        if (accion) {
            filtros.push("l.accion LIKE ?");
            params.push(`%${accion}%`);
        }
        if (modulo) {
            filtros.push("l.id_modulo = ?");
            params.push(modulo);
        }

        const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

        const query = `
      SELECT SQL_CALC_FOUND_ROWS 
        l.id_log,
        l.fecha,
        l.id_usuario,
        u.usua,
        l.id_modulo,
        m.nombre_modulo,
        l.id_submodulo,
        s.nombre_sub,
        l.accion,
        l.recurso,
        l.descripcion,
        l.ip
      FROM ${this.tableName} l
      LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
      LEFT JOIN modulo m ON l.id_modulo = m.id_modulo  
      LEFT JOIN submodulos s ON l.id_submodulo = s.id_submodulo
      ${where}
      ORDER BY l.fecha DESC 
      LIMIT ? OFFSET ?
    `;

        const rows = await this.query(query, [...params, parseInt(limit), parseInt(offset)]);

        // Get total rows using a separate connection query or helper if available. 
        // BaseRepository `query` releases connection, so `FOUND_ROWS()` might fail if not same connection.
        // Ah, `FOUND_ROWS()` must be in the same connection.
        // My BaseRepository `query` gets a connection, executes, and releases.
        // So `SQL_CALC_FOUND_ROWS` won't work with `this.query()` if I call another query.
        // Refactoring: I should add a method to get data + count or handle it inside `findAll` manually.
        // Or I can modify `findAll` to use `getConnection` manually.

        return rows;
    }

    // Custom method to handle FOUND_ROWS correctly
    async findAllWithCount({ from, to, usuario, accion, modulo, id_tenant, limit, offset }) {
        let connection;
        try {
            connection = await this.getConnection();

            const filtros = [];
            const params = [];

            if (id_tenant) {
                filtros.push("l.id_tenant = ?");
                params.push(id_tenant);
            }

            if (from) {
                filtros.push("l.fecha >= ?");
                params.push(from + " 00:00:00");
            }
            if (to) {
                filtros.push("l.fecha <= ?");
                params.push(to + " 23:59:59");
            }

            if (usuario) {
                filtros.push("l.id_usuario = ?");
                params.push(usuario);
            }
            if (accion) {
                filtros.push("l.accion LIKE ?");
                params.push(`%${accion}%`);
            }
            if (modulo) {
                filtros.push("l.id_modulo = ?");
                params.push(modulo);
            }

            const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

            const query = `
          SELECT SQL_CALC_FOUND_ROWS 
            l.id_log,
            l.fecha,
            l.id_usuario,
            u.usua,
            l.id_modulo,
            m.nombre_modulo,
            l.id_submodulo,
            s.nombre_sub,
            l.accion,
            l.recurso,
            l.descripcion,
            l.ip
          FROM ${this.tableName} l
          LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
          LEFT JOIN modulo m ON l.id_modulo = m.id_modulo  
          LEFT JOIN submodulos s ON l.id_submodulo = s.id_submodulo
          ${where}
          ORDER BY l.fecha DESC 
          LIMIT ? OFFSET ?
        `;

            const [rows] = await connection.query(query, [...params, parseInt(limit), parseInt(offset)]);
            const [totalResult] = await connection.query("SELECT FOUND_ROWS() as total");

            return { rows, total: totalResult[0].total };
        } finally {
            if (connection) connection.release();
        }
    }

    async findById(id, id_tenant) {
        let query = `
      SELECT 
        l.*,
        u.nombre_usuario,
        m.nombre_modulo,
        s.nombre_submodulo
      FROM ${this.tableName} l
      LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
      LEFT JOIN modulo m ON l.id_modulo = m.id_modulo  
      LEFT JOIN submodulos s ON l.id_submodulo = s.id_submodulo
      WHERE l.id_log = ?
    `;
        const params = [id];

        if (id_tenant) {
            query += " AND l.id_tenant = ?";
            params.push(id_tenant);
        }

        const results = await this.query(query, params);
        return results[0];
    }
}


import { getConnection } from "../database/database.js";

/**
 * Clase base para Repositorios
 * Maneja la conexión y métodos comunes
 */
export class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async getConnection() {
        return await getConnection();
    }

    async query(sql, params) {
        let connection;
        try {
            connection = await this.getConnection();
            const [results] = await connection.query(sql, params);
            return results;
        } finally {
            if (connection) connection.release();
        }
    }

    // Método para ejecutar queries dentro de una transacción externa
    async queryWithConnection(connection, sql, params) {
        const [results] = await connection.query(sql, params);
        return results;
    }
}

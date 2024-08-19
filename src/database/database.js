import mysql from "mysql2/promise";
//import fs from 'fs';
//import path from 'path';
import { HOST, DATABASE, USER, PASSWORD, PORT_DB } from "../config.js";

/*const sslOptions = {
    ca: fs.readFileSync(path.resolve(__dirname, '../ca.pem'))
};*/

const getConnection = async () => {
    try {
        const connection = await mysql.createConnection({
            host: HOST,
            database: DATABASE,
            user: USER,
            password: PASSWORD,
            port: PORT_DB
        });
        console.log('Connected to the database');
        return connection;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
};

export { getConnection }; // Exportar directamente la función

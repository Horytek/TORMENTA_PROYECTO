import mysql from 'mysql2/promise';
import { HOST, PORT, DATABASE, USER, PASSWORD, SSL_CA_CONTENT } from '../config.js';

const connection = mysql.createPool({
    host: HOST,
    port: PORT,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    ssl: {
        ca: SSL_CA_CONTENT // Usa el contenido del certificado directamente
    }
});

const getConnection = async () => {
    try {
        const conn = await connection.getConnection();
        console.log("Connected to the database.");
        return conn;
    } catch (err) {
        console.error("Error connecting to the database: ", err);
        throw err;
    }
};

export default getConnection;

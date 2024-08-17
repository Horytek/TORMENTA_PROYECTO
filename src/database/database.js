import mysql from "mysql2/promise";
import fs from 'fs';
import path from 'path';
import { HOST, DATABASE, USER, PASSWORD, PORT_DB } from "../config.js";

const sslOptions = {
    ca: fs.readFileSync(path.resolve(__dirname, '../ca.pem')),
    rejectUnauthorized: false
};

const connection = mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    ssl: sslOptions
});

const getConnection = () => {
    return connection;
};

module.exports = {
    getConnection
};
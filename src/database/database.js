import mysql from "mysql2/promise";
import { HOST, DATABASE, USER, PASSWORD, PORT } from "../config.js";

const connection = mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT,
});

const getConnection = () => {
    return connection;
};

module.exports = {
    getConnection
};
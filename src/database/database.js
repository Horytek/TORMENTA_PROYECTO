import mysql from "mysql2/promise";
import { HOST, DATABASE, USER, PASSWORD } from "../config.js";

const connection = mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD
});

const getConnection = () => {
    return connection;
};

module.exports = {
    getConnection
};
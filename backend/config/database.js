const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'sigic_user',
    password: process.env.DB_PASSWORD || 'sigic_pass',
    database: process.env.DB_NAME || 'sigic_espoch',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool;
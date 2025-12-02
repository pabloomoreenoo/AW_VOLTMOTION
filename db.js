// conexion MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({       
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});                          // para utilizar promise API version de mysql => funciones async

module.exports = pool; 

/*async function getNotes() {
    const [rows] = await pool.query("SELECT * FROM notes");

    return rows;
}

async function getNote(id){
    const [rows] = await pool.query(`
        SELECT * FROM notes
        WHERE id = ?
        `, [id]);
    return rows[0];
}

async function createNote(title, content){
    const [result] = await pool.query(
                    `INSERT INTO notes (title, contents) VALUES (?, ?)`,
                    [title, content]
                );
    return result.insertId;
}

const result = await createNote('test', 'test')
console.log(result) 

export{pool};*/ 
 
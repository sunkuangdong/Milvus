import mysql from "mysql2/promise";

async function main() {
  const connectionConfig = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    multipleStatements: true,
  };

  const connection = await mysql.createConnection(connectionConfig);

  try {
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS hello CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE hello;`);

    // Create friends table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        gender VARCHAR(10),                -- Gender
        birth_date DATE,                   -- Birth date
        company VARCHAR(100),              -- Company
        title VARCHAR(100),                -- Job title
        phone VARCHAR(20),                 -- Current phone number
        wechat VARCHAR(50)                 -- WeChat ID
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert demo data
    const insertSql = `
      INSERT INTO friends (
        name,
        gender,
        birth_date,
        company,
        title,
        phone,
        wechat
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      "王经理", // name
      "男", // gender
      "1990-01-01", // birth_date
      "字节跳动", // company
      "产品经理/产品总监", // title
      "18612345678", // phone
      "wangjingli2024", // wechat
    ];

    const [result] = await connection.execute(insertSql, values);
    console.log("Database and table created successfully, demo data inserted, insert ID:", result.insertId);
  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Script execution failed:", err);
});
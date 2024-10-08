const mysql = require('mysql2/promise');
const config = require('../util/config');
const createHttpError = require('http-errors');

async function query(sql, params) {
  try {
    const connection = await mysql.createConnection(config.db);
  const [results, ] = await connection.execute(sql, params);
  connection.end();
  return results;
  } catch (error) {
    throw new createHttpError.Conflict(error.sqlMessage);
  }
  
}

module.exports = {
  query
}
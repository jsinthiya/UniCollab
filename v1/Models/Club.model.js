const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
class ClubModel{
    constructor(clubID,name,email,uniID)
    {
        this.clubID = clubID;
        this.name = name;
        this.email = email;
        this.uniID = uniID;
    }
    async create()
    {
        try {
            const result = await db.query(
              `INSERT INTO clubs 
              (clubID, name, email,uniID) 
              VALUES 
              ('${this.clubID}', '${this.name}', '${this.email}', '${this.uniID}')`
            );
      
            return {
                success: true,
                message: `New Club named ${this.name} has been created.`,
              };
          } catch (error) {
            return createError.InternalServerError(error);
          }
    }
    static async update(fields,clubID) {
        try {
          const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
          const values = Object.values(fields);
          const query = `UPDATE clubs SET ${updateFields} WHERE orgID = ?`;
          const result = await db.query(query, [...values, clubID]);
    
          return {
            success: true,
            message: `User with ID ${clubID} updated successfully.`,
          };
        } catch (error) {
          console.error('Error in updateUser:', error);
          return {
            success: false,
            error: 'An error occurred while updating the user.',
          };
        }
      }
      
      
  static async get(clubID,field = 'clubID') {
    const query = `SELECT * FROM clubs WHERE ${field} = ?`;
    const rows = await db.query(query, [clubID]);
    const data = helper.emptyOrRows(rows);
    if(!data.length) return null;
    return data;
  }

  static async getWithFilter(filters) {
    try {
      const filterClauses = Object.keys(filters).map(key => `${key} = ?`);
      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

      const query = `SELECT * FROM clubs ${whereClause}`;
      const values = Object.values(filters);

      const rows = await db.query(query, values);
      const data = helper.emptyOrRows(rows);
      if(!data.length) return null;
      return {
        data,
      };
    } catch (error) {
      return createError.InternalServerError();
    }
  } 
  static async getWithFilterOR(filters) {
    try {
      const filterClauses = Object.keys(filters).map(key => `${key} = ?`);
      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' OR ')}` : '';

      const query = `SELECT * FROM clubs ${whereClause}`;
      const values = Object.values(filters);

      const rows = await db.query(query, values);
      const data = helper.emptyOrRows(rows);
      if(!data.length) return null;
      return {
        data,
      };
    } catch (error) {
      return createError.InternalServerError();
    }
  }
  static async getMultiple(page = 1, listPerPage = 10) {
    const offset = helper.getOffset(page, listPerPage);
    const rows = await db.query(
      `SELECT clubs.*, university.name as uniName, users.username as clubUsername, (SELECT username FROM users WHERE userID = clubs.uniID) AS uniUnsername
      FROM clubs 
      JOIN university ON clubs.uniID = university.uniID
      JOIN users ON clubs.clubID = users.userID LIMIT ${offset},${listPerPage+1}`
    );
    const data = helper.emptyOrRows(rows.slice(0, listPerPage));
    const organizedData = data.map(club => ({
        clubID: club.clubID,
        name: club.name,
        email: club.email,
        username: club.clubUsername,
        university: {
            uniID: club.uniID,
            name: club.uniName,
            username: club.uniUnsername
        }
    }));
    const hasNextPage = rows.length > listPerPage;

    const meta = { page, hasNextPage };
    return {
      data:organizedData,
      meta,
    };
  }
}
module.exports = {
    ClubModel
}
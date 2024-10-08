const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
const bcrypt = require('bcrypt');
class OrganizationModel{
    constructor(orgID,name,email,website,approval,description)
    {
        this.orgID = orgID;
        this.name = name;
        this.email = email;
        this.website = website;
        this.approval = approval;
        this.description = description;
    }
    async create()
    {
        try {
            const result = await db.query(
              `INSERT INTO organization 
              (orgID, name, email,website,description) 
              VALUES 
              ('${this.orgID}', '${this.name}', '${this.email}', '${this.website}','${this.description}')`
            );
      
            return {
                success: true,
                message: `Approval request send for ${this.name}. We'll contract with you within 24h via email.`,
              };
          } catch (error) {
            return createError.InternalServerError(error);
          }
    }
    static async update(fields,orgID) {
        try {
          const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
          const values = Object.values(fields);
          const query = `UPDATE organization SET ${updateFields} WHERE orgID = ?`;
          const result = await db.query(query, [...values, orgID]);
    
          return {
            success: true,
            message: `User with ID ${orgID} updated successfully.`,
          };
        } catch (error) {
          console.error('Error in updateUser:', error);
          return {
            success: false,
            error: 'An error occurred while updating the user.',
          };
        }
      }
      
      
  static async get(orgID,field = 'orgID') {
    const query = `SELECT * FROM organization WHERE ${field} = ?`;
    const rows = await db.query(query, [orgID]);
    const data = helper.emptyOrRows(rows);
    if(!data.length) return null;
    return data;
  }

  static async getWithFilter(filters) {
    try {
      const filterClauses = Object.keys(filters).map(key => `${key} = ?`);
      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

      const query = `SELECT * FROM organization ${whereClause}`;
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

      const query = `SELECT * FROM organization ${whereClause}`;
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
}
module.exports = {
    OrganizationModel
}
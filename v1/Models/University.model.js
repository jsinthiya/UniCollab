const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
const bcrypt = require('bcrypt');
class UniversityModel{
    constructor(uniID,name,type,email,website,approval,description)
    {
        this.uniID = uniID;
        this.name = name;
        this.type = type;
        this.email = email;
        this.website = website;
        this.approval = approval;
        this.description = description;
    }
    async create()
    {
        try {
            const result = await db.query(
              `INSERT INTO university 
              (uniID, name,type, email,website,description) 
              VALUES 
              ('${this.uniID}', '${this.name}','${this.type}', '${this.email}', '${this.website}','${this.description}')`
            );

            return {
              success: true,
              message: `Approval request send for ${this.name}. We'll contract with you within 24h via email.`,
            };
              
          } catch (error) {
            return createError.InternalServerError(error);
          }
    }
    static async update(fields,uniID) {
        try {
          const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
          const values = Object.values(fields);
          const query = `UPDATE university SET ${updateFields} WHERE uniID = ?`;
          const result = await db.query(query, [...values, uniID]);
    
          return {
            success: true,
            message: `User with ID ${uniID} updated successfully.`,
          };
        } catch (error) {
          console.error('Error in updateUser:', error);
          return {
            success: false,
            error: 'An error occurred while updating the user.',
          };
        }
      }
      
      
  static async get(fieldValue,field = 'uniID') {
    const query = `SELECT * FROM university WHERE ${field} = '${fieldValue}'`;
    const rows = await db.query(query);
    const data = helper.emptyOrRows(rows);
    if(!data.length) return null;
    return data;
  }
  static async getAll() {
    const query = `SELECT * FROM university WHERE approval = 1`;
    const rows = await db.query(query);
    const data = helper.emptyOrRows(rows);
    if(!data.length) return null;
    return data;
  }
  static async getRegex(uniID,field = 'uniID') {
    const query = `SELECT allowedEmails	FROM university WHERE ${field} = ?`;
    const rows = await db.query(query, [uniID]);
    const data = helper.emptyOrRows(rows);
    if(!data.length) return null;
    return data[0].allowedEmails;
  }

  static async getPendingApproval(search) {
    search==undefined?search='':search;
    return db.query(`SELECT users.userID,users.username,users.email,users.name,users.role,users.avatar,university.website,university.description
    FROM users
    JOIN university ON users.userID = university.uniID
    WHERE (users.role = "guestUniversity" AND university.approval = 0) AND (users.name LIKE '%${search}%' OR users.username LIKE '%${search}%' OR users.email LIKE '%${search}%')
    UNION
    SELECT users.userID,users.username,users.email,users.name,users.role,users.avatar,
    organization.website,organization.description
    FROM users
    JOIN organization ON users.userID = organization.orgID
    WHERE (users.role = "guestOrg" AND organization.approval = 0) AND (users.name LIKE '%${search}%' OR users.username LIKE '%${search}%' OR users.email LIKE '%${search}%')`);
  
  }
  

}
module.exports = {
    UniversityModel
}
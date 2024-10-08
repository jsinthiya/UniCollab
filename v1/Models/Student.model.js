const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
const bcrypt = require('bcrypt');
class StudentModel{
    constructor(stuID,eduMail,uniID,department,enrollmentDate,graduationDate)
    {
        this.stuID = stuID;
        this.eduMail = eduMail;
        this.uniID = uniID;
        this.department = department;
        this.enrollmentDate = enrollmentDate;
        this.graduationDate = graduationDate;
    }
    async create()
    {
        try {
            const result = await db.query(`INSERT INTO students (stuID, eduMail, uniID, department, enrollmentDate, graduationDate) VALUES (?,?,?,?,?,?)`,[this.stuID,this.eduMail,this.uniID,this.department,this.enrollmentDate,this.graduationDate]);
            console.log(result);
            return {
                success: true,
                message: `Your Account Created Successfully`,
              };
          } catch (error) {
            return createError.InternalServerError(error);
          }
    }
    static async update(fields,stuID) {
        try {
          const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
          const values = Object.values(fields);
          const query = `UPDATE students SET ${updateFields} WHERE stuID = ?`;
          const result = await db.query(query, [...values, stuID]);
    
          return {
            success: true,
            message: `Student with ID ${stuID} updated successfully.`,
          };
        } catch (error) {
          console.error('Error in updateUser:', error);
          return {
            success: false,
            error: 'An error occurred while updating the user.',
          };
        }
      }
      
      
  static async get(stuID,field = 'stuID') {
    const query = `SELECT * FROM students WHERE ${field} = ?`;
    const rows = await db.query(query, [stuID]);
    const data = helper.emptyOrRows(rows);
    if(!data.length) return null;
    return data;
  }

  static async getWithFilter(filters) {
    try {
      const filterClauses = Object.keys(filters).map(key => `${key} = ?`);
      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

      const query = `SELECT * FROM students ${whereClause}`;
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

      const query = `SELECT * FROM students ${whereClause}`;
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
  static async studentDetails(stuID) {
    try {
      const query = `SELECT 
      u.name AS student_name,
      u.username AS student_username,
      u.email AS student_email,
      u.avatar AS avatar,
      s.eduMail AS edu_email,
      u.userID AS stuID,
      sd.fullName,
      sd.fatherName,
      sd.motherName,
      sd.dob,
      sd.jscBoard,
      sd.jscInstitute,
      sd.jscRoll,
      sd.jscReg,
      sd.jscYear,
      sd.jscResult,
      sd.sscBoard,
      sd.sscInstitute,
      sd.sscRoll,
      sd.sscReg,
      sd.sscYear,
      sd.sscResult,
      sd.hscBoard,
      sd.hscInstitute,
      sd.hscRoll,
      sd.hscReg,
      sd.hscYear,
      sd.hscResult,
      sd.presentAddress,
      sd.permanentAddress,
      sd.mobileNumber,
      uni.uniID AS university_id,
      (SELECT username FROM users WHERE userID = uni.uniID) AS uni_username,
      uni.name AS university_name,
      s.department AS department,
      s.enrollmentDate AS enrollment_date,
      s.graduationDate AS graduation_date
  FROM 
      users u
  LEFT JOIN 
      students s ON u.userID = s.stuID
  LEFT JOIN 
      university uni ON s.uniID = uni.uniID
  LEFT JOIN studentdetails sd ON sd.stuID = s.stuID
  WHERE (u.role  = 'student' OR u.role =  'user') AND u.userID = ?`;
      const rows = await db.query(query, [stuID]);
      const data = helper.emptyOrRows(rows);
      if(!data.length) return null;
      return {
        stuID: data[0].stuID,
        student_name: data[0].student_name,
        student_username: data[0].student_username,
        student_avatar: data[0].avatar,
        student_email: data[0].student_email,
        edu_email: data[0].edu_email,
        mobile: data[0].mobileNumber,
        personalDetails: {
            fullName: data[0].fullName,
            father_name: data[0].fatherName,
            mother_name: data[0].motherName,
            dob: data[0].dob,
            present_address: data[0].presentAddress,
            permanent_address: data[0].permanentAddress,

        },
        education: {
            jsc: {
                board: data[0].jscBoard,
                institute: data[0].jscInstitute,
                year: data[0].jscYear,
                roll: data[0].jscRoll,
                reg: data[0].jscReg,
                result: data[0].jscResult
            },
            ssc: {
                board: data[0].sscBoard,
                institute: data[0].sscInstitute,
                year: data[0].sscYear,
                roll: data[0].sscRoll,
                reg: data[0].sscReg,
                result: data[0].sscResult
            
            },
            hsc: {
                board: data[0].hscBoard,
                institute: data[0].hscInstitute,
                year: data[0].hscYear,
                roll: data[0].hscRoll,
                reg: data[0].hscReg,
                result: data[0].hscResult
            },
            university:
            {
                uniID: data[0].university_id,
                username: data[0].uni_username,
                name: data[0].university_name,
                email: data[0].university_email,
                department: data[0].department,
                enrollment_date: data[0].enrollment_date,
                graduation_date: data[0].graduation_date
            }
        },
    }
    } catch (error) {
      return createError.InternalServerError();
    }
  
  }
  static async addEducation(fields,stuID) {
    try {
      const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE studentdetails SET ${updateFields} WHERE stuID = ?`;
      const result = await db.query(query, [...values, stuID]);
  
      return {
        success: true,
        message: `Student with ID ${stuID} updated successfully.`,
      };
    } catch (error) {
      console.error('Error in updateUser:', error);
      return {
        success: false,
        error: 'An error occurred while updating the user.',
      };
    }
  }
  static async addDetails(fields,stuID) {
    try {
      let { phone, presentAddress, parmanentAddress, name, username, avatar } = fields;

      // Update studentdetails table
      await db.query(
        'UPDATE studentdetails SET mobileNumber = ?, presentAddress = ?, permanentAddress = ? WHERE stuID = ?',
        [phone, presentAddress, parmanentAddress, stuID],
        (error, results) => {
          if (error) throw error;
          console.log('Updated studentdetails table');
        }
      );
      let sql = 'UPDATE users SET name = ?, username = ?, avatar = ? WHERE userID = ?'
      let data = [name, username, avatar, stuID];
        if(avatar=="")
        {
          sql = 'UPDATE users SET name = ?, username = ? WHERE userID = ?'
          data = [name, username, stuID]
        }
        if(avatar==null)
        {
          let sql = `UPDATE users SET name = ?, username = ?, avatar = ''  WHERE userID = ?'`
         let data = [name, username, stuID];
        }
      // Update users table
      await db.query(
        sql,
        data,
        (error, results) => {
          if (error) throw error;
          console.log('Updated users table');
        }
      );
  
      return {
        success: true,
        message: `Student with ID ${stuID} updated successfully.`,
      };
    } catch (error) {
      console.error('Error in updateUser:', error);
      return {
        success: false,
        error: 'An error occurred while updating the user.',
      };
    }
  }
}
module.exports = {
    StudentModel
}
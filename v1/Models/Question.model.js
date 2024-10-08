const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
const bcrypt = require('bcrypt');
class QuestionModel {
  constructor(quesID, userID, quesText, imgPath) {
    this.quesID = quesID;
    this.userID = userID;
    this.quesText = quesText;
    this.imgPath = imgPath;
  }
  async create() {
    try {
      const result = await db.query(`INSERT INTO questions (quesID,userID,quesText,imgPath) VALUES ('${this.quesID}','${this.userID}','${this.quesText}','${this.imgPath}')`);
      return {
        success: true,
        message: `Question Created Successfully`,
      };
    } catch (error) {
      return createError.InternalServerError(error);
    }
  }
  static async update(fields, quesID) {
    try {
      const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE questions SET ${updateFields} WHERE quesID = ?`;
      const result = await db.query(query, [...values, quesID]);

      return {
        success: true,
        message: `${quesID} updated successfully.`,
      };
    } catch (error) {
      console.error('Error in update question:', error);
      return {
        success: false,
        error: 'An error occurred while updating the question.',
      };
    }
  }

  static async delete(quesID) {
    try {
      const query = `DELETE FROM questions WHERE quesID = ?`;
      const result = await db.query(query, [quesID]);
      return {
        success: true,
        message: `${quesID} deleted successfully.`,
      };
    } catch (error) {
      console.error('Error in delete question:', error);
      return {
        success: false,
        error: 'An error occurred while deleting the question.',
      };
    }
  }


  static async get(quesID, field = 'quesID') {
    const query = `SELECT * FROM questions WHERE ${field} = ?`;
    const rows = await db.query(query, [quesID]);
    const data = helper.emptyOrRows(rows);
    if (!data.length) return null;
    return data;
  }

  static async getWithAns(quesID) {
    const query = `SELECT 
    questions.quesID,
    questions.quesText,
    questions.imgPath,
    questions.status,
    questions.timestamp AS questionTimestamp,
    questions.userID AS stuID,
    users.name AS studentName,
    users.username AS studentUsername,
    users.avatar AS studentAvatar,
    university.uniID,
    university.name AS universityName,
    (SELECT username FROM users WHERE userID = university.uniID) AS universityUsername,
    answers.ansID,
    answers.ansText,
    answers.timestamp AS answerTimestamp,
    answers.userID AS answerUserID,
    (SELECT name FROM users WHERE userID = answers.userID) AS answerName,
    (SELECT username FROM users WHERE userID = answers.userID) AS answerUserName,
    (SELECT avatar FROM users WHERE userID = answers.userID) AS answerAvatar
  FROM
    questions
  JOIN
    users ON questions.userID = users.userID
  JOIN
    students ON users.userID = students.stuID
  JOIN
    university ON students.uniID = university.uniID
  LEFT JOIN
    answers ON questions.quesID = answers.quesID
  WHERE questions.quesID = ?
  ORDER BY
     answers.timestamp DESC`;
    const rows = await db.query(query, [quesID]);
    const data = helper.emptyOrRows(rows);
    if (!data.length) return null;

    const structuredData = [];
  
      data.forEach(row => {
        const existingQuestion = structuredData.find(q => q.quesID === row.quesID);
        if (!existingQuestion) {
          structuredData.push({
            quesID: row.quesID,
            quesText: row.quesText,
            imgPath: row.imgPath,
            status: row.status,
            timestamp: row.questionTimestamp,
            uploader: {
              student: {
                stuID: row.stuID,
                name: row.studentName,
                username: row.studentUsername,
                avatar: row.studentAvatar
              },
              university: {
                uniID: row.uniID,
                name: row.universityName,
                username: row.universityUsername
              }
            },
            answers: row.ansID
              ? [
                  {
                    ansID: row.ansID,
                    ansText: row.ansText,
                    timestamp: row.answerTimestamp,
                    userID: row.answerUserID,
                    name: row.answerName,
                    username: row.answerUserName,
                    avatar: row.answerAvatar
                  }
                ]
              : []
          });
        } else {
          existingQuestion.answers.push({
            ansID: row.ansID,
            ansText: row.ansText,
            timestamp: row.answerTimestamp,
            userID: row.answerUserID,
            name: row.answerName,
            username: row.answerUserName,
            avatar: row.answerAvatar
          });
        }
      });

    return structuredData[0];
  }

  static async getMultiple(page = 1, listPerPage = 10) {
    const offset = helper.getOffset(page, listPerPage);
    const rows = await db.query(
      `SELECT
      questions.quesID,
      questions.quesText,
      questions.imgPath,
      questions.status,
      questions.timestamp,
      questions.userID AS stuID,
      users.name AS studentName,
      users.username AS studentUsername,
      university.uniID,
      university.name AS universityName,
      (SELECT username FROM users WHERE userID = university.uniID) AS universityUsername
  FROM
      questions
  JOIN
      users ON questions.userID = users.userID
  JOIN
      students ON users.userID = students.stuID
  JOIN
      university ON students.uniID = university.uniID
  ORDER BY questions.timestamp DESC    
   LIMIT ${offset},${listPerPage + 1}`
    );
    const data = helper.emptyOrRows(rows.slice(0, listPerPage));
    const organizedData = data.map(ques => ({
      quesID: ques.quesID,
      quesText: ques.quesText,
      imgPath: ques.imgPath,
      status: ques.status,
      timestamp: ques.timestamp,
      uploader: {
        student: {
          stuID: ques.stuID,
          name: ques.studentName,
          username: ques.studentUsername,
        },
        university: {
          uniID: ques.uniID,
          name: ques.universityName,
          username: ques.universityUsername,
        },
      }
    }));
    const hasNextPage = rows.length > listPerPage;

    const meta = { page, hasNextPage };
    return {
      data: organizedData,
      meta,
    };
  }

  static async getQuestionsWithAnswers(page = 1, listPerPage = 10) {
    try {
      const offset = helper.getOffset(page, listPerPage);
      const rows = await db.query(`
        SELECT
          questions.quesID,
          questions.quesText,
          questions.imgPath,
          questions.status,
          questions.timestamp AS questionTimestamp,
          questions.userID AS stuID,
          users.name AS studentName,
          users.username AS studentUsername,
          users.avatar AS studentAvatar,
          university.uniID,
          university.name AS universityName,
          (SELECT username FROM users WHERE userID = university.uniID) AS universityUsername,
          answers.ansID,
          answers.ansText,
          answers.timestamp AS answerTimestamp,
          answers.userID AS answerUserID,
          (SELECT username FROM users WHERE userID = answers.userID) AS answerUserName,
          (SELECT name FROM users WHERE userID = answers.userID) AS answerName,
          (SELECT avatar FROM users WHERE userID = answers.userID) AS answerAvatar
        FROM
          questions
        JOIN
          users ON questions.userID = users.userID
        JOIN
          students ON users.userID = students.stuID
        JOIN
          university ON students.uniID = university.uniID
        LEFT JOIN
          answers ON questions.quesID = answers.quesID
        ORDER BY
          questions.timestamp DESC, answers.timestamp DESC
          LIMIT ${offset},${listPerPage + 1}`);
    
      const data = helper.emptyOrRows(rows.slice(0, listPerPage));
      const structuredData = [];
  
      data.forEach(row => {
        const existingQuestion = structuredData.find(q => q.quesID === row.quesID);
  
        if (!existingQuestion) {
          structuredData.push({
            quesID: row.quesID,
            quesText: row.quesText,
            imgPath: row.imgPath,
            status: row.status,
            timestamp: row.questionTimestamp,
            uploader: {
              student: {
                stuID: row.stuID,
                name: row.studentName,
                username: row.studentUsername,
                avatar: row.studentAvatar
              },
              university: {
                uniID: row.uniID,
                name: row.universityName,
                username: row.universityUsername
              }
            },
            answers: row.ansID
              ? [
                  {
                    ansID: row.ansID,
                    ansText: row.ansText,
                    timestamp: row.answerTimestamp,
                    userID: row.answerUserID,
                    name: row.answerName,
                    username: row.answerUserName,
                    avatar: row.answerAvatar
                  }
                ]
              : []
          });
        } else {
          existingQuestion.answers.push({
            ansID: row.ansID,
            ansText: row.ansText,
            timestamp: row.answerTimestamp,
            userID: row.answerUserID,
            username: row.answerUserName
          });
        }
      });
      
      const hasNextPage = rows.length > listPerPage;

    const meta = { page, hasNextPage };
    return {
      data: structuredData,
      meta,
    };
  
      
    } catch (error) {
      return createError.InternalServerError(error);
    }
  }

  static async getWithFilter(filters) {
    try {
      const filterClauses = Object.keys(filters).map(key => `${key} = ?`);
      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

      const query = `SELECT * FROM questions ${whereClause}`;
      const values = Object.values(filters);

      const rows = await db.query(query, values);
      const data = helper.emptyOrRows(rows);
      if (!data.length) return null;
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

      const query = `SELECT * FROM questions ${whereClause}`;
      const values = Object.values(filters);

      const rows = await db.query(query, values);
      const data = helper.emptyOrRows(rows);
      if (!data.length) return null;
      return {
        data,
      };
    } catch (error) {
      return createError.InternalServerError();
    }
  }

}
module.exports = {
  QuestionModel
}
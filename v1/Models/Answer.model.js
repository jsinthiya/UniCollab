const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
const bcrypt = require('bcrypt');
class AnswerModel {
  constructor(ansID,quesID, userID, ansText, imgPath) {
    this.ansID = ansID;
    this.quesID = quesID;
    this.userID = userID;
    this.ansText = ansText;
    this.imgPath = imgPath;
  }
  async create() {
    try {

        const query = `INSERT INTO answers (ansID,quesID, userID, ansText, imgPath) VALUES ( '${this.ansID}', '${this.quesID}', '${this.userID}', '${this.ansText}', '${this.imgPath}')`;
        const result = await db.query(query);
      return {
        success: true,
        message: `Answer has been Created for Question ID: ${this.quesID} Successfully`,
      };
    } catch (error) {
      return createError.InternalServerError(error);
    }
  }
    static async get(ansID) {
        try {
        const query = `SELECT 
        answers.ansID,
        answers.quesID,
        answers.ansText,
        answers.imgPath,
        answers.timestamp AS answerTimestamp,
        answers.userID AS answerUserID,
        users_answer.username AS answerUsername,
        users_answer.name AS answerName,
        feedback.feedbackID,
        feedback.comment,
        feedback.rating,
        feedback.timestamp AS feedbackTimestamp,
        feedback.userID AS feedbackUserID,
        users_feedback.username AS feedbackUsername,
        users_feedback.name AS feedbackName
    FROM answers
    LEFT JOIN feedback ON answers.ansID = feedback.ansID
    LEFT JOIN users AS users_answer ON answers.userID = users_answer.userID
    LEFT JOIN users AS users_feedback ON feedback.userID = users_feedback.userID
    WHERE answers.ansID = ?
    ORDER BY feedback.timestamp DESC;
    
        `;
        const data = await db.query(query, [ansID]);
        if (data.length === 0) {
            return null;
        }
        return data;
        } catch (error) {
        return createError.InternalServerError(error);
        }
    }
 static async getQuestionAnswers(quesID) {
    try {
        const query = `SELECT 
        answers.ansID,
        answers.quesID,
        answers.ansText,
        answers.imgPath,
        answers.timestamp AS answerTimestamp,
        answers.userID AS answerUserID,
        users_answer.username AS answerUsername,
        users_answer.name AS answerName,
        users_answer.avatar AS answerAvatar,
        feedback.feedbackID,
        feedback.comment,
        feedback.rating,
        feedback.timestamp AS feedbackTimestamp,
        feedback.userID AS feedbackUserID,
        users_feedback.username AS feedbackUsername,
        users_feedback.name AS feedbackName,
        users_feedback.avatar AS feedbackAvatar
    FROM answers
    LEFT JOIN feedback ON answers.ansID = feedback.ansID
    LEFT JOIN users AS users_answer ON answers.userID = users_answer.userID
    LEFT JOIN users AS users_feedback ON feedback.userID = users_feedback.userID
    WHERE answers.quesID = ?
    ORDER BY feedback.timestamp DESC;`
        const data = await db.query(query, [quesID]);
        const transformedArray = data.reduce((result, item) => {
            const existingItem = result.find(i => i.ansID === item.ansID);
        
            if (!existingItem) {
                const newItem = {
                    ansID: item.ansID,
                    quesID: item.quesID,
                    ansText: item.ansText,
                    imgPath: item.imgPath,
                    answerTimestamp: item.answerTimestamp,
                    answerUser: {
                        userID: item.answerUserID,
                        username: item.answerUsername,
                        name: item.answerName,
                        avatar: item.answerAvatar
                    },
                    feedback: []
                };
        
                if (item.feedbackID !== null) {
                    newItem.feedback.push({
                        feedbackID: item.feedbackID,
                        comment: item.comment,
                        rating: item.rating,
                        feedbackTimestamp: item.feedbackTimestamp,
                        feedbackUser: {
                            userID: item.feedbackUserID,
                            username: item.feedbackUsername,
                            name: item.feedbackName,
                            avatar: item.feedbackAvatar
                        }
                    });
                }
        
                result.push(newItem);
            } else {
                if (item.feedbackID !== null) {
                    existingItem.feedback.push({
                        feedbackID: item.feedbackID,
                        comment: item.comment,
                        rating: item.rating,
                        feedbackTimestamp: item.feedbackTimestamp,
                        feedbackUser: {
                            userID: item.feedbackUserID,
                            username: item.feedbackUsername,
                            name: item.feedbackName
                        }
                    });
                }
            }
        
            return result;
        }, []);
        return transformedArray;
    }
    catch (error) {
        return createError.InternalServerError(error);
    }
}
  static async update(fields, ansID) {
    try {
      const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE answers SET ${updateFields} WHERE ansID = ?`;
      const result = await db.query(query, [...values, ansID]);

      return {
        success: true,
        message: `${ansID} updated successfully.`,
      };
    } catch (error) {
      console.error('Error in update question:', error);
      return {
        success: false,
        error: 'An error occurred while updating the question.',
      };
    }
  }

  static async delete(ansID) {
    try {
      const query = `DELETE FROM answers WHERE ansID = ?`;
      const result = await db.query(query, [ansID]);
      return {
        success: true,
        message: `${ansID} deleted successfully.`,
      };
    } catch (error) {
      console.error('Error in delete question:', error);
      return {
        success: false,
        error: 'An error occurred while deleting the question.',
      };
    }
  }
}

module.exports = {
    AnswerModel,
    };
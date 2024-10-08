const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
const bcrypt = require('bcrypt');
class FeedbackModel {
  constructor(feedbackID,ansID, userID, comment) {
    this.feedbackID = feedbackID;
    this.ansID = ansID;
    this.userID = userID;
    this.comment = comment;
  }
  async create() {
    try {

        const query = `INSERT INTO feedback (feedbackID,ansID, userID, comment) VALUES ( '${this.feedbackID}', '${this.ansID}', '${this.userID}', '${this.comment}')`;
        const result = await db.query(query);
      return {
        success: true,
        message: `Answer has been Created for Question ID: ${this.quesID} Successfully`,
      };
    } catch (error) {
      return createError.InternalServerError(error);
    }
  }

  static async get(feedbackID) {
    try {
      const query = `SELECT * FROM feedback WHERE feedbackID = ?`;
      const data = await db.query(query, [feedbackID]);
      if (data.length === 0) {
        return null;
      }
      return data[0];
    } catch (error) {
      return createError.InternalServerError(error);
    }
  }

  static async update(fields, feedbackID) {
    try {
      const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      const query = `UPDATE feedback SET ${updateFields} WHERE feedbackID = ?`;
      const result = await db.query(query, [...values, feedbackID]);

      return {
        success: true,
        message: `${feedbackID} updated successfully.`,
      };
    } catch (error) {
      console.error('Error in update question:', error);
      return {
        success: false,
        error: 'An error occurred while updating the question.',
      };
    }
  }

  static async delete(feedbackID) {
    try {
      const query = `DELETE FROM feedback WHERE feedbackID = ?`;
      const result = await db.query(query, [feedbackID]);
      return {
        success: true,
        message: `${feedbackID} deleted successfully.`,
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
    FeedbackModel,
    };
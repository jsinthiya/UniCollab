const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
class CommitModel{
   constructor(commitID,projectID,commitMessage,commitDate,commitAuthor)
   {
       this.commitID = commitID;
       this.projectID = projectID;
       this.commitMessage = commitMessage;
       this.commitDate = commitDate;
       this.commitAuthor = commitAuthor;
   }
 
}
module.exports = {
    CommitModel
}
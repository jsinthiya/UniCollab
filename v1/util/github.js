const createHttpError = require("http-errors");
const { query } = require("../services/db");
const { db } = require("./config");
const crypto = require('crypto');
async function addProjectCommits(owner, repo,projectID) {
      const commits = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        }
        });
        const commitData = await commits.json();
        if(commits.status!=200)
        {
            return null;
        }
        const Data = [];
        commitData.forEach(commit => {
            const d = {
                committer: commit.commit.committer,
                message: commit.commit.message,
                date: commit.commit.committer.date 
               }
               d.committer.avatar=commit.author?.avatar_url?commit.author.avatar_url:null;
               d.committer.github = commit.author?.html_url?commit.author.html_url:null;
            Data.push(d)

    });
    const usersTable = await query('SELECT userID,username,email,name,role,avatar FROM users');

    Data.forEach(commit => {
        const user = usersTable.find(user => user.email === commit.committer.email)
        if (user) {
            commit.committer = user;
        }
        else{
            delete Data[Data.indexOf(commit)]
        }
    })

    var filtered = Data.filter(function (el) {
        return el != null;
      });

      
      const values = filtered.map(commit => {
        return `('${crypto.randomUUID()}','${projectID}','${commit.committer.userID}', '${commit.message.replace(/'/g, "''")}', '${commit.date}')`;
    }).join(',');

    const sql = `
            INSERT INTO project_contributors (contributionID,projectID, contributorID, commit, date)
            VALUES ${values}
        `;
    const result = await query(sql);
    return result;
     
}


async function getCommits(owner, repo) {
    const commits = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        }
        });
        const commitData = await commits.json();
        if(commits.status!=200)
            return [];
        return commitData;
}

module.exports = {
    addProjectCommits,
    getCommits
}
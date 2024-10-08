const db = require('../services/db');
const helper = require('../util/helper');
const createError = require('http-errors');
function generateId() {
    return Math.floor(Math.random() * 1000000);
}
class ProjectModel{
    constructor(obj)
    {
        this.projectID = generateId();
        this.title = obj.title;
        this.description = obj.description;
        this.owner = obj.owner;
        this.gitLink = obj.gitLink;
        this.logo = obj.logo;
        this.privacy = obj.privacy;
        this.status = "In Progress";
    }
    async create()
    {
        try{
            const query = `INSERT INTO projects (projectID,title,description,owner,gitLink,logo,privacy,status) VALUES (?,?,?,?,?,?,?,?)`;
            const result = await db.query(query,[this.projectID,this.title,this.description,this.owner,this.gitLink,this.logo,this.privacy,this.status]);
            return result;
        }
        catch(err)
        {
            console.log(err);
            throw err;
        }
    }
    static async getUserProjects(userID){
        try{
            const query = `SELECT DISTINCT projects.*
            FROM project_contributors
            JOIN projects ON project_contributors.projectID = projects.projectID
            WHERE contributorID = ? OR projects.owner = ?;
            `;
            const result = await db.query(query,[userID,userID]);
            return result;
        }
        catch(err)
        {
            throw err;
        }
    }
    static async getProject(projectID){
        try{
            const query = `SELECT 
            projects.*, 
            users.userID, 
            users.username, 
            users.email, 
            users.name, 
            users.role, 
            users.avatar,
            (
               SELECT COUNT(DISTINCT project_contributors.contributorID)
                FROM project_contributors
                WHERE project_contributors.projectID = projects.projectID
            ) AS contributor_count,
            (
                SELECT COUNT(project_contributors.contributionID)
                FROM project_contributors
                WHERE project_contributors.projectID = projects.projectID
            ) AS contribution_count
        FROM 
            projects
        JOIN 
            users ON projects.owner = users.userID        
            WHERE projectID = ?`;
            const result = await db.query(query,[projectID]);
            if(result.length === 0)
            {
                throw createError.NotFound('Project not found');
            }
            const project = {
                projectID: result[0].projectID,
                title: result[0].title,
                shortDescription: result[0].shortDescription,
                description: result[0].description,
                createdAt: result[0].createdAt,
                owner: {
                    userID: result[0].userID,
                    username: result[0].username,
                    email: result[0].email,
                    name: result[0].name,
                    role: result[0].role,
                    avatar: result[0].avatar
                },
                gitLink: result[0].gitLink,
                liveLink: result[0].liveLink,
                colabLink: result[0].colabLink,
                logo: result[0].logo,
                privacy: result[0].privacy,
                status: result[0].status,
                contributor_count: result[0].contributor_count,
                contribution_count: result[0].contribution_count
            }
            return project;
        }
        catch(err)
        {
            throw err;
        }
    }
    static async getProjectDetails(projectID){
        try{
            const query = `SELECT p.*,
            c.categoryName,
            u.name AS ownerName,
            u.username AS ownerUsername,
            u.avatar AS ownerAvatar,
            (SELECT date
                FROM project_contributors
                WHERE project_contributors.projectID = p.projectID
                ORDER BY date DESC
                LIMIT 1) AS lastCommitTime,
            (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'taskID', t.taskID,
                            'taskTitle', t.title,
                            'taskStatus', t.status,
                            'taskTargetDate', t.targetDate,
                            'taskDescription', t.description,
                            'taskAssignUsers', (
                                SELECT JSON_ARRAYAGG(
                                           JSON_OBJECT(
                                               'id', tu.userID,
                                               'name', tu.name,
                                               'avatar', tu.avatar,
                                               'username', tu.username
                                           )
                                       )
                                FROM users tu
                                JOIN user_project_task ut ON tu.userID = ut.userID
                                WHERE ut.taskID = t.taskID
                            )
                        )
                    )
             FROM project_tasks t
             WHERE t.projectID = p.projectID
            ) AS tasks,
            (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'featureID', f.featureID,
                            'featureName', f.featureName,
                            'featureDescription', f.featureDescription,
                            'featureContributors', (
                                SELECT JSON_ARRAYAGG(
                                           JSON_OBJECT(
                                               'id', fu.contributorID,
                                               'name', u.name,
                                               'avatar', u.avatar,
                                               'username', u.username
                                           )
                                       )
                                FROM users u
                                JOIN projects_features_contributors fu ON fu.contributorID = u.userID
                                WHERE fu.featureID = f.featureID
                            )
                        )
                    )
             FROM projects_features f
             WHERE f.projectID = p.projectID
            ) AS features,
            (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pc.contributorID,
                            'name', u.name,
                            'avatar', u.avatar,
                            'username', u.username
                        )
                    )
             FROM project_contributors pc
             JOIN users u ON pc.contributorID = u.userID
             WHERE pc.projectID = p.projectID
            ) AS projectContributors,
            (SELECT JSON_ARRAYAGG(
                         usedtech.technologyName
                  
                    )
             FROM used_technologies usedtech
             JOIN projects_technologies ptech ON ptech.technologyID = usedtech.technologyID
             WHERE ptech.projectID = p.projectID
            ) AS usedTechnologies
     FROM projects AS p
     JOIN categories c ON c.categoryID = p.projectCategory
     JOIN users AS u ON p.owner = u.userID
     WHERE p.projectID = ?     
     `;
            const result = await db.query(query,[projectID]);
            if(result.length === 0)
            {
                throw createError.NotFound('Project not found');
            }
            const project = result[0];
            project.tasks = project.tasks? project.tasks: [];
            project.tasks.forEach(task => {
                task.taskAssignUsers = task.taskAssignUsers? task.taskAssignUsers: [];
            })
            project.features = project.features? project.features: [];
            project.features.forEach(feature => {
                feature.featureContributors = feature.featureContributors? feature.featureContributors: [];
            })
            project.projectContributors = project.projectContributors? project.projectContributors: [];
            project.usedTechnologies = project.usedTechnologies? project.usedTechnologies: [];
            const uniqueContributors = project.projectContributors.reduce((acc, current) => {
                const existing = acc.find(item => item.id === current.id);
                if (!existing) {
                    return acc.concat([current]);
                } else{
                    return acc;
                }
            }, []);
            console.log(project.features)
            project.projectContributors = uniqueContributors;
            project.tasks = project.tasks? project.tasks: [];
            project.tasks.forEach(task => {
                task.taskAssignUsers = task.taskAssignUsers? task.taskAssignUsers: [];
            }
            )
            project.features = project.features? project.features: [];
            project.features.forEach(feature => {
                feature.featureContributors = feature.featureContributors? feature.featureContributors: [];
            }
            )
            project.usedTechnologies = project.usedTechnologies? project.usedTechnologies: [];
            return project;            
        }
        catch(err)
        {
            throw err;
        }
    }
    static async publicProjects(page=1,limit=10,search='',status=''){
        try{
            const offset = helper.getOffset(page,limit);
            const query = `SELECT 
            p.projectID,
            p.title,
            u.name AS ownerName,
            u.username AS ownerUsername,
            p.logo AS projectLogo,
            GROUP_CONCAT(DISTINCT t.tagName ORDER BY t.tagName SEPARATOR ',') AS tags,
            p.description AS description,
            COUNT(DISTINCT pr.reviewID) AS reviews,
            AVG(pr.rating) AS rating,
            COUNT(DISTINCT pu.upvoteID) AS upvotes,
            COUNT(DISTINCT pc.contributorID) AS contributors,
            COUNT(DISTINCT pc.contributionID) AS contributions,
            p.status
        FROM 
            projects p
        JOIN 
            users u ON p.owner = u.userID
        LEFT JOIN 
            projects_tags pt ON p.projectID = pt.projectID
        LEFT JOIN 
            tags t ON pt.tagID = t.tagID
        LEFT JOIN 
            projects_reviews pr ON p.projectID = pr.projectID
        LEFT JOIN 
            project_upvotes pu ON p.projectID = pu.projectID
        LEFT JOIN 
            project_contributors pc ON p.projectID = pc.projectID
        LEFT JOIN 
            (
                SELECT 
                    pc.projectID,
                    u.userID AS contributorID,
                    u.name AS contributorName,
                    u.username AS contributorUsername
                FROM 
                    project_contributors pc
                JOIN 
                    users u ON pc.contributorID = u.userID
            ) AS contrib ON p.projectID = contrib.projectID
        WHERE 
            p.privacy = 'public' AND (contrib.contributorName LIKE "%${search}%" OR u.name LIKE "%${search}%" OR u.username LIKE "%${search}%") 
            AND p.status LIKE "%${status}%"
        GROUP BY 
            p.projectID        
            ORDER BY p.createdAt DESC
            LIMIT ${limit+1} OFFSET ${offset}`;

            const rows = await db.query(query);
            const data = helper.emptyOrRows(rows.slice(0, limit));

            const projects = data?.map(project => {
                return {
                    projectID: project.projectID,
                    title: project.title,
                    ownerName: project.ownerName,
                    ownerUsername: project.ownerUsername,
                    projectLogo: project.projectLogo,
                    tags: project.tags? project.tags.split(',').map(tag => tag.trim()): [],
                    description: project.description? project.description.trim() : '',
                    reviews: project.reviews? parseInt(project.reviews) : 0,
                    rating: project.rating? parseFloat(project.rating) : 0,
                    upvotes: project.upvotes? parseInt(project.upvotes) : 0,
                    contributors: project.contributors? parseInt(project.contributors) : 0,
                    contributions: project.contributions? parseInt(project.contributions) : 0,
                    status: project.status
                }
            })
            const hasNextPage = rows.length > limit;
            return {
                projects: projects,
                hasNextPage: hasNextPage,
                page: page
            
            }
        }
        catch(err)
        {
            throw err;
        }
    }

    static async userProjects(userID,page=1,limit=10){
        try{
            const offset = helper.getOffset(page,limit);
            const query = `SELECT 
            p.projectID,
            p.title,
            u.name AS ownerName,
            u.username AS ownerUsername,
            p.logo AS projectLogo,
            GROUP_CONCAT(DISTINCT t.tagName ORDER BY t.tagName SEPARATOR ',') AS tags,
            p.description AS description,
            COUNT(DISTINCT pr.reviewID) AS reviews,
            AVG(pr.rating) AS rating,
            COUNT(DISTINCT pu.upvoteID) AS upvotes,
            COUNT(DISTINCT pc.contributorID) AS contributors,
            COUNT(DISTINCT pc.contributionID) AS contributions,
            p.status
        FROM 
            projects p
        JOIN 
            users u ON p.owner = u.userID
        LEFT JOIN 
            projects_tags pt ON p.projectID = pt.projectID
        LEFT JOIN 
            tags t ON pt.tagID = t.tagID
        LEFT JOIN 
            projects_reviews pr ON p.projectID = pr.projectID
        LEFT JOIN 
            project_upvotes pu ON p.projectID = pu.projectID
        LEFT JOIN 
            project_contributors pc ON p.projectID = pc.projectID
        LEFT JOIN 
            (
                SELECT 
                    pc.projectID,
                    u.userID AS contributorID,
                    u.name AS contributorName,
                    u.username AS contributorUsername
                FROM 
                    project_contributors pc
                JOIN 
                    users u ON pc.contributorID = u.userID
            ) AS contrib ON p.projectID = contrib.projectID
        WHERE 
            (p.privacy = 'public' AND (contrib.contributorID = "${userID}" OR p.owner = "${userID}")) OR (p.privacy = 'private' AND p.owner = "${userID}") OR (p.privacy = "protected" AND p.projectID IN (
                						SELECT project_access.projectID 
                					FROM project_access 
                					WHERE project_access.userID = "${userID}"))
        GROUP BY 
            p.projectID        
            ORDER BY p.createdAt DESC
            LIMIT ${limit+1} OFFSET ${offset}`;

            const rows = await db.query(query);
            const data = helper.emptyOrRows(rows.slice(0, limit));

            const projects = data?.map(project => {
                return {
                    projectID: project.projectID,
                    title: project.title,
                    ownerName: project.ownerName,
                    ownerUsername: project.ownerUsername,
                    logo: project.projectLogo,
                    tags: project.tags? project.tags.split(',').map(tag => tag.trim()): [],
                    description: project.description? project.description.trim() : '',
                    reviews: project.reviews? parseInt(project.reviews) : 0,
                    rating: project.rating? parseFloat(project.rating) : 0,
                    upvotes: project.upvotes? parseInt(project.upvotes) : 0,
                    contributors: project.contributors? parseInt(project.contributors) : 0,
                    contributions: project.contributions? parseInt(project.contributions) : 0,
                    status: project.status
                }
            })
            const hasNextPage = rows.length > limit;
            return {
                projects: projects,
                hasNextPage: hasNextPage,
                page: page
            
            }
        }
        catch(err)
        {
            throw err;
        }
    }

    static async getCommits(projectID){
        try{
            const query = `SELECT project_contributors.*, users.userID,users.username,users.email,users.name,users.role,users.avatar
            FROM project_contributors
            JOIN users ON users.userID = project_contributors.contributorID WHERE projectID = ? ORDER BY project_contributors.date DESC;`
            const result = await db.query(query,[projectID]);

            const commits = result?.map(commit => {
                return {
                    contributionID: commit.contributionID,
                    projectID: commit.projectID,
                    contributor: {
                        userID: commit.userID,
                        username: commit.username,
                        email: commit.email,
                        name: commit.name,
                        role: commit.role,
                        avatar: commit.avatar
                    },
                    commit: commit.commit,
                    date: commit.date
                }
            })

            return commits;
        }
        catch(err)
        {
            throw err;
        }
    }

    static async getContributors(projectID){
        try{
            const query = `SELECT users.userID,users.username,users.email,users.name,users.role,users.avatar ,COUNT(project_contributors.contributionID) AS numOfContribute 
            FROM project_contributors
            JOIN users ON users.userID = project_contributors.contributorID
            WHERE project_contributors.projectID = ?
            GROUP BY project_contributors.contributorID`
            const result = await db.query(query,[projectID]);

            const contributors = {
                projectID: projectID,
                contributors: result?.map(contributor => {
                    return {
                        userID: contributor.userID,
                        username: contributor.username,
                        email: contributor.email,
                        name: contributor.name,
                        role: contributor.role,
                        avatar: contributor.avatar,
                        numOfContribute: contributor.numOfContribute
                    }
                })
            }

            return contributors;
        }
        catch(err)
        {
            throw err;
        }
    }

    static async addColabLink(fields,projectID){
        try {
            const query = `UPDATE projects SET colabLink = '${fields.colabLink}' WHERE projectID = ${projectID}`;
            console.log(query);
            const result = await db.query(query);
            return result;
        } catch (error) {
            throw error;
        }
        
      }
      static async deleteColabLink(projectID){
        try {
            const query = `UPDATE projects SET colabLink = NULL WHERE projectID = ${projectID}`;
            console.log(query);
            const result = await db.query(query);
            return result;
        } catch (error) {
            throw error;
        }
      }
      static async getTopProjects(){
        try{
            const query = `SELECT projects.*, users.userID, users.username, users.email, users.name, users.role, users.avatar
            FROM projects
            JOIN users ON projects.owner = users.userID
            ORDER BY projects.createdAt DESC
            LIMIT 5`;
            const result = await db.query(query);
            return result;
        }
        catch(err)
        {
            throw err;
        }
    }
    static async updateProject(fields,projectID){
        try{
            const updateFields = Object.keys(fields).map(key => `${key} = ?`).join(', ');
            const values = Object.values(fields);
            const query = `UPDATE projects SET ${updateFields} WHERE projectID = ?`;
            const result = await db.query(query, [...values, projectID]);
            return result;
        }
        catch(err)
        {
            throw err;
        }
    }
   
}
module.exports = {
    ProjectModel
}
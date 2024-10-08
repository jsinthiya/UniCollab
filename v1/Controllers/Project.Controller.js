const createError = require('http-errors');
const fs = require('fs');
const { generateDockerComposeFile } = require('../util/docker');
const cli = require('child_process');
const event = require('../util/event');
const { projectSchema } = require('../util/validation_schema');
const { ProjectModel } = require('../Models/Project.model');
const { get } = require('http');
const { addProjectCommits, getCommits } = require('../util/github');
const { i } = require('mathjs');
const db = require('../services/db');

module.exports = {
    create: async (req,res,next) => {
        try {
            delete req.body.avatar_remove
            const logo = req.files[0]?`/uploads/projects/${req.files[0].filename}`:null;
            for (let key in req.body) {
                if (req.body[key] === "") {
                    delete req.body[key];
                }
            }
             const validate = await projectSchema.validateAsync(req.body); 
            validate.logo = logo;
            const project = new ProjectModel(validate);
            console.log(project);
            const data =  await project.create();
            // const gitLink = project.gitLink;
            // const owner = gitLink.split('/')[3];
            // const repo = gitLink.split('/')[4];
            // const commits = await getCommits(owner, repo);
            // console.log(commits.length);
            // if(commits.length>1)
            // {
            //     project.status = 'Under Development'
            // }
           
            // const Data = await addProjectCommits(owner,repo,project.projectID);
              res.send(data)
        } catch (error) {
            next(error)
        }
        
    },
    publicProjects: async (req,res,next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const search = req.query.search || '';
            const status = req.query.status || '';
            const projects = await ProjectModel.publicProjects(page,limit,search,status);
            res.send(projects);
        } catch (error) {
            next(error)
        }
    },
    getProject: async (req,res,next) => {
        try {
            
            const project = await ProjectModel.getProjectDetails(req.params.id);
            const myTasks = [];
            project.tasks.forEach(task => {
                task.taskAssignUsers.forEach(user => {
                    if(user.username == req.user.username)
                    {
                        myTasks.push(task);
                    }
                })
            });
            project.myTasks = myTasks;
            if(project.owner == req.user.userID)
                project.isOwner = true;
            else
                project.isOwner = false;
            //is contributor
            project.isContributor = false;
            project.projectContributors.find(contributor => {
                if(contributor.id == req.user.userID)
                {
                    project.isContributor = true;
                }
            });
            project.viewingUser = req.user.username;
            
            return res.send(project);
        } catch (error) {
            next(error)
        }
   

    },
    getCommits: async (req,res,next) => {
        try {
            const commits = await ProjectModel.getCommits(req.params.id);
            res.send(commits);
        } catch (error) {
            next(error)
        }
    },
    getContributors: async (req,res,next) => {
        try {
            const contributors = await ProjectModel.getContributors(req.params.id);
            res.send(contributors);
        } catch (error) {
            next(error)
        }
    },
    projectFromGit: async (req, res, next) => {
        try {
            const rootDir = `D:/project/`;
        const projectName = req.body.gitURL.split('/')[4];
        const projectID = req.body.projectID;
        const userDir = `${rootDir}/${req.user.username}`
        const workspace = `${req.user.username}/${projectName}`
        if(fs.existsSync(`${userDir}/${projectName}`)) {
            next(createError.Conflict(`${projectName} already exists`));
        }
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }
        if (!fs.existsSync(`${userDir}/${projectName}Docker`)) {
            fs.mkdirSync(`${userDir}/${projectName}Docker`);
        }
        const containerConfig  = {
            FILE_PATH: `${userDir}/${projectName}Docker/docker-compose.yml`,
            CONTAINER_NAME: `${req.user.username}-${projectName}`,
            PROJECTS_PATH: workspace,
            PORT: Math.floor(Math.random() * 10000)
            }
        await generateDockerComposeFile(containerConfig);

        const data = {
            gitURL: req.body.gitURL,
            userDir,
            projectName,
            containerConfig
        }
        await ProjectModel.addColabLink({colabLink: `http://localhost:${containerConfig.PORT}`}, projectID);
        event.emit('project', data);
        res.send({message: `Project is being created. Check back in a few minutes. Code Server will be available at http://localhost:${containerConfig.PORT}`});
        } catch (error) {
            next(error)
        }
    },
    stopColab: async (req, res, next) => {
        try {
            const projectID = req.params.id;
            const project = await ProjectModel.getProject(projectID);
            const containerName = `${project.owner.username}-${project.gitLink.split('/')[4]}`;
            //delete project directory
            const userDir = `D:/project/${project.owner.username}`;
            const projectName = project.gitLink.split('/')[4];
            const projectDir = `${userDir}/${projectName}Docker`;
            if(fs.existsSync(projectDir)) {
                fs.rmdirSync(projectDir, { recursive: true });
            }
            if(fs.existsSync(`${userDir}/${projectName}`)) {
                fs.rmdirSync(`${userDir}/${projectName}`, { recursive: true });
            }
            //stop container
            cli.exec(`docker rm ${containerName}  --force`, (err, stdout, stderr) => {
                if (err) {
                    throw err;
                } 
            });
            await ProjectModel.deleteColabLink(projectID);
            res.send({message: 'Container stopped successfully'});
        
        } catch (error) {
            next(error)
        }
    },
    userProjects: async (req,res,next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const projects = await ProjectModel.userProjects(req.user.userID,page,limit);
            res.send(projects);
        } catch (error) {
            next(error)
        }
    },
    getTopProjects: async (req,res,next) => {
        try {
            const projects = await ProjectModel.getTopProjects();
            res.send(projects);
        } catch (error) {
            next(error)
        }
    },
    updateProject: async (req,res,next) => {
        try {
            const projectID = req.params.projectID;
            const project = await ProjectModel.getProject(projectID);
            if(req.files.length>0)
            {
                req.body.logo = `/uploads/projects/${req.files[0].filename}`;
            }
            const data = await ProjectModel.update(req.body,projectID);
            res.send(data);
        } catch (error) {
            next(error)
        }
    },
    updateProjectStatus: async(req,res,next)=> {
        try {
            const projectID = req.params.projectID;
            const status = req.query.status;
            await db.query(`UPDATE projects SET status = '${status}' WHERE projectID = '${projectID}'`);
            res.send('ok');
        } catch (error) {
            next(error)
        }
    },
    updateTask: async(req,res,next) => {
        try {
            const taskID = req.params.taskID;
            const data = req.query.status;
            await db.query(`UPDATE project_tasks SET status = '${data}' WHERE taskID = '${taskID}'`);
            res.send('ok');
        } catch (error) {
            next(error)
        }
    },
    addProjectContributors: async(req,res,next) => {
        const projectID = req.query.projectID;
        if(!projectID)
        {
            res.send('Project ID is required');
            return;
        }
        //find gitLink
        const project = await ProjectModel.getProject(projectID);
        console.log(project);
        const owner = project.gitLink.split('/')[3];
        const repo = project.gitLink.split('/')[4];
        const data  = await addProjectCommits(owner,repo,projectID);
        console.log(data);
    }
}

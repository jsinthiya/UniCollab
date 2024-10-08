const createError = require('http-errors');
const db = require('../services/db');
const helper = require('../util/helper');
const { ProjectModel } = require('../Models/Project.model');



async function accessCheck(req,res,next)
{
    try {
        const project = await ProjectModel.getProject(req.params.id)
        if(project.length === 0)
        {
            next(createError.NotFound('Project not found'));
        }
        if(project.privacy === 'public')
        {
            req.project = project;
            next();
        }
        else if(project.privacy === 'private')
        {
            if(req.user.userID === project.owner.userID || req.user.role === 'admin')
            {
                req.project = project;
                next();
            }
            else{
                next(createError.Unauthorized('You are not authorized to access this project'));
            }
        }
        else if(project.privacy === 'protected')
        {
            if(req.user)
            {
                if(req.user.userID === project.owner.userID || req.user.role === 'admin')
                {
                    req.project = project;
                    next();
                }
                else{
                    const projectAccess = await db.query('SELECT * FROM project_access WHERE projectID = ? AND userID = ?', [project.projectID, req.user.userID]);
                    if(projectAccess.length > 0)
                    {
                        req.project = project;
                        next();
                    }
                    else{
                         next(createError.Unauthorized('You are not authorized to access this project'));
                    }
                }
            }
            else{
                next(createError.Unauthorized('You are not authorized to access this project'));
            }
        }
        else{
            next(createError.NotFound('Project not found'));
        }
    } catch (error) {
        next(error)
    }
   
    
}
module.exports = {
    accessCheck
};

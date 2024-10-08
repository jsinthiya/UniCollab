const express = require('express');
const AuthController = require('../Controllers/Auth.Controller')
const { encryptPassword,validateLogin } = require('../Middleware/Auth.middleware');
const { onlyUniversityAccess,universityAndStudentAccess } = require('../Middleware/Permission.middleware');
const { signAccessToken,verifyAccessToken,signRefreshToken, verifyRefreshToken } = require('../util/jwt');
const ClubController = require('../Controllers/Club.Controller');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');
const { accessCheck } = require('../Middleware/Project.middleware');
const ProjectController = require('../Controllers/Project.Controller');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { query } = require('../services/db');
const crypto = require('crypto');
const { re } = require('mathjs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.resolve(__dirname, '../../public/uploads/projects'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

router.post('/create',verifyAccessToken,upload.any(),ProjectController.create);
router.post('/create/git',verifyAccessToken,ProjectController.projectFromGit);
router.delete('/colab/stop/:id',verifyAccessToken,ProjectController.stopColab);

// router.get('/get',ProjectController.getProjects);

router.get('/contributions/:id',ProjectController.getCommits)
router.get('/contributors/:id',ProjectController.getContributors)

router.get('/get/:id',verifyAccessToken,accessCheck,ProjectController.getProject);
router.get('/public',ProjectController.publicProjects);
router.get('/get',verifyAccessToken,ProjectController.userProjects);
router.get('/top',ProjectController.getTopProjects);
router.put('/update/:projectID',verifyAccessToken,upload.any(),ProjectController.updateProject);
router.put('/updatestatus/:projectID',ProjectController.updateProjectStatus);
router.put('/tasks/:taskID',ProjectController.updateTask);
router.get('/addProjectContributors',ProjectController.addProjectContributors);






router.post('/webhook/:id',async(req,res,next) =>{
  const projectID = req.params.id;
    if(req.body?.commits)
    {


      const Data = [];
      req.body.commits.forEach(commit => {
            const d = {
                committer: commit.committer,
                message: commit.message,
                date: commit.timestamp
               }
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
  if(filtered.length == 0)
  {
    res.send('ok');
    return;
  }

  const sql = `
          INSERT INTO project_contributors (contributionID,projectID, contributorID, commit, date)
          VALUES ${values}
      `;
  console.log(sql)
  const result = await query(sql);

    }
    res.send('ok');
})

module.exports = router;
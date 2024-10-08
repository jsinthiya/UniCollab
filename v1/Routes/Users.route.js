const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../util/jwt');
const { StudentModel } = require('../Models/Student.model');
const { transformExamDetails } = require('../util/helper');
const path = require('path');
const multer = require('multer');
const { ProjectModel } = require('../Models/Project.model');
const User = require('../Models/User.model');
const { onlyAdminAccess } = require('../Middleware/Admin.middleware');



router.get('/me',verifyAccessToken, async (req, res) => {
    const student  = await StudentModel.studentDetails(req.user.userID);
    res.send(student);
});
router.get('/projects',verifyAccessToken, async (req, res) => {
    const projects  = await ProjectModel.getUserProjects(req.user.userID);
    res.send(projects);
});






router.get('/adminhome',verifyAccessToken,onlyAdminAccess, async (req, res) => {
    const info = await User.adminHome();
    res.send(info);
});

router.get('/generateCV',verifyAccessToken, async (req, res) => {
    const studentDetails = await StudentModel.studentDetails(req.user.userID);
    const projects = await ProjectModel.getUserProjects(req.user.userID);
    const data = {
        student:studentDetails,
        projects
    }
    
});

router.post('/education',verifyAccessToken, async (req, res) => {
    const data  = transformExamDetails(req.body);
    let resp = {status:500};
    let tryCount = 0;
    while(resp.status != 200 && tryCount < 5)
    { 
        tryCount++;
        const fetchResult = await fetch('https://result.webhunt.workers.dev/?exam='+req.body.exam+'&year='+req.body.year+'&board='+req.body.board+'&roll='+req.body.roll+'&reg='+req.body.reg);
        resp = await fetchResult.json();
    }
    if(resp.status != 200)
    {
        res.send({status: 404,error:"Result Not Found"});
        return;
    }
    const result = await StudentModel.addEducation(data,req.user.userID);
    
    const temp = {
        exam : resp.data.exam,
        result:resp.data.details.GPA,
        institute: resp.data.details.Institute,
    }
    const tempTransform = transformExamDetails(temp);
    const details = {
        fullName:resp.data.details.Name,
        fatherName:resp.data.details['Father\'s Name'],
        motherName:resp.data.details['Mother\'s Name'],
        dob:resp.data.details['Date of Birth'],
        ...tempTransform
    }
    const detailsResult = await StudentModel.addEducation(details,req.user.userID);
    res.send(detailsResult);
    
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.resolve(__dirname, '../../public/uploads/avatar'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
  
  const upload = multer({ storage: storage })
router.post('/details',verifyAccessToken,
    upload.any(),
    async (req, res) => {
        const data = {
            avatar: req.files[0]?`/uploads/avatar/${req.files[0].filename}`:'',
            ...req.body
        }
        console.log(data)
        if(data.avatar_remove=='1')
            data.avatar = null;
        delete data.avatar_remove;
        const result = await StudentModel.addDetails(data,req.user.userID);
        res.send(result)
    }
    
)

router.get('/orgUniClub', async (req, res) => {
    const result = await User.orgUniClub();
    res.send(result.data);
});







module.exports = router;
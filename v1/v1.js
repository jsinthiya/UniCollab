const express = require('express');
const AuthRoute = require('./Routes/Auth.route');
const UsersRoute = require('./Routes/Users.route');
const UniversityRoute = require('./Routes/University.route')
const OrganizationRoute = require('./Routes/Organization.route');
const ClubRoute = require('./Routes/Club.route');
const StudentRoute = require('./Routes/Student.route');
const QuestionRoute = require('./Routes/Question.route');
const EventRoute = require('./Routes/Event.route');
const ResearchRoute = require('./Routes/Research.route');
const DashboardRoute = require('./Routes/Dashboard.route');
const JobRoute = require('./Routes/Jobs.route');

const ProjectRoute = require('./Routes/Project.route');
const { eventSchema } = require('./util/validation_schema');
require('./util/event')
// const cors=require("cors");


const router = express.Router();

// const corsOptions ={
//     origin:'*', 
//     credentials:true,            //access-control-allow-credentials:true
//     optionSuccessStatus:200,
//  }
 
//  router.use(cors(corsOptions))


//User Role Specific Routes
router.use('/auth', AuthRoute);
router.use('/university', UniversityRoute);
router.use('/org', OrganizationRoute);


router.use('/dashboard', DashboardRoute);


// router.use('/club', ClubRoute);
router.use('/student', StudentRoute);

router.use('/user', UsersRoute);

// router.get('/result', async (req, res) => {
//     const result = await EducationBoardResult(req.query.exam, req.query.year, req.query.board, req.query.roll, req.query.reg);
//     res.send(result);
// });

//Feature Specific Routes


router.use('/question', QuestionRoute);

router.use('/project',ProjectRoute)
router.use('/research',ResearchRoute)

router.use('/event',EventRoute)
router.use('/job',JobRoute)

router.post('/test', async (req, res,next) => {
    try {
        const data = req.body;
        const validate = await eventSchema.validateAsync(data)
        console.log(validate);
        res.send(data);
    } catch (error) {
        next(error)
    }
    
})
module.exports = router;
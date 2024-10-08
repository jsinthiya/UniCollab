const express = require('express');
const moragn = require('morgan');
const path = require('path');
const createError = require('http-errors');
const v1 = require('./v1/v1');
const view = require('./viewRoute/view');
const app = express();
app.use(express.json());
app.use(moragn('dev'));
let cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(cookieParser());
app.use((express.static(path.join(__dirname, 'public'))));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
// Access-Control-Allow-Origin
//Access-Control-Allow-Methods
//Access-Control-Allow-Headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//version 1
app.use('/v1', v1);
app.post('/webhook',async(req,res,next) =>{
    console.log(req.body);
    res.send('ok');
})
// app.use('/',view);

app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use(async(err, req, res, next) => { 
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

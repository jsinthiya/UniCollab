const EventEmmiter = require('events');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {AnswerModel} = require('../Models/Answer.model');
const QuestionModel = require('../Models/Question.model');
const eventEmmiter = new EventEmmiter();
const cli = require('child_process');
const db = require('../services/db');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

eventEmmiter.on('question', async (data) => {
    try {
        data.imgPath ? await geminiProVision(data.quesText, data.imgPath) : await geminiPro(data);
    console.log('Event Emmiter:', data);
    } catch (error) {
        throw error;
    }
    
});

async function geminiPro(data) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(data.quesText);
    const response = await result.response;
    const text = response.text();
    const answer  = new AnswerModel(generateID(),data.quesID,process.env.AI_USER_ID,text,undefined);
    const ans = await answer.create();
    console.log('Answer:', ans);  
    await updateQuestionStatus(data.quesID);
  
    return text;
    } catch (error) {
        throw error;
    }
    
}
async function updateQuestionStatus(quesID) {
    try {
        const question = await db.query(`SELECT * FROM questions WHERE quesID = '${quesID}'`);
    console.log('Question:', question);
    if(question[0].status == "Pending") 
    {
       const result =  await db.query(`UPDATE questions SET status = 'AI Answered' WHERE quesID = '${quesID}'`);
        console.log("Question Status Updated to AI Answered")
    }
    } catch (error) {
        throw error;
    }
    
}
async function geminiProVision(prompt, imgPath) {
    console.log('Gemini Pro Vision:', prompt, imgPath);
    // const model = genAI.getGenerativeModel({ model: "gemini-pro-vision"});
    // const result = await model.generateContent("What is the meaning of life?");
    // const response = await result.response;
    // const text = response.text();
    // console.log(text);

    return prompt;
}


eventEmmiter.on('project', async (data) => {
    await projectCreateGit(data);
    console.log('Event Emmiter:', data);
});

async function projectCreateGit(data) {
    cli.exec(`git clone ${data.gitURL} ${data.userDir}/${data.projectName} && cd ${data.userDir}/${data.projectName}Docker &&  docker compose up -d`,async (err, stdout, stderr) => {
        if (err) throw err;        
    })
}


module.exports = eventEmmiter;
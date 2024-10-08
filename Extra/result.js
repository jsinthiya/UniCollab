async function EducationBoardResult(exam, year, board, roll, reg) {
    try {
        const response = await fetch('http://www.educationboardresults.gov.bd');

        const expression = extractExpression(await response.text());
        if (!expression) {
            console.log("Expression not found.");
            return JSON.stringify({ status: 404, data: "Expression not found" });
        }

        const capAns = calculateExpression(expression);
        const cookie = response.headers.get('set-cookie');
        const finalCookie = `${cookie.split(";")[0]};tcount_unique_eb_log=1`;

        const details = buildDetailsObject(exam, year, board, roll, reg, capAns);
        const formBody = new URLSearchParams(details).toString();

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Cookie': finalCookie,
            },
            body: formBody,
        };

        const resultResponse = await fetch('http://www.educationboardresults.gov.bd/result.php', options);
        const { detailsObj, resultObj } = parseResultResponse(await resultResponse.text());

        const responseObj = { status: 200, data: { exam, details: detailsObj, result: resultObj } };
        return responseObj;
    } catch (err) {
        console.error(err);
        return JSON.stringify({ status: 500, data: "An error occurred" });
    }
}

function extractExpression(text) {
    const regex = /(\d+\s*[+]\s*\d+)/;
    const match = regex.exec(text);
    return match ? match[1] : null;
}

function calculateExpression(expression) {
    const [operand1, operator, operand2] = expression.split(" ");
    return operator === '+' ? parseInt(operand1) + parseInt(operand2) : null;
}

function buildDetailsObject(exam, year, board, roll, reg, capAns) {
    return {
        sr: "3",
        et: "2",
        exam,
        year,
        board,
        roll,
        reg,
        value_s: capAns,
        button2: "Submit",
    };
}

function parseResultResponse(textResult) {
    const pattern = /<td[^>]*>(.*?)<\/td>/g;
    const matches = [];
    let matchs;

    while ((matchs = pattern.exec(textResult)) !== null) {
        matches.push(matchs[1]);
    }

    const arr = [];
    const detailsArr = [];
    const resultArr = [];

    for (let i = 0; i < matches.length; i++) {
        if (!(matches[i].includes("<") || matches[i].startsWith("&"))) {
            arr.push(matches[i]);
        }
    }

    for (let i = 1; !arr[i].includes("Code"); i++) {
        detailsArr.push(arr[i]);
    }

    for (let i = arr.indexOf("Code"); i < arr.length; i++) {
        resultArr.push(arr[i]);
    }

    const resultObj = [];
    for (let i = 3; i < resultArr.length; i = i + 3) {
        const obj = {};
        obj[resultArr[0]] = resultArr[i];
        obj[resultArr[1]] = resultArr[i + 1];
        obj[resultArr[2]] = resultArr[i + 2];
        resultObj.push(obj);
    }

    const detailsObj = arrayToObject(detailsArr);
    return { detailsObj, resultObj };
}

function arrayToObject(arr) {
    return arr.reduce((obj, value, index) => {
        if (index % 2 === 0) {
            obj[value] = arr[index + 1];
        }
        return obj;
    }, {});
}

module.exports = {
    EducationBoardResult,
};
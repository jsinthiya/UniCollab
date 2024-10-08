const userModel = require('../Models/User.model');
function getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage];
  }
  
  function emptyOrRows(rows) {
    if (!rows) {
      return [];
    }
    return rows;
  }


  function generateShortName(longName) {
    const words = longName.split(' ');
    const shortName = words.map(word => word.charAt(0).toLowerCase()).join('');

    return shortName;
}



async function isValidPassword(user)
{
    try {
      const userObj = new userModel();
    
      const result = await userObj.getPassword(user.password)
      return await bcrypt.compare(user.password,result.data.password);
    } catch (error) {
      throw error;
    }
}


function generateDomainRegex(exampleEmail) {
  const match = exampleEmail.match(/@(.+)$/);

  if (match) {
      const domain = match[1];
      const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const domainRegex = `@${escapedDomain}`;
      return new RegExp(domainRegex);
  } else {
      throw new Error("Invalid email format");
  }
}

function isEmailMatchingDomain(email, domainRegex) {
  return domainRegex.test(email);
}

function transformExamDetails(details) {
  const prefix = details.exam;
  const transformedDetails = {};
  for (const key in details) {
      if (key !== 'exam') {
          const newKey = `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
          transformedDetails[newKey] = details[key];
      }
  }
  return transformedDetails;
}
  
  module.exports = {
    getOffset,
    emptyOrRows,
    isValidPassword,
    generateShortName,
    generateDomainRegex,
    isEmailMatchingDomain,
    transformExamDetails
  }
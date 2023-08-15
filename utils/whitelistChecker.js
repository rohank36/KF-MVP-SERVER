const fs = require("fs").promises;
const path = require("path");

const filePath = path.join(__dirname, "../whitelist.txt");

const loadWhitelist = async (filepath) => {
  try {
    const data = await fs.readFile(filepath, "utf8");
    const emails = data.split("\r\n").filter((email) => email.trim() !== "");
    return emails;
  } catch (err) {
    console.error("Error reading the whitelist", err);
  }
};

exports.isEmailWhitelisted = async (email) => {
  const whitelistedEmails = await loadWhitelist(filePath);
  return whitelistedEmails.includes(email);
};

/*
(async () => {
  const emailToCheck = "rohankanti2527@gmail.com";
  try {
    const isWhitelisted = await isEmailWhitelisted(emailToCheck);
    if (isWhitelisted) {
      console.log(`${emailToCheck} is whitelisted!`);
    } else {
      console.log(`${emailToCheck} is not whitelisted.`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
})();
*/

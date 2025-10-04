import bcrypt from "bcrypt";
import promptModule from "prompt-sync";
import { MongoClient } from "mongodb";
const password = "test1234";
//const hash = bcrypt.hashSync(password, 10);
// Create the function for NewSavePassword
const prompt = promptModule();
const mockDB = { passwords: {} };

const showMenu = async () => {
  console.log(`
 1. View passwords
 2. Manage new password
 3. Verify password
 4. Exit`);
  const response = prompt(">");
  if (response === "1") viewPasswords();
  else if (response === "2") promptManageNewPassword();
  else if (response === "3") promptOldPassword();
  else if (response === "4") process.exit();
  else {
    console.log(`That's an invalid response.`);
    showMenu();
  }
};

const saveNewPassword = (password) => {
  mockDB.hash = bcrypt.hashSync(password, 10);
  console.log("The Password Saved !");
  showMenu();
};

const compareHashedPassword = async (password) => {
  return await bcrypt.compare(password, mockDB.hash);
};

/*
promptNewPassword logs a message to the command-line
console for the user to type their main master password.
*/

const promptNewPassword = () => {
  const response = prompt(" Enter a main password: ");
  return saveNewPassword(response);
};

const promptOldPassword = async () => {
  while (true) {
    const response = prompt("Enter your password: ");
    const result = await compareHashedPassword(response);
    if (result) {
      console.log("Password verified.");
      showMenu();
      break; // out to loop
    } else {
      console.log("Password incorrect. Try again.");
    }
  }
};

const viewPasswords = () => {
  const { passwords } = mockDB;
  Object.entries(passwords).forEach(([key, value], index) => {
    console.log(`${index + 1}. ${key} => ${value}`);
  });
  showMenu();
};

// function to see if the password = passord entered

const promptManageNewPassword = () => {
  const source = prompt("Enter name for password: ");
  const password = prompt("Enter password to save: ");

  mockDB.passwords[source] = password;
  console.log(`Password for ${source} has been saved`);
  showMenu();
};
if (!mockDB.hash) promptNewPassword();
else promptOldPassword();

/**
Wee are going to saving the passWord in MongoDB 
*/

const dbURL = "mongodb://localhost:27017";
const client = new MongoClient(dbURL);
let hasPassWords = false;
let passwordsCollection, authCollection;
const dbName = "PasswordManager";

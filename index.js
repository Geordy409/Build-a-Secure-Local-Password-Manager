import bcrypt from "bcrypt";
import promptModule from "prompt-sync";
import { MongoClient, ReturnDocument } from "mongodb";
const password = "test1234";
//const hash = bcrypt.hashSync(password, 10);
// Create the function for NewSavePassword
const prompt = promptModule();
const mockDB = { passwords: {} };

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

const viewPasswords = async () => {
  const passwords = await passwordsCollection.find({}).toArray(); // Make a mongoDB's request and returning all documents
  passwords.forEach(({ source, password }, index) => {
    console.log(`${index + 1}. ${source} => ${password}`);
  });
  showMenu();
};

// function to see if the password = passord entered

const promptManageNewPassword = async () => {
  const source = prompt("Enter name for password: ");
  const password = prompt("Enter password to save: ");
  /*
    Use findOneAndUpdate to look for an existing password that matches your
    source and then set the new password.
    */
  await passwordsCollection.findOneAndUpdate(
    { source },
    { $set: { password } }, // updates(or Sets) the password field with the new value
    { ReturnDocument: "after", upsert: true } // Return document, upsert is the key(Document created if not exist)
  );
  console.log(`Password for ${source} has been saved`);
  showMenu();
};

/**
Wee are going to saving the passWord in MongoDB 
*/

const dbURL = "mongodb://localhost:27017";
const client = new MongoClient(dbURL);
let hasPassWords = false;
let passwordsCollection, authCollection;
const dbName = "PasswordManager";

const showMenu = async () => {
  console.log(`
 1. View passwords
 2. Manage new password
 3. Verify password
 4. Exit`);
  const response = prompt(">");
  switch (response) {
    case "1":
      await viewPasswords();
      break;
    case "2":
      await promptManageNewPassword();
      break;
    case "3":
      await promptOldPassword();
      break;
    case "4":
      process.exit();
    default:
      console.log(`That's an invalid response.`);
      await showMenu();
  }
};

const main = async () => {
  try {
    await client.connect();
    console.log("Connected succefully server !");
    const db = client.db(dbName);
    authCollection = db.collection("auth");
    passwordsCollection = db.collection("password");
    const hashedPassword = await authCollection.findOne({ type: "auth" });
    hasPassWords = !!hashedPassword;
  } catch (error) {
    console.error("Error connecting to the database: ", error);
    process.exit(1);
  }
};

await main();
if (!hasPassWords) promptNewPassword();
else promptOldPassword();

import bcrypt from "bcrypt";
import promptModule from "prompt-sync";
import { MongoClient, ReturnDocument } from "mongodb";

const password = "test1234";
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
      break;
    } else {
      console.log("Password incorrect. Try again.");
    }
  }
};

const viewPasswords = async () => {
  const passwords = await passwordsCollection.find({}).toArray();
  passwords.forEach(({ source, password }, index) => {
    console.log(`${index + 1}. ${source} => ${password}`);
  });
  showMenu();
};

const promptManageNewPassword = async () => {
  const source = prompt("Enter name for password: ");
  const password = prompt("Enter password to save: ");
  await passwordsCollection.findOneAndUpdate(
    { source },
    { $set: { password } },
    { ReturnDocument: "after", upsert: true }
  );
  console.log(`Password for ${source} has been saved`);
  showMenu();
};

// NOUVELLE FONCTION : Recherche de mot de passe par source
const findPasswordBySource = async () => {
  while (true) {
    const source = prompt("Enter source name to find (or 'back' to return): ");

    // Option pour retourner au menu
    if (source.toLowerCase() === "back") {
      showMenu();
      break;
    }

    // Recherche dans la collection
    const result = await passwordsCollection.findOne({ source });

    if (result) {
      console.log(`\nPassword found for "${source}":`);
      console.log(`  Username: ${result.username || "N/A"}`);
      console.log(`  Password: ${result.password}\n`);
    } else {
      console.log(`\nNo password saved for that source.\n`);
    }

    // Demander si l'utilisateur veut continuer
    const again = prompt("Search for another? (y/n): ");
    if (again.toLowerCase() !== "y") {
      showMenu();
      break;
    }
  }
};

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
 4. Exit
 5. Find password by source`);
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
    case "5":
      await findPasswordBySource();
      break;
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

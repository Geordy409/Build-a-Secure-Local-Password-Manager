import bcrypt from "bcrypt";
import promptModule from "prompt-sync";

const password = "test1234";
//const hash = bcrypt.hashSync(password, 10);
// Create the function for NewSavePassword
const prompt = promptModule();
const mockDB = { password: {} };

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

const comparedHashedPassWord = async (password) => {
  await bcrypt.compare(password, mockDB.hash);
};

/*
promptNewPassword logs a message to the command-line
console for the user to type their main master password.
*/

const promptNewPassword = (password) => {
  const response = prompt(" Enter a main password: ");
  return saveNewPassword(response);
};

promptNewPassword();

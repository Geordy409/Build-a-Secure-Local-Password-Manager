import bcrypt from "bcrypt";
import promptModule from "prompt-sync";
import { MongoClient, ReturnDocument } from "mongodb";

/* 
In this Project, we:
• Built your own password manager application
• Implemented secure password hashing logic utilizing the bcrypt package
• Set up a MongoDB database collection for passwords
• Configured Node to use the mongodb package with user input
*/

const prompt = promptModule();
let storedSaltRounds = 10; // Salt rounds fixé à 3

// Fonction pour valider la force du mot de passe
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("- At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("- At least one uppercase letter (A-Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("- At least one lowercase letter (a-z)");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("- At least one number (0-9)");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("- At least one special character (!@#$%^&*()_+-=[]{}etc.)");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

const saveNewPassword = async (password, saltRounds) => {
  const hash = bcrypt.hashSync(password, saltRounds);

  await authCollection.insertOne({
    type: "auth",
    hash: hash,
    saltRounds: saltRounds,
  });

  console.log("The Password Saved !");
  showMenu();
};

const compareHashedPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const promptNewPassword = async () => {
  console.log("\n=== Create Master Password ===");
  console.log("Your password must contain:");
  console.log("- At least 8 characters");
  console.log("- At least one uppercase letter");
  console.log("- At least one lowercase letter");
  console.log("- At least one number");
  console.log("- At least one special character (!@#$%^&* etc.)\n");

  let password;
  let confirmPassword;

  // Boucle jusqu'à ce que le mot de passe soit valide
  while (true) {
    password = prompt("Enter a main password: ");

    const validation = validatePasswordStrength(password);

    if (!validation.isValid) {
      console.log("\n❌ Password is too weak. Missing:");
      validation.errors.forEach((error) => console.log(error));
      console.log();
      continue;
    }

    // Confirmation du mot de passe
    confirmPassword = prompt("Confirm your password: ");

    if (password !== confirmPassword) {
      console.log("\n❌ Passwords don't match. Try again.\n");
      continue;
    }

    console.log("✅ Password is strong!\n");
    break;
  }

  const saltRounds = 10;
  console.log(`Using ${saltRounds} salt rounds...`);
  return await saveNewPassword(password, saltRounds);
};

const promptOldPassword = async () => {
  const authData = await authCollection.findOne({ type: "auth" });

  if (!authData) {
    console.log("No authentication data found.");
    return;
  }

  storedSaltRounds = authData.saltRounds;
  console.log(`Using stored salt rounds: ${storedSaltRounds}`);

  while (true) {
    const response = prompt("Enter your password: ");
    const result = await compareHashedPassword(response, authData.hash);
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
  if (passwords.length === 0) {
    console.log("No passwords saved yet.");
  } else {
    passwords.forEach(({ source, password }, index) => {
      console.log(`${index + 1}. ${source} => ${password}`);
    });
  }
  showMenu();
};

const promptManageNewPassword = async () => {
  const source = prompt("Enter name for password: ");
  const password = prompt("Enter password to save: ");
  await passwordsCollection.findOneAndUpdate(
    { source },
    { $set: { password } },
    { returnDocument: "after", upsert: true }
  );
  console.log(`Password for ${source} has been saved`);
  showMenu();
};

const findPasswordBySource = async () => {
  while (true) {
    const source = prompt("Enter source name to find (or 'back' to return): ");

    if (source.toLowerCase() === "back") {
      showMenu();
      break;
    }

    const result = await passwordsCollection.findOne({ source });

    if (result) {
      console.log(`\nPassword found for "${source}":`);
      console.log(`  Username: ${result.username || "N/A"}`);
      console.log(`  Password: ${result.password}\n`);
    } else {
      console.log(`\nNo password saved for that source.\n`);
    }

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
      console.log("Goodbye!");
      await client.close();
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
    console.log("Connected successfully to server!");
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
if (!hasPassWords) await promptNewPassword();
else await promptOldPassword();

/*
📋 Tâches pour implémenter le système de comptes
Phase 1 : Structure de base

 Tâche 1.1 : Créer une nouvelle collection users dans MongoDB (au lieu de auth)
 Tâche 1.2 : Modifier la structure des données pour inclure username, email, masterPasswordHash, saltRounds, createdAt
 Tâche 1.3 : Ajouter un champ userId dans la collection passwords pour lier chaque mot de passe à un utilisateur

Phase 2 : Menu principal

 Tâche 2.1 : Créer une fonction showMainMenu() avec 3 options : "1. Create account", "2. Login", "3. Exit"
 Tâche 2.2 : Modifier la fonction main() pour afficher ce nouveau menu au démarrage
 Tâche 2.3 : Supprimer la logique actuelle if (!hasPassWords) qui lance directement la création de mot de passe

Phase 3 : Création de compte

 Tâche 3.1 : Créer une fonction createAccount() qui demande : username, email, master password
 Tâche 3.2 : Vérifier que le username est unique dans la collection users
 Tâche 3.3 : Vérifier que l'email est unique dans la collection users
 Tâche 3.4 : Réutiliser validatePasswordStrength() pour valider le master password
 Tâche 3.5 : Sauvegarder le nouvel utilisateur dans la collection users
 Tâche 3.6 : Afficher un message de succès et retourner au menu principal

Phase 4 : Connexion (Login)

 Tâche 4.1 : Créer une fonction login() qui demande username et password
 Tâche 4.2 : Chercher l'utilisateur dans la collection users par username
 Tâche 4.3 : Vérifier le mot de passe avec bcrypt.compare()
 Tâche 4.4 : Si échec, afficher "Invalid credentials" et redemander ou retourner au menu
 Tâche 4.5 : Si succès, stocker l'utilisateur connecté dans une variable globale currentUser
 Tâche 4.6 : Rediriger vers showMenu() (menu des mots de passe)

Phase 5 : Gestion de session

 Tâche 5.1 : Créer une variable globale let currentUser = null pour stocker l'utilisateur connecté
 Tâche 5.2 : Ajouter une option "6. Logout" dans showMenu()
 Tâche 5.3 : Créer une fonction logout() qui réinitialise currentUser = null et retourne au menu principal

Phase 6 : Modifier les fonctions existantes

 Tâche 6.1 : Modifier promptManageNewPassword() pour inclure userId: currentUser._id lors de la sauvegarde
 Tâche 6.2 : Modifier viewPasswords() pour filtrer par userId: currentUser._id
 Tâche 6.3 : Modifier findPasswordBySource() pour filtrer par userId: currentUser._id
 Tâche 6.4 : Supprimer les fonctions promptNewPassword() et promptOldPassword() (remplacées par createAccount() et login())

Phase 7 : Validation et sécurité

 Tâche 7.1 : Ajouter une validation d'email (format valide avec regex)
 Tâche 7.2 : Limiter les tentatives de connexion (ex: 3 essais maximum)
 Tâche 7.3 : Ajouter des messages d'erreur clairs et informatifs

Phase 8 : Tests

 Tâche 8.1 : Tester la création de plusieurs comptes avec différents usernames
 Tâche 8.2 : Tester la connexion avec de mauvais identifiants
 Tâche 8.3 : Vérifier que chaque utilisateur voit uniquement ses propres mots de passe
 Tâche 8.4 : Tester le logout et la reconnexion
 Tâche 8.5 : Vérifier que les doublons de username/email sont bien bloqués


🎯 Ordre recommandé : Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
*/

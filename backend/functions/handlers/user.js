const { db, admin } = require("../util/admin");
const firebase = require("firebase");

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASX-BOugDHChGxuoO29l2WF3qGZA01IPk",
  authDomain: "example-post-comment.firebaseapp.com",
  databaseURL: "https://example-post-comment.firebaseio.com",
  projectId: "example-post-comment",
  storageBucket: "example-post-comment.appspot.com",
  messagingSenderId: "1009348792978",
  appId: "1:1009348792978:web:413b7a63ff12607f214c4b",
  measurementId: "G-SJNKZ6PEW5",
};
firebase.initializeApp(firebaseConfig);

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
  };

  // validate data
  let errors = {};
  if (newUser.password != newUser.confirmPassword) {
    errors.confirmPassword = "Passwords not match";
  }

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  let retVal_token;
  db.doc(`/users/${newUser.userName}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ error: "UserName already taken" });
      }
      return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
    })
    .then((data) => {
      uid = data.user.uid;
      return uid;
    })
    .then((id_token) => {
      retVal_token = id_token;
      const userCredentials = {
        userName: newUser.userName,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: retVal_token,
      };
      return db.doc(`/users/${newUser.userName}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token: retVal_token });
    })
    .catch((err) => {
      console.log(err);
      if (err.code == "auth/email-already-in-use") {
        return res.status(400).json({ error: "EMAIL ALREADY USE" });
      } else {
        return res.status(500).json({ error: err });
      }
    });
};

exports.logIn = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};
  if (isEmpty(user.email)) errors.email = "NOT BE EMPTY";
  if (isEmpty(user.password)) errors.password = "NOT BE EMPTY";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((access_token) => {
      return res.json({ access_token });
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
};

exports.getCurrentUser = (req, res) => {
  const userName = req.user.userName;
  db.doc(`/users/${userName}`)
    .get()
    .then((userDoc) => {
      if (!userDoc.exists) {
        return res.status(404).json({ error: "NO USER FOUND" });
      }
      return res.json(userDoc.data());
    });
};

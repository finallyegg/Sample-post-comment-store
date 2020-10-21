const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const {
  getAllpost,
  createPost,
  getPost,
  createComment,
  likePost,
  unlikePost,
  deletePost,
} = require("./handlers/post");
const { signUp, logIn, getCurrentUser } = require("./handlers/user");
const { AuthMiddle } = require("./util/authMiddleware");

// Post Route
app.get("/post", getAllpost);
app.post("/post", AuthMiddle, createPost);
app.get("/post/:postId", getPost);
app.delete("/post/:postId", AuthMiddle, deletePost);
app.get("/post/:postId/like", AuthMiddle, likePost);
app.get("/post/:postId/unlike", AuthMiddle, unlikePost);
app.post("/post/:postId/comment", AuthMiddle, createComment);

// User Route
app.post("/signup", signUp);
app.post("/login", logIn);
app.get("/currentuser", AuthMiddle, getCurrentUser);
exports.api = functions.region("us-east1").https.onRequest(app);

const { Timestamp } = require("@google-cloud/firestore");

let db = {
  posts: [
    {
      userName: "userName",
      body: "this is posts body",
      createdAt: String,
      likeCount: 5,
      commentCount: 10,
    },
  ],
  comments: [
    {
      userName: "userName",
      postId: "t12313f",
      commentId: " asdasd",
      body: "Nice",
      createdAt: Timestamp,
    },
  ],
};

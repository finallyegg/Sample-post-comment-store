const { db, admin } = require("../util/admin");

exports.getAllpost = (req, res) => {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push({
          postId: doc.id,
          ...doc.data(),
        });
      });
      return res.json(posts);
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.createPost = (req, res) => {
  const newPost = {
    body: req.body.body,
    userName: req.user.userName,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection("posts")
    .add(newPost)
    .then((doc) => {
      return res.json({ ...newPost, postId: doc.id });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};
exports.getPost = (req, res) => {
  let postData = {};
  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "POST NOT FOUND" });
      }
      postData = doc.data();
      postData.postID = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("postId", "==", req.params.postId)
        .get();
    })
    .then((comments) => {
      postData.comments = [];
      comments.forEach((comment) => {
        postData.comments.push({ ...comment.data(), commentId: comment.id }); //TODO
      });
      return res.json(postData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err.code });
    });
};
exports.createComment = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ error: "NOT EMPTY" });
  const newComment = {
    postId: req.params.postId,
    body: req.body.body,
    userName: req.user.userName,
    createdAt: new Date().toISOString(),
  };
  let postDocument = db.doc(`/posts/${req.params.postId}`);
  let postData;
  postDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(500).json({ error: "POST NOT FOUND" });
      }
      postData = doc.data();
      return db.collection("comments").add(newComment);
    })
    .then((doc) => {
      postData.commentCount++;
      postDocument.update({ commentCount: postData.commentCount });
      return res.json({ ...newComment, commentId: doc.id });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

exports.likePost = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .where("postId", "==", req.params.postId)
    .limit(1);

  let postDocument = db.doc(`/posts/${req.params.postId}`);
  let postData;
  postDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(500).json({ error: "POST NOT FOUND" });
      }
      postData = doc.data();
      return likeDocument.get();
    })
    .then((data) => {
      if (data.empty) {
        const newLike = {
          userName: req.user.userName,
          postId: req.params.postId,
        };
        return db
          .collection("likes")
          .add(newLike)
          .then((doc) => {
            postData.likeCount++;
            postDocument.update({ likeCount: postData.likeCount });
            return res.json({ likeSucess_ID: doc.id });
          });
      } else {
        return res.status(400).json({ error: "Already liked" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

exports.unlikePost = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .where("postId", "==", req.params.postId)
    .limit(1);

  let postDocument = db.doc(`/posts/${req.params.postId}`);
  let postData;
  postDocument
    .get()
    .then((postDoc) => {
      if (!postDoc.exists) {
        return res.status(404).json({ error: "POST NOT FOUND" });
      }
      postData = postDoc.data();
      return likeDocument.get();
    })
    .then((data) => {
      if (!data.empty) {
        const likeId = data.docs[0].id;
        return db
          .doc(`/likes/${likeId}`)
          .delete()
          .then((doc) => {
            postData.likeCount--;
            postDocument.update({ likeCount: postData.likeCount });
            return res.json({ unlikeSucess_ID: doc });
          });
      } else {
        return res.status(400).json({ error: "Already unliked" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};
exports.deletePost = (req, res) => {
  const postId = req.params.postId;
  let postDocument = db.doc(`/posts/${postId}`);
  postDocument
    .get()
    .then((postDoc) => {
      if (!postDoc.exists) {
        return res.status(404).json({ error: "NOT FOUND" });
      }
      //   console.log(req.user.userName);
      //   console.log(postDoc.data().userName);
      //   console.log(postDoc.userName == req.user.userName);
      if (postDoc.data().userName !== req.user.userName) {
        return res.status(403).json({ error: "FORB" });
      } else {
        // remove likes
        return db.collection("likes").where("postId", "==", postId).get();
      }
    })
    .then((likes) => {
      if (likes.exists) {
        likes.forEach((like) => {
          db.doc(`/likes/${like.id}`).delete();
        });
      } else {
        return db.collection("comments").where("postId", "==", postId).get();
      }
    })
    .then((comments) => {
      if (comments.exists) {
        comments.forEach((comment) => {
          return db.doc(`/comments/${comment.id}`).delete();
        });
      } else {
        return db.doc(`/posts/${postId}`).delete();
      }
    })
    .then(() => {
      res.json({ delete: "Success" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

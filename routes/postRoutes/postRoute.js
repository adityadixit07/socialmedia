import express from "express";
import {
  addComment,
  createPost,
  deleteAllPosts,
  deleteComment,
  deletePost,
  followUser,
  getFollowingPosts,
  likeAndUnlikePost,
  updatePost,
} from "../../controllers/postController/post.js";
import { isAuthenticated } from "../../midllewares/isAuthenticated.js";

export const postRouter = express.Router();

postRouter.route("/create/post").post(isAuthenticated, createPost);
// delete all posts of a user
postRouter.route("/delete/posts").delete(isAuthenticated, deleteAllPosts);
// delete one post of a user at a time
postRouter.route("/delete/post/:id").delete(isAuthenticated, deletePost);
// like the post
postRouter.route("/post/:id").get(isAuthenticated, likeAndUnlikePost);
// get following posts
postRouter.route("/following/posts").get(isAuthenticated, getFollowingPosts);
// update post description and title
postRouter.route("/update/post/:id").put(isAuthenticated, updatePost);
// add and update comment
postRouter.route("/post/comment/:id").put(isAuthenticated, addComment);
// delete comment
postRouter.route("/post/comment/:id").delete(isAuthenticated, deleteComment);

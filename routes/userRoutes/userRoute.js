import express from "express";
import {
  deleteProfile,
  forgotPassword,
  getAllUsers,
  getUserProfile,
  login,
  logout,
  myProfile,
  register,
  resetPassword,
  updatePassword,
  updateProfile,
} from "../../controllers/userController/User.js";
import { followUser } from "../../controllers/postController/post.js";
import { isAuthenticated } from "../../midllewares/isAuthenticated.js";

export const userRouter = express.Router();

// register the user
userRouter.route("/register").post(register);
// login user
userRouter.route("/login").post(login);
// logout user
userRouter.route("/logout").get(logout);
// follow user
userRouter.route("/follow/:id").get(isAuthenticated, followUser);
// update password
userRouter.route("/update/password").put(isAuthenticated, updatePassword);
// update profile
userRouter.route("/update/profile").put(isAuthenticated, updateProfile);
// delete user profile
userRouter.route("/delete/myprofile").delete(isAuthenticated, deleteProfile);
// my profile information
userRouter.route("/me").get(isAuthenticated, myProfile);
// get user profile
userRouter.route("/user/:id").get(isAuthenticated, getUserProfile);
// get all users
userRouter.route("/users").get(isAuthenticated, getAllUsers);
// forget password
userRouter.route("/forgot/password").post(forgotPassword);
// reset password
userRouter.route("/password/reset/:token").put(resetPassword);

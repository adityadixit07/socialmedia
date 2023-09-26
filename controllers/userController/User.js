import sendEmail from "../../midllewares/sendEmail.js";
import User from "../../schema/UserSchema.js";
import Post from "../../schema/postSchema.js";
import crypto from "crypto";

//register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Login to post",
      });
    }
    if (!name || !email || !password) {
      res
        .status(400)
        .json({ success: false, message: "Plesase enter the fields" });
    }
    const user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: "pulic_id",
        url: "image url",
      },
    });
    await user.save();
    const token = await user.generateToken();
    res
      .status(200)
      .cookie("token", token, {
        expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "User Registered successfully",
        user: user._id,
        token,
      });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter the email and password",
      });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({
        success: false,
        message: "email does not exist. Try with other email.",
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    const token = await user.generateToken();

    res
      .status(200)
      .cookie("token", token, {
        expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: "none",
        // secure false ka matlab hai ki humara cookie http ke through bhi send ho jayega
      })
      .json({
        success: true,
        message: "User logged in successfully",
        user,
        token,
      });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// logout user
export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "User logged out" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// update password
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;
    // error handling
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter the old and new password",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old Password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// update profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email } = req.body;
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter the fields" });
    }
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// delete the user profile
export const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // get user posts
    const followers = user.followers;
    const following = user.following;
    const userId = user._id;
    await user.deleteOne();

    // logout user afer deleting user
    res.clearCookie("token");

    // delete all the post associated with the user
    await Post.deleteMany({ owner: req.user._id });

    // removing user from followers following list
    // jo user login hai  vo agar kiski ko follow kr rha hai to hum us follower ke following list se us user ko remove kr denge
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }
    for (let i = 0; i < following.length; i++) {
      const follow = await User.findById(following[i]);
      const index = follow.followers.indexOf(userId);
      follow.followers.splice(index, 1);
      await follow.save();
    }
    res.status(200).json({ success: true, message: "User Profile deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// give my profile information
export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("posts");
    // console.log(req.user._id);
    // populate ka use isliye kiya hai taki user ke saath uske posts bhi aa jaye
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    res.status(200).json({ success: true, message: "User Profile", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("posts");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    res.status(200).json({ success: true, message: "User Profile", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ success: true, message: "All Users", users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({ success: false, message: "User does not exist" });
    }
    const resetPasswordToken = await user.getResetPasswordToken();
    await user.save();
    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetPasswordToken}`;
    // console.log(resetPasswordUrl)
    const message = `Your password reset token is as follows:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, then ignore it.`;
    // console.log(message);
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset",
        message,
      });
      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
        message,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    // gt use kia hai taki jo time hai vo current time se bada ho
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token or hash expired",
      });
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

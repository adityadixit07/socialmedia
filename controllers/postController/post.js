import User from "../../schema/UserSchema.js";
import Post from "../../schema/postSchema.js";

// create post
export const createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    // add basic validation
    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all the fields" });
    }

    const newPost = await Post.create({
      title,
      description,
      image: {
        public_id: "public_id",
        url: "url",
      },
      owner: req.user._id,
    });
    // pushing the new post to the user posts array
    const user = await User.findById(req.user._id);
    user.posts.push(newPost._id);
    await user.save();

    return res
      .status(201)
      .json({ success: true, message: "Post created successfully", newPost });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// delete all posts of a user
export const deleteAllPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    await Post.deleteMany({ owner: req.user._id });
    // after this update the user posts array
    user.posts = [];
    await user.save();
    res.status(200).json({ success: true, message: "All posts deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// delete one  post of a user at a time
export const deletePost = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(400)
        .json({ success: false, message: "Post does not exist" });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthrorised",
      });
    }
    await Post.findByIdAndDelete(req.params.id);
    // updating the user posts array
    user = await User.findById(req.user._id);
    const index = user.posts.indexOf(req.params.id);
    user.posts.splice(index, 1);
    await user.save();

    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// like and unlike post
export const likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(400).json({ success: false, message: "Post does not exist" });
    }
    // if the post is already liked then dislike it logic
    if (post.likes.includes(req.user._id)) {
      const index = post.likes.indexOf(req.user._id);
      post.likes.splice(index, 1);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Post Disliked",
      });
    }
    // like the Post
    post.likes.push(req.user._id);
    post.save();
    return res.status(200).json({
      success: true,
      message: "Post Liked",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// follow user
export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);

    if (!userToFollow) {
      res.status(400).json({ success: false, message: "User does not exist" });
    }
    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot follow yourself" });
    }

    // unfollow the user
    if (loggedInUser.following.includes(userToFollow._id)) {
      const index = loggedInUser.following.indexOf(userToFollow._id);
      loggedInUser.following.splice(index, 1);
      await loggedInUser.save();
      // unfollow the user
      const index2 = userToFollow.followers.indexOf(loggedInUser._id);
      userToFollow.followers.splice(index2, 1);
      await userToFollow.save();
      return res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    }

    // update the loggedInUser following array
    loggedInUser.following.push(userToFollow._id);
    // follow the user
    userToFollow.followers.push(loggedInUser._id);
    await userToFollow.save();
    await loggedInUser.save();
    return res.status(200).json({
      success: true,
      message: "User Followed",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get followingposts
export const getFollowingPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({ owner: { $in: user.following } });
    // in ka use ka reason hai ki agar user ne kisi ko unfollow kar diya toh uske posts bhi nahi dikhenge
    res.status(200).json({ success: true, message: "posts fetched", posts });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// update title and description of a post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(400).json({ success: false, message: "Post does not exist" });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorised" });
    }
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all the fields" });
    }
    post.title = title;
    post.description = description;
    await post.save();
    res
      .status(200)
      .json({ success: true, message: "Post updated", updatedPost: post });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//add and update Comment
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(400).json({ success: false, message: "Post does not exist" });
    }
    const { comment } = req.body;
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all the fields" });
    }

    let commentAlreadyExistsIndex = -1;
    post.comments.forEach((comment, index) => {
      if (comment.user.toString() === req.user._id.toString()) {
        commentAlreadyExistsIndex = index;
      }
    });

    if (commentAlreadyExistsIndex != -1) {
      post.comments[commentAlreadyExistsIndex].comment = comment;
      await post.save();
      return res
        .status(400)
        .json({ success: false, message: "Comment Updated" });
    }

    post.comments.push({
      comment,
      user: req.user._id,
    });
    await post.save();
    res.status(200).json({ success: true, message: "Comment added" });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// delete the comment
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(400).json({ success: false, message: "Post does not exist" });
    }

    // post owner can delete any comment
    if (post.owner.toString() === req.user._id.toString()) {
      if (req.body.commentId === undefined) {
        return res
          .status(400)
          .json({ success: false, message: "Please enter the comment id" });
      }
      post.comments.forEach((comment, index) => {
        if (comment._id.toString() === req.body.commentId.toString()) {
          post.comments.splice(index, 1);
        }
        post.comments.splice(index, 1);
      });
      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "Selected comment deleted" });
    } else {
      post.comments.forEach((comment, index) => {
        if (comment.user.toString() === req.user._id.toString()) {
          post.comments.splice(index, 1);
        }
      });
      await post.save();
      res.status(200).json({ success: true, message: "Your Comment deleted" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

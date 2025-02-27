const Post = require("../model/post.model");
const Comment = require("../model/comment.model");
const User = require("../model/user.model")
exports.getPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const title = req.query.title;
    let query = {};
    // ricerca post kay insensitive
    if (title) {
      query.title = { $regex: `\\b${title}`, $options: "i" }; //ricerca tramite titolo key insensitive
    }

    // trova post con l'array invertito per ottenere i post dall'ultimo inserito
    const post = await Post.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 });
    const totalPosts = await Post.countDocuments(query);
    res.status(200).json({
      post,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ userId: userId });
    const reversedPost = posts.reverse();
    res.status(200).json(reversedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delatePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Cancellare tutti i commenti associati al post
    await Comment.deleteMany({ postId: postId });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.postLike = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;
    
    const user = await User.findById(userId)
    const post = await Post.findById(postId);

    const userName = user.name
    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (post.likedBy.includes(userId)) {
      return res.status(400).send("You have already liked this post");
    }

    post.likedBy.push(userId);
    post.likedByName.push(userName);
    
    post.likes += 1;

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.PostPost = async (req, res) => {
  try {
    console.log("Inizio della funzione");
    console.log("req.userId:", req.userId);
    const user = await User.findById(req.userId)
    console.log("Utente trovato:", user);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    req.body.userId = req.userId;
    req.body.userName = user.name;
    req.body.email = user.email
    console.log("Creazione del post");
    const post = await Post.create(req.body);
    console.log("Post creato:", post);
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

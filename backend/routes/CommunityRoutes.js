const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const communityController = require("../controllers/communityController");
const notificationController = require("../controllers/notificationController");

// All routes require authentication
router.use(authenticate);

// ========== POSTS ==========
router
  .route("/posts")
  .get(communityController.getPosts)
  .post(communityController.createPost);

router
  .route("/posts/:postId")
  .get(communityController.getPostById)
  .put(communityController.updatePost)
  .delete(communityController.deletePost);

// ========== COMMENTS ==========
router.post("/posts/:postId/comments", communityController.addComment);
router.put("/comments/:commentId", communityController.updateComment);
router.delete("/comments/:commentId", communityController.deleteComment);

// ========== LIKES ==========
router.post("/posts/:postId/like", communityController.toggleLike);

// ========== SEARCH ==========
router.get("/search", communityController.search);

// ========== NOTIFICATIONS ==========
router.get("/notifications", notificationController.getNotifications);
router.put(
  "/notifications/:notificationId/read",
  notificationController.markAsRead,
);
router.put("/notifications/read-all", notificationController.markAllAsRead);

module.exports = router;

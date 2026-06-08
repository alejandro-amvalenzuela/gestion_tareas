const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getAll);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.delete);
router.get("/:id/pending-tasks", userController.getPendingTasks);
router.patch("/:id/toggle", userController.toggleStatus);

module.exports = router;

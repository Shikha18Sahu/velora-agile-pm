const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, addComment, addTaskLink } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/:projectId')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.route('/:id/comments')
  .post(protect, addComment);

router.route('/:id/links')
  .post(protect, addTaskLink);

module.exports = router;

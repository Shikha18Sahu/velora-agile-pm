const express = require('express');
const router = express.Router();
const { getProjects, createProject, deleteProject, inviteMember } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProjects)
  .post(protect, createProject);

router.route('/:id')
  .delete(protect, deleteProject);

router.route('/:id/invite')
  .post(protect, inviteMember);

module.exports = router;

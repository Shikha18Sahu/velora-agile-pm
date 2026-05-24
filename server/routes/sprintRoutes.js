const express = require('express');
const router = express.Router();
const { 
  getSprints, 
  createSprint, 
  updateSprint, 
  completeSprint, 
  deleteSprint 
} = require('../controllers/sprintController');
const { protect } = require('../middleware/auth');

router.route('/:projectId')
  .get(protect, getSprints)
  .post(protect, createSprint);

router.route('/sprint/:id')
  .put(protect, updateSprint)
  .delete(protect, deleteSprint);

router.route('/sprint/:id/complete')
  .post(protect, completeSprint);

module.exports = router;

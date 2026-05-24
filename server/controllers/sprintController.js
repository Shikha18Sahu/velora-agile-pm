const Sprint = require('../models/sprint');
const Project = require('../models/project');
const Task = require('../models/task');

// @desc    Get all sprints for a project
// @route   GET /api/sprints/:projectId
// @access  Private
const getSprints = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Auth check
    const isMember = project.owner.toString() === req.user.id || 
                     project.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const sprints = await Sprint.find({ project: req.params.projectId })
      .populate('memberCapacities.user', 'name email')
      .sort({ createdAt: 1 });
    res.json({ success: true, count: sprints.length, data: sprints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching sprints' });
  }
};

// @desc    Create a new sprint
// @route   POST /api/sprints/:projectId
// @access  Private
const createSprint = async (req, res) => {
  try {
    const { name, goal, startDate, endDate, memberCapacities } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please provide name, start date and end date' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check (Admin/Member can create, Viewer cannot)
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const isAdminOrMember = project.owner.toString() === req.user.id || 
                            (member && (member.role === 'Admin' || member.role === 'Member'));
    if (!isAdminOrMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to create sprints (Admin/Member only)' });
    }

    let sprint = await Sprint.create({
      name,
      goal,
      startDate,
      endDate,
      project: req.params.projectId,
      status: 'planning',
      memberCapacities: memberCapacities || []
    });

    sprint = await Sprint.findById(sprint._id).populate('memberCapacities.user', 'name email');

    res.status(201).json({ success: true, data: sprint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error creating sprint' });
  }
};

// @desc    Update a sprint (activate, modify details)
// @route   PUT /api/sprints/:id
// @access  Private
const updateSprint = async (req, res) => {
  try {
    const { name, goal, startDate, endDate, status, memberCapacities } = req.body;
    let sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    const project = await Project.findById(sprint.project);
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const isAdminOrMember = project.owner.toString() === req.user.id || 
                            (member && (member.role === 'Admin' || member.role === 'Member'));
    if (!isAdminOrMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to update sprints' });
    }

    // If activating sprint, verify no other active sprints exist for this project
    if (status === 'active' && sprint.status !== 'active') {
      const activeSprint = await Sprint.findOne({ project: sprint.project, status: 'active' });
      if (activeSprint) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot activate sprint. Another sprint "${activeSprint.name}" is currently active.` 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (goal !== undefined) updateData.goal = goal;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;
    if (memberCapacities !== undefined) updateData.memberCapacities = memberCapacities;

    sprint = await Sprint.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('memberCapacities.user', 'name email');
    res.json({ success: true, data: sprint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating sprint' });
  }
};

// @desc    Complete a sprint (close active and move remaining tasks)
// @route   POST /api/sprints/:id/complete
// @access  Private
const completeSprint = async (req, res) => {
  try {
    const { incompleteAction, targetSprintId } = req.body; // 'backlog' or 'sprint'
    let sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    if (sprint.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active sprints can be completed' });
    }

    const project = await Project.findById(sprint.project);
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const isAdminOrMember = project.owner.toString() === req.user.id || 
                            (member && (member.role === 'Admin' || member.role === 'Member'));
    if (!isAdminOrMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete sprints' });
    }

    // Complete the sprint
    sprint.status = 'completed';
    sprint.completedAt = Date.now();
    await sprint.save();

    // Identify incomplete tasks
    const incompleteTasks = await Task.find({ sprint: sprint._id, status: { $ne: 'done' } });
    const incompleteCount = incompleteTasks.length;

    if (incompleteCount > 0) {
      if (incompleteAction === 'sprint' && targetSprintId) {
        // Move to target sprint
        await Task.updateMany(
          { sprint: sprint._id, status: { $ne: 'done' } },
          { $set: { sprint: targetSprintId } }
        );
      } else {
        // Default: return to backlog
        await Task.updateMany(
          { sprint: sprint._id, status: { $ne: 'done' } },
          { $set: { sprint: null } }
        );
      }
    }

    res.json({ 
      success: true, 
      message: `Sprint completed successfully. Moved ${incompleteCount} incomplete tasks.`,
      data: sprint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error completing sprint' });
  }
};

// @desc    Delete a sprint (move tasks back to backlog)
// @route   DELETE /api/sprints/:id
// @access  Private
const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    const project = await Project.findById(sprint.project);
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const isAdminOrMember = project.owner.toString() === req.user.id || 
                            (member && (member.role === 'Admin' || member.role === 'Member'));
    if (!isAdminOrMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete sprints' });
    }

    // Revert tasks inside this sprint to backlog
    await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });

    // Delete sprint
    await Sprint.findByIdAndDelete(sprint._id);

    res.json({ success: true, message: 'Sprint successfully deleted. Associated tasks returned to backlog.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error deleting sprint' });
  }
};

module.exports = {
  getSprints,
  createSprint,
  updateSprint,
  completeSprint,
  deleteSprint
};

const Task = require('../models/task');
const Project = require('../models/project');
const Notification = require('../models/notification');
const User = require('../models/user');

// @desc    Get all tasks for a project
// @route   GET /api/tasks/:projectId
// @access  Private
const getTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify user is owner or member
    const isMember = project.owner.toString() === req.user.id || 
                     project.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to view tasks for this project' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .populate('sprint', 'name status')
      .populate('parentTask', 'key title status')
      .populate('comments.author', 'name email')
      .populate('links.targetTask', 'key title status')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching tasks' });
  }
};

// @desc    Create a new task in a project
// @route   POST /api/tasks/:projectId
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignee, type, storyPoints, dueAt, sprint, parentTask } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please add a task title' });
    }

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify user role: Admins or Members can create. Viewers cannot.
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const hasWriteAccess = project.owner.toString() === req.user.id || 
                           (member && (member.role === 'Admin' || member.role === 'Member'));
    
    if (!hasWriteAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized: Viewer role cannot create tasks.' });
    }

    // Atomic increment of project taskCounter
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $inc: { taskCounter: 1 } },
      { new: true }
    );

    const taskKey = `${updatedProject.key}-${updatedProject.taskCounter}`;

    const task = await Task.create({
      title,
      description,
      key: taskKey,
      type: type || 'task',
      priority: priority || 'medium',
      status: 'todo',
      storyPoints: storyPoints || 0,
      dueAt: dueAt || null,
      project: req.params.projectId,
      assignee: assignee || null,
      sprint: sprint || null,
      parentTask: parentTask || null,
      activityLog: [{
        user: req.user.id,
        text: 'created the issue'
      }]
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('sprint', 'name status');

    // Create Notification if assignee is set
    if (assignee && assignee !== req.user.id) {
      await Notification.create({
        user: assignee,
        text: `You have been assigned to task "${title}" (${taskKey}).`,
        link: `/projects/${req.params.projectId}`
      });
    }

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error creating task' });
  }
};

// @desc    Update a task (details, status, links, log changes)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    
    // Verify user role permissions
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const hasWriteAccess = project.owner.toString() === req.user.id || 
                           (member && (member.role === 'Admin' || member.role === 'Member'));
    
    if (!hasWriteAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized: Viewer role cannot modify tasks.' });
    }

    const { title, description, priority, status, assignee, type, storyPoints, dueAt, sprint } = req.body;
    
    const logs = [];

    // Track status change
    if (status !== undefined && status !== task.status) {
      logs.push(`changed status from "${task.status}" to "${status}"`);
      task.status = status;
    }

    // Track assignee change
    if (assignee !== undefined) {
      const oldAssigneeId = task.assignee ? task.assignee.toString() : '';
      const newAssigneeId = assignee ? assignee.toString() : '';
      
      if (oldAssigneeId !== newAssigneeId) {
        if (assignee) {
          const newAssigneeUser = await User.findById(assignee);
          logs.push(`assigned to "${newAssigneeUser.name}"`);
          
          // Notify new assignee
          if (assignee !== req.user.id) {
            await Notification.create({
              user: assignee,
              text: `You have been assigned to task "${task.title}" (${task.key}).`,
              link: `/projects/${project._id}`
            });
          }
        } else {
          logs.push('removed the assignee');
        }
        task.assignee = assignee || null;
      }
    }

    // Track story points change
    if (storyPoints !== undefined && storyPoints !== task.storyPoints) {
      logs.push(`changed story points from ${task.storyPoints} to ${storyPoints}`);
      task.storyPoints = storyPoints;
    }

    // Track details modification
    let genericChange = false;
    if (title !== undefined && title !== task.title) {
      task.title = title;
      genericChange = true;
    }
    if (description !== undefined && description !== task.description) {
      task.description = description;
      genericChange = true;
    }
    if (priority !== undefined && priority !== task.priority) {
      task.priority = priority;
      genericChange = true;
    }
    if (type !== undefined && type !== task.type) {
      task.type = type;
      genericChange = true;
    }
    if (dueAt !== undefined && dueAt !== task.dueAt) {
      task.dueAt = dueAt || null;
      genericChange = true;
    }
    if (sprint !== undefined && sprint !== task.sprint) {
      task.sprint = sprint || null;
      genericChange = true;
    }

    if (genericChange && logs.length === 0) {
      logs.push('updated issue details');
    }

    // Append logs to activityLog array
    logs.forEach(logText => {
      task.activityLog.push({
        user: req.user.id,
        text: logText
      });
    });

    await task.save();

    // Reload with populaters
    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('sprint', 'name status')
      .populate('parentTask', 'key title status')
      .populate('comments.author', 'name email')
      .populate('links.targetTask', 'key title status');

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating task' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    
    // Verify user role
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const hasWriteAccess = project.owner.toString() === req.user.id || 
                           (member && (member.role === 'Admin' || member.role === 'Member'));
    
    if (!hasWriteAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized: Viewer role cannot delete tasks.' });
    }

    // Delete subtasks if any
    await Task.deleteMany({ parentTask: task._id });

    // Remove from other tasks links references
    await Task.updateMany(
      { 'links.targetTask': task._id },
      { $pull: { links: { targetTask: task._id } } }
    );

    await Task.findByIdAndDelete(task._id);

    res.json({ success: true, message: 'Task successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error deleting task' });
  }
};

// @desc    Add a comment to a task (mentions will create alerts)
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please add a comment string' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);

    // Member checks
    const isMember = project.owner.toString() === req.user.id || 
                     project.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Create comment
    const comment = {
      author: req.user.id,
      text,
      createdAt: Date.now()
    };

    task.comments.push(comment);
    
    // Log comment activity
    task.activityLog.push({
      user: req.user.id,
      text: 'added a comment'
    });

    await task.save();

    // Check for @mentions in comment text
    for (const m of project.members) {
      const memberUser = await User.findById(m.user);
      if (memberUser && text.includes(`@${memberUser.name}`) && memberUser._id.toString() !== req.user.id.toString()) {
        await Notification.create({
          user: memberUser._id,
          text: `${req.user.name} mentioned you in a comment on "${task.title}" (${task.key}).`,
          link: `/projects/${project._id}`
        });
      }
    }

    // Populate comments.author
    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('sprint', 'name status')
      .populate('parentTask', 'key title status')
      .populate('comments.author', 'name email')
      .populate('links.targetTask', 'key title status');

    res.status(201).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};

// @desc    Link related issues (reciprocally blocks/blocked_by or relates_to)
// @route   POST /api/tasks/:id/links
// @access  Private
const addTaskLink = async (req, res) => {
  try {
    const { targetTaskId, linkType } = req.body; // linkType: blocks, blocked_by, relates_to
    if (!targetTaskId || !linkType) {
      return res.status(400).json({ success: false, message: 'Please provide target task ID and link type' });
    }

    const task = await Task.findById(req.params.id);
    const targetTask = await Task.findById(targetTaskId);

    if (!task || !targetTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Prevent linking task to itself
    if (task._id.toString() === targetTask._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot link a task to itself' });
    }

    // Check permissions
    const project = await Project.findById(task.project);
    const member = project.members.find(m => m.user.toString() === req.user.id);
    const hasWriteAccess = project.owner.toString() === req.user.id || 
                           (member && (member.role === 'Admin' || member.role === 'Member'));
    
    if (!hasWriteAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify tasks' });
    }

    // Check if link already exists
    const linkExists = task.links.some(l => l.targetTask.toString() === targetTaskId);
    if (linkExists) {
      return res.status(400).json({ success: false, message: 'Tasks are already linked' });
    }

    // Link A to B
    task.links.push({
      targetTask: targetTaskId,
      linkType
    });
    task.activityLog.push({
      user: req.user.id,
      text: `linked this task as "${linkType}" to ${targetTask.key}`
    });
    await task.save();

    // Link B to A (reciprocal link)
    let reciprocalType = linkType;
    if (linkType === 'blocks') reciprocalType = 'blocked_by';
    else if (linkType === 'blocked_by') reciprocalType = 'blocks';

    targetTask.links.push({
      targetTask: task._id,
      linkType: reciprocalType
    });
    targetTask.activityLog.push({
      user: req.user.id,
      text: `linked this task as "${reciprocalType}" to ${task.key}`
    });
    await targetTask.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('sprint', 'name status')
      .populate('parentTask', 'key title status')
      .populate('comments.author', 'name email')
      .populate('links.targetTask', 'key title status');

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error linking tasks' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  addTaskLink
};

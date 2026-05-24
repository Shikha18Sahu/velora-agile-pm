const Project = require('../models/project');
const Task = require('../models/task');
const mongoose = require('mongoose');

const getDashboardStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    const projectIds = projects.map(p => p._id);
    const totalProjects = projects.length;

    if (totalProjects === 0) {
      return res.json({
        success: true,
        stats: { totalProjects: 0, totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
        recentTasks: []
      });
    }

    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
    const todoCount = await Task.countDocuments({ project: { $in: projectIds }, status: 'todo' });
    const inProgressCount = await Task.countDocuments({ project: { $in: projectIds }, status: 'in_progress' });
    const doneCount = await Task.countDocuments({ project: { $in: projectIds }, status: 'done' });

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: { totalProjects, totalTasks, todoCount, inProgressCount, doneCount },
      recentTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error loading dashboard statistics' });
  }
};

module.exports = { getDashboardStats };
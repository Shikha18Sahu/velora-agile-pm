const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/user');
const Notification = require('../models/notification');

// Helper to generate a project key from its name
const generateProjectKey = (name) => {
  // Remove special characters, clean double spaces
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanName.split(/\s+/);
  
  let key = '';
  if (words.length >= 2) {
    // Take first letter of each word
    key = words.map(w => w[0]).join('');
  } else if (cleanName.length >= 3) {
    // Single word, take first 3 characters
    key = cleanName.substring(0, 3);
  } else {
    // Short word, pad with PRJ
    key = (cleanName + 'PRJ').substring(0, 3);
  }
  
  return key.toUpperCase().substring(0, 5); // Max 5 chars
};

// @desc    Get all projects for the logged in user (owner or member)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    }).populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching projects' });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, key: customKey } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Please add a project name and description' });
    }

    // Auto-generate key or use custom if provided
    let key = customKey ? customKey.trim().toUpperCase() : generateProjectKey(name);
    
    // Ensure key is unique
    const keyExists = await Project.findOne({ key });
    if (keyExists) {
      // Append a random number to resolve conflict
      key = `${key}${Math.floor(Math.random() * 9) + 1}`;
    }

    const project = await Project.create({
      name,
      description,
      key,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'Admin' }] // Creator is Admin
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({ success: true, data: populatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error creating project' });
  }
};

// @desc    Delete a project and its associated tasks
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check project owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project. Only the owner can delete it.' });
    }

    // Delete associated tasks
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await Project.findByIdAndDelete(project._id);

    res.json({ success: true, message: 'Project and all associated tasks successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error deleting project' });
  }
};

// @desc    Invite a user to a project by email
// @route   POST /api/projects/:id/invite
// @access  Private
const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body; // role: Admin, Member, Viewer
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Auth check: Current user must be owner or Admin role in the project
    const currentMember = project.members.find(m => m.user.toString() === req.user.id);
    const isProjectAdmin = project.owner.toString() === req.user.id || 
                           (currentMember && currentMember.role === 'Admin');
    if (!isProjectAdmin) {
      return res.status(403).json({ success: false, message: 'Only project Admins or Owners can invite members' });
    }

    // Find user to invite
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ success: false, message: `User with email ${email} is not registered yet.` });
    }

    // Check if user is already a member
    const alreadyMember = project.members.some(m => m.user.toString() === invitedUser._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    // Add member
    const targetRole = role || 'Member';
    project.members.push({ user: invitedUser._id, role: targetRole });
    await project.save();

    // Create a Notification for the invited user
    await Notification.create({
      user: invitedUser._id,
      text: `You have been added to the project "${project.name}" as a ${targetRole}.`,
      link: `/projects/${project._id}`
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({ success: true, message: 'User successfully added to project', data: populatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error inviting member' });
  }
};

module.exports = {
  getProjects,
  createProject,
  deleteProject,
  inviteMember
};

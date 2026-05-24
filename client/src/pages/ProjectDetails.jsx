import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Modal from '../components/Modal';
import TaskModal from '../components/TaskModal';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line
} from 'recharts';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Briefcase,
  Calendar,
  Sparkles,
  Info,
  List,
  Kanban,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  UserPlus,
  Play,
  CheckSquare,
  Settings,
  Trash2,
  Bookmark,
  Bug,
  Crown,
  GitPullRequest,
  Check,
  Search,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab state
  const [activeTab, setActiveTab] = useState('summary');

  // Task Details states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // New Task states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskType, setNewTaskType] = useState('task');
  const [newTaskPoints, setNewTaskPoints] = useState(0);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskSprint, setNewTaskSprint] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // New Sprint states
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');
  const [sprintCreateLoading, setSprintCreateLoading] = useState(false);

  // Complete Sprint Modal states
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingSprint, setCompletingSprint] = useState(null);
  const [incompleteAction, setIncompleteAction] = useState('backlog'); // 'backlog' or 'sprint'
  const [targetSprintId, setTargetSprintId] = useState('');
  const [completeSprintLoading, setCompleteSprintLoading] = useState(false);

  // Invite Member states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [inviteErrorMsg, setInviteErrorMsg] = useState('');

  // List View states (search, sort, filter)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [sortField, setSortField] = useState('key');
  const [sortDirection, setSortDirection] = useState('asc');

  // Capacity states per sprint
  const [editingCapacitySprintId, setEditingCapacitySprintId] = useState(null);
  const [tempCapacities, setTempCapacities] = useState({}); // { [userId]: capacity }

  // Task Icons Mapping
  const typeIcons = {
    task: <CheckSquare className="h-4 w-4 text-sky-400" />,
    story: <Bookmark className="h-4 w-4 text-emerald-400 fill-emerald-400" />,
    bug: <Bug className="h-4 w-4 text-rose-500" />,
    epic: <Crown className="h-4 w-4 text-violet-500 fill-violet-500" />,
    subtask: <GitPullRequest className="h-4 w-4 text-indigo-400" />
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch current project
      const projRes = await api.get('/projects');
      const currentProj = projRes.data.data.find(p => p._id === projectId);
      
      if (!currentProj) {
        setError('Project not found or you do not have permission to access it.');
        setLoading(false);
        return;
      }
      setProject(currentProj);

      // 2. Fetch tasks
      const taskRes = await api.get(`/tasks/${projectId}`);
      if (taskRes.data.success) {
        setTasks(taskRes.data.data);
      }

      // 3. Fetch sprints
      const sprintRes = await api.get(`/sprints/${projectId}`);
      if (sprintRes.data.success) {
        setSprints(sprintRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching project board data:', err);
      setError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const taskRes = await api.get(`/tasks/${projectId}`);
      if (taskRes.data.success) {
        setTasks(taskRes.data.data);
      }
      const sprintRes = await api.get(`/sprints/${projectId}`);
      if (sprintRes.data.success) {
        setSprints(sprintRes.data.data);
      }
    } catch (err) {
      console.error('Error refreshing project data:', err);
    }
  };

  // Drag and drop handler
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    // A: DRAGGING SPRINT ASSIGNMENTS
    if (destCol.startsWith('sprint_') || sourceCol.startsWith('sprint_')) {
      const targetSprintId = destCol === 'sprint_backlog' ? null : destCol.replace('sprint_', '');
      
      // Optimistic state update
      setTasks(prev => prev.map(t => 
        t._id === draggableId 
          ? { ...t, sprint: targetSprintId ? { _id: targetSprintId, name: sprints.find(s => s._id === targetSprintId)?.name } : null } 
          : t
      ));

      try {
        await api.put(`/tasks/${draggableId}`, { sprint: targetSprintId });
      } catch (err) {
        console.error('Failed to update task sprint:', err);
        refreshData();
      }
      return;
    }

    // B: DRAGGING STATUS COLUMNS ON BOARD
    // Optimistic Update
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex(t => t._id === draggableId);
    if (taskIndex === -1) return;

    const columnMap = {
      todo: updatedTasks.filter(t => t.status === 'todo'),
      in_progress: updatedTasks.filter(t => t.status === 'in_progress'),
      in_review: updatedTasks.filter(t => t.status === 'in_review'),
      done: updatedTasks.filter(t => t.status === 'done')
    };

    const [movedTask] = columnMap[sourceCol].splice(source.index, 1);
    movedTask.status = destCol;
    columnMap[destCol].splice(destination.index, 0, movedTask);

    const merged = [
      ...columnMap.todo,
      ...columnMap.in_progress,
      ...columnMap.in_review,
      ...columnMap.done,
      ...updatedTasks.filter(t => !['todo', 'in_progress', 'in_review', 'done'].includes(t.status))
    ];
    setTasks(merged);

    try {
      await api.put(`/tasks/${draggableId}`, { status: destCol });
    } catch (err) {
      console.error('Failed to sync board status with server:', err);
      refreshData();
    }
  };

  // Create Task Handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newTaskTitle) {
      setCreateError('Please enter a task title');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await api.post(`/tasks/${projectId}`, {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        assignee: newTaskAssignee || null,
        type: newTaskType,
        storyPoints: Number(newTaskPoints) || 0,
        dueAt: newTaskDueDate || null,
        sprint: newTaskSprint || null
      });

      if (response.data.success) {
        setTasks([response.data.data, ...tasks]);
        setIsCreateModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskPriority('medium');
        setNewTaskAssignee('');
        setNewTaskType('task');
        setNewTaskPoints(0);
        setNewTaskDueDate('');
        setNewTaskSprint('');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setCreateError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Create Sprint Handler
  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprintName || !newSprintStart || !newSprintEnd) {
      alert('Please fill out Name, Start Date, and End Date.');
      return;
    }

    setSprintCreateLoading(true);
    try {
      const response = await api.post(`/sprints/${projectId}`, {
        name: newSprintName,
        goal: newSprintGoal,
        startDate: newSprintStart,
        endDate: newSprintEnd
      });

      if (response.data.success) {
        setSprints([...sprints, response.data.data]);
        setIsSprintModalOpen(false);
        setNewSprintName('');
        setNewSprintGoal('');
        setNewSprintStart('');
        setNewSprintEnd('');
      }
    } catch (err) {
      console.error('Error creating sprint:', err);
      alert('Failed to create sprint.');
    } finally {
      setSprintCreateLoading(false);
    }
  };

  // Sprint Activation (Planning -> Active)
  const handleStartSprint = async (sprintId) => {
    try {
      const response = await api.put(`/sprints/sprint/${sprintId}`, { status: 'active' });
      if (response.data.success) {
        setSprints(sprints.map(s => s._id === sprintId ? response.data.data : s));
        refreshData();
      }
    } catch (err) {
      console.error('Error starting sprint:', err);
      alert(err.response?.data?.message || 'Failed to start sprint.');
    }
  };

  // Sprint Completion Confirmation
  const openCompleteSprintModal = (sprint) => {
    setCompletingSprint(sprint);
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSprint = async () => {
    setCompleteSprintLoading(true);
    try {
      const res = await api.post(`/sprints/sprint/${completingSprint._id}/complete`, {
        incompleteAction,
        targetSprintId: incompleteAction === 'sprint' ? targetSprintId : null
      });

      if (res.data.success) {
        setIsCompleteModalOpen(false);
        setCompletingSprint(null);
        refreshData();
      }
    } catch (err) {
      console.error('Error completing sprint:', err);
      alert('Failed to complete sprint.');
    } finally {
      setCompleteSprintLoading(false);
    }
  };

  // Delete Sprint
  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm('Are you sure you want to delete this sprint? Associated tasks will return to the backlog.')) {
      return;
    }
    try {
      const res = await api.delete(`/sprints/sprint/${sprintId}`);
      if (res.data.success) {
        setSprints(sprints.filter(s => s._id !== sprintId));
        refreshData();
      }
    } catch (err) {
      console.error('Error deleting sprint:', err);
      alert('Failed to delete sprint.');
    }
  };

  // Invite Member Handler
  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteErrorMsg('');
    setInviteSuccessMsg('');
    if (!inviteEmail) return;

    setInviteLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/invite`, {
        email: inviteEmail,
        role: inviteRole
      });

      if (res.data.success) {
        setInviteSuccessMsg(`Successfully invited ${inviteEmail} as a ${inviteRole}!`);
        setProject(res.data.data);
        setInviteEmail('');
      }
    } catch (err) {
      console.error('Error inviting member:', err);
      setInviteErrorMsg(err.response?.data?.message || 'Failed to invite member.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Capacity planning edits
  const handleEditCapacities = (sprint) => {
    setEditingCapacitySprintId(sprint._id);
    const initial = {};
    project.members?.forEach(m => {
      const user = m.user;
      const exist = sprint.memberCapacities?.find(c => (c.user?._id || c.user) === user._id);
      initial[user._id] = exist ? exist.capacity : 10;
    });
    setTempCapacities(initial);
  };

  const handleSaveCapacities = async (sprintId) => {
    const capacitiesArray = Object.keys(tempCapacities).map(userId => ({
      user: userId,
      capacity: Number(tempCapacities[userId]) || 10
    }));

    try {
      const res = await api.put(`/sprints/sprint/${sprintId}`, {
        memberCapacities: capacitiesArray
      });

      if (res.data.success) {
        setSprints(sprints.map(s => s._id === sprintId ? res.data.data : s));
        setEditingCapacitySprintId(null);
      }
    } catch (err) {
      console.error('Error saving capacities:', err);
      alert('Failed to save capacities.');
    }
  };

  // Summary Tab Data calculations
  const getStatusData = () => {
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const inReview = tasks.filter(t => t.status === 'in_review').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return [
      { name: 'To Do', value: todo, color: '#6366f1' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'In Review', value: inReview, color: '#ec4899' },
      { name: 'Done', value: done, color: '#10b981' }
    ];
  };

  const getPriorityData = () => {
    const low = tasks.filter(t => t.priority === 'low').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const high = tasks.filter(t => t.priority === 'high').length;
    return [
      { name: 'Low', count: low, fill: '#64748b' },
      { name: 'Medium', count: medium, fill: '#f59e0b' },
      { name: 'High', count: high, fill: '#ef4444' }
    ];
  };

  const getTypeData = () => {
    const tCount = tasks.filter(t => t.type === 'task').length;
    const sCount = tasks.filter(t => t.type === 'story').length;
    const bCount = tasks.filter(t => t.type === 'bug').length;
    const eCount = tasks.filter(t => t.type === 'epic').length;
    const subCount = tasks.filter(t => t.type === 'subtask').length;
    return [
      { name: 'Task', count: tCount, fill: '#38bdf8' },
      { name: 'Story', count: sCount, fill: '#34d399' },
      { name: 'Bug', count: bCount, fill: '#f87171' },
      { name: 'Epic', count: eCount, fill: '#a78bfa' },
      { name: 'Subtask', count: subCount, fill: '#818cf8' }
    ];
  };

  const getActivityFeed = () => {
    const feed = [];
    tasks.forEach(t => {
      if (t.activityLog) {
        t.activityLog.forEach(log => {
          feed.push({
            ...log,
            taskKey: t.key,
            taskTitle: t.title,
            taskId: t._id
          });
        });
      }
    });
    return feed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  };

  // Gantt Chart roadmap calculation
  const getRoadmapDays = () => {
    const today = new Date();
    const dates = [];
    for (let i = -5; i < 25; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Filter & Sort tasks for List View
  const getFilteredTasks = () => {
    let result = [...tasks];
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.key.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    // Status
    if (filterStatus) {
      result = result.filter(t => t.status === filterStatus);
    }
    // Priority
    if (filterPriority) {
      result = result.filter(t => t.priority === filterPriority);
    }
    // Type
    if (filterType) {
      result = result.filter(t => t.type === filterType);
    }
    // Assignee
    if (filterAssignee) {
      result = result.filter(t => (t.assignee?._id || t.assignee) === filterAssignee);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested properties
      if (sortField === 'assignee') {
        valA = a.assignee?.name || '';
        valB = b.assignee?.name || '';
      } else if (sortField === 'sprint') {
        valA = a.sprint?.name || '';
        valB = b.sprint?.name || '';
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' 
        ? (valA > valB ? 1 : -1) 
        : (valB > valA ? 1 : -1);
    });

    return result;
  };

  // Velocity data calculation
  const getVelocityData = () => {
    const completed = sprints.filter(s => s.status === 'completed');
    return completed.map(s => {
      const sprintTasks = tasks.filter(t => t.sprint?._id === s._id);
      const plannedPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completedPoints = sprintTasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      return {
        name: s.name,
        Planned: plannedPoints,
        Completed: completedPoints
      };
    });
  };

  // Burndown chart calculation
  const getBurndownData = () => {
    const activeSprint = sprints.find(s => s.status === 'active');
    if (!activeSprint) return [];

    const sprintTasks = tasks.filter(t => t.sprint?._id === activeSprint._id);
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    const totalDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1;

    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 0; day < totalDays; day++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + day);

      // Ideal Remaining Points
      const ideal = Math.max(0, totalPoints - (day * (totalPoints / (totalDays - 1 || 1))));

      // Actual Remaining Points
      let actual = null;
      if (currentDay <= today) {
        // Calculate points completed by this day
        const completedPoints = sprintTasks.filter(t => {
          if (t.status !== 'done') return false;
          // Find completion date from activity log or default to createdAt
          const doneLog = t.activityLog?.find(log => log.text.includes('status') && log.text.includes('done'));
          const compDate = doneLog ? new Date(doneLog.createdAt) : new Date(t.createdAt);
          compDate.setHours(0, 0, 0, 0);
          return compDate <= currentDay;
        }).reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        actual = totalPoints - completedPoints;
      }

      data.push({
        dayLabel: `Day ${day}`,
        dateStr: currentDay.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        Ideal: Math.round(ideal * 10) / 10,
        Actual: actual !== null ? Math.round(actual * 10) / 10 : undefined
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-dark-400 text-sm">Loading project board data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link to="/projects" className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Active Sprint references
  const activeSprint = sprints.find(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');

  // Priority badge styling
  const priorityBadges = {
    high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-400 border border-slate-700/60',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Link to="/projects" className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Key: {project.key}
              </span>
              <span className="text-xs text-dark-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-dark-100 mt-2">{project.name}</h1>
            <p className="text-dark-400 text-sm mt-1 max-w-3xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-dark-400 bg-dark-800 border border-dark-700/60 px-3.5 py-2 rounded-xl">
              <Users className="h-4 w-4 text-brand-400" />
              <span>{project.members?.length || 1} Members</span>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" /> Create Issue
            </button>
          </div>
        </div>
      </div>

      {/* TABS BUTTONS */}
      <div className="border-b border-dark-800 flex overflow-x-auto gap-2 scrollbar-none pb-0.5">
        {[
          { id: 'summary', name: 'Summary', icon: TrendingUp },
          { id: 'list', name: 'List View', icon: List },
          { id: 'board', name: 'Active Board', icon: Kanban },
          { id: 'roadmap', name: 'Timeline/Roadmap', icon: Calendar },
          { id: 'sprints', name: 'Sprints & Backlog', icon: Activity },
          { id: 'charts', name: 'Agile Reports', icon: Sparkles }
        ].map(t => {
          const Active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all shrink-0 -mb-0.5 ${
                Active 
                  ? 'border-brand-500 text-brand-400 font-bold bg-brand-500/5 rounded-t-xl' 
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-800/20 rounded-t-xl'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="pt-2">

        {/* 1. SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Donut Chart: Status distribution */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
                <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider">Status Distribution</h3>
                <div className="h-44 w-full relative mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getStatusData()}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {getStatusData().map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '10px' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-100">{tasks.length}</span>
                    <span className="text-[10px] uppercase font-bold text-dark-500">Total Issues</span>
                  </div>
                </div>
                {/* Labels legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  {getStatusData().map(cell => (
                    <div key={cell.name} className="flex items-center gap-1.5 text-dark-300">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cell.color }} />
                      <span>{cell.name}: <strong className="text-dark-100">{cell.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority bar chart */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
                <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider">Issues by Priority</h3>
                <div className="h-44 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPriorityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '10px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-dark-400 text-center mt-2">Breakdown of priority distributions.</div>
              </div>

              {/* Issue types bar chart */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[300px]">
                <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider">Types of Work</h3>
                <div className="h-44 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTypeData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '10px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-dark-400 text-center mt-2">Issues split by task categories.</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Member Workloads and Collaboration */}
              <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider">Active Sprint Member Workload</h3>
                {activeSprint ? (
                  <div className="space-y-4 pt-2">
                    {project.members?.map((member) => {
                      const u = member.user || member;
                      const capObj = activeSprint.memberCapacities?.find(c => (c.user?._id || c.user) === u._id);
                      const capacity = capObj ? capObj.capacity : 10;
                      const sprintTasks = tasks.filter(t => t.sprint?._id === activeSprint._id && (t.assignee?._id || t.assignee) === u._id);
                      const assignedPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                      const pct = Math.min(100, Math.round((assignedPoints / (capacity || 1)) * 100));
                      const isOver = assignedPoints > capacity;

                      return (
                        <div key={u._id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-dark-200">{u.name} ({u.email})</span>
                            <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-dark-300'}`}>
                              {assignedPoints} / {capacity} SP assigned
                            </span>
                          </div>
                          <div className="h-3 w-full bg-dark-900 border border-dark-800 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${pct}%` }} 
                              className={`h-full transition-all duration-300 ${isOver ? 'bg-rose-500' : 'bg-brand-500'}`} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-dark-500 flex flex-col items-center justify-center gap-1.5 border border-dashed border-dark-800 rounded-xl">
                    <Info className="h-5 w-5 text-dark-500" />
                    <span>Start an active sprint to see team capacity planning statistics.</span>
                  </div>
                )}

                {/* Invite Members form */}
                <div className="border-t border-dark-700/60 pt-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark-400 block">Invite Team Member</span>
                  {inviteSuccessMsg && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs">
                      {inviteSuccessMsg}
                    </div>
                  )}
                  {inviteErrorMsg && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
                      {inviteErrorMsg}
                    </div>
                  )}
                  <form onSubmit={handleInviteMember} className="flex flex-wrap items-center gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter teammate email..."
                      className="flex-1 min-w-[200px] px-3.5 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-100 focus:outline-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Member">Member</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="flex items-center gap-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md"
                    >
                      {inviteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                      Invite
                    </button>
                  </form>
                </div>
              </div>

              {/* Recent project activities feed */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-brand-400" />
                    Project Activity Feed
                  </h3>
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {getActivityFeed().length === 0 ? (
                      <p className="text-xs text-dark-500 py-6 text-center">No activities recorded yet.</p>
                    ) : (
                      getActivityFeed().map((log, idx) => {
                        const mUser = project.members?.find(m => (m.user?._id || m.user) === log.user)?.user?.name || log.user?.name || 'User';
                        return (
                          <div key={idx} className="text-xs border-l-2 border-dark-700 pl-3 space-y-0.5">
                            <p className="text-dark-200">
                              <span className="font-bold text-dark-100">{mUser}</span> {log.text}
                            </p>
                            <span 
                              onClick={() => {
                                const activeT = tasks.find(t => t._id === log.taskId);
                                if (activeT) {
                                  setSelectedTask(activeT);
                                  setIsTaskModalOpen(true);
                                }
                              }}
                              className="text-[10px] text-brand-400 font-semibold cursor-pointer hover:underline"
                            >
                              {log.taskKey}: {log.taskTitle}
                            </span>
                            <span className="text-[9px] text-dark-500 block">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LIST VIEW TAB */}
        {activeTab === 'list' && (
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 border-b border-dark-800 pb-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-dark-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ID, summary, details..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>

              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3.5 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-200 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3.5 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-200 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
                <option value="subtask">Subtask</option>
              </select>

              {/* Assignee filter */}
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-3.5 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-200 focus:outline-none"
              >
                <option value="">All Assignees</option>
                {project.members?.map(m => (
                  <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                    {m.user?.name || m.name}
                  </option>
                ))}
              </select>

              {/* Clear filters button */}
              {(searchTerm || filterStatus || filterPriority || filterType || filterAssignee) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setFilterPriority('');
                    setFilterType('');
                    setFilterAssignee('');
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-xs font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-800 text-[10px] font-bold uppercase tracking-wider text-dark-500 select-none">
                    {[
                      { field: 'key', name: 'ID' },
                      { field: 'title', name: 'Title' },
                      { field: 'type', name: 'Type' },
                      { field: 'priority', name: 'Priority' },
                      { field: 'status', name: 'Status' },
                      { field: 'assignee', name: 'Assignee' },
                      { field: 'dueAt', name: 'Due Date' },
                      { field: 'sprint', name: 'Sprint' }
                    ].map(col => (
                      <th 
                        key={col.field} 
                        onClick={() => {
                          if (sortField === col.field) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField(col.field);
                            setSortDirection('asc');
                          }
                        }}
                        className="py-3 px-4 hover:text-dark-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          {col.name}
                          {sortField === col.field && (sortDirection === 'asc' ? '▲' : '▼')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/40 text-xs">
                  {getFilteredTasks().length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-dark-500">No issues found.</td>
                    </tr>
                  ) : (
                    getFilteredTasks().map(t => (
                      <tr 
                        key={t._id} 
                        onClick={() => {
                          setSelectedTask(t);
                          setIsTaskModalOpen(true);
                        }}
                        className="hover:bg-dark-900/30 cursor-pointer group transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-dark-300 group-hover:text-brand-400 transition-colors">{t.key}</td>
                        <td className="py-3 px-4 font-semibold text-dark-100 group-hover:text-white truncate max-w-[200px]">{t.title}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 capitalize">
                            {typeIcons[t.type]}
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${priorityBadges[t.priority]}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] uppercase font-bold text-dark-300 bg-dark-800 border border-dark-700/60 px-2 py-0.5 rounded">
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {t.assignee ? (
                            <span className="font-medium text-dark-200">{t.assignee.name}</span>
                          ) : (
                            <span className="text-dark-500">--</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-dark-300">
                          {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '--'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-brand-400">
                          {t.sprint?.name || '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. BOARD TAB (4-column Kanban Board) */}
        {activeTab === 'board' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 items-start">
              {[
                { id: 'todo', title: 'To Do', theme: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', line: 'bg-indigo-500' },
                { id: 'in_progress', title: 'In Progress', theme: 'bg-amber-500/10 text-amber-400 border-amber-500/20', line: 'bg-amber-500' },
                { id: 'in_review', title: 'In Review', theme: 'bg-pink-500/10 text-pink-400 border-pink-500/20', line: 'bg-pink-500' },
                { id: 'done', title: 'Done', theme: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', line: 'bg-emerald-500' }
              ].map(column => {
                // Filter board tasks to show ONLY active sprint tasks OR backlog tasks if no active sprint is selected. 
                // Let's filter to tasks in the active sprint if an active sprint exists! 
                const boardTasks = tasks.filter(t => 
                  t.status === column.id && 
                  (activeSprint ? t.sprint?._id === activeSprint._id : true)
                );

                return (
                  <div key={column.id} className="bg-dark-800/40 border border-dark-800/80 rounded-2xl flex flex-col p-4 min-h-[500px]">
                    <div className="flex items-center justify-between pb-3.5 border-b border-dark-700/60 mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${column.line}`} />
                        <span className="font-bold text-sm text-dark-100">{column.title}</span>
                      </div>
                      <span className="text-xs font-bold text-dark-400 bg-dark-800 px-2 py-0.5 rounded border border-dark-700/50">
                        {boardTasks.length}
                      </span>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 flex flex-col gap-3 rounded-xl transition-colors duration-150 p-1 min-h-[400px] ${
                            snapshot.isDraggingOver ? 'bg-dark-800/20 rounded-xl' : ''
                          }`}
                        >
                          {boardTasks.length === 0 ? (
                            <div className="h-28 border border-dashed border-dark-800 rounded-xl flex flex-col items-center justify-center text-dark-500 text-xs gap-1 select-none bg-dark-900/10">
                              <HelpCircle className="h-4 w-4" />
                              <span>No tasks here</span>
                            </div>
                          ) : (
                            boardTasks.map((t, index) => (
                              <Draggable key={t._id} draggableId={t._id} index={index}>
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    onClick={() => {
                                      setSelectedTask(t);
                                      setIsTaskModalOpen(true);
                                    }}
                                    className={`glass-panel p-4 rounded-xl cursor-grab active:cursor-grabbing border border-dark-700/60 hover:border-dark-600 transition-all flex flex-col justify-between min-h-[110px] group select-none ${
                                      snap.isDragging ? 'shadow-premium ring-1 ring-brand-500/40 bg-dark-800 border-brand-500/25 scale-[1.01]' : ''
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        {typeIcons[t.type] || <CheckSquare className="h-3.5 w-3.5" />}
                                        <span className="text-[10px] font-bold text-dark-400 group-hover:text-brand-400 transition-colors">
                                          {t.key}
                                        </span>
                                      </div>
                                      <h4 className="font-semibold text-xs text-dark-100 group-hover:text-white transition-colors leading-relaxed line-clamp-2">
                                        {t.title}
                                      </h4>
                                    </div>

                                    {/* Footer details */}
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dark-700/30">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${priorityBadges[t.priority]}`}>
                                          {t.priority}
                                        </span>
                                        {t.storyPoints > 0 && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-dark-800 text-dark-300 border border-dark-700/60">
                                            {t.storyPoints}
                                          </span>
                                        )}
                                      </div>

                                      {t.assignee ? (
                                        <div 
                                          className="h-5 w-5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[8px] font-bold text-brand-400 uppercase select-none"
                                          title={`Assigned to ${t.assignee.name}`}
                                        >
                                          {t.assignee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                      ) : (
                                        <div className="h-5 w-5 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[8px] text-dark-500">
                                          --
                                        </div>
                                      )}
                                    </div>
                                    
                                    {t.dueAt && (
                                      <div className="flex items-center gap-1 text-[9px] text-dark-400 mt-2">
                                        <Calendar className="h-3 w-3 text-dark-500" />
                                        <span>Due {new Date(t.dueAt).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* 4. TIMELINE/ROADMAP TAB */}
        {activeTab === 'roadmap' && (
          <div className="glass-panel p-6 rounded-2xl overflow-x-auto">
            <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-400" />
              Project Roadmap Timeline
            </h3>

            <div className="min-w-[1000px] border border-dark-700/60 rounded-xl overflow-hidden">
              {/* Gantt Header grid */}
              <div className="grid grid-cols-12 bg-dark-900 border-b border-dark-700/60 text-[9px] font-bold uppercase tracking-wider text-dark-500 py-3">
                <div className="col-span-3 pl-4 border-r border-dark-700/60">Issue Summary</div>
                <div className="col-span-9 grid text-center select-none overflow-x-hidden" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
                  {getRoadmapDays().map((date, idx) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div 
                        key={idx} 
                        className={`py-0.5 border-r border-dark-700/30 flex flex-col items-center justify-center ${isToday ? 'bg-brand-500/25 text-brand-400 font-black' : ''}`}
                      >
                        <span>{date.toLocaleDateString([], { weekday: 'narrow' })}</span>
                        <span>{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="divide-y divide-dark-800/60">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-dark-500">No issues to display on roadmap.</div>
                ) : (
                  tasks.map(t => {
                    const createdDate = new Date(t.createdAt);
                    const rangeStart = getRoadmapDays()[0];
                    const rangeEnd = getRoadmapDays()[getRoadmapDays().length - 1];

                    // Set start column
                    let startIdx = Math.max(0, Math.floor((createdDate - rangeStart) / (24 * 60 * 60 * 1000)));
                    if (createdDate < rangeStart) startIdx = 0;

                    // Set duration
                    const dueDateObj = t.dueAt ? new Date(t.dueAt) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                    let duration = Math.ceil((dueDateObj - createdDate) / (24 * 60 * 60 * 1000));
                    if (duration < 1) duration = 1;

                    // Constrain grid indices
                    const endIdx = Math.min(30, startIdx + duration);
                    const span = Math.max(1, endIdx - startIdx);

                    // Colors by priority
                    const barColors = {
                      high: 'bg-rose-500/30 border-rose-500/50 text-rose-300',
                      medium: 'bg-amber-500/30 border-amber-500/50 text-amber-300',
                      low: 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300'
                    };

                    return (
                      <div 
                        key={t._id} 
                        onClick={() => {
                          setSelectedTask(t);
                          setIsTaskModalOpen(true);
                        }}
                        className="grid grid-cols-12 hover:bg-dark-900/30 transition-colors py-2.5 items-center cursor-pointer"
                      >
                        {/* Task metadata */}
                        <div className="col-span-3 pl-4 border-r border-dark-700/60 flex items-center gap-2 truncate pr-2">
                          {typeIcons[t.type] || <CheckSquare className="h-3.5 w-3.5" />}
                          <div className="truncate text-xs">
                            <span className="font-bold text-dark-400 block text-[10px]">{t.key}</span>
                            <span className="font-semibold text-dark-200 truncate block">{t.title}</span>
                          </div>
                        </div>

                        {/* Visual Gantt Bar */}
                        <div className="col-span-9 grid items-center overflow-x-hidden relative h-7" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
                          <div 
                            style={{ 
                              gridColumnStart: startIdx + 1, 
                              gridColumnEnd: startIdx + span + 1 
                            }} 
                            className={`h-6 border rounded-lg flex items-center px-2 text-[8px] font-bold truncate z-10 transition-all ${barColors[t.priority] || barColors.medium}`}
                            title={`${t.key}: ${t.title} (${duration} Days)`}
                          >
                            <span className="truncate">{t.title}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. SPRINTS TAB (Sprint list + Capacity planner + Backlog list) */}
        {activeTab === 'sprints' && (
          <div className="space-y-6">
            
            {/* Create Sprint and statistics overview */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-dark-800/30 border border-dark-800/80 rounded-2xl">
              <div>
                <h3 className="font-bold text-sm text-dark-100">Sprint Backlog Organizer</h3>
                <p className="text-xs text-dark-400 mt-0.5">Plan sprints, allocate points, and track team capacity.</p>
              </div>

              <button
                onClick={() => setIsSprintModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-brand-400 font-semibold rounded-xl text-xs border border-brand-500/25 transition-all shadow-md active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Sprint
              </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Panel: Sprints (Expanded and editable list) */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dark-500 px-1">Planned & Active Sprints</h4>
                  
                  {sprints.length === 0 ? (
                    <div className="py-12 border border-dashed border-dark-800 rounded-2xl text-center text-xs text-dark-500">
                      No sprints created. Use "Create New Sprint" to make your first sprint.
                    </div>
                  ) : (
                    sprints.slice().reverse().map(sprint => {
                      const sprintTasks = tasks.filter(t => t.sprint?._id === sprint._id);
                      const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                      const isExpanded = editingCapacitySprintId === sprint._id;

                      return (
                        <div key={sprint._id} className="bg-dark-800/30 border border-dark-800/80 rounded-2xl overflow-hidden">
                          {/* Sprint Header Banner */}
                          <div className="p-4 bg-dark-950/30 border-b border-dark-800 flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-dark-100">{sprint.name}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  sprint.status === 'active' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : sprint.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-dark-800 text-dark-400 border border-dark-700/60'
                                }`}>
                                  {sprint.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-dark-500">
                                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                              </p>
                              {sprint.goal && (
                                <p className="text-[11px] text-dark-400 italic font-medium">Goal: "{sprint.goal}"</p>
                              )}
                            </div>

                            {/* Control button actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {sprint.status === 'planning' && (
                                <button
                                  onClick={() => handleStartSprint(sprint._id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg text-[10px] transition-all"
                                >
                                  <Play className="h-3 w-3 fill-white" /> Start Sprint
                                </button>
                              )}

                              {sprint.status === 'active' && (
                                <button
                                  onClick={() => openCompleteSprintModal(sprint)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all"
                                >
                                  <CheckSquare className="h-3 w-3" /> Complete Sprint
                                </button>
                              )}

                              <button
                                onClick={() => handleEditCapacities(sprint)}
                                className="p-1.5 text-dark-400 hover:text-dark-200 bg-dark-800 rounded-lg hover:bg-dark-700 transition-all border border-dark-700/50"
                                title="Sprint Capacity Planner"
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </button>

                              {sprint.status !== 'completed' && (
                                <button
                                  onClick={() => handleDeleteSprint(sprint._id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all border border-rose-500/10"
                                  title="Delete Sprint"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Capacity Planner Editor Expansion */}
                          {isExpanded && (
                            <div className="p-4 bg-dark-900/40 border-b border-dark-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-dark-200">Sprint Capacity Planner</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingCapacitySprintId(null)}
                                    className="px-2.5 py-1 text-[10px] text-dark-400 hover:bg-dark-800 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveCapacities(sprint._id)}
                                    className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-[10px]"
                                  >
                                    Save capacities
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {project.members?.map(m => {
                                  const user = m.user;
                                  return (
                                    <div key={user._id} className="flex items-center justify-between text-xs p-2 bg-dark-800/40 border border-dark-800 rounded-xl">
                                      <span className="font-semibold text-dark-300 truncate max-w-[120px]">{user.name}</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={tempCapacities[user._id] || 10}
                                        onChange={(e) => setTempCapacities({
                                          ...tempCapacities,
                                          [user._id]: Number(e.target.value)
                                        })}
                                        className="w-14 px-2 py-1 bg-dark-900 border border-dark-700/60 rounded text-center"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Sprint Tasks Drop Area */}
                          <Droppable droppableId={`sprint_${sprint._id}`}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-4 min-h-[80px] divide-y divide-dark-800/40 transition-colors ${
                                  snapshot.isDraggingOver ? 'bg-brand-500/5' : ''
                                }`}
                              >
                                {sprintTasks.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-dark-500">
                                    Sprint is empty. Drag backlog issues here or use the selector in task detail.
                                  </div>
                                ) : (
                                  sprintTasks.map((t, idx) => (
                                    <Draggable key={t._id} draggableId={t._id} index={idx}>
                                      {(prov, snap) => (
                                        <div
                                          ref={prov.innerRef}
                                          {...prov.draggableProps}
                                          {...prov.dragHandleProps}
                                          onClick={() => {
                                            setSelectedTask(t);
                                            setIsTaskModalOpen(true);
                                          }}
                                          className={`py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-dark-900/10 px-2 rounded-xl group transition-all ${
                                            snap.isDragging ? 'bg-dark-800 shadow-premium' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            {typeIcons[t.type] || <CheckSquare className="h-3.5 w-3.5" />}
                                            <span className="font-bold text-dark-400 group-hover:text-brand-400 transition-colors shrink-0">
                                              {t.key}
                                            </span>
                                            <span className="font-semibold text-dark-200 truncate">{t.title}</span>
                                          </div>
                                          
                                          <div className="flex items-center gap-3 shrink-0 ml-4">
                                            {t.storyPoints > 0 && (
                                              <span className="font-bold px-1.5 py-0.5 rounded-full bg-dark-800 text-dark-400 border border-dark-700/60">
                                                {t.storyPoints} SP
                                              </span>
                                            )}
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${priorityBadges[t.priority]}`}>
                                              {t.priority}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {/* Sprint Footer planned total */}
                          <div className="p-3 bg-dark-900/10 border-t border-dark-800 flex items-center justify-between text-[10px] text-dark-500 px-4">
                            <span>Total Planned Story Points</span>
                            <span className="font-bold text-dark-300">{totalPoints} Story Points</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Panel: Backlog (Drag backlog tasks into Sprints) */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dark-500 px-1 mb-4">Backlog</h4>
                  
                  <Droppable droppableId="sprint_backlog">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-dark-800/40 border border-dark-800/80 rounded-2xl p-4 min-h-[450px] flex flex-col gap-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-dark-800/20 border-brand-500/25' : ''
                        }`}
                      >
                        {tasks.filter(t => !t.sprint).length === 0 ? (
                          <div className="py-12 text-center text-xs text-dark-500 flex-1 flex flex-col items-center justify-center border border-dashed border-dark-800 rounded-xl">
                            No backlog issues.
                          </div>
                        ) : (
                          tasks.filter(t => !t.sprint).map((t, idx) => (
                            <Draggable key={t._id} draggableId={t._id} index={idx}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  onClick={() => {
                                    setSelectedTask(t);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className={`glass-panel p-3.5 rounded-xl cursor-grab active:cursor-grabbing border border-dark-700/60 hover:border-dark-600 transition-all flex flex-col justify-between group ${
                                    snap.isDragging ? 'shadow-premium bg-dark-800 border-brand-500/25' : ''
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      {typeIcons[t.type]}
                                      <span className="text-[9px] font-bold text-dark-400 group-hover:text-brand-400 transition-colors">
                                        {t.key}
                                      </span>
                                    </div>
                                    <h5 className="font-semibold text-xs text-dark-100 leading-normal line-clamp-2">{t.title}</h5>
                                  </div>

                                  <div className="flex items-center justify-between mt-3 pt-1 border-t border-dark-700/30">
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${priorityBadges[t.priority]}`}>
                                      {t.priority}
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                      {t.storyPoints > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700/50">
                                          {t.storyPoints}
                                        </span>
                                      )}
                                      
                                      {/* Quick sprint move selector dropdown */}
                                      <select
                                        value=""
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={async (e) => {
                                          const val = e.target.value;
                                          if (!val) return;
                                          // Update state
                                          setTasks(prev => prev.map(item => item._id === t._id ? { ...item, sprint: { _id: val } } : item));
                                          try {
                                            await api.put(`/tasks/${t._id}`, { sprint: val });
                                          } catch (err) {
                                            refreshData();
                                          }
                                        }}
                                        className="px-1.5 py-0.5 bg-dark-900 border border-dark-700/60 rounded text-[9px] text-dark-400 hover:text-dark-100 focus:outline-none"
                                      >
                                        <option value="">Move to...</option>
                                        {sprints.filter(s => s.status !== 'completed').map(s => (
                                          <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

              </div>
            </DragDropContext>
          </div>
        )}

        {/* 6. AGILE REPORTS TAB (Charts & capacity reports) */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sprint Velocity Chart */}
              <div className="glass-panel p-6 rounded-2xl min-h-[350px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider">Sprint Velocity</h3>
                  <p className="text-xs text-dark-400 mt-1">Comparing planned points to completed points per sprint.</p>
                </div>
                {getVelocityData().length === 0 ? (
                  <div className="py-12 text-center text-xs text-dark-500 border border-dashed border-dark-800 rounded-xl my-4">
                    No completed sprints yet to calculate velocity.
                  </div>
                ) : (
                  <div className="h-56 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getVelocityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '10px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                        <Bar dataKey="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="text-[10px] text-dark-500 text-center">Completed sprints velocity metrics.</div>
              </div>

              {/* Active Sprint Burndown Chart */}
              <div className="glass-panel p-6 rounded-2xl min-h-[350px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wider">Active Sprint Burndown</h3>
                  <p className="text-xs text-dark-400 mt-1">Story points remaining vs Ideal Burndown line.</p>
                </div>
                {!activeSprint ? (
                  <div className="py-12 text-center text-xs text-dark-500 border border-dashed border-dark-800 rounded-xl my-4">
                    No currently active sprint found to burndown.
                  </div>
                ) : (
                  <div className="h-56 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getBurndownData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="dateStr" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '10px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                        <Line type="monotone" dataKey="Ideal" stroke="#64748b" strokeDasharray="5 5" activeDot={false} />
                        <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="text-[10px] text-dark-500 text-center">Daily tracking for active sprint {activeSprint?.name || ''}.</div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Issue"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {createError}
          </div>
        )}

        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-1.5">Title</label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g., Implement OAuth SSO Flow"
              className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-1.5">Description</label>
            <textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Provide issue details..."
              rows={3}
              className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Issue Type</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              >
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
                <option value="subtask">Subtask</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Assignee</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              >
                <option value="">Unassigned</option>
                {project?.members?.map((m) => {
                  const u = m.user || m;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Story Points</label>
              <input
                type="number"
                min="0"
                value={newTaskPoints}
                onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Due Date</label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Sprint</label>
              <select
                value={newTaskSprint}
                onChange={(e) => setNewTaskSprint(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              >
                <option value="">Backlog (No Sprint)</option>
                {sprints.filter(s => s.status !== 'completed').map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-dark-300 hover:bg-dark-700 rounded-lg text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE SPRINT MODAL */}
      <Modal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        title="Create New Sprint"
      >
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-1.5">Sprint Name</label>
            <input
              type="text"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              placeholder="e.g., Sprint 1: Auth & Database"
              className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-1.5">Sprint Goal</label>
            <textarea
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              placeholder="e.g., Core user session storage and schema deployments."
              rows={2}
              className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">Start Date</label>
              <input
                type="date"
                value={newSprintStart}
                onChange={(e) => setNewSprintStart(e.target.value)}
                className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-1.5">End Date</label>
              <input
                type="date"
                value={newSprintEnd}
                onChange={(e) => setNewSprintEnd(e.target.value)}
                className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSprintModalOpen(false)}
              className="px-4 py-2 text-dark-300 hover:bg-dark-700 rounded-lg text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sprintCreateLoading}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {sprintCreateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Sprint'}
            </button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE SPRINT SUMMARY MODAL */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setCompletingSprint(null);
        }}
        title="Complete Active Sprint"
      >
        {completingSprint && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-dark-900 border border-dark-800 rounded-xl text-xs space-y-2">
              <p className="font-bold text-dark-200">Sprint Summary: {completingSprint.name}</p>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-dark-500 block">Completed Issues</span>
                  <span className="font-bold text-emerald-400 text-lg">
                    {tasks.filter(t => t.sprint?._id === completingSprint._id && t.status === 'done').length}
                  </span>
                </div>
                <div>
                  <span className="text-dark-500 block">Incomplete Issues</span>
                  <span className="font-bold text-rose-400 text-lg">
                    {tasks.filter(t => t.sprint?._id === completingSprint._id && t.status !== 'done').length}
                  </span>
                </div>
              </div>
            </div>

            {tasks.filter(t => t.sprint?._id === completingSprint._id && t.status !== 'done').length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-400">
                  Move Incomplete Issues To
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="action_backlog"
                      name="incomplete_action"
                      checked={incompleteAction === 'backlog'}
                      onChange={() => setIncompleteAction('backlog')}
                      className="accent-brand-500"
                    />
                    <label htmlFor="action_backlog" className="cursor-pointer text-dark-200 text-xs">
                      Move to Backlog (Unplanned)
                    </label>
                  </div>

                  {planningSprints.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="action_sprint"
                          name="incomplete_action"
                          checked={incompleteAction === 'sprint'}
                          onChange={() => {
                            setIncompleteAction('sprint');
                            setTargetSprintId(planningSprints[0]._id);
                          }}
                          className="accent-brand-500"
                        />
                        <label htmlFor="action_sprint" className="cursor-pointer text-dark-200 text-xs">
                          Move to Another Sprint
                        </label>
                      </div>

                      {incompleteAction === 'sprint' && (
                        <select
                          value={targetSprintId}
                          onChange={(e) => setTargetSprintId(e.target.value)}
                          className="block w-full px-3 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-xs text-dark-100 focus:outline-none"
                        >
                          {planningSprints.map(ps => (
                            <option key={ps._id} value={ps._id}>{ps.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-dark-800">
              <button
                type="button"
                onClick={() => {
                  setIsCompleteModalOpen(false);
                  setCompletingSprint(null);
                }}
                className="px-4 py-2 text-dark-300 hover:bg-dark-700 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSprint}
                disabled={completeSprintLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all"
              >
                {completeSprintLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Confirm Complete'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* TASK MODAL (Details / Edit / Delete) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        projectMembers={project?.members || []}
        onUpdate={(updatedTask) => {
          setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
        }}
        onDelete={(taskId) => {
          setTasks(tasks.filter(t => t._id !== taskId));
        }}
      />
    </div>
  );
};

export default ProjectDetails;

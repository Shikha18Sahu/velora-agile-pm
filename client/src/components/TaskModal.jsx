import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from './Modal';
import { 
  CheckSquare, 
  Bookmark, 
  Bug, 
  Crown, 
  GitPullRequest, 
  Trash2, 
  Loader2, 
  User, 
  AlertOctagon, 
  FileText, 
  ChevronRight, 
  Type, 
  Calendar, 
  Link2, 
  Plus, 
  MessageSquare, 
  History, 
  Sparkles,
  Info 
} from 'lucide-react';

const TaskModal = ({ 
  isOpen, 
  onClose, 
  task, 
  projectMembers = [], 
  onUpdate, 
  onDelete 
}) => {
  const [activeTask, setActiveTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState('todo');
  const [issueType, setIssueType] = useState('task');
  const [storyPoints, setStoryPoints] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [sprintId, setSprintId] = useState('');

  // Sprints and tasks of this project (for dropdowns)
  const [sprints, setSprints] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkType, setLinkType] = useState('relates_to');
  const [linkLoading, setLinkLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  // Mentions autocomplete states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  // Sync state with task details when modal opens or activeTask changes
  useEffect(() => {
    if (task && isOpen) {
      setActiveTask(task);
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setAssigneeId(task.assignee?._id || task.assignee || '');
      setStatus(task.status || 'todo');
      setIssueType(task.type || 'task');
      setStoryPoints(task.storyPoints || 0);
      setDueDate(task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '');
      setSprintId(task.sprint?._id || task.sprint || '');
      setError('');
      fetchExtraData(task.project?._id || task.project);
    }
  }, [task, isOpen]);

  const fetchExtraData = async (projId) => {
    if (!projId) return;
    try {
      // Fetch sprints for this project
      const sprintRes = await api.get(`/sprints/${projId}`);
      if (sprintRes.data.success) {
        setSprints(sprintRes.data.data);
      }
      // Fetch other tasks for linking
      const taskRes = await api.get(`/tasks/${projId}`);
      if (taskRes.data.success) {
        setAllTasks(taskRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching extra data for task modal:', err);
    }
  };

  if (!isOpen || !activeTask) return null;

  // Icons based on Issue type
  const typeIcons = {
    task: <CheckSquare className="h-4 w-4 text-sky-400" />,
    story: <Bookmark className="h-4 w-4 text-emerald-400 fill-emerald-400" />,
    bug: <Bug className="h-4 w-4 text-rose-500" />,
    epic: <Crown className="h-4 w-4 text-violet-500 fill-violet-500" />,
    subtask: <GitPullRequest className="h-4 w-4 text-indigo-400" />
  };

  const handleUpdateTask = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.put(`/tasks/${activeTask._id}`, {
        title,
        description,
        priority,
        status,
        assignee: assigneeId || null,
        type: issueType,
        storyPoints: Number(storyPoints),
        dueAt: dueDate || null,
        sprint: sprintId || null
      });

      if (response.data.success) {
        setActiveTask(response.data.data);
        onUpdate(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api.delete(`/tasks/${activeTask._id}`);
      if (response.data.success) {
        onDelete(activeTask._id);
        onClose();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const res = await api.post(`/tasks/${activeTask._id}/comments`, { text: newComment });
      if (res.data.success) {
        setActiveTask(res.data.data);
        onUpdate(res.data.data);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkTargetId) return;
    setLinkLoading(true);
    try {
      const res = await api.post(`/tasks/${activeTask._id}/links`, {
        targetTaskId: linkTargetId,
        linkType
      });
      if (res.data.success) {
        setActiveTask(res.data.data);
        onUpdate(res.data.data);
        setLinkTargetId('');
        // Refresh extra tasks to update statuses
        fetchExtraData(activeTask.project?._id || activeTask.project);
      }
    } catch (err) {
      console.error('Error linking tasks:', err);
      setError(err.response?.data?.message || 'Failed to link issues.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setNewComment(val);
    
    // Check if user is typing a mention
    const words = val.split(/[\s\n]+/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionSearch(lastWord.substring(1));
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (memberName) => {
    // Replace the mention keyword with the user's name
    const words = newComment.split(' ');
    words[words.length - 1] = `@${memberName}`;
    setNewComment(words.join(' ') + ' ');
    setShowMentions(false);
  };

  const handleOpenLinkedTask = (targetTask) => {
    if (!targetTask?._id) return;
    const fullTask = allTasks.find(t => t._id === targetTask._id);
    if (fullTask) {
      setActiveTask(fullTask);
      setTitle(fullTask.title || '');
      setDescription(fullTask.description || '');
      setPriority(fullTask.priority || 'medium');
      setAssigneeId(fullTask.assignee?._id || fullTask.assignee || '');
      setStatus(fullTask.status || 'todo');
      setIssueType(fullTask.type || 'task');
      setStoryPoints(fullTask.storyPoints || 0);
      setDueDate(fullTask.dueAt ? new Date(fullTask.dueAt).toISOString().split('T')[0] : '');
      setSprintId(fullTask.sprint?._id || fullTask.sprint || '');
    }
  };

  const linkableTasks = allTasks.filter(t => t._id !== activeTask._id && !activeTask.links?.some(l => l.targetTask?._id === t._id));

  // Filter project members for @mention dropdown
  const filteredMembers = projectMembers.filter(m => 
    m.user?.name?.toLowerCase().includes(mentionSearch.toLowerCase()) || 
    m.name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${activeTask.key || 'Issue Details'}`}
      maxWidth="max-w-5xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Details Column (Left: Title, Description, Links, Comments) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdateTask} className="space-y-5">
            {/* Title */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                <Type className="h-3.5 w-3.5" />
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 text-sm font-semibold"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                <FileText className="h-3.5 w-3.5" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add detailed task instructions..."
                rows={4}
                className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 text-sm resize-none"
              />
            </div>

            {/* Save details button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Details'}
              </button>
            </div>
          </form>

          {/* Linked Issues Section */}
          <div className="border-t border-dark-700/60 pt-5 space-y-3">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-dark-100">
              <Link2 className="h-4 w-4 text-brand-400" />
              Linked Issues
            </h4>
            
            {/* List Linked Issues */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {activeTask.links && activeTask.links.length > 0 ? (
                activeTask.links.map((link, idx) => {
                  const target = link.targetTask;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleOpenLinkedTask(target)}
                      className="flex items-center justify-between text-xs p-2.5 bg-dark-900/50 border border-dark-800 hover:border-dark-700 hover:bg-dark-800/20 rounded-xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 uppercase shrink-0">
                          {link.linkType.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-dark-300 group-hover:text-brand-400 transition-colors shrink-0">
                          {target?.key || 'KAN'}
                        </span>
                        <span className="text-dark-400 truncate">
                          {target?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-dark-500 uppercase shrink-0 px-2 py-0.5 rounded bg-dark-800 border border-dark-700/60">
                        {target?.status?.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-dark-500">No issues linked to this task.</p>
              )}
            </div>

            {/* Link New Issue Form */}
            <form onSubmit={handleAddLink} className="flex flex-wrap items-center gap-2 pt-1.5">
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                className="px-3 py-1.5 bg-dark-900 border border-dark-700/60 rounded-lg text-xs text-dark-200 focus:outline-none focus:border-brand-500"
              >
                <option value="relates_to">Relates to</option>
                <option value="blocks">Blocks</option>
                <option value="blocked_by">Is Blocked by</option>
              </select>

              <select
                value={linkTargetId}
                onChange={(e) => setLinkTargetId(e.target.value)}
                className="flex-1 min-w-[150px] px-3 py-1.5 bg-dark-900 border border-dark-700/60 rounded-lg text-xs text-dark-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">Select target issue...</option>
                {linkableTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.key}: {t.title}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={linkLoading || !linkTargetId}
                className="flex items-center gap-1 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white rounded-lg text-xs font-semibold border border-dark-700/60 transition-all disabled:opacity-50"
              >
                {linkLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3 w-3" /> Link
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Comments Section */}
          <div className="border-t border-dark-700/60 pt-5 space-y-4">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-dark-100">
              <MessageSquare className="h-4 w-4 text-brand-400" />
              Comments
            </h4>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="relative space-y-2">
              <textarea
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Add a comment... Use @name to mention team members."
                rows={2}
                className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 text-xs resize-none"
              />

              {/* Mentions dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute left-0 bottom-full mb-1 w-64 bg-dark-800 border border-dark-700 rounded-xl shadow-premium z-50 overflow-hidden divide-y divide-dark-700/40">
                  {filteredMembers.map((member) => {
                    const name = member.user?.name || member.name;
                    return (
                      <div
                        key={member._id}
                        onClick={() => handleMentionSelect(name)}
                        className="p-2 text-xs hover:bg-dark-900 cursor-pointer text-dark-200 hover:text-white transition-colors"
                      >
                        {name} ({member.user?.email || member.email})
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs transition-all disabled:opacity-50"
                >
                  {commentLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
                </button>
              </div>
            </form>

            {/* List Comments */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {activeTask.comments && activeTask.comments.length > 0 ? (
                activeTask.comments.slice().reverse().map((c, idx) => {
                  const authorName = c.author?.name || 'User';
                  return (
                    <div key={idx} className="flex gap-3 text-xs bg-dark-900/10 p-3 border border-dark-800/40 rounded-xl">
                      <div className="h-7 w-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-400 uppercase select-none shrink-0">
                        {authorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-dark-200">{authorName}</span>
                          <span className="text-[10px] text-dark-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-dark-300 leading-relaxed break-words whitespace-pre-wrap">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-dark-500">No comments yet.</p>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Parameters Column (Right: Fields, Control) */}
        <div className="bg-dark-900/30 border border-dark-800/60 rounded-2xl p-5 space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-dark-500 block mb-1">Issue Details</span>
            <div className="border-b border-dark-800 pb-3 mb-2 flex items-center justify-between">
              <span className="text-sm font-extrabold text-dark-100">{activeTask.key || 'KAN-0'}</span>
              <span className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded border border-dark-700/60 font-semibold uppercase">
                {activeTask.status?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Issue Type */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Type
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 pointer-events-none">
                {typeIcons[issueType] || <CheckSquare className="h-4 w-4" />}
              </div>
              <select
                value={issueType}
                onChange={(e) => {
                  setIssueType(e.target.value);
                  setTimeout(() => handleUpdateTask(), 100);
                }}
                className="block w-full pl-9 pr-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
              >
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
                <option value="subtask">Subtask</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setTimeout(() => handleUpdateTask(), 100);
              }}
              className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setTimeout(() => handleUpdateTask(), 100);
              }}
              className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                setTimeout(() => handleUpdateTask(), 100);
              }}
              className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((member) => {
                const u = member.user || member;
                return (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Story Points */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Story Points
            </label>
            <input
              type="number"
              min="0"
              value={storyPoints}
              onChange={(e) => setStoryPoints(Number(e.target.value))}
              onBlur={() => handleUpdateTask()}
              className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setTimeout(() => handleUpdateTask(), 100);
                }}
                className="block w-full px-4 py-2 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
              />
            </div>
          </div>

          {/* Sprint */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-400 mb-1.5">
              Sprint
            </label>
            <select
              value={sprintId}
              onChange={(e) => {
                setSprintId(e.target.value);
                setTimeout(() => handleUpdateTask(), 100);
              }}
              className="block w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 focus:outline-none focus:border-brand-500 text-xs"
            >
              <option value="">Backlog (No Sprint)</option>
              {sprints.map((s) => (
                <option key={s._id} value={s._id} disabled={s.status === 'completed'}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Log */}
          <div className="border-t border-dark-800 pt-4 space-y-2">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-dark-500">
              <History className="h-3.5 w-3.5" />
              Activity Log
            </span>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {activeTask.activityLog && activeTask.activityLog.length > 0 ? (
                activeTask.activityLog.slice().reverse().map((log, idx) => {
                  const logUser = projectMembers.find(m => (m.user?._id || m.user) === log.user)?.user?.name || log.user?.name || 'User';
                  return (
                    <div key={idx} className="text-[10px] text-dark-400 border-l border-dark-700 pl-2 leading-normal">
                      <span className="font-semibold text-dark-300">{logUser} </span>
                      {log.text}
                      <span className="text-dark-500 block text-[9px]">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[9px] text-dark-500">No activity logged.</p>
              )}
            </div>
          </div>

          {/* Delete controls */}
          <div className="border-t border-dark-800 pt-4 flex justify-between">
            <button
              type="button"
              onClick={handleDeleteTask}
              disabled={deleteLoading}
              className="flex items-center justify-center gap-1.5 w-full py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {deleteLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Issue
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </Modal>
  );
};

export default TaskModal;

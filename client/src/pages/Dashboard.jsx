import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  ListTodo
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        if (response.data.success) {
          setStats(response.data.stats);
          setRecentTasks(response.data.recentTasks);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-dark-400 text-sm">Loading your workspace stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
        {error}
      </div>
    );
  }

  // Calculate percentages for status breakdown bar
  const total = stats.totalTasks || 0;
  const todoPercent = total > 0 ? Math.round((stats.todoCount / total) * 100) : 0;
  const inProgressPercent = total > 0 ? Math.round((stats.inProgressCount / total) * 100) : 0;
  const donePercent = total > 0 ? Math.round((stats.doneCount / total) * 100) : 0;

  const priorityColors = {
    high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-400 border border-slate-700/60',
  };

  const statusLabels = {
    todo: { label: 'To Do', color: 'bg-indigo-500' },
    in_progress: { label: 'In Progress', color: 'bg-amber-500' },
    done: { label: 'Done', color: 'bg-emerald-500' }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-dark-100">
          Hello, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-dark-400 mt-1.5">
          Here is an overview of your active projects and tasks.
        </p>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Projects */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div>
            <p className="text-dark-400 text-sm font-medium">Total Projects</p>
            <p className="text-2xl font-bold mt-0.5 text-dark-100">{stats.totalProjects}</p>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ListTodo className="h-6 w-6" />
          </div>
          <div>
            <p className="text-dark-400 text-sm font-medium">Total Tasks</p>
            <p className="text-2xl font-bold mt-0.5 text-dark-100">{stats.totalTasks}</p>
          </div>
        </div>

        {/* Tasks in Progress */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-dark-400 text-sm font-medium">In Progress</p>
            <p className="text-2xl font-bold mt-0.5 text-dark-100">{stats.inProgressCount}</p>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-dark-400 text-sm font-medium">Tasks Completed</p>
            <p className="text-2xl font-bold mt-0.5 text-dark-100">{stats.doneCount}</p>
          </div>
        </div>
      </div>

      {/* Mid Section: Status breakdown & recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Task Status Breakdown Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-dark-100 mb-2">Task Distribution</h3>
            <p className="text-xs text-dark-400">Breakdown of tasks across your active boards.</p>
          </div>

          <div className="my-8 space-y-4">
            {/* Visual Multi-segment progress bar */}
            <div className="h-4 w-full rounded-full bg-dark-700/60 overflow-hidden flex">
              {stats.totalTasks > 0 ? (
                <>
                  <div style={{ width: `${todoPercent}%` }} className="bg-indigo-500 h-full" title={`Todo: ${todoPercent}%`} />
                  <div style={{ width: `${inProgressPercent}%` }} className="bg-amber-500 h-full" title={`In Progress: ${inProgressPercent}%`} />
                  <div style={{ width: `${donePercent}%` }} className="bg-emerald-500 h-full" title={`Done: ${donePercent}%`} />
                </>
              ) : (
                <div className="w-full bg-dark-700 h-full" />
              )}
            </div>

            {/* Labels and values */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-dark-200">
                  <div className="h-3 w-3 rounded bg-indigo-500" />
                  <span>To Do</span>
                </div>
                <span className="font-semibold text-sm text-dark-100">
                  {stats.todoCount} <span className="text-xs text-dark-400 font-normal">({todoPercent}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-dark-200">
                  <div className="h-3 w-3 rounded bg-amber-500" />
                  <span>In Progress</span>
                </div>
                <span className="font-semibold text-sm text-dark-100">
                  {stats.inProgressCount} <span className="text-xs text-dark-400 font-normal">({inProgressPercent}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-dark-200">
                  <div className="h-3 w-3 rounded bg-emerald-500" />
                  <span>Done</span>
                </div>
                <span className="font-semibold text-sm text-dark-100">
                  {stats.doneCount} <span className="text-xs text-dark-400 font-normal">({donePercent}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-dark-700/60 pt-4 flex items-center justify-between text-xs text-dark-400">
            <span>Total Tasks tracked</span>
            <span className="font-bold text-dark-200">{stats.totalTasks}</span>
          </div>
        </div>

        {/* Recent Tasks List */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-bold text-dark-100 mb-1">Recent Tasks</h3>
          <p className="text-xs text-dark-400 mb-6">Latest tasks created across all projects.</p>

          {recentTasks.length === 0 ? (
            <div className="h-48 border border-dashed border-dark-700 rounded-xl flex flex-col items-center justify-center text-dark-400 text-sm gap-2">
              <AlertCircle className="h-8 w-8 text-dark-500" />
              <span>No tasks found. Create a project to get started!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div 
                  key={task._id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-900/40 border border-dark-800 hover:border-dark-700/80 transition-card group"
                >
                  <div className="flex items-center gap-4 truncate">
                    {/* Status Dot */}
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusLabels[task.status]?.color || 'bg-dark-500'}`} />
                    
                    <div className="truncate">
                      <p className="font-semibold text-sm text-dark-100 group-hover:text-white transition-colors truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-dark-400 mt-0.5 truncate">
                        Project: <span className="font-medium text-dark-300">{task.project?.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {/* Priority Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>

                    {/* Assignee Avatar */}
                    {task.assignee ? (
                      <div className="h-7 w-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-400 uppercase select-none" title={`Assigned to ${task.assignee.name}`}>
                        {task.assignee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px] font-medium text-dark-400" title="Unassigned">
                        --
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

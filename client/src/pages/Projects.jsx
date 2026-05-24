import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Modal from '../components/Modal';
import { 
  FolderPlus, 
  Trash2, 
  Users, 
  ArrowUpRight, 
  Loader2, 
  Plus, 
  FolderKanban,
  User2
} from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Project Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newProjName || !newProjDesc) {
      setCreateError('Please enter a name and description');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await api.post('/projects', {
        name: newProjName,
        description: newProjDesc
      });

      if (response.data.success) {
        setProjects([response.data.data, ...projects]);
        setIsModalOpen(false);
        setNewProjName('');
        setNewProjDesc('');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setCreateError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation(); // Avoid navigating to project details on click
    
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be permanently removed.')) {
      return;
    }

    try {
      const response = await api.delete(`/projects/${projectId}`);
      if (response.data.success) {
        setProjects(projects.filter(p => p._id !== projectId));
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-dark-400 text-sm">Loading projects list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-100">Projects</h1>
          <p className="text-dark-400 mt-1.5">Manage and track your engineering projects</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 shrink-0"
        >
          <FolderPlus className="h-5 w-5" />
          New Project
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Create project card button */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="group border border-dashed border-dark-700 hover:border-brand-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all bg-dark-900/10 hover:bg-brand-500/5 hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-400 group-hover:text-brand-400 group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all mb-4">
            <Plus className="h-6 w-6" />
          </div>
          <span className="font-semibold text-dark-200 group-hover:text-brand-400 transition-colors">
            Create New Project
          </span>
          <p className="text-xs text-dark-500 mt-2 max-w-[200px]">
            Kick off a new agile workspace, set goals and delegate tasks.
          </p>
        </div>

        {/* Existing projects list */}
        {projects.map((proj) => {
          const isOwner = proj.owner._id === user?._id;
          const formattedDate = new Date(proj.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div
              key={proj._id}
              onClick={() => navigate(`/projects/${proj._id}`)}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[220px] cursor-pointer hover:border-dark-600/80 transition-card hover:-translate-y-1 group relative overflow-hidden"
            >
              <div>
                {/* Project card header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  
                  {isOwner && (
                    <button
                      onClick={(e) => handleDeleteProject(proj._id, e)}
                      className="text-dark-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all absolute top-4 right-4"
                      title="Delete Project"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-lg text-dark-100 group-hover:text-white transition-colors line-clamp-1 pr-6">
                  {proj.name}
                </h3>
                <p className="text-xs text-dark-400 line-clamp-3 mt-2 pr-2">
                  {proj.description}
                </p>
              </div>

              {/* Card Footer info */}
              <div className="border-t border-dark-700/60 pt-4 mt-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-dark-400">
                  <User2 className="h-3.5 w-3.5 text-brand-500/70" />
                  <span className="truncate max-w-[80px]">
                    {isOwner ? 'You' : proj.owner.name.split(' ')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-dark-400">
                  <span className="text-[10px] bg-dark-700 px-2 py-0.5 rounded text-dark-300">
                    {formattedDate}
                  </span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{proj.members?.length || 1}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {createError}
          </div>
        )}
        
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="e.g., Mobile App Launch"
              className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-1.5">
              Description
            </label>
            <textarea
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              placeholder="Brief description of project goals, team, and scope."
              rows={4}
              className="block w-full px-4 py-2.5 bg-dark-900 border border-dark-700/60 rounded-xl text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 text-sm resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-dark-300 hover:bg-dark-700 rounded-lg text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {createLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;

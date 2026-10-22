import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetBoardsQuery, useCreateBoardMutation } from '../../../api/boardApi';
import { Plus, LayoutGrid, Users, Calendar, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../../components/ToastNotification';
import type { Board } from '../../../types';

export const BoardsListPage: React.FC = () => {
  const { data, isLoading, error } = useGetBoardsQuery();
  const [createBoard, { isLoading: isCreating }] = useCreateBoardMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!title.trim()) return;

    try {
      await createBoard({ name: title.trim(), description: description.trim() }).unwrap();
      showToast({
        type: 'PROJECT_CREATED',
        title: 'Project Created',
        message: `Project "${title.trim()}" created successfully`,
      });
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err: any) {
      setCreateError(err.data?.message || 'Failed to create board');
    }
  };

  const boards: Board[] = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-hero text-ink flex items-center space-x-3">
            <LayoutGrid className="w-9 h-9" style={{ color: 'var(--accent)' }} />
            <span>Workspace Boards</span>
          </h1>
          <p className="text-body text-mute mt-1.5">
            Manage and collaborate on your real-time Kanban projects
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary px-6 py-3">
          <Plus className="w-5 h-5" />
          <span>Create New Board</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="notice notice-danger p-6 text-center">
          Failed to load boards. Please verify MongoDB backend service is running.
        </div>
      ) : boards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-12 text-center max-w-lg mx-auto my-12"
        >
          <div className="brand-mark w-16 h-16 mx-auto mb-5">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h3 className="text-card-title text-xl font-bold text-ink mb-2">No Boards Found</h3>
          <p className="text-body text-mute mb-7">
            Get started by creating your first real-time Kanban board!
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary px-6 py-2.5">
            <Plus className="w-4 h-4" />
            <span>Create Board</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board: Board, idx: number) => (
            <motion.div
              key={board._id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35, ease: [0.22, 0.8, 0.32, 1] }}
            >
              <Link
                to={`/boards/${board._id}`}
                className="group block glass-card card-lift p-6 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-opacity"
                  style={{ background: 'radial-gradient(circle, var(--glow), transparent 65%)' }}
                />

                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-card-title text-xl font-bold text-ink line-clamp-1">
                    {board.name}
                  </h2>
                  <ArrowRight className="w-5 h-5 text-faint group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>

                <p className="text-body text-sm text-mute mb-6 line-clamp-2 min-h-[2.5rem]">
                  {board.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between text-xs text-mute pt-4 border-t divider">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span>{board.members?.length || 1} Member(s)</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{board.columns?.length || 4} Columns</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-scrim">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.28, ease: [0.22, 0.8, 0.32, 1] }}
              className="w-full max-w-md modal-panel p-6 relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="icon-btn absolute top-4 right-4"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-card-title text-xl font-bold text-ink mb-1">Create New Board</h3>
              <p className="text-meta text-xs text-mute mb-6">Enter details for your new collaborative board</p>

              {createError && (
                <div className="notice notice-danger mb-4 text-xs">{createError}</div>
              )}

              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div>
                  <label className="label">Board Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Product Launch Q3"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of board goals..."
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating} className="btn btn-primary px-5">
                    {isCreating ? 'Creating...' : 'Create Board'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import type { Task, User, Column } from '../../../types';
import { useUpdateTaskMutation, useDeleteTaskMutation, useArchiveTaskMutation } from '../../../api/taskApi';
import { useAppDispatch } from '../../../app/hooks';
import { setActiveTaskId } from '../../board/boardSlice';
import { X, Trash2, Archive, User as UserIcon } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { TypingIndicator } from './TypingIndicator';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { showToast } from '../../../components/ToastNotification';
import { ConfirmDeleteModal } from '../../../components/ConfirmDeleteModal';
import type { TypingUser } from '../../../sockets/useSocketEvents';
import { motion } from 'framer-motion';

interface TaskModalProps {
  task: Task;
  boardId: string;
  members: User[];
  columns: Column[];
  typingUsers?: TypingUser[];
  onTypingStart: (taskId: string) => void;
  onTypingStop: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  boardId,
  members,
  columns,
  typingUsers,
  onTypingStart,
  onTypingStop,
}) => {
  const dispatch = useAppDispatch();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [archiveTask, { isLoading: isArchiving }] = useArchiveTaskMutation();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(task.priority || 'medium');
  const [columnId, setColumnId] = useState(task.columnId);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    task.assignees ? task.assignees.map((a) => (typeof a === 'string' ? a : a._id)) : []
  );
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const resolvedBoardId =
    boardId ||
    (typeof task.board === 'string' ? task.board : (task.board as any)?._id) ||
    '';

  const isDirty =
    title !== task.title ||
    description !== (task.description || '') ||
    priority !== (task.priority || 'medium') ||
    columnId !== task.columnId ||
    dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '') ||
    JSON.stringify(selectedAssignees.slice().sort()) !==
      JSON.stringify(
        (task.assignees ? task.assignees.map((a) => (typeof a === 'string' ? a : a._id)) : []).slice().sort()
      );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setColumnId(task.columnId);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setSelectedAssignees(task.assignees ? task.assignees.map((a) => (typeof a === 'string' ? a : a._id)) : []);
    setConflictError(null);
  }, [task]);

  const handleClose = () => {
    dispatch(setActiveTaskId(null));
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
    } else {
      handleClose();
    }
  };

  const handleSave = async () => {
    try {
      setConflictError(null);
      await updateTask({
        taskId: task._id,
        boardId: resolvedBoardId,
        title,
        description,
        priority,
        dueDate: dueDate || null,
        assignees: selectedAssignees,
        version: task.version,
      }).unwrap();
      showToast({
        type: 'TASK_UPDATED',
        title: 'Task Updated',
        message: `Task "${title.trim()}" updated successfully`,
      });
      onTypingStop(task._id);
      handleClose();
    } catch (err: any) {
      if (err?.status === 409 || err?.data?.message === 'VERSION_CONFLICT') {
        setConflictError(
          'Simultaneous update conflict: Another team member saved changes to this task while you were editing. Review the latest values or make your edits again.'
        );
      } else {
        console.error('Failed to update task', err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDeleteConfirmOpen || isDiscardConfirmOpen) return;
        e.preventDefault();
        handleCloseAttempt();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleCloseAttempt, isDeleteConfirmOpen, isDiscardConfirmOpen]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTask({ taskId: task._id, boardId: resolvedBoardId }).unwrap();
      showToast({
        type: 'TASK_DELETED',
        title: 'Task Deleted',
        message: `Task "${task.title}" deleted`,
      });
      setIsDeleteConfirmOpen(false);
      handleClose();
    } catch (err) {
      console.error('Failed to delete task', err);
      showToast({
        type: 'TASK_DELETED',
        title: 'Delete Failed',
        message: 'Failed to delete task',
      });
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
      onClick={handleCloseAttempt}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] glass-card rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto relative flex flex-col cursor-default"
        style={{ backgroundColor: 'var(--surface, #14151a)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-edge">
          <div className="flex items-center space-x-3">
            <TypingIndicator typingUsers={typingUsers} />
            {task.version && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-edge text-mute font-bold">
                v{task.version}
              </span>
            )}
            {isDirty ? (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Saved</span>
              </span>
            )}
          </div>
          <button
            onClick={handleCloseAttempt}
            className="p-1 text-mute hover:text-ink rounded-lg hover:bg-surface border border-transparent hover:border-edge ml-auto transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simultaneous Update Conflict Warning */}
        {conflictError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
            <p className="font-semibold mb-1">⚠️ Simultaneous Update Conflict</p>
            <p>{conflictError}</p>
          </div>
        )}

        <div className="space-y-5 my-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onTypingStart(task._id);
              }}
              onBlur={() => onTypingStop(task._id)}
              className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 text-lg font-bold text-ink focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* TipTap Rich Text Description with Cloudinary Upload & @Member Tagging */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
              Formattable Description (@Member Tagging & Cloudinary Uploads)
            </label>
            <RichTextEditor
              content={description}
              onChange={(html) => setDescription(html)}
              onTypingStart={() => onTypingStart(task._id)}
              onTypingStop={() => onTypingStop(task._id)}
              members={members}
            />
          </div>

          {/* Priority & Column & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-surface border border-edge rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
              >
                <option value="low" className="bg-surface text-ink">Low Priority</option>
                <option value="medium" className="bg-surface text-ink">Medium Priority</option>
                <option value="high" className="bg-surface text-ink">High Priority</option>
                <option value="critical" className="bg-surface text-ink">Critical Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
                Status / Column
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full bg-surface border border-edge rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
              >
                {columns.map((c) => (
                  <option key={c._id} value={c._id} className="bg-surface text-ink">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface border border-edge rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Assignees
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isSelected = selectedAssignees.includes(member._id);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleAssignee(member._id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent/20 text-accent border-accent/50 shadow-sm font-semibold'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Section */}
          <CommentSection taskId={task._id} onTypingStart={onTypingStart} onTypingStop={onTypingStop} />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await archiveTask({ taskId: task._id, boardId: resolvedBoardId, isArchived: true }).unwrap();
                  showToast({
                    type: 'TASK_UPDATED',
                    title: 'Task Archived',
                    message: `Task "${task.title}" archived. Restore anytime in Settings > Archives.`,
                  });
                  handleClose();
                } catch (err) {
                  console.error('Failed to archive task', err);
                }
              }}
              disabled={isArchiving}
              className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 px-3 py-2 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-40"
              title="Archive this card"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer flex items-center space-x-1.5 transition-colors"
            >
              <span>{isDirty ? 'Discard' : 'Cancel'}</span>
              <span className="hidden sm:inline-block text-[10px] font-mono opacity-50 px-1 py-0.5 rounded bg-white/5 border border-white/10">Esc</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="btn btn-primary px-4 py-2 text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              <span className="hidden sm:inline-block text-[10px] font-mono opacity-80 px-1.5 py-0.5 rounded bg-black/25">⌘↵</span>
            </button>
          </div>
        </div>
      </motion.div>

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Task?"
        itemName={title || task.title}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={isDiscardConfirmOpen}
        title="Discard Unsaved Changes?"
        message="You have unsaved edits to this task. Are you sure you want to discard your changes?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          handleClose();
        }}
        onCancel={() => setIsDiscardConfirmOpen(false)}
      />
    </div>
  );
};
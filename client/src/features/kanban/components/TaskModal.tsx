import React, { useState, useEffect } from 'react';
import type { Task, User, Column } from '../../../types';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../../../api/taskApi';
import { useAppDispatch } from '../../../app/hooks';
import { setActiveTaskId } from '../../board/boardSlice';
import { X, Trash2, User as UserIcon } from 'lucide-react';
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

  const resolvedBoardId =
    boardId ||
    (typeof task.board === 'string' ? task.board : (task.board as any)?._id) ||
    '';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl overflow-y-auto relative flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <TypingIndicator typingUsers={typingUsers} />
            {task.version && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                v{task.version}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-auto"
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
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
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* TipTap Rich Text Description with Cloudinary Upload & @Member Tagging */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Status / Column
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {columns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Are you want to delete?"
        itemName={title || task.title}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};
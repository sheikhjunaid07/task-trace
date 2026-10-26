import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column, Task } from '../../../types';
import { TaskCard } from './TaskCard';
import { useCreateTaskMutation } from '../../../api/taskApi';
import {
  useRenameColumnMutation,
  useRemoveColumnMutation,
  useUpdateColumnWipLimitMutation,
  useArchiveColumnMutation,
} from '../../../api/boardApi';
import {
  Plus,
  X,
  GripVertical,
  Edit2,
  Trash2,
  Check,
  MoreHorizontal,
  AlertTriangle,
  Archive,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { columnColor } from '../../../utils/columnTheming';
import { showToast } from '../../../components/ToastNotification';
import { ConfirmDeleteModal } from '../../../components/ConfirmDeleteModal';
import type { TypingUser, DraggingUser } from '../../../sockets/useSocketEvents';

interface KanbanColumnProps {
  column: Column;
  boardId: string;
  tasks: Task[];
  columns?: Column[];
  typingUsersMap?: Record<string, TypingUser[]>;
  draggingTasks?: Record<string, DraggingUser>;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  boardId,
  tasks,
  columns,
  typingUsersMap,
  draggingTasks,
}) => {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: column._id });
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: { type: 'Column', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [renameColumn, { isLoading: isRenaming }] = useRenameColumnMutation();
  const [removeColumn, { isLoading: isRemoving }] = useRemoveColumnMutation();
  const [updateColumnWipLimit] = useUpdateColumnWipLimitMutation();
  const [archiveColumn] = useArchiveColumnMutation();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const col = columnColor(column.name);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createTask({
        boardId,
        columnId: column._id,
        title: newTitle.trim(),
      }).unwrap();
      showToast({
        type: 'TASK_CREATED',
        title: 'Task Added',
        message: `Task "${newTitle.trim()}" added to ${column.name}`,
      });
      setNewTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleRenameColumn = async () => {
    if (!columnName.trim() || columnName === column.name) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await renameColumn({
        boardId,
        columnId: column._id,
        name: columnName.trim(),
      }).unwrap();
      showToast({
        type: 'TASK_UPDATED',
        title: 'Column Renamed',
        message: `Column renamed to "${columnName.trim()}"`,
      });
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Failed to rename column', err);
    }
  };

  const handleConfirmDeleteColumn = async () => {
    try {
      await removeColumn({ boardId, columnId: column._id }).unwrap();
      showToast({
        type: 'TASK_DELETED',
        title: 'Column Deleted',
        message: `Column "${column.name}" was deleted`,
      });
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete column', err);
    }
  };

  const taskIds = tasks.map((t) => t._id);

  return (
    <motion.div
      ref={(node) => {
        setDroppableRef(node);
        setSortableRef(node);
      }}
      style={{ ...style, '--col': col } as React.CSSProperties}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 0.8, 0.32, 1] }}
      className="column-card w-[85vw] sm:w-80 shrink-0 snap-start flex flex-col max-h-full glass-panel rounded-2xl p-4 group/col"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b divider">
        <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
          <span className="column-dot shrink-0" />

          {isEditingTitle ? (
            <div className="flex items-center space-x-1 flex-1">
              <input
                type="text"
                autoFocus
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameColumn();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="input py-1 px-2 text-xs font-bold w-full"
              />
              <button
                type="button"
                onClick={handleRenameColumn}
                disabled={isRenaming}
                className="icon-btn w-6 h-6 text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3
              onDoubleClick={() => setIsEditingTitle(true)}
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink truncate cursor-pointer hover:text-accent transition-colors"
              title="Double click to rename"
            >
              {column.name}
            </h3>
          )}

          {column.wipLimit && column.wipLimit > 0 ? (
            tasks.length > column.wipLimit ? (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0 animate-pulse"
                title={`WIP Limit exceeded! (${tasks.length}/${column.wipLimit} cards)`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{tasks.length}/{column.wipLimit}</span>
              </span>
            ) : (
              <span
                className="column-badge shrink-0"
                title={`WIP limit: ${column.wipLimit} cards`}
              >
                {tasks.length}/{column.wipLimit}
              </span>
            )
          ) : (
            <span className="column-badge shrink-0">{tasks.length}</span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 relative">
          {/* Column Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-mute hover:text-ink hover:bg-white/5 transition-colors"
            title="Drag to reorder column"
          >
            <GripVertical className="column-grip w-4 h-4 text-mute" />
          </div>

          {/* Quick Add Task */}
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Add Task"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Column Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Column options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-8 z-30 w-44 py-1.5 glass-card bg-slate-900 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md text-xs"
                  style={{ backgroundColor: 'var(--surface, #14151a)' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingTitle(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename Column</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const limit = prompt(
                        'Enter maximum cards limit for this column (or leave blank for unlimited):',
                        column.wipLimit ? String(column.wipLimit) : ''
                      );
                      if (limit !== null) {
                        const parsed = parseInt(limit.trim(), 10);
                        const wipVal = isNaN(parsed) || parsed <= 0 ? null : parsed;
                        updateColumnWipLimit({
                          boardId,
                          columnId: column._id,
                          wipLimit: wipVal,
                        });
                        showToast({
                          type: 'TASK_UPDATED',
                          title: 'WIP Limit Updated',
                          message: wipVal ? `WIP Limit set to ${wipVal} cards` : 'WIP Limit removed',
                        });
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Set WIP Limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Archive column "${column.name}"?`)) {
                        archiveColumn({ boardId, columnId: column._id, isArchived: true });
                        showToast({
                          type: 'TASK_UPDATED',
                          title: 'Column Archived',
                          message: `Column "${column.name}" moved to archives`,
                        });
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Archive Column</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Column</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mb-3 overflow-hidden"
          >
            <div className="glass-card p-3 rounded-xl">
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter task title..."
                className="input py-2 mb-2 text-[13px]"
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="icon-btn w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="btn btn-primary px-4 py-1.5 text-[13px]"
                >
                  {isCreating ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div
        className={`flex-1 overflow-y-auto space-y-3 min-h-[150px] p-1 rounded-xl ${
          isOver ? 'drop-target' : ''
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentColumn={column}
              columns={columns}
              boardId={boardId}
              typingUsers={typingUsersMap ? typingUsersMap[task._id] : undefined}
              draggingUser={draggingTasks ? draggingTasks[task._id] : undefined}
            />
          ))}
          {tasks.length === 0 && !isAdding && (
            <div
              onClick={() => setIsAdding(true)}
              className="h-28 rounded-xl border border-dashed border-white/10 hover:border-white/20 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors group/empty select-none"
            >
              <Plus className="w-4 h-4 text-slate-500 group-hover/empty:text-slate-300 mb-1 transition-colors" />
              <span className="text-[11px] font-medium text-slate-400 group-hover/empty:text-slate-200 transition-colors">
                No tasks yet
              </span>
              <span className="text-[10px] text-slate-500">
                Click + to add a task
              </span>
            </div>
          )}
        </SortableContext>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title={`Delete "${column.name}" Column?`}
        message={
          tasks.length > 0
            ? `This will permanently delete the "${column.name}" column and all ${tasks.length} task(s) inside it. This action cannot be undone.`
            : `This will permanently delete the "${column.name}" column. This action cannot be undone.`
        }
        isLoading={isRemoving}
        onConfirm={handleConfirmDeleteColumn}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </motion.div>
  );
};
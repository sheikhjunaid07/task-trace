import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column, Task } from '../../../types';
import { TaskCard } from './TaskCard';
import { useCreateTaskMutation } from '../../../api/taskApi';
import { useRenameColumnMutation, useRemoveColumnMutation } from '../../../api/boardApi';
import { Plus, X, GripVertical, Edit2, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { columnColor } from '../../../utils/columnTheming';
import { showToast } from '../../../components/ToastNotification';
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

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnName, setColumnName] = useState(column.name);

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

  const handleDeleteColumn = async () => {
    if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
      try {
        await removeColumn({ boardId, columnId: column._id }).unwrap();
        showToast({
          type: 'TASK_DELETED',
          title: 'Column Deleted',
          message: `Column "${column.name}" was deleted`,
        });
      } catch (err) {
        console.error('Failed to delete column', err);
      }
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

          <span className="column-badge shrink-0">{tasks.length}</span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Column Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-mute hover:text-ink">
            <GripVertical className="column-grip w-4 h-4 text-mute" />
          </div>

          <button
            type="button"
            onClick={() => setIsEditingTitle(!isEditingTitle)}
            className="icon-btn w-7 h-7 text-mute hover:text-ink"
            title="Rename Column"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDeleteColumn}
            disabled={isRemoving}
            className="icon-btn w-7 h-7 text-slate-300 hover:text-rose-400"
            title="Delete Column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="icon-btn w-7 h-7 text-slate-300 hover:text-white"
            title="Add Task"
          >
            <Plus className="w-4 h-4" />
          </button>
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
        </SortableContext>
      </div>
    </motion.div>
  );
};
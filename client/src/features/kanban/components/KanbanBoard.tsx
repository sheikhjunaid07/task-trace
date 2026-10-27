import React, { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  closestCorners,
  getFirstCollision,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Column, Task } from "../../../types";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { useMoveTaskMutation } from "../../../api/taskApi";
import {
  useAddColumnMutation,
  useReorderColumnsMutation,
} from "../../../api/boardApi";
import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { showToast } from "../../../utils/toast";
import type {
  TypingUser,
  DraggingUser,
} from "../../../sockets/useSocketEvents";

interface KanbanBoardProps {
  boardId: string;
  columns: Column[];
  tasks: Task[];
  typingUsersMap?: Record<string, TypingUser[]>;
  draggingTasks?: Record<string, DraggingUser>;
  onDragStart?: (taskId: string) => void;
  onDragEnd?: (taskId: string) => void;
}

const POSITION_STEP = 1000;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  columns,
  tasks,
  typingUsersMap,
  draggingTasks,
  onDragStart,
  onDragEnd,
}) => {
  const [moveTask] = useMoveTaskMutation();
  const [addColumn, { isLoading: isAddingColumn }] = useAddColumnMutation();
  const [reorderColumns] = useReorderColumnsMutation();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [isAddingColumnForm, setIsAddingColumnForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const columnIds = useMemo(
    () => new Set(columns.map((c) => c._id)),
    [columns],
  );
  const columnIdList = useMemo(() => columns.map((c) => c._id), [columns]);

  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      const pointerCollisions = pointerWithin(args);
      const intersections =
        pointerCollisions.length > 0
          ? pointerCollisions
          : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id");

      if (overId != null && columnIds.has(overId as string)) {
        const columnTasks = tasks.filter((t) => t.columnId === overId);
        if (columnTasks.length > 0) {
          const closest = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) =>
                container.id !== overId &&
                columnTasks.some((t) => t._id === container.id),
            ),
          });
          overId = closest[0]?.id ?? null;
        }
      }

      return overId != null ? [{ id: overId }] : [];
    },
    [columnIds, tasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    const isColumn = columnIds.has(active.id as string);
    if (isColumn) {
      const col = columns.find((c) => c._id === active.id);
      if (col) setActiveColumn(col);
    } else {
      const task = tasks.find((t) => t._id === active.id);
      if (task) {
        setActiveTask(task);
        onDragStart?.(task._id);
      }
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    if (activeTask) {
      onDragEnd?.(activeTask._id);
    }
    setActiveTask(null);
    setActiveColumn(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const taskBeingMoved = activeTask;
    if (taskBeingMoved) {
      onDragEnd?.(taskBeingMoved._id);
    }
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 1. Column Drag Reordering
    if (columnIds.has(activeId) && columnIds.has(overId)) {
      if (activeId !== overId) {
        const oldIndex = columnIdList.indexOf(activeId);
        const newIndex = columnIdList.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newColumnIds = [...columnIdList];
          const [moved] = newColumnIds.splice(oldIndex, 1);
          newColumnIds.splice(newIndex, 0, moved);

          try {
            await reorderColumns({ boardId, columnIds: newColumnIds }).unwrap();
          } catch (err) {
            console.error("Failed to reorder columns", err);
          }
        }
      }
      return;
    }

    // 2. Task Drag Reordering
    const taskToMove = tasks.find((t) => t._id === activeId);
    if (!taskToMove) return;

    let targetColumnId: string;
    let targetPosition: number;

    const isOverColumn = columnIds.has(overId);

    if (isOverColumn) {
      targetColumnId = overId;
      const colTasks = tasks
        .filter((t) => t.columnId === targetColumnId && t._id !== activeId)
        .sort((a, b) => a.position - b.position || a._id.localeCompare(b._id));

      if (colTasks.length === 0) {
        targetPosition = POSITION_STEP;
      } else {
        targetPosition = colTasks[colTasks.length - 1].position + POSITION_STEP;
      }
    } else if (overId === activeId) {
      return;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (!overTask) return;

      targetColumnId = overTask.columnId;

      if (taskToMove.columnId === targetColumnId) {
        // Reordering within the SAME column
        const fullSorted = tasks
          .filter((t) => t.columnId === targetColumnId)
          .sort(
            (a, b) => a.position - b.position || a._id.localeCompare(b._id),
          );

        const overIndex = fullSorted.findIndex((t) => t._id === overId);
        const activeIndex = fullSorted.findIndex((t) => t._id === activeId);
        if (overIndex === -1 || activeIndex === -1 || overIndex === activeIndex)
          return;

        const newOrder = [...fullSorted];
        const [moved] = newOrder.splice(activeIndex, 1);
        newOrder.splice(overIndex, 0, moved);

        const newIndex = newOrder.findIndex((t) => t._id === activeId);
        const prev = newOrder[newIndex - 1];
        const next = newOrder[newIndex + 1];

        if (!prev) {
          targetPosition = next ? next.position / 2 : POSITION_STEP;
        } else if (!next) {
          targetPosition = prev.position + POSITION_STEP;
        } else {
          targetPosition = (prev.position + next.position) / 2;
        }
      } else {
        // Moving to a DIFFERENT column (e.g. from "To Do" to "In Progress" or "Done")
        const targetColTasks = tasks
          .filter((t) => t.columnId === targetColumnId && t._id !== activeId)
          .sort(
            (a, b) => a.position - b.position || a._id.localeCompare(b._id),
          );

        const overIndex = targetColTasks.findIndex((t) => t._id === overId);
        if (overIndex === -1) {
          const last = targetColTasks[targetColTasks.length - 1];
          targetPosition = last ? last.position + POSITION_STEP : POSITION_STEP;
        } else {
          const prev = targetColTasks[overIndex - 1];
          const target = targetColTasks[overIndex];
          if (!prev) {
            targetPosition = target.position / 2;
          } else {
            targetPosition = (prev.position + target.position) / 2;
          }
        }
      }
    }

    try {
      await moveTask({
        taskId: activeId,
        boardId,
        columnId: targetColumnId,
        position: targetPosition,
      }).unwrap();
      const destCol = columns.find((c) => c._id === targetColumnId);
      showToast({
        type: "TASK_MOVED",
        title: "Task Moved",
        message: `Task moved to ${destCol?.name || "new column"}`,
      });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  const handleAddColumnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    try {
      await addColumn({ boardId, name: newColumnName.trim() }).unwrap();
      showToast({
        type: "TASK_CREATED",
        title: "Column Added",
        message: `Column "${newColumnName.trim()}" created`,
      });
      setNewColumnName("");
      setIsAddingColumnForm(false);
    } catch (err) {
      console.error("Failed to add column", err);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 min-h-[460px] h-[calc(100dvh-17.5rem)] sm:h-[calc(100vh-14rem)] items-start overscroll-x-contain">
        <SortableContext
          items={columnIdList}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => {
            const colTasks = tasks
              .filter((t) => t.columnId === column._id)
              .sort(
                (a, b) => a.position - b.position || a._id.localeCompare(b._id),
              );

            return (
              <KanbanColumn
                key={column._id}
                column={column}
                boardId={boardId}
                tasks={colTasks}
                columns={columns}
                typingUsersMap={typingUsersMap}
                draggingTasks={draggingTasks}
              />
            );
          })}
        </SortableContext>

        {/* Add Column Button / Card */}
        <div className="w-[84vw] max-w-[340px] sm:w-80 shrink-0 snap-start">
          {isAddingColumnForm ? (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleAddColumnSubmit}
              className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3"
            >
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Create New Column
              </h4>
              <input
                type="text"
                autoFocus
                required
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsAddingColumnForm(false);
                  }
                }}
                placeholder="Column name (e.g. In Review)..."
                className="input py-2 text-xs"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingColumnForm(false)}
                  className="icon-btn w-8 h-8"
                  title="Cancel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={isAddingColumn || !newColumnName.trim()}
                  className="btn btn-primary px-4 py-1.5 text-xs"
                >
                  {isAddingColumn ? "Creating..." : "Add Column"}
                </button>
              </div>
            </motion.form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingColumnForm(true)}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent/40 hover:bg-white/[0.04] text-slate-400 hover:text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Column</span>
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeColumn ? (
          <div className="opacity-90 scale-105 shadow-2xl">
            <KanbanColumn
              column={activeColumn}
              boardId={boardId}
              tasks={tasks.filter((t) => t.columnId === activeColumn._id)}
              columns={columns}
              typingUsersMap={typingUsersMap}
            />
          </div>
        ) : activeTask ? (
          <div className="rotate-2 scale-105 shadow-hover">
            <TaskCard
              task={activeTask}
              currentColumn={columns.find((c) => c._id === activeTask.columnId)}
              columns={columns}
              boardId={boardId}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

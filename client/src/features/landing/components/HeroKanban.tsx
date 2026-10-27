import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { MessageSquare, TrendingUp } from "lucide-react";

type Priority = "low" | "medium" | "high" | "critical";
type ColId = "todo" | "inprogress" | "done";

interface KbTask {
  id: string;
  title: string;
  priority: Priority;
  assignees: string[];
  due?: string;
  progress?: number;
  comments?: number;
}

const COLORS: Record<ColId, string> = {
  todo: "#8b5cf6",
  inprogress: "#f59e0b",
  done: "#22c55e",
};

const COL_LABELS: Record<ColId, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#8b5cf6,#a855f7)",
  "linear-gradient(135deg,#ec4899,#f472b6)",
  "linear-gradient(135deg,#22c55e,#10b981)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
];

const INITIAL: Record<ColId, KbTask[]> = {
  todo: [
    {
      id: "t1",
      title: "Design onboarding flow",
      priority: "high",
      assignees: [AVATAR_GRADIENTS[0], AVATAR_GRADIENTS[1]],
      due: "Today",
      comments: 3,
    },
    {
      id: "t2",
      title: "API rate limiting strategy",
      priority: "medium",
      assignees: [AVATAR_GRADIENTS[2]],
      due: "Fri",
      progress: 45,
    },
    {
      id: "t3",
      title: "Refactor auth guards",
      priority: "low",
      assignees: [AVATAR_GRADIENTS[3], AVATAR_GRADIENTS[4]],
    },
  ],
  inprogress: [
    {
      id: "t4",
      title: "Landing page rebuild",
      priority: "critical",
      assignees: [AVATAR_GRADIENTS[0]],
      due: "Today",
      progress: 72,
      comments: 5,
    },
    {
      id: "t5",
      title: "Real-time presence sync",
      priority: "high",
      assignees: [AVATAR_GRADIENTS[4], AVATAR_GRADIENTS[1]],
      progress: 35,
    },
  ],
  done: [
    {
      id: "t6",
      title: "Board invite links",
      priority: "medium",
      assignees: [AVATAR_GRADIENTS[2]],
      due: "Mon",
      progress: 100,
    },
    {
      id: "t7",
      title: "Task mention pings",
      priority: "low",
      assignees: [AVATAR_GRADIENTS[3]],
    },
  ],
};

function Card({ task }: { task: KbTask }) {
  return (
    <div className="lp-kb-card px-3 py-2.5">
      <p className="line-clamp-2 text-[11.5px] font-semibold leading-snug text-ink">
        {task.title}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.assignees.slice(0, 2).map((g, i) => (
            <span
              key={i}
              className="lp-avatar-ring flex h-[18px] w-[18px] items-center justify-center rounded-full text-[7px] font-bold text-white"
              style={{ backgroundImage: g }}
            >
              {["A", "L", "M", "S", "K"][i]}
            </span>
          ))}
          {task.assignees.length > 2 && (
            <span className="text-[8px] font-medium text-faint">
              +{task.assignees.length - 2}
            </span>
          )}
        </div>
        <span
          className={`prio-badge ${task.priority === "low" ? "prio-low" : task.priority === "medium" ? "prio-medium" : task.priority === "high" ? "prio-high" : "prio-critical"}`}
          style={{ fontSize: 8.5, padding: "2px 7px" }}
        >
          {task.priority}
        </span>
      </div>

      {(task.progress !== undefined ||
        task.due ||
        task.comments !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {task.progress !== undefined && (
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)]">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  background:
                    task.progress === 100 ? "var(--success)" : "var(--accent)",
                  width: `${task.progress}%`,
                }}
              />
            </div>
          )}
          {task.due && (
            <span className="ml-auto whitespace-nowrap text-[9px] font-medium text-faint">
              {task.due}
            </span>
          )}
          {task.comments !== undefined && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-faint">
              <MessageSquare className="h-2.5 w-2.5" />
              {task.comments}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Column({ id, tasks }: { id: ColId; tasks: KbTask[] }) {
  return (
    <div
      className="lp-kb-col min-h-0 w-[74vw] max-w-[240px] shrink-0 snap-center rounded-xl bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] p-2 sm:w-auto sm:max-w-none sm:shrink sm:snap-align-none"
      style={{ ["--col" as string]: COLORS[id] }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="column-dot" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-mute">
            {COL_LABELS[id]}
          </span>
        </div>
        <span className="column-badge">{tasks.length}</span>
      </div>

      <AnimatePresence initial={false}>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Card task={t} />
            </motion.div>
          ))}
          {id === "inprogress" && tasks.length > 0 && (
            <div className="lp-kb-card-drag flex h-16 items-center justify-center text-[9px] font-medium text-faint">
              Drop to move · live sync
            </div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}

export function HeroKanban() {
  const [cols, setCols] = useState<Record<ColId, KbTask[]>>(INITIAL);
  const [isDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const reduced = useReducedMotion();

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), {
    stiffness: 130,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9, 9]), {
    stiffness: 130,
    damping: 18,
  });

  useEffect(() => {
    if (reduced) return;
    let advance: ReturnType<typeof setInterval>;
    let finish: ReturnType<typeof setInterval>;
    const delayTimer = setTimeout(() => {
      advance = setInterval(() => {
        setCols((prev) => {
          if (!prev.todo.length) {
            if (!prev.inprogress.length && prev.done.length >= 3) {
              return INITIAL;
            }
            return prev;
          }
          const task = prev.todo[0];
          return {
            todo: prev.todo.slice(1),
            inprogress: [...prev.inprogress, task],
            done: prev.done,
          };
        });
      }, 4200);
      finish = setInterval(() => {
        setCols((prev) => {
          if (!prev.inprogress.length) return prev;
          const task = prev.inprogress[0];
          return {
            todo: prev.todo,
            inprogress: prev.inprogress.slice(1),
            done: [...prev.done, task],
          };
        });
      }, 6400);
    }, 5500);

    return () => {
      clearTimeout(delayTimer);
      if (advance) clearInterval(advance);
      if (finish) clearInterval(finish);
    };
  }, [reduced]);

  const totalTasks =
    cols.todo.length + cols.inprogress.length + cols.done.length;

  return (
    <div
      ref={ref}
      onPointerEnter={() => {
        if (ref.current) {
          rectRef.current = ref.current.getBoundingClientRect();
        }
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        let r = rectRef.current;
        if (!r && ref.current) {
          r = ref.current.getBoundingClientRect();
          rectRef.current = r;
        }
        if (!r || !r.width || !r.height) return;
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        rectRef.current = null;
        mx.set(0.5);
        my.set(0.5);
      }}
      className="relative w-full max-w-full"
      style={{ perspective: 1400 }}
    >
      {/* glow behind board */}
      <div
        className="absolute inset-0 sm:-inset-10 -z-10 rounded-[40px]"
        style={{
          background:
            "radial-gradient(58% 52% at 50% 42%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* floating chip — velocity */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -left-6 -top-5 z-20 hidden lg:block"
      >
        <div className="lp-float-slow">
          <div className="lp-glass-deep flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)]">
              <TrendingUp
                className="h-4 w-4"
                style={{ color: "var(--success)" }}
              />
            </span>
            <div>
              <p className="text-[13px] font-bold leading-none text-ink">
                +12.4%
              </p>
              <p className="mt-1 text-[10px] font-medium text-faint">
                Velocity this week
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* floating chip — presence */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 1.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-6 -left-8 z-20 hidden lg:block"
      >
        <div className="lp-float" style={{ animationDelay: "1.2s" }}>
          <div className="lp-glass-deep flex items-center gap-3 rounded-2xl px-4 py-3">
            <div className="flex">
              {[
                AVATAR_GRADIENTS[1],
                AVATAR_GRADIENTS[2],
                AVATAR_GRADIENTS[3],
              ].map((g, i) => (
                <span
                  key={i}
                  className="lp-avatar-ring -ml-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white first:ml-0"
                  style={{ backgroundImage: g }}
                >
                  {["L", "M", "S"][i]}
                </span>
              ))}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold leading-none text-ink">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                3 online
              </p>
              <p className="mt-1 text-[10px] font-medium text-faint">
                Editing this board
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* the board */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-full"
      >
        <div className="lp-float" style={{ animationDelay: "0.8s" }}>
          <motion.div
            style={{
              rotateX: !isDesktop || reduced ? 0 : rotateX,
              rotateY: !isDesktop || reduced ? 0 : rotateY,
            }}
            className="lp-kb-board"
          >
            <div className="lp-glass-deep w-full max-w-full box-border rounded-[24px] p-3 sm:p-3.5">
              {/* board header */}
              <div className="mb-3 flex items-center justify-between px-1.5">
                <div>
                  <p className="text-[13px] font-bold text-ink">
                    Product Launch
                  </p>
                  <p className="text-[10px] font-medium text-faint">
                    {totalTasks} tasks · updated just now
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="lp-avatar-ring -ml-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white first:ml-0"
                        style={{ backgroundImage: AVATAR_GRADIENTS[i] }}
                      >
                        {["A", "L", "M"][i]}
                      </span>
                    ))}
                  </div>
                  <span
                    className="rounded-full px-3 py-1.5 text-[9.5px] font-bold"
                    style={{
                      background: "var(--grad-accent)",
                      color: "#fff",
                      boxShadow: "0 4px 14px -4px var(--glow)",
                    }}
                  >
                    Share
                  </span>
                </div>
              </div>

              {/* mobile swipe cue */}
              <div className="mb-2 flex items-center justify-between px-1 text-[11px] sm:hidden">
                <span className="flex items-center gap-1.5 font-semibold text-mute">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  Live sync
                </span>
                <span className="text-[10px] font-medium text-mute">
                  Swipe columns →
                </span>
              </div>

              {/* columns */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory scroll-smooth sm:grid sm:grid-cols-3 sm:overflow-visible sm:snap-none">
                <Column id="todo" tasks={cols.todo} />
                <Column id="inprogress" tasks={cols.inprogress} />
                <Column id="done" tasks={cols.done} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

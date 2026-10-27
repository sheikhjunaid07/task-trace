# 🚀 TaskTrace — Real-Time Collaborative Kanban Workspace

A high-performance, real-time collaborative Kanban workspace built with **React 19**, **Vite**, **TypeScript**, **Redux Toolkit**, **Socket.io**, **Node.js**, **Express**, **MongoDB**, and **Tailwind CSS v4**.

TaskTrace combines zero-refresh optimistic UI responsiveness with real-time multiplayer synchronization, conflict-free fractional positioning, rich text task management, and responsive touch controls.

---

## 🌟 Key Features

### 🎛️ Interactive Kanban Workspace
- **Multi-Column Drag & Drop**: Seamlessly move tasks within a column or across columns using `@dnd-kit/core` and `@dnd-kit/sortable`.
- **Fractional Position Math**: Smooth, high-performance midpoint calculation `(prevPos + nextPos) / 2` for reordering without re-indexing entire columns in MongoDB.
- **Collaborative Drag Presence**: Real-time visual feedback displaying which collaborator is currently dragging a card (`task:drag:started` / `task:drag:ended`).
- **Dynamic Column Management**: Add custom columns (`In Review`, `QA`, etc.), inline rename (double-click/edit icon), delete columns, set Work-in-Progress (WIP) limits, archive columns, and drag-and-drop column reordering.
- **Cross-Device Live Sync**: Socket.io broadcasts (`task:created`, `task:moved`, `task:updated`, `task:deleted`, `column:*`) keep all active sessions synchronized instantly without page reloads.

### 📝 Rich Task Details & Modal (`TaskModal.tsx`)
- **TipTap Rich Text Editor**: Formattable descriptions with Bold, Italic, Strikethrough, Headings, Bullet Lists, and Numbered Lists (`@tiptap/react`).
- **Image Attachments**: Integrated image uploading via Multer to Cloudinary (`POST /api/upload`) with a base64 Data URI fallback.
- **Priority Management**: 4 distinct priority levels (`Low`, `Medium`, `High`, and `Critical`) with glowing accent badges.
- **Due Date Tracking**: Calendar date picker with real-time status indicators (overdue, due today, upcoming).
- **Multi-Assignee Support**: Assign multiple team members to a task with colored avatar chips.
- **Task Comments (`CommentSection.tsx`)**: Real-time conversation thread on every task with user avatars and relative timestamps.
- **Live Typing Indicators (`TypingIndicator.tsx`)**: Animated typing chips (`"Alice is typing..."`) on task cards and modals with 2.5-second auto-clearing timers.

### 🧭 Navigation, Dashboards & Team Management
- **Central Workspace Dashboard (`/dashboard`)**: Overview stats (Active Projects, Total Tasks, Completion Rate %, In Progress, To Do), recent workspace activity feed, and an **Upcoming Deadlines** widget.
- **Projects & Boards List (`/boards`)**: Grid view of user-owned and collaborative boards with quick creation modals.
- **Team Directory (`/team`)**: Workspace collaborator list with role badges (`Admin` / `Member`), search filter, online status, and direct invite modals.
- **Project Settings & Archives (`/settings`)**: Project title/description edits, WIP limits, column and task archive manager (view, restore, or permanently delete), and ownership transfer.
- **Collapsible Sidebar (`LeftSidebar.tsx`)**: Persistent navigation bar with fast board switching, quick-add buttons, and mobile drawer overlay.

### 🔔 Live Sync, Invitations & Toast Notifications
- **Pending Invitations Banner (`PendingInvitationsBanner.tsx`)**: Global top notification banner alerting users of pending board invitations with instant **Accept** or **Decline** buttons.
- **Floating Toast System (`ToastNotification.tsx`)**: Animated floating toast notifications for board invitations, task creations, movements, updates, deletions, and member joins.
- **Board Activity Timeline (`ActivityTimeline.tsx`)**: Slide-out audit drawer logging task creations, movements, edits, member joins, and column changes chronologically.
- **Board Analytics Drawer (`AnalyticsPanel.tsx`)**: Slide-over panel tracking task distributions, completion rates, and priority breakdowns.

### 🔗 Shareable Board Links & Access Control
- **Shareable Invite Codes**: Unique auto-generated invite codes for each board (`/boards/join/:inviteCode`).
- **Dedicated Join Preview Page (`JoinBoardPage.tsx`)**: Preview card displaying board title, description, owner avatar, and member count before joining.
- **Role-Based Controls**: Distinct Owner and Member permissions. Board owners can kick/remove members, regenerate share links, and transfer board ownership.

### 🎨 Themes & Ergonomics
- **5 Curated Design Themes**: Switch between `Obsidian` (Dark Violet), `Editorial` (Clean Paper Light), `Midnight Neon` (Cyber Cyan), `Forest Executive` (Emerald), and `Rose Gold` on the fly via `ThemeSwitcher`.
- **100% Mobile Responsive**: Touch-optimized drag & drop via `TouchSensor` (250ms long-press delay to preserve native page scrolling) and horizontal scroll snap (`snap-x`).
- **Keyboard Shortcuts (`KeyboardShortcutsModal.tsx`)**: Press `?` to open the shortcuts cheat sheet (`/` to focus search, `M` to toggle "My Tasks", `Esc` to close/reset, `Cmd/Ctrl + Enter` to save).

---

## 🛠️ Tech Stack Architecture

### Frontend
| Technology | Role |
|---|---|
| **React 19** | Core UI framework with Concurrent Mode & Suspense |
| **Vite 8** | High-speed frontend build tool and dev server |
| **TypeScript** | Strict static type safety |
| **Redux Toolkit & RTK Query** | Global state management, caching, and optimistic mutations |
| **Socket.io Client** | Real-time WebSocket connection and event handling |
| **@dnd-kit** (`core`, `sortable`) | Multi-column drag-and-drop with pointer and touch sensors |
| **TipTap Editor** | Formattable rich text editor with image and mention extensions |
| **Tailwind CSS v4** | Modern styling with design tokens and responsive breakpoints |
| **Framer Motion** | Spring animations, drawer transitions, and toast motions |
| **Lucide React** | Comprehensive icon library |

### Backend
| Technology | Role |
|---|---|
| **Node.js & Express** | RESTful API server and route handlers |
| **TypeScript & tsx** | Strict typing and fast development runtime |
| **MongoDB & Mongoose** | Document database with indexed schemas and fractional positioning |
| **Socket.io Server** | WebSocket rooms (`board:<id>`, `user:<id>`), presence, and event broadcast |
| **JWT & bcryptjs** | Stateless authentication and secure password hashing |
| **Zod** | Request validation schemas for body and query payloads |
| **Cloudinary & Multer** | Cloud media storage with memory buffer handling |

---

## 📁 Project Structure

```
.
├── client/                               # Frontend React 19 Application
│   ├── src/
│   │   ├── api/                          # RTK Query API slices
│   │   │   ├── activityApi.ts            # Board activity logs
│   │   │   ├── authApi.ts                # Auth & user profile
│   │   │   ├── baseApi.ts                # RTK Query base configuration
│   │   │   ├── boardApi.ts               # Boards, columns, members, invitations
│   │   │   ├── commentApi.ts             # Task comments
│   │   │   ├── taskApi.ts                # Task CRUD & move operations
│   │   │   └── uploadApi.ts              # Image upload endpoints
│   │   ├── app/                          # Redux store & typed hooks (useAppDispatch, useAppSelector)
│   │   ├── components/                   # Shared UI components
│   │   │   ├── ConfirmDeleteModal.tsx    # Deletion safety dialog
│   │   │   ├── InvitePopupModal.tsx      # Quick invitation modal
│   │   │   ├── KeyboardShortcutsModal.tsx# Hotkey guide dialog (?)
│   │   │   ├── LeftSidebar.tsx           # Collapsible workspace navigation
│   │   │   ├── Navbar.tsx                # Header bar, workspace switcher & theme controls
│   │   │   ├── PendingInvitationsBanner.tsx # Top alert banner for board invites
│   │   │   ├── RichTextEditor.tsx        # TipTap description editor
│   │   │   └── ToastNotification.tsx     # Global socket-driven toast container
│   │   ├── features/
│   │   │   ├── auth/                     # LoginPage, RegisterPage, authSlice
│   │   │   ├── board/                    # BoardPage, BoardsListPage, JoinBoardPage, BoardHeader, FilterBar
│   │   │   ├── dashboard/                # DashboardPage, UpcomingDeadlines
│   │   │   ├── kanban/                   # KanbanBoard, KanbanColumn, TaskCard, TaskModal, TypingIndicator
│   │   │   ├── landing/                  # LandingPage, Hero, Pricing, Testimonials, Showcase
│   │   │   ├── notFound/                 # NotFoundPage (404)
│   │   │   ├── settings/                 # ProjectSettingsPage (WIP limits, archives, danger zone)
│   │   │   └── team/                     # TeamMembersPage
│   │   ├── routes/                       # AppRoutes & ProtectedRoute
│   │   ├── sockets/                      # Socket client initialization & useSocketEvents hook
│   │   ├── theme/                        # ThemeContext & ThemeSwitcher (5 themes)
│   │   └── utils/                        # columnTheming, toast, date helpers
│   ├── package.json
│   └── vite.config.ts                    # Vite dev proxy configuration
│
├── server/                               # Backend Node.js / Express Application
│   ├── src/
│   │   ├── config/                       # MongoDB connection, Cloudinary config & env parsing
│   │   ├── controllers/                  # REST controllers (auth, board, task, comment, notification, upload)
│   │   ├── middlewares/                  # Auth middleware, validation, error handler, Multer upload
│   │   ├── models/                       # Mongoose models (User, Board, Task, Comment, Invitation, Notification, Activity)
│   │   ├── routes/                       # Express router definitions
│   │   ├── services/                     # Business logic (activity, notification, task services)
│   │   ├── sockets/                      # Socket.io handlers (board, task, presence, typing)
│   │   ├── utils/                        # ApiError, ApiResponse, asyncHandler, idempotency helpers
│   │   ├── validators/                   # Zod validation schemas
│   │   ├── app.ts                        # Express application configuration
│   │   └── server.ts                     # HTTP & Socket.io server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── render.yaml                           # Render cloud deployment blueprint
├── FEATURE_LIST.md                       # Comprehensive feature breakdown
└── README.md                             # Project documentation
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** (or yarn / pnpm)
- **MongoDB**: Local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

### 1. Backend Setup

1. Navigate to the `server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file in the `server` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tasktrace

   # Authentication (JWT)
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d

   # Client CORS Origin (Vite dev server)
   CLIENT_URL=http://localhost:5173

   # Cloudinary Media Storage (Optional: falls back to base64 Data URI)
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_KEY=your_api_key
   CLOUDINARY_SECRET=your_api_secret
   ```

3. Start the backend in development mode:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a new terminal, navigate to the `client` directory, and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. *(Optional)* Create a `.env` file in `client` if you wish to override defaults:
   ```env
   # Defaults to "/api" (proxied via vite.config.ts to http://localhost:5000)
   VITE_API_URL=/api
   ```
   > **Note**: `vite.config.ts` automatically proxies both `/api` requests and `/socket.io` WebSockets to your backend server port, eliminating CORS issues during development.

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 📡 API & Socket Event Reference

### REST Endpoints Overview (`/api`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user & receive JWT |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/boards` | List boards user owns or belongs to |
| `POST` | `/api/boards` | Create a new board |
| `GET` | `/api/boards/:boardId` | Fetch board details |
| `PATCH` | `/api/boards/:boardId` | Update board title, description, visibility |
| `DELETE` | `/api/boards/:boardId` | Delete board |
| `GET` | `/api/boards/join-preview/:inviteCode` | Public board preview via invite code |
| `POST` | `/api/boards/join-code/:inviteCode` | Join board via share code |
| `GET` | `/api/boards/invitations/pending` | List pending invitations for current user |
| `POST` | `/api/boards/invitations/:id/respond` | Accept or decline invitation |
| `POST` | `/api/boards/:boardId/columns` | Add a new column |
| `PATCH` | `/api/boards/:boardId/columns/reorder` | Reorder column sequence |
| `PATCH` | `/api/boards/:boardId/columns/:columnId` | Rename column |
| `PATCH` | `/api/boards/:boardId/columns/:columnId/wip-limit` | Set column WIP limit |
| `DELETE` | `/api/boards/:boardId/columns/:columnId` | Delete column |
| `GET` | `/api/tasks/board/:boardId` | Fetch all tasks for a board |
| `POST` | `/api/tasks/board/:boardId/column/:columnId` | Create task in column |
| `PATCH` | `/api/tasks/:taskId` | Update task details (title, description, priority, etc.) |
| `PATCH` | `/api/tasks/:taskId/move` | Move task to column / position |
| `DELETE` | `/api/tasks/:taskId` | Delete task |
| `GET` | `/api/tasks/:taskId/comments` | Fetch task comments |
| `POST` | `/api/tasks/:taskId/comments` | Post comment on task |
| `POST` | `/api/upload` | Upload image to Cloudinary / memory fallback |
| `GET` | `/api/boards/dashboard/stats` | Fetch aggregate stats for dashboard |
| `GET` | `/api/boards/:boardId/activity` | Fetch board activity history |

### Real-Time Socket Events

| Event | Direction | Description |
|---|---|---|
| `board:join` / `board:leave` | Client ➔ Server | Join or leave board socket room |
| `task:created` | Server ➔ Room | Broadcast new task added to board |
| `task:moved` | Server ➔ Room | Broadcast task movement / reorder |
| `task:updated` | Server ➔ Room | Broadcast task field modifications |
| `task:deleted` | Server ➔ Room | Broadcast task deletion |
| `task:drag:started` / `task:drag:ended` | Bidirectional | Real-time collaborator drag indicators |
| `comment:created` | Server ➔ Room | Live comment notification |
| `typing:start` / `typing:stop` | Bidirectional | Real-time typing indicator broadcast |
| `presence:update` | Server ➔ Room | Active online collaborator status |
| `notification:new` | Server ➔ User Room | Dispatched to `user:<id>` for invitations & mentions |

---

## ⌨️ Keyboard Shortcuts

Press **`?`** anywhere in the board to bring up the shortcuts modal:

| Shortcut | Action |
|---|---|
| `/` | Quick-focus search field |
| `M` | Toggle "My Tasks" filter |
| `Esc` | Clear search query / discard changes / close modal |
| `Cmd/Ctrl + Enter` | Save task changes in modal or editor |
| `Enter` | Confirm action in dialogs |
| `?` | Open / close keyboard shortcuts guide |

---

## 🧪 Build & Lint Commands

### Frontend Type Check & Build
```bash
cd client
npm run build
```

### Backend Type Check & Build
```bash
cd server
npm run typecheck
npm run build
```

### Frontend Linting
```bash
cd client
npm run lint
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

# Real-Time Collaborative Kanban Board — Complete Feature List

Comprehensive document listing all features, technical architecture, API endpoints, and real-time capabilities implemented in this application.

---

## 🛠️ 1. Tech Stack Architecture

| Layer | Choice | Key Role |
|---|---|---|
| **Frontend Build** | React 19 + Vite + TypeScript | Fast dev server, strict static typing, HMR |
| **State & Fetching** | Redux Toolkit + RTK Query | Optimistic updates, cache tags, socket cache patching |
| **Realtime Engine** | Socket.io (Client + Server) | Room isolation (`board:<id>`, `user:<id>`), bidirectional sync, notifications |
| **Drag & Drop** | `@dnd-kit/core` (`PointerSensor`, `TouchSensor`, `KeyboardSensor`) + `@dnd-kit/sortable` | Multi-column task dragging, Touch drag-and-drop on mobile, fractional positioning & column reordering |
| **Mobile Responsiveness** | Tailwind CSS v4 + Responsive Breakpoints + Touch Snap | Native horizontal touch swiping (`snap-x`), mobile auto-collapsing sidebar & responsive modal adaptation |
| **Rich Text Description** | `@tiptap/react` + StarterKit + Mention + Image | Formattable descriptions with inline Cloudinary images & `@member` tagging |
| **File Storage** | Cloudinary SDK v2 + Multer Middleware | Secure image uploads with base64 Data URI fallback for development |
| **Notifications** | Header Notification Dropdown + Realtime Sockets | Real-time bell notifications for Board Invites, Share Link Joins & `@Task` Mentions |
| **Animations** | Framer Motion | Smooth layout shifts, drag overlays, modal spring transitions |
| **Styling & Theme** | Tailwind CSS v4 + IBM Plex / Space Grotesk | High-contrast design system with paper surfaces & 5 customizable theme tokens |
| **Backend API** | Node.js + Express + TypeScript | RESTful controller-service architecture with Zod validation |
| **Database** | MongoDB + Mongoose | Fractional position indexing, notification models, indexes |
| **Authentication** | JWT (Bearer token) + bcryptjs | Stateless authorization for REST & Socket.io handshake middleware |

---

## 🚀 2. Comprehensive Feature Breakdown

### 📱 100% Mobile Phone Responsiveness & Touch Controls
- **Touch-Friendly Drag & Drop (`TouchSensor`)**: Long-press activation (`delay: 250ms`, `tolerance: 5px`) allows smooth vertical page scrolling on phones while enabling touch drag-and-drop for task cards and columns!
- **Touch Horizontal Scroll Snap (`snap-x`)**: Columns container supports fluid, native horizontal swiping on mobile touchscreens (`w-[85vw] sm:w-80`).
- **Mobile Left Sidebar Overlay**: Left Sidebar automatically collapses into a compact drawer on narrow screens (`< 768px`) to maximize board viewport space on mobile devices.
- **Mobile Responsive Modals & Drawers**: `TaskModal`, `BoardMembersModal`, `FilterBar`, and `ActivityTimeline` automatically scale to mobile viewports (`320px–480px`) with stacked inputs and responsive padding (`p-3 sm:p-6`).

### ⌨️ Real-Time Typing Indicators (`TypingIndicator.tsx`)
- **Debounced Auto-Clearing Timer**: Automatically dispatches `typing:start` on keystrokes in Task Title, TipTap Description, or Comment input fields. Pausing for 2.5 seconds automatically dispatches `typing:stop`.
- **Live Indicator Badge**: Displays animated typing indicator chips (`"Alice is typing..."`) on both `TaskCard` and `TaskModal` for all active room collaborators.

### 🎯 Priority Selection & Real-Time Sync
- **4-Level Priority System**: Tasks support `Low`, `Medium`, `High`, and `Critical` priorities with high-contrast color badges (`prio-low`, `prio-medium`, `prio-high`, `prio-critical`).
- **Critical Glow Styling**: Critical tasks feature pulsing borders and priority indicators.
- **Instant RTK Query & Socket Sync**: Priority edits save reliably and update across all connected collaborator views in real time.

### 📊 Column Management & Drag-and-Drop Column Reordering
- **Add New Columns**: Dedicated "Add Column" card at the right end of the board allowing users to create custom workflow columns (`In Review`, `QA`, etc.).
- **Inline Column Renaming**: Double-click or click the edit icon on any column header to rename columns on the fly.
- **Delete Columns**: Delete column control (with confirmation prompt) removing column and associated tasks.
- **Drag-and-Drop Column Reordering**: Grab column grip handle to drag and rearrange column sequence on the board (`reorderColumns` mutation & real-time socket broadcast).

### 🎛️ Real-Time Task Sequence Reordering via Drag
- **Multi-Column Drag & Drop**: Drag tasks within the same column or across columns seamlessly (`@dnd-kit/sortable`).
- **Fractional Position Algorithm**: High-performance midpoint calculation `(prevPos + nextPos) / 2` without re-indexing all column tasks in MongoDB.
- **Cross-Tab Real-Time Sync**: Socket.io event broadcasting (`task:moved`, `task:created`, `task:updated`, `task:deleted`) keeps all connected browser tabs synchronized instantly.

### 🔗 Shareable Board Links & Join Page (`/boards/join/:inviteCode`)
- **Auto-Generated Board Invite Code**: Unique `inviteCode` generated for each board (`inv_xxxxxx`).
- **1-Click Copy Link**: Share button in board header and member modal with instant "Copy Link" feedback.
- **Dedicated Join Workspace Page (`JoinBoardPage.tsx`)**:
  - Route `/boards/join/:inviteCode`.
  - Preview card displaying board name, description, owner avatar, and member count.
  - Prominent **"Join Workspace Board"** action button.
- **Board Owner Join Notification**: When a new member joins via share link, the board owner receives a real-time header bell notification (`User X joined board Y via share link`).
- **Regenerate & Revoke Link**: Board owners can regenerate share codes to invalidate old links.

### 🚫 Owner Kick / Remove Member Controls
- **Kick Member Action**: Board owners have a "Kick Member" control next to collaborators in `BoardMembersModal.tsx`.
- **Real-Time Removal**: Kicking a member immediately removes them from `board.members`, logs `MEMBER_REMOVED` activity, and emits `board:member-removed` socket event.

### 🔔 Real-Time Live Sync & Toast Notification System (`ToastNotification.tsx`)
- **Real-Time Notification Delivery**: Listens to socket events for instantaneous real-time sync across connected collaborators.
- **Board Invitation Notifications**: Features direct alerts and invitation response banners in `PendingInvitationsBanner.tsx`.
- **Toast Alerts**: Instant visual toast alerts for task updates, status changes, assignments, and board operations.

### 🧭 Collapsible Left Sidebar & Board Navigation (`LeftSidebar.tsx`)
- **Real-Time Board Search**: Instant search input filtering workspace boards by title/name.
- **Board Switching**: Quick-switch scrollable list highlighting the active board.
- **Compact & Expanded Modes**: Collapsible sidebar toggle for expanding or minimizing navigation.
- **Inline Board Creator**: Quick-trigger modal for creating new boards directly from the sidebar.

### 📋 Board Workspace & Member Management
- **Workspace Dashboard (`/boards`)**: Grid view of all user-owned and collaborative boards.
- **Create Board Modal**: Quick creation flow with custom board title and description.
- **Default Columns Setup**: Auto-initializes new boards with standard workflow columns (`To Do`, `In Progress`, `Done`).
- **Board Members Modal (`BoardMembersModal.tsx`)**:
  - **Active Members List**: Displays all board collaborators, roles (`Owner` vs `Member`), live online indicators, and owner kick options.
  - **Share Link Tab**: Displays full shareable URL with 1-click copy & regenerate controls.
  - **Invitation History Tab**: Tracks sent invitation requests with status tags (`Pending`, `Accepted`, `Declined`).

### ✍️ TipTap Rich Text Description & Cloudinary Image Attachments (`RichTextEditor.tsx`)
- **Formattable Description Editor**: Powered by TipTap with Bold, Italic, Strikethrough, Headings, Bullet Lists, and Numbered Lists.
- **Cloudinary Image Upload Middleware**: Integrated image upload button in the description toolbar that uploads images to Cloudinary (via `POST /api/upload`) and embeds them inline.
- **@Member Tagging**: `@` mention suggestion menu allowing users to tag any board collaborator (`@Member Name`) inside task descriptions.

---

## 📡 3. API & Socket Event Reference

### REST Endpoints (`/api`)
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user
- `GET /api/auth/me` — Current user profile
- `GET /api/boards` — Fetch user's boards
- `GET /api/boards/:boardId` — Fetch board details
- `POST /api/boards` — Create board
- `POST /api/boards/:boardId/columns` — Add new column
- `PATCH /api/boards/:boardId/columns/reorder` — Reorder columns sequence
- `PATCH /api/boards/:boardId/columns/:columnId` — Rename column
- `DELETE /api/boards/:boardId/columns/:columnId` — Delete column
- `GET /api/boards/join-preview/:inviteCode` — Fetch board preview before joining via share link
- `POST /api/boards/join-code/:inviteCode` — Join board via share link
- `GET /api/boards/:boardId/invite-code` — Retrieve/generate share invite code
- `POST /api/boards/:boardId/regenerate-invite-code` — Regenerate share link
- `POST /api/boards/:boardId/members` — Send invitation request to email
- `DELETE /api/boards/:boardId/members/:userId` — Kick/remove member (Owner only)
- `GET /api/boards/:boardId/invitations` — Fetch board's outgoing invitations
- `GET /api/boards/invitations/pending` — Fetch logged-in user's pending invitations
- `POST /api/boards/invitations/:invitationId/respond` — Accept or decline invitation
- `GET /api/notifications` — Fetch user's notifications & unread count
- `PATCH /api/notifications/read-all` — Mark all notifications as read
- `PATCH /api/notifications/:id/read` — Mark single notification as read
- `GET /api/boards/:boardId/tasks` — Fetch board tasks
- `POST /api/boards/:boardId/columns/:columnId/tasks` — Create task
- `PATCH /api/tasks/:taskId` — Update task details
- `PATCH /api/tasks/:taskId/move` — Move task column/position (drag & drop reordering)
- `DELETE /api/tasks/:taskId` — Delete task
- `GET /api/tasks/:taskId/comments` — Fetch task comments
- `POST /api/tasks/:taskId/comments` — Create comment
- `GET /api/boards/:boardId/activity` — Fetch activity log
- `POST /api/upload` — Upload image file to Cloudinary (or local base64 fallback)

### Socket.io Events
- `board:join` / `board:leave` — Join/leave board room
- `column:added` / `column:renamed` / `column:reordered` / `column:deleted` — Column real-time broadcasts
- `notification:new` — Emitted to `user:<userId>` when receiving board invites, share link joins, or task mentions
- `task:created` / `task:moved` / `task:updated` / `task:deleted` — Task mutation broadcasts
- `comment:created` — Live comment broadcast
- `typing:start` / `typing:stop` / `typing:update` — Real-time typing indicators
- `invite:sent` / `board:member-added` / `board:member-removed` — Member and invitation real-time events

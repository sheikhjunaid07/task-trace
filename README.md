# 🚀 TaskTrace — Real-Time Collaborative Kanban Board

A modern, high-performance, real-time collaborative Kanban application built with **React 19**, **Vite**, **TypeScript**, **Redux Toolkit**, **Socket.io**, **Node.js**, **Express**, **MongoDB**, and **Cloudinary**.

---

## 🌟 Key Features

### 🎛️ Real-Time Kanban Workspace
- **Multi-Column Drag & Drop**: Drag tasks within the same column or across columns seamlessly (`@dnd-kit/sortable`).
- **Fractional Position Math**: Smooth, high-performance position calculation `(prevPos + nextPos) / 2` without re-indexing entire columns in MongoDB.
- **Dynamic Column Management**: Add custom columns (`In Review`, `QA`, etc.), rename columns inline (double-click/edit icon), delete columns, and drag-and-drop column sequence reordering (`reorderColumns`).
- **Cross-Tab Real-Time Sync**: Instant Socket.io event broadcasting (`task:created`, `task:moved`, `task:updated`, `task:deleted`, `column:reordered`) keeps all active collaborators synchronized across browser tabs.

### 📱 100% Mobile Phone Responsive & Touch Controls
- **Touch-Friendly Drag & Drop (`TouchSensor`)**: Long-press activation constraint (`delay: 250ms`, `tolerance: 5px`) allows smooth vertical page scrolling on phones while enabling touch drag-and-drop for task cards and columns.
- **Touch Horizontal Scroll Snap (`snap-x`)**: Fluid horizontal swiping across columns on mobile touchscreens (`w-[85vw] sm:w-80`).
- **Auto-Collapsing Left Sidebar**: Automatically collapses into a drawer on narrow viewports (`< 768px`) to maximize workspace on mobile screens.

### ✍️ TipTap Rich Text Description & Cloudinary Image Uploads
- **Formattable Text Editor**: Powered by `@tiptap/react` with Bold, Italic, Strikethrough, Headings, Bullet Lists, and Numbered Lists.
- **Cloudinary Image Upload Middleware**: Integrated image upload button in the toolbar that streams images to Cloudinary (via `POST /api/upload`) and embeds them inline.
- **@Member Tagging**: `@` mention suggestion menu allowing users to tag any board collaborator (`@Member Name`) inside task descriptions.

### ⌨️ Real-Time Typing Indicators
- **Debounced Auto-Clearing Timer**: Dispatches `typing:start` on keystrokes in Task Title, TipTap Description, or Comment input fields with a 2.5-second auto-clear timer.
- **Live Indicator Badge**: Displays animated typing indicator chips (`"Alice is typing..."`) on both `TaskCard` and `TaskModal` for all active room collaborators.

### 🔔 Header Notification System
- **Real-Time Notification Bell**: Animated bell dropdown in `Navbar` displaying unread counters.
- **Board Invitation Notifications**: Features direct **Accept** and **Decline** action buttons right inside the dropdown.
- **Task `@Member` Mention Notifications**: Clicking a mention notification marks it read, navigates to the board, and automatically opens the target task modal.

### 🔗 Shareable Board Links & Owner Join Controls
- **Unique Board Share Code**: Unique `inviteCode` per board (`http://localhost:5173/boards/join/inv_xxxxxx`).
- **Dedicated Join Workspace Page (`JoinBoardPage.tsx`)**: Preview card displaying board details, owner avatar, and team size before joining.
- **Board Owner Join Notification**: Notifies the board owner in real-time when a member joins via a share link.
- **Owner Kick Member Controls**: Board owners can kick/remove members directly from `BoardMembersModal.tsx`.

---

## 🛠️ Tech Stack Architecture

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **State & Fetching**: Redux Toolkit + RTK Query
- **Real-time Engine**: Socket.io-client
- **Drag & Drop**: `@dnd-kit/core` (`PointerSensor`, `TouchSensor`, `KeyboardSensor`) + `@dnd-kit/sortable`
- **Rich Text Editor**: `@tiptap/react` + StarterKit + Mention + ImageExtension
- **Styling & Icons**: Tailwind CSS v4 + Lucide React + Framer Motion

### Backend
- **Runtime & Language**: Node.js + Express + TypeScript
- **Database & ORM**: MongoDB Atlas + Mongoose
- **Real-time WebSockets**: Socket.io Server
- **File Storage**: Cloudinary SDK v2 + Multer memory storage
- **Auth & Validation**: JWT + bcryptjs + Zod validation schemas

---

## 📁 Project Structure

```
.
├── client/                     # React 19 Frontend App
│   ├── src/
│   │   ├── api/                # RTK Query APIs (boardApi, taskApi, commentApi, uploadApi)
│   │   ├── app/                # Redux store & custom hooks
│   │   ├── components/         # Global components (Navbar, LeftSidebar, RichTextEditor, ToastNotification)
│   │   ├── features/
│   │   │   ├── auth/           # Login & Register views
│   │   │   ├── board/          # Board details, header, filter bar, members modal, analytics
│   │   │   ├── kanban/         # Kanban board, columns, task cards, task modal, comments, typing indicator
│   │   │   └── landing/        # TaskTrace landing page
│   │   ├── routes/             # AppRoutes & ProtectedRoute wrapper
│   │   └── sockets/            # Socket.io connection & useSocketEvents hook
│   └── vite.config.ts
│
├── server/                     # Node.js + Express Backend App
│   ├── src/
│   │   ├── config/             # MongoDB db connection & Cloudinary setup
│   │   ├── controllers/        # REST Controllers (auth, board, task, comment, notification, upload)
│   │   ├── middlewares/        # Authentication, Error handling, Multer upload & Zod validation
│   │   ├── models/             # Mongoose schemas (User, Board, Task, Comment, Invitation, Notification)
│   │   ├── routes/             # Express API routes
│   │   ├── sockets/            # Socket.io room handlers (board, task, presence, typing)
│   │   └── validators/         # Zod input schemas
│   └── package.json
│
├── FEATURE_LIST.md             # Up-to-date detailed feature documentation
└── README.md                   # Project documentation
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **MongoDB Database**: Local MongoDB instance or MongoDB Atlas connection URI

---

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/kanban

# Auth (JWT)
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Client URL (CORS & Sockets)
CLIENT_URL=http://localhost:5173

# Cloudinary Storage
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret
```

Start the backend server in development mode:

```bash
npm run dev
```

---

### 2. Frontend Setup

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 🔑 Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `PORT` | Backend server port (e.g. `5000`) | Yes |
| `MONGODB_URI` | MongoDB Atlas / Local Connection URI | Yes |
| `JWT_SECRET` | Secret key for signing JWT tokens | Yes |
| `CLIENT_URL` | Allowed CORS origin (e.g. `http://localhost:5173`) | Yes |
| `CLOUDINARY_NAME` | Cloudinary account Cloud Name | Optional (fallback to Data URI) |
| `CLOUDINARY_KEY` | Cloudinary API Key | Optional |
| `CLOUDINARY_SECRET` | Cloudinary API Secret | Optional |

---

## 🧪 Build & Verification Commands

### Frontend Production Build
```bash
cd client
npm run build
```

### Backend Type Check & Build
```bash
cd server
npm run build
```

---

## 📄 License
Distributed under the MIT License.

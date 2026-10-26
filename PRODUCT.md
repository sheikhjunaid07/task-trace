# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Solo developers, freelancers, and independent builders who want a distraction-free, instant-sync personal task board to organize their daily work, client deliverables, and coding sprints without administrative overhead or lag.

## Product Purpose
TaskTrace provides a zero-friction, zero-refresh Kanban workspace where task creation, movement, and updates feel immediate and effortless. Success means never waiting for a page reload, never losing update ordering, and staying in a focused flow state with an interface that responds instantly to every interaction.

## Positioning
Unlike bloated project management suites that impose multi-second load times and complex corporate hierarchies, TaskTrace delivers instant optimistic interactions backed by Socket.io live synchronization, conflict-free fractional positioning math, and clean touch-friendly drag-and-drop. It combines the lightness and responsiveness of a local note with the multiplayer capability of a live cloud board.

## Operating Context
- Environments: Desktop browsers during focused deep work; mobile touchscreens for quick task logging, status updates, and column checking on the go.
- Workflows: Rapid task creation, fluid drag-and-drop column transitions, rich-text task notes (TipTap), tagging collaborators (@mentions), and real-time state synchronization across devices and tabs without manual refreshes.

## Capabilities and Constraints
- Multi-column Kanban board with fractional position mathematics `(prevPos + nextPos) / 2` for lightweight reordering.
- Dynamic column management (custom columns, inline renaming, drag-and-drop column reordering).
- Live real-time sync via WebSockets (Socket.io) across tabs and active sessions.
- Rich text task descriptions powered by TipTap with image attachments (Cloudinary) and @member tagging.
- Real-time typing indicators ("User is typing...") and active presence tracking.
- Notification center with shareable board invite codes and join controls.
- Technical constraint: Full-stack Node.js/Express + MongoDB API with React 19 + TypeScript + Vite + Tailwind CSS v4 frontend.
- Undecided product facts: Soft vs. hard delete for removed tasks; public view-only sharing mode for client review; custom tagging/label taxonomy.

## Brand Commitments
- Name: TaskTrace
- Voice & Tone: Crisp, distraction-free, modern, fast, and calm.
- Affordances: Responsive optimistic feedback, clear visual hierarchy, subtle ambient indicators (green presence dot, live connection chip).

## Evidence on Hand
- Full working implementation in `/client` (React 19, Tailwind CSS v4, Redux Toolkit, TipTap, dnd-kit) and `/server` (Node.js, Express, MongoDB, Socket.io).
- Product Requirements Document: [02-PRD.md](file:///home/junaid/Desktop/Universal/Kanban-Board-local/02-PRD.md)
- Software Requirements Specification: [01-SRS.md](file:///home/junaid/Desktop/Universal/Kanban-Board-local/01-SRS.md)
- Architecture Specification: [04-Architecture.md](file:///home/junaid/Desktop/Universal/Kanban-Board-local/04-Architecture.md)
- Feature documentation: [FEATURE_LIST.md](file:///home/junaid/Desktop/Universal/Kanban-Board-local/FEATURE_LIST.md)
- Incumbent Design draft: [05-Design.md](file:///home/junaid/Desktop/Universal/Kanban-Board-local/05-Design.md)
- Absences: No external marketing testimonials or customer case studies currently exist.

## Product Principles
1. **Zero-Refresh Immediacy**: Every action gives instant optimistic visual feedback and syncs seamlessly without manual page refreshes.
2. **Distraction-Free Focus**: The interface stays out of the way; tasks and boards are clear, legible, and frictionless.
3. **Safe Concurrency & Order Integrity**: Concurrency is handled gracefully with fractional positioning and non-destructive conflict resolution.
4. **Fluid Across Viewports**: Smooth interaction ergonomics across desktop pointer and mobile touch gestures (touch sensor drag, scroll snap).

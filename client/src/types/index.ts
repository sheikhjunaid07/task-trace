export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface Column {
  _id: string;
  id?: string;
  name: string;
  color?: string;
  position?: number;
  order?: number;
  wipLimit?: number | null;
  isArchived?: boolean;
}

export interface BoardLabel {
  _id?: string;
  name: string;
  color: string;
}

export interface MemberRole {
  user: User | string;
  role: 'admin' | 'member' | 'viewer';
}

export interface BoardMember {
  _id?: string;
  user: User | string;
  role: 'owner' | 'admin' | 'member';
  joinedAt?: string;
}

export interface Board {
  _id: string;
  id?: string;
  title: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  avatarUrl?: string;
  visibility?: 'public' | 'private';
  owner: User | string;
  members: User[];
  memberRoles?: MemberRole[];
  labels?: BoardLabel[];
  columns: Column[];
  inviteCode?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invitation {
  _id: string;
  board: Board;
  inviter: User;
  invitee: User;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType =
  | 'BOARD_INVITATION'
  | 'TASK_MENTION'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'TASK_CREATED'
  | 'TASK_MOVED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'PROJECT_DELETED'
  | 'MEMBER_JOINED'
  | 'GENERAL';

export interface AppNotification {
  _id: string;
  recipient: string;
  sender: User;
  type: NotificationType;
  title: string;
  message: string;
  board?: Board;
  task?: Task;
  invitation?: Invitation;
  isRead: boolean;
  createdAt: string;
}

export interface Task {
  _id: string;
  id?: string;
  board: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
  version?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels?: string[];
  dueDate?: string | null;
  assignees?: User[];
  createdBy: User | string;
  commentCount?: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  id?: string;
  task: string;
  user: User;
  author?: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Activity {
  _id: string;
  id?: string;
  user: User;
  board: string;
  action?: string;
  type?: string;
  details?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface BoardFilterState {
  searchQuery: string;
  priorityFilter: 'all' | 'low' | 'medium' | 'high' | 'critical';
  assigneeFilter: string; // 'all' | userId
  activeTaskId: string | null;
  isActivityOpen: boolean;
  isAnalyticsOpen: boolean;
  selectedProjectId?: string | null;
}

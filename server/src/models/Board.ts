import mongoose, { Schema, Types } from "mongoose";

export interface IColumn {
  _id?: Types.ObjectId;
  name: string;
  order?: number;
  wipLimit?: number | null;
  color?: string;
  isArchived?: boolean;
}

export interface ILabel {
  _id?: Types.ObjectId;
  name: string;
  color: string;
}

export interface IMemberRole {
  user: Types.ObjectId;
  role: "admin" | "member" | "viewer";
}

export interface IBoard {
  name: string;
  description?: string;
  color?: string;
  avatarUrl?: string;
  visibility?: "public" | "private";
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  memberRoles?: IMemberRole[];
  labels?: Types.DocumentArray<ILabel> | ILabel[];
  columns: Types.DocumentArray<IColumn>;
  inviteCode?: string;
  isArchived: boolean;
}

const columnSchema = new Schema<IColumn>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    order: { type: Number, required: true, default: 0 },
    wipLimit: { type: Number, default: null },
    color: { type: String, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { _id: true }
);

const labelSchema = new Schema<ILabel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    color: { type: String, required: true, trim: true, maxlength: 20 },
  },
  { _id: true }
);

const memberRoleSchema = new Schema<IMemberRole>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member", "viewer"], default: "member" },
  },
  { _id: false }
);

const boardSchema = new Schema<IBoard>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    color: { type: String, default: "#8b5cf6" },
    avatarUrl: { type: String, default: null },
    visibility: { type: String, enum: ["public", "private"], default: "private" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    memberRoles: { type: [memberRoleSchema], default: [] },
    labels: {
      type: [labelSchema],
      default: [
        { name: "Bug", color: "#ef4444" },
        { name: "Feature", color: "#3b82f6" },
        { name: "Design", color: "#8b5cf6" },
        { name: "DevOps", color: "#10b981" },
        { name: "Documentation", color: "#f59e0b" },
      ],
    },
    columns: { type: [columnSchema], default: [] },
    inviteCode: { type: String, unique: true, sparse: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Board = mongoose.model<IBoard>("Board", boardSchema);
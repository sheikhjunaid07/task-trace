import mongoose, { Schema, Types } from "mongoose";

export interface ITask {
  _id?: Types.ObjectId;
  board: Types.ObjectId;
  columnId: Types.ObjectId;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  labels: string[];
  dueDate?: Date | null;
  assignees: Types.ObjectId[];
  position: number;
  version: number;
  createdBy: Types.ObjectId;
  isArchived?: boolean;
}

const taskSchema = new Schema<ITask>(
  {
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    columnId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    labels: { type: [String], default: [] },
    dueDate: { type: Date, default: null },
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    position: { type: Number, required: true, default: 0 },
    version: { type: Number, required: true, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ board: 1, columnId: 1, position: 1, _id: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
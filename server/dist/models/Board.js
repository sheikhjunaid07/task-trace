"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const columnSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 50 },
    order: { type: Number, required: true, default: 0 },
    wipLimit: { type: Number, default: null },
    color: { type: String, default: null },
    isArchived: { type: Boolean, default: false },
}, { _id: true });
const labelSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 40 },
    color: { type: String, required: true, trim: true, maxlength: 20 },
}, { _id: true });
const memberRoleSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member", "viewer"], default: "member" },
}, { _id: false });
const boardSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    color: { type: String, default: "#8b5cf6" },
    avatarUrl: { type: String, default: null },
    visibility: { type: String, enum: ["public", "private"], default: "private" },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
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
}, { timestamps: true });
exports.Board = mongoose_1.default.model("Board", boardSchema);
//# sourceMappingURL=Board.js.map
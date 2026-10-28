"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondInvitationSchema = exports.addMemberSchema = exports.renameColumnSchema = exports.addColumnSchema = exports.setWipLimitSchema = exports.transferOwnershipSchema = exports.updateMemberRoleSchema = exports.updateBoardSchema = exports.createBoardSchema = void 0;
const zod_1 = require("zod");
exports.createBoardSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(100).optional(),
    title: zod_1.z.string().trim().min(1).max(100).optional(),
    description: zod_1.z.string().trim().max(500).optional(),
})
    .refine((data) => data.name || data.title, {
    message: "Board name or title is required",
    path: ["name"],
});
exports.updateBoardSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(100).optional(),
    title: zod_1.z.string().trim().min(1).max(100).optional(),
    description: zod_1.z.string().trim().max(500).optional(),
    color: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().nullable().optional(),
    visibility: zod_1.z.enum(["public", "private"]).optional(),
    labels: zod_1.z
        .array(zod_1.z.object({
        _id: zod_1.z.string().optional(),
        name: zod_1.z.string().trim().min(1).max(40),
        color: zod_1.z.string().trim().min(1).max(20),
    }))
        .optional(),
}).passthrough();
exports.updateMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["admin", "member", "viewer"]),
});
exports.transferOwnershipSchema = zod_1.z.object({
    newOwnerId: zod_1.z.string().min(1, "New owner user ID is required"),
});
exports.setWipLimitSchema = zod_1.z.object({
    wipLimit: zod_1.z.number().nullable().optional(),
});
exports.addColumnSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Column name is required").max(50),
});
exports.renameColumnSchema = exports.addColumnSchema;
exports.addMemberSchema = zod_1.z
    .object({
    userId: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Invalid email format").optional(),
})
    .refine((data) => data.userId || data.email, {
    message: "Either userId or email is required",
    path: ["email"],
});
exports.respondInvitationSchema = zod_1.z.object({
    action: zod_1.z.enum(["accept", "decline"], {
        required_error: "Action must be accept or decline",
    }),
});
//# sourceMappingURL=board.validator.js.map
import { z } from "zod";

export const createBoardSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    title: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.name || data.title, {
    message: "Board name or title is required",
    path: ["name"],
  });

export const updateBoardSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  labels: z
    .array(
      z.object({
        _id: z.string().optional(),
        name: z.string().trim().min(1).max(40),
        color: z.string().trim().min(1).max(20),
      })
    )
    .optional(),
}).passthrough();

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "New owner user ID is required"),
});

export const setWipLimitSchema = z.object({
  wipLimit: z.number().nullable().optional(),
});

export const addColumnSchema = z.object({
  name: z.string().trim().min(1, "Column name is required").max(50),
});

export const renameColumnSchema = addColumnSchema;

export const addMemberSchema = z
  .object({
    userId: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email is required",
    path: ["email"],
  });

export const respondInvitationSchema = z.object({
  action: z.enum(["accept", "decline"], {
    required_error: "Action must be accept or decline",
  }),
});
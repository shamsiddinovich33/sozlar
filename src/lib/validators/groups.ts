import { z } from "zod";

import { GROUP_NAME_MAX } from "@/lib/groups";
import { setIdSchema } from "@/lib/validators/set";

export const groupIdSchema = setIdSchema;

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, "Guruh nomini kiriting")
  .max(GROUP_NAME_MAX, `Guruh nomi ${GROUP_NAME_MAX} belgidan oshmasligi kerak`);

/** Invite tokens are 32 random bytes in base64url (43 characters). */
export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,64}$/);

export const addGroupSetsSchema = z.object({
  groupId: groupIdSchema,
  setIds: z.array(setIdSchema).min(1, "Kamida bitta to'plam tanlang").max(50),
});

export const groupMemberSchema = z.object({ groupId: groupIdSchema, userId: setIdSchema });
export const groupSetSchema = z.object({ groupId: groupIdSchema, setId: setIdSchema });

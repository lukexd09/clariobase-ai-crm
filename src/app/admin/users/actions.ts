"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createControlledUser,
  disableUser,
  reactivateUser,
  revokeUserSession,
  revokeUserSessions,
  setUserPassword,
  updateBasicIdentity,
  type AdminGatewayResult
} from "@/lib/user-admin-gateway";

const identitySchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  name: z.string().trim().min(1).max(120)
});

const createSchema = identitySchema.omit({ userId: true }).extend({
  password: z.string().min(12).max(128)
});

const userIdSchema = z.object({ userId: z.string().min(1) });
const sessionSchema = z.object({ sessionId: z.string().min(1) });
const passwordSchema = userIdSchema.extend({ newPassword: z.string().min(12).max(128) });

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function finish(result: AdminGatewayResult<unknown>, successMessage: string): never {
  const notice = result.ok ? successMessage : result.message;
  const tone = result.ok ? "success" : "error";
  if (result.ok) revalidatePath("/admin/users");
  redirect(`/admin/users?tone=${tone}&notice=${encodeURIComponent(notice)}`);
}

export async function createUserAction(formData: FormData) {
  const input = createSchema.safeParse({
    email: value(formData, "email"),
    name: value(formData, "name"),
    password: value(formData, "password")
  });
  if (!input.success) redirect("/admin/users?tone=error&notice=Check%20the%20new%20user%20fields");
  finish(await createControlledUser({ headers: await headers() }, input.data), "User created");
}

export async function updateIdentityAction(formData: FormData) {
  const input = identitySchema.safeParse({
    userId: value(formData, "userId"),
    email: value(formData, "email"),
    name: value(formData, "name")
  });
  if (!input.success) redirect("/admin/users?tone=error&notice=Check%20the%20identity%20fields");
  finish(await updateBasicIdentity({ headers: await headers() }, input.data), "Identity updated");
}

export async function disableUserAction(formData: FormData) {
  const input = userIdSchema.safeParse({ userId: value(formData, "userId") });
  if (!input.success) redirect("/admin/users?tone=error&notice=Invalid%20user");
  finish(await disableUser({ headers: await headers() }, input.data), "User disabled and sessions revoked");
}

export async function reactivateUserAction(formData: FormData) {
  const input = userIdSchema.safeParse({ userId: value(formData, "userId") });
  if (!input.success) redirect("/admin/users?tone=error&notice=Invalid%20user");
  finish(await reactivateUser({ headers: await headers() }, input.data.userId), "User reactivated");
}

export async function resetPasswordAction(formData: FormData) {
  const input = passwordSchema.safeParse({
    userId: value(formData, "userId"),
    newPassword: value(formData, "newPassword")
  });
  if (!input.success) redirect("/admin/users?tone=error&notice=Password%20must%20be%2012-128%20characters");
  finish(await setUserPassword({ headers: await headers() }, input.data), "Password reset and sessions revoked");
}

export async function revokeAllSessionsAction(formData: FormData) {
  const input = userIdSchema.safeParse({ userId: value(formData, "userId") });
  if (!input.success) redirect("/admin/users?tone=error&notice=Invalid%20user");
  finish(await revokeUserSessions({ headers: await headers() }, input.data.userId), "All user sessions revoked");
}

export async function revokeSessionAction(formData: FormData) {
  const input = sessionSchema.safeParse({ sessionId: value(formData, "sessionId") });
  if (!input.success) redirect("/admin/users?tone=error&notice=Invalid%20session");
  finish(await revokeUserSession({ headers: await headers() }, input.data.sessionId), "Session revoked");
}

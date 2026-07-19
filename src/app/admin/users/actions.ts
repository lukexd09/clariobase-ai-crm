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
import {
  type AdminUserNoticeCode,
  isAdminUserNoticeCode
} from "@/lib/admin-user-notices";

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

function finish(result: AdminGatewayResult<unknown>, successCode: AdminUserNoticeCode): never {
  const noticeCode = result.ok ? successCode : isAdminUserNoticeCode(result.code) ? result.code : "admin_operation_failed";
  const tone = result.ok ? "success" : "error";
  if (result.ok) revalidatePath("/admin/users");
  redirect(`/admin/users?tone=${tone}&noticeCode=${encodeURIComponent(noticeCode)}`);
}

export async function createUserAction(formData: FormData) {
  const input = createSchema.safeParse({
    email: value(formData, "email"),
    name: value(formData, "name"),
    password: value(formData, "password")
  });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_new_user_fields");
  finish(await createControlledUser({ headers: await headers() }, input.data), "user_created");
}

export async function updateIdentityAction(formData: FormData) {
  const input = identitySchema.safeParse({
    userId: value(formData, "userId"),
    email: value(formData, "email"),
    name: value(formData, "name")
  });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_identity_fields");
  finish(await updateBasicIdentity({ headers: await headers() }, input.data), "identity_updated");
}

export async function disableUserAction(formData: FormData) {
  const input = userIdSchema.safeParse({ userId: value(formData, "userId") });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_user");
  finish(await disableUser({ headers: await headers() }, input.data), "user_disabled");
}

export async function reactivateUserAction(formData: FormData) {
  const input = userIdSchema.safeParse({ userId: value(formData, "userId") });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_user");
  finish(await reactivateUser({ headers: await headers() }, input.data.userId), "user_reactivated");
}

export async function resetPasswordAction(formData: FormData) {
  const input = passwordSchema.safeParse({
    userId: value(formData, "userId"),
    newPassword: value(formData, "newPassword")
  });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_password_length");
  finish(await setUserPassword({ headers: await headers() }, input.data), "password_reset");
}

export async function revokeAllSessionsAction(formData: FormData) {
  const input = userIdSchema.safeParse({ userId: value(formData, "userId") });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_user");
  finish(await revokeUserSessions({ headers: await headers() }, input.data.userId), "all_sessions_revoked");
}

export async function revokeSessionAction(formData: FormData) {
  const input = sessionSchema.safeParse({ sessionId: value(formData, "sessionId") });
  if (!input.success) redirect("/admin/users?tone=error&noticeCode=invalid_session");
  finish(await revokeUserSession({ headers: await headers() }, input.data.sessionId), "session_revoked");
}

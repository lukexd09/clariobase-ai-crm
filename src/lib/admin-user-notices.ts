export const ADMIN_USER_NOTICE_MESSAGES = {
  user_created: "User created",
  identity_updated: "Identity updated",
  user_disabled: "User disabled and sessions revoked",
  user_reactivated: "User reactivated",
  password_reset: "Password reset and sessions revoked",
  all_sessions_revoked: "All user sessions revoked",
  session_revoked: "Session revoked",
  invalid_new_user_fields: "Check the new user fields",
  invalid_identity_fields: "Check the identity fields",
  invalid_user: "Invalid user",
  invalid_session: "Invalid session",
  invalid_password_length: "Password must be 12-128 characters",
  user_not_found: "User not found",
  session_not_found: "Session not found",
  self_lockout: "Administrators cannot perform that action on themselves",
  last_active_admin: "The last active administrator cannot be disabled",
  invalid_admin_user: "Authentication provider returned an invalid user",
  unauthorized: "Authentication required",
  forbidden: "Active administrator access required",
  admin_provider_error: "Administrator operation failed",
  admin_operation_failed: "Administrator operation failed"
} as const;

export type AdminUserNoticeCode = keyof typeof ADMIN_USER_NOTICE_MESSAGES;

export function isAdminUserNoticeCode(value: string | null | undefined): value is AdminUserNoticeCode {
  return typeof value === "string" && value in ADMIN_USER_NOTICE_MESSAGES;
}

export function resolveAdminUserNoticeMessage(code: string | null | undefined) {
  return isAdminUserNoticeCode(code) ? ADMIN_USER_NOTICE_MESSAGES[code] : ADMIN_USER_NOTICE_MESSAGES.admin_operation_failed;
}

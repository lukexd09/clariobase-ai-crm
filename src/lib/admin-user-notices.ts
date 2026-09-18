import type { TranslationKey } from "@/i18n/types";

export const ADMIN_USER_NOTICE_KEYS = {
  user_created: "notice.admin.user_created",
  identity_updated: "notice.admin.identity_updated",
  user_disabled: "notice.admin.user_disabled",
  user_reactivated: "notice.admin.user_reactivated",
  password_reset: "notice.admin.password_reset",
  all_sessions_revoked: "notice.admin.all_sessions_revoked",
  session_revoked: "notice.admin.session_revoked",
  invalid_new_user_fields: "notice.admin.invalid_new_user_fields",
  invalid_identity_fields: "notice.admin.invalid_identity_fields",
  invalid_user: "notice.admin.invalid_user",
  invalid_session: "notice.admin.invalid_session",
  invalid_password_length: "notice.admin.invalid_password_length",
  user_not_found: "notice.admin.user_not_found",
  session_not_found: "notice.admin.session_not_found",
  self_lockout: "notice.admin.self_lockout",
  last_active_admin: "notice.admin.last_active_admin",
  invalid_admin_user: "notice.admin.invalid_admin_user",
  unauthorized: "notice.admin.unauthorized",
  forbidden: "notice.admin.forbidden",
  admin_provider_error: "notice.admin.admin_provider_error",
  admin_operation_failed: "notice.admin.admin_operation_failed"
} as const satisfies Record<string, TranslationKey>;

export type AdminUserNoticeCode = keyof typeof ADMIN_USER_NOTICE_KEYS;

export function isAdminUserNoticeCode(value: string | null | undefined): value is AdminUserNoticeCode {
  return typeof value === "string" && Object.hasOwn(ADMIN_USER_NOTICE_KEYS, value);
}

export function getAdminUserNoticeTranslationKey(code: string | null | undefined): TranslationKey {
  return isAdminUserNoticeCode(code) ? ADMIN_USER_NOTICE_KEYS[code] : ADMIN_USER_NOTICE_KEYS.admin_operation_failed;
}

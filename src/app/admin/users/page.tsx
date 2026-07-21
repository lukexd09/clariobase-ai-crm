import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-context";
import { getAdminUserNoticeTranslationKey } from "@/lib/admin-user-notices";
import { getI18n } from "@/i18n/server";
import { getAdminRoleTranslationKey, getAdminStateTranslationKey } from "@/i18n/taxonomy";
import { listUsers, listUserSessions } from "@/lib/user-admin-gateway";
import {
  createUserAction,
  disableUserAction,
  reactivateUserAction,
  resetPasswordAction,
  revokeAllSessionsAction,
  revokeSessionAction,
  updateIdentityAction
} from "@/app/admin/users/actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ userId?: string; noticeCode?: string; tone?: string }>;
}) {
  const currentUser = await requireUser({ mode: "redirect", returnTo: "/admin/users" });
  if (currentUser.role !== "admin" || currentUser.banned !== false) redirect("/");

  const requestHeaders = await headers();
  const { t, formatDateTime, formatNumber } = await getI18n(requestHeaders);
  const query = await searchParams;
  const usersResult = await listUsers({ headers: requestHeaders });
  if (!usersResult.ok) redirect("/");

  const selectedUser = usersResult.data.users.find((user) => user.id === query.userId);
  const sessionsResult = selectedUser
    ? await listUserSessions({ headers: requestHeaders }, selectedUser.id)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-sky-700">{t("admin.users.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t("admin.users.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {t("admin.users.description")}
          </p>
        </header>

        {query.noticeCode ? (
          <div
            role={query.tone === "success" ? "status" : "alert"}
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${query.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
          >
            {t(getAdminUserNoticeTranslationKey(query.noticeCode))}
          </div>
        ) : null}

        <section aria-labelledby="create-user-heading" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 id="create-user-heading" className="text-lg font-semibold text-slate-950">{t("admin.users.createTitle")}</h2>
          <form action={createUserAction} className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">{t("admin.users.name")}<input required name="name" maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">{t("admin.users.email")}<input required name="email" type="email" autoComplete="off" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">{t("admin.users.initialPassword")}<input required name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <button className="self-end rounded-lg bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800">{t("admin.users.create")}</button>
          </form>
        </section>

        <section aria-labelledby="users-heading" className="mt-5 space-y-4">
          <h2 id="users-heading" className="text-lg font-semibold text-slate-950">{t("admin.users.count", { count: formatNumber(usersResult.data.total) })}</h2>
          {usersResult.data.users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{user.name ?? user.email ?? t("admin.users.unnamed")}</h3>
                  <p className="text-sm text-slate-600">{user.email ?? t("admin.users.noEmail")}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${user.banned ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {t(getAdminRoleTranslationKey(user.role))} · {t(getAdminStateTranslationKey(user.banned))}
                </span>
              </div>

              <form action={updateIdentityAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="userId" value={user.id} />
                <label className="text-sm font-medium text-slate-700">{t("admin.users.name")}<input required name="name" defaultValue={user.name ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">{t("admin.users.email")}<input required name="email" type="email" defaultValue={user.email ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                <button className="self-end rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700">{t("admin.users.saveIdentity")}</button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={user.banned ? reactivateUserAction : disableUserAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button className={`rounded-lg border px-3 py-2 text-sm font-medium ${user.banned ? "border-emerald-300 text-emerald-700" : "border-rose-300 text-rose-700"}`}>
                    {user.banned ? t("admin.users.reactivate") : t("admin.users.disable")}
                  </button>
                </form>
                <Link href={`/admin/users?userId=${encodeURIComponent(user.id)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">{t("admin.users.manageSessions")}</Link>
              </div>

              <form action={resetPasswordAction} className="mt-4 flex max-w-xl flex-wrap items-end gap-2">
                <input type="hidden" name="userId" value={user.id} />
                <label className="min-w-64 flex-1 text-sm font-medium text-slate-700">{t("admin.users.recoveryPassword")}<input required name="newPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                <button className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800">{t("admin.users.resetPassword")}</button>
              </form>
            </article>
          ))}
        </section>

        {selectedUser ? (
          <section aria-labelledby="sessions-heading" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 id="sessions-heading" className="text-lg font-semibold text-slate-950">{t("admin.users.sessionsFor", { name: selectedUser.name ?? selectedUser.email ?? t("admin.users.user") })}</h2><p className="text-sm text-slate-600">{t("admin.users.tokensHidden")}</p></div>
              <form action={revokeAllSessionsAction}><input type="hidden" name="userId" value={selectedUser.id} /><button className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700">{t("admin.users.revokeAll")}</button></form>
            </div>
            {!sessionsResult?.ok ? <p role="alert" className="mt-4 text-sm text-rose-700">{t("admin.users.sessionsError")}</p> : (
              <ul className="mt-4 divide-y divide-slate-200">
                {sessionsResult.data.map((session) => (
                  <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="text-sm"><p className="font-medium text-slate-800">{t("admin.users.expires", { date: formatDateTime(session.expiresAt) })}</p><p className="text-slate-500">{session.ipAddress ?? t("admin.users.unknownIp")} · {session.userAgent ?? t("admin.users.unknownClient")}</p></div>
                    <form action={revokeSessionAction}><input type="hidden" name="sessionId" value={session.id} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">{t("admin.users.revokeSession")}</button></form>
                  </li>
                ))}
                {sessionsResult.data.length === 0 ? <li className="py-5 text-sm text-slate-500">{t("admin.users.noSessions")}</li> : null}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

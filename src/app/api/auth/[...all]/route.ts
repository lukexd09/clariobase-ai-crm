import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { withAdminNamespaceFirewall } from "@/lib/auth-admin-firewall";

const publicHandlers = toNextJsHandler(auth);

export const GET = withAdminNamespaceFirewall(publicHandlers.GET);
export const POST = withAdminNamespaceFirewall(publicHandlers.POST);
export const PUT = withAdminNamespaceFirewall(publicHandlers.PUT);
export const PATCH = withAdminNamespaceFirewall(publicHandlers.PATCH);
export const DELETE = withAdminNamespaceFirewall(publicHandlers.DELETE);

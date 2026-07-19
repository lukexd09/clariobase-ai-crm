import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { withAdminNamespaceFirewall } from "@/lib/auth-admin-firewall";
import { withAuthProxyContract } from "@/lib/auth-proxy-contract";

const publicHandlers = toNextJsHandler(auth);
const protect = (handler: (request: Request) => Promise<Response>) =>
  withAuthProxyContract(withAdminNamespaceFirewall(handler));

export const GET = protect(publicHandlers.GET);
export const POST = protect(publicHandlers.POST);
export const PUT = protect(publicHandlers.PUT);
export const PATCH = protect(publicHandlers.PATCH);
export const DELETE = protect(publicHandlers.DELETE);

import { toNextJsHandler } from "better-auth/next-js";

import { createAppAuth } from "@/lib/auth";

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(createAppAuth());

"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { createCustomerAuth } from "./customer-auth-core";
export const customerAuthClient = createAuthClient({ plugins: [inferAdditionalFields<ReturnType<typeof createCustomerAuth>>()] });

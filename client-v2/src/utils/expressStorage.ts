import { set, get, del } from "idb-keyval";
import type { ExpressPermissions } from "@/features/express/types";

/** Almacenamiento separado del token ERP — Pocket POS usa un JWT y esquema propios. */
const TOKEN_KEY = "express_token";
const BUSINESS_KEY = "express_business_name";
const ROLE_KEY = "express_role";
const PERMISSIONS_KEY = "express_permissions";

export const setExpressToken = async (token: string): Promise<void> => {
  if (!token) return;
  await set(TOKEN_KEY, token);
};

export const getExpressToken = async (): Promise<string | undefined> => await get<string>(TOKEN_KEY);

export const removeExpressToken = async (): Promise<void> => {
  await del(TOKEN_KEY);
};

export const setExpressBusinessName = async (name: string): Promise<void> => {
  if (!name) return;
  await set(BUSINESS_KEY, name);
};

export const getExpressBusinessName = async (): Promise<string | undefined> => await get<string>(BUSINESS_KEY);

export const removeExpressBusinessName = async (): Promise<void> => {
  await del(BUSINESS_KEY);
};

export const setExpressRole = async (role: string): Promise<void> => {
  if (!role) return;
  await set(ROLE_KEY, role);
};

export const getExpressRole = async (): Promise<string | undefined> => await get<string>(ROLE_KEY);

export const removeExpressRole = async (): Promise<void> => {
  await del(ROLE_KEY);
};

export const setExpressPermissions = async (permissions: ExpressPermissions): Promise<void> => {
  if (!permissions) return;
  await set(PERMISSIONS_KEY, permissions);
};

export const getExpressPermissions = async (): Promise<ExpressPermissions | undefined> =>
  await get<ExpressPermissions>(PERMISSIONS_KEY);

export const removeExpressPermissions = async (): Promise<void> => {
  await del(PERMISSIONS_KEY);
};

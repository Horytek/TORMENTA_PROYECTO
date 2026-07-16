import { set, get, del } from "idb-keyval";

/** Almacenamiento separado del token ERP — Pocket POS usa un JWT y esquema propios. */
const TOKEN_KEY = "express_token";
const BUSINESS_KEY = "express_business_name";

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

import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Role = z.infer<typeof role>;
export const role = z.object({
  id: z.number(),
  name: z.string(),
  permissions: z.string().array(),
  users: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .array(),
});

export async function getRoles() {
  const { data } = await AxiosFetch("/api/v1/roles");
  return role.array().parse(data.data);
}

export async function getRole(id: number) {
  const { data } = await AxiosFetch(`/api/v1/roles/${id}`);
  return role.parse(data.data);
}

export type Permission = z.infer<typeof permission>;
export const permission = z.object({
  id: z.number(),
  name: z.string(),
});

export async function getPermissions() {
  const { data } = await AxiosFetch("/api/v1/permissions");
  return permission.array().parse(data.data);
}

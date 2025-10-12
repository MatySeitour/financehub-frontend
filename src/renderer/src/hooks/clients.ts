/* IMPORTS */
import { z } from "zod";
import axios from "./axios";

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* DATA TYPES */

/* SCHEMAS */
//Client's base structure
export type Client = z.infer<typeof clientSchema>;
export const clientSchema = z.object({
  id: z.number(),
  name: z.string().max(50),
  phone: z.string().max(20),
  address: z.string().max(200),
  info: z.string().nullable(),
  referred_to: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
});

/* GETS */
//return all clients
export async function getClients() {
  const { data } = await AxiosFetch(`/api/v1/clients`);

  return clientSchema.array().parse(data?.data);
}

export async function getClient(clientID: number) {
  const { data } = await AxiosFetch(`/api/v1/clients/${clientID}`);
  return clientSchema.parse(data?.data);
}

/* IMPORTS */
import { z } from "zod";
import axios from "./axios";

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* DATA TYPES */
export type Client = z.infer<typeof clientSchema>;

/* SCHEMAS */
//Client's base structure
export const clientSchema = z.object({
  id: z.number(),
  //org_id: z.number(),
  name: z.string().max(50),
  phone: z.string().max(20),
  address: z.string().max(200),
  info: z.string().nullable(),
  /* LA API NO DEVUELVE ESTO TODAVIA, TIENE QUE DEVOLVERLO */
  // referredBy: z.object({
  //   id: z.number(),
  //   name: z.string(),
  // }),
});

/* GETS */
//return all clients
export async function getClients() {
  const { data } = await AxiosFetch(`/api/v1/clients`);

  return clientSchema.array().parse(data?.data);
}

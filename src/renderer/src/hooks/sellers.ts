/* IMPORTS */
import { z } from "zod";
import axios from "./axios";

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* DATA TYPES */
export type Seller = z.infer<typeof sellerSchema>;

/* SCHEMAS */
//Sellers's base structure
export const sellerSchema = z.object({
  id: z.number(),
  //org_id: z.number(),
  name: z.string().max(50),
  info: z.string().nullable(),
  phone: z.string().max(20),
  /* LA API NO DEVUELVE ESTO TODAVIA, TIENE QUE DEVOLVERLO */
  // referredBy: z.object({
  //   id: z.number(),
  //   name: z.string(),
  // }),
});

/* GETS */
//return all sellers
export async function getSellers() {
  const { data } = await AxiosFetch(`/api/v1/sellers`);

  return sellerSchema.array().parse(data?.data);
}

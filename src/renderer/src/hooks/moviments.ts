import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export const movimentTypes = ["expense", "income"] as const;

export type Moviment = z.infer<typeof movimentSchema>;
export const movimentSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.coerce.number(),
  cashbox_id: z.number(),
  date: z.string(),
  moviment_type: z.enum(movimentTypes),
});

export async function getMoviments(from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch("/api/v1/moviments", { params });
  return movimentSchema.array().parse(data.data);
}

import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Currency = z.infer<typeof currencySchema>;
export const currencySchema = z.object({
  id: z.number(),
  name: z.string(),
  nomenclature: z.string(),
});

export async function getCurrencies() {
  const { data } = await AxiosFetch("/api/v1/currencies");
  return currencySchema.array().parse(data.data);
}

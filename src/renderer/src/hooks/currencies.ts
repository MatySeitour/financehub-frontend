import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

////////////// Cronista currencies //////////////
export type TCronistaCurrency = z.infer<typeof cronistaCurrencySchema>;
export const cronistaCurrencySchema = z.object({
  id: z.number(),
  name: z.string(),
  update_date: z.string(),
  sale_value: z.string(),
  buys_value: z.string(),
  variation: z.coerce.number(),
});

export async function getCronistaCurrencies() {
  const { data } = await AxiosFetch("/api/v1/cronista-currencies");
  return cronistaCurrencySchema.array().parse(data.data);
}
////////////////////////////////////////////////////////////

////////////// Currencies //////////////
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

import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

const operationType = [
  "operation",
  "commission",
  "installment",
  "bill",
  "loan",
] as const;

export type TSummary = z.infer<typeof summarySchema>;
export const summarySchema = z.object({
  operationType: z.enum(operationType),
  date: z.string(),
  income: z.coerce.string().nullable(),
  exit: z.coerce.string().nullable(),
  client: z.string().nullable(),
  cashboxID: z.number(),
  message: z.string().nullable().optional(),
});

export async function getSummary(date: Date) {
  const params = { date };
  const { data } = await AxiosFetch("/api/v1/current-day", { params: params });
  return summarySchema.array().parse(data.data);
}

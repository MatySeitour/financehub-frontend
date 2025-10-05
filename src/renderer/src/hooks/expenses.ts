import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Expense = z.infer<typeof expenseSchema>;
export const expenseSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.coerce.number(),
  cashbox_id: z.number(),
  date: z.string(),
});

export async function getExpenses(from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch("/api/v1/expenses", { params });
  return expenseSchema.array().parse(data.data);
}

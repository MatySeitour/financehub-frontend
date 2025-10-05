import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type PaymentFrequency = (typeof PAYMENT_FREQUENCY)[number];
export const PAYMENT_FREQUENCY = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export const paymentFrequencies: Record<PaymentFrequency, string> = {
  daily: "Diario",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export type Loan = z.infer<typeof loanSchema>;
export const loanSchema = z.object({
  id: z.number(),
  principal: z.coerce.number(),
  cashboxID: z.number(),
  numberOfInstallments: z.number(),
  firstDueDate: z.string(),
  dateGenerated: z.string(),
  installmentValue: z.coerce.number(),
  totalPaid: z.coerce.number(),
  commission: z.coerce.number(),
  expected_profit: z.coerce.number(),
  retainedEarnings: z.coerce.number().nullable(),
  seller: z.object({
    id: z.number(),
    name: z.string(),
  }),
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  paymentFrequency: z.enum(PAYMENT_FREQUENCY),
});

export async function getLoans(from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch("/api/v1/loans", { params });
  return loanSchema.array().parse(data.data);
}

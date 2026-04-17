import { z } from "zod";
import axios from "./axios";
import { DataPerPage } from "@renderer/components/Table";
import { installmentSchema } from "./installments";

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
  seller: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  paymentFrequency: z.enum(PAYMENT_FREQUENCY),
});

export const loanWithInstallmentSchema = z.object({
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
  installments: z.array(installmentSchema),
});

export const loanWithTotalSchema = z.object({
  total: z.number(),
  loans: loanSchema.array(),
  totalLoans: z.coerce.number().optional()
});

export async function getLoans(
  from?: Date,
  to?: Date,
  page?: number,
  limit?: DataPerPage,
) {
  const params = {
    from,
    to,
    page,
    limit,
  };
  const { data } = await AxiosFetch("/api/v1/loans", { params });
  return loanWithTotalSchema.parse(data.data);
}

export async function getLoan(loanID: number) {
  const { data } = await AxiosFetch(`/api/v1/loans/${loanID}`);
  return loanWithInstallmentSchema.parse(data?.data);
}
////////////////////////////////////////////////////////////

////////////// Client //////////////
export async function getClientLoans(clientID: number, from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch(`/api/v1/clients/${clientID}/loans`, {
    params,
  });
  return loanSchema.array().parse(data.data);
}

////////////////////////////////////////////////////////////

////////////// Seller //////////////
export async function getSellerLoans(sellerID: number, from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch(`/api/v1/sellers/${sellerID}/loans`, {
    params,
  });
  return loanSchema.array().parse(data.data);
}

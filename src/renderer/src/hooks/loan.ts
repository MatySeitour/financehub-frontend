/* IMPORTS */
import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

/* DATA TYPES */
export type Loan = z.infer<typeof loanSchema>;
export type CreateLoan = z.infer<typeof createLoanSchema>;

/* ENUMS */
const paymentFrecuency = ["daily", "weekly", "biweekly", "monthly"] as const;
const currency = ["ars", "usd", "eur", "real", "lib"] as const;

/* SCHEMAS */
//
export const loanSchema = z.object({
  id: z.number(),
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  seller: z.object({
    id: z.number(),
    name: z.string(),
  }),
  principal: z.number(),
  currency: z.enum(currency),
  installmentValue: z.number(),
  numberOfInstallments: z.number(),
  paymentFrequency: z.enum(paymentFrecuency),
  firstDueDate: z.string(),
  totalPaid: z.number().nullable(),
  commission: z.number(),
});
//
export const createLoanSchema = z.object({
  principal: z.number(),
  currency: z.enum(currency),
  installment_value: z.number(),
  number_of_installments: z.number(),
  payment_frequency: z.enum(paymentFrecuency),
  first_due_date: z.string(),
  commission: z.number(),
  client_id: z.number(),
  seller_id: z.number(),
  total_paid: z.number(),
});

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* GETS */
export async function getLoans() {
  try {
    const { data } = await AxiosFetch("/api/v1/1/loans");

    console.log("Respuesta sin parsear:", data?.data);

    return loanSchema.array().parse(data?.data);
  } catch (error) {
    console.error(error);

    return errorsResponse(error);
  }
}

/* POST */
export async function createLoan(data: CreateLoan): Promise<void> {
  try {
    const parsed = createLoanSchema.parse(data);
    await AxiosFetch.post("/api/v1/1/loans", parsed);
  } catch (error) {
    console.error(error);
    return errorsResponse(error);
  }
}
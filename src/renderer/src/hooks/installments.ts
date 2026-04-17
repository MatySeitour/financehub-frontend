import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

////////////// Installments //////////////
export type TInstallment = z.infer<typeof installmentSchema>;
export const installmentSchema = z.object({
  id: z.number(),
  number: z.number(),
  value: z.coerce.number(),
  amount: z.coerce.number().nullable(),
  paymentAmount: z.coerce.number(),
  paymentDate: z.string().nullable(),
  dueDate: z.string(),
  currency: z.string(),
  number_of_installments: z.number(),
  clientName: z.string(),
  sellerName: z.string(),
  loanID: z.number(),
  cashbox: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export const installmentWithTotalSchema = z.object({
  total: z.number(),
  installments: installmentSchema.array(),
});

export async function getInstallmentsPagination(
  from?: Date,
  to?: Date,
  // page?: number,
  // limit?: DataPerPage,
) {
  const params = {
    from,
    to,
    // page,
    // limit,
  };
  const { data } = await AxiosFetch("/api/v1/all_installments", { params });
  return installmentSchema.array().parse(data.data);
}

export async function getInstallments(from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch("/api/v1/installments", { params });
  return installmentSchema.array().parse(data.data);
}
////////////////////////////////////////////////////////////

////////////// Installments history //////////////
export type InstallmentHistory = z.infer<typeof installmentHistorySchema>;
export const installmentHistorySchema = installmentSchema
  .omit({ currency: true })
  .extend({
    installment_id: z.number().optional(),
    movimentDateTime: z.string().optional(),
  });

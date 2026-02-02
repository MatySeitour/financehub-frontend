/* IMPORTS */
import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type GeneralCheckingAccount = z.infer<typeof generalCheckingAccount>;
export const generalCheckingAccount = z.object({
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  totalCount: z.number(),
  totalAmountBorrowed: z.number(),
  percentage: z.number(),
  latestCheckingAccount: z.object({
    id: z.number(),
    amountBorrowed: z.number(),
    loanDate: z.string(),
    isPaid: z.union([z.literal(0), z.literal(1)]),
    cashboxName: z.string(),
  }),
});

export async function getGeneralCheckingAccounts() {
  const { data } = await AxiosFetch(`/api/v1/checking-accounts`);

  return generalCheckingAccount.array().parse(data?.data);
}

export type CheckingAccount = z.infer<typeof checkingAccount>;
export const checkingAccount = z.object({
  id: z.number(),
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  percentage: z.number(),
  amountBorrowed: z.number(),
  amountGross: z.number(),
  loanDate: z.string(),
  isPaid: z.union([z.literal(0), z.literal(1)]),
  cashbox: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export async function getCheckingAccountsClient(clientID: number) {
  const { data } = await AxiosFetch(
    `/api/v1/clients/${clientID}/checking-accounts`,
  );
  return checkingAccount.array().parse(data?.data);
}

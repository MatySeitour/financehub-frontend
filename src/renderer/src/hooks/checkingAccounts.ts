/* IMPORTS */
import { z } from "zod";
import axios from "./axios";
import { DataPerPage } from "@renderer/components/Table";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

// export type GeneralCheckingAccount = z.infer<typeof generalCheckingAccount>;
// export const generalCheckingAccount = z.object({
//   client: z.object({
//     id: z.number(),
//     name: z.string(),
//   }),
//   totalCount: z.number(),
//   totalAmountBorrowed: z.number(),
//   percentage: z.number(),
//   latestCheckingAccount: z.object({
//     id: z.number(),
//     amountBorrowed: z.number(),
//     loanDate: z.string(),
//     isPaid: z.union([z.literal(0), z.literal(1)]),
//     cashboxName: z.string(),
//   }),
// });

////////////////////////////////////////////////////////////

////////////// Percentages //////////////
export type TCheckingAccountPercentage = z.infer<
  typeof checkingAccountPercentageSchema
>;
export const checkingAccountPercentageSchema = z.object({
  id: z.number(),
  percentage: z.string(),
  checking_account_id: z.number(),
});

export const checkingAccountPercentageWithParamSchema = z.object({
  total: z.number(),
  percentages: checkingAccountPercentageSchema.array(),
});

export async function getCheckingAccountPercentages(id: number) {
  const { data } = await AxiosFetch(
    `/api/v1/checking-accounts/${id}/percentages`,
  );

  return checkingAccountPercentageWithParamSchema.parse(data?.data);
}

////////////////////////////////////////////////////////////

////////////// Checking account clients //////////////

export type TCheckingAccountClient = z.infer<
  typeof checkingAccountClientSchema
>;
export const checkingAccountClientSchema = z.object({
  id: z.number(),
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  percentages: checkingAccountPercentageSchema.array(),
});

export async function getCheckingAccountClients() {
  const { data } = await AxiosFetch(`/api/v1/checking-accounts`);

  return checkingAccountClientSchema.array().parse(data?.data);
}

////////////////////////////////////////////////////////////

////////////// Checking account moviments //////////////

export type TCheckingAccountMoviment = z.infer<
  typeof checkingAccountMovimentSchema
>;
export const checkingAccountMovimentSchema = z.object({
  id: z.number(),
  amountBorrowed: z.number(),
  amountGross: z.number(),
  loanDate: z.string(),
  isPaid: z.union([z.number(), z.number()]),
  isCash: z.union([z.number(), z.number()]),
  disabled: z.union([z.number(), z.number()]),
  cashboxIncrement: z.object({
    id: z.number(),
    name: z.string(),
    nomenclature: z.string(),
  }),
  cashboxDecrement: z.object({
    id: z.number(),
    name: z.string(),
    nomenclature: z.string(),
  }),
});

export const checkingAccountMovimentWithParamSchema = z.object({
  total: z.number(),
  moviments: checkingAccountMovimentSchema.array(),
  clientName: z.string(),
  percentage: z.string(),
});

export async function getCheckingAccountsMoviments(
  clientID: number,
  percentageID: number,
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

  const { data } = await AxiosFetch(
    `/api/v1/checking-accounts/${clientID}/percentages/${percentageID}/moviments`,
    { params },
  );
  return checkingAccountMovimentWithParamSchema.parse(data?.data);
}

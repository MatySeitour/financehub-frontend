import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";
import { currencySchema } from "./currencies";
import { operationSchema } from "./operations";
import { loanSchema } from "./loans";
import { installmentHistorySchema } from "./installments";
import { movimentSchema } from "./moviments";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Cashbox = z.infer<typeof cashboxSchema>;
export const cashboxSchema = z.object({
  id: z.number(),
  name: z.string(),
  currency: currencySchema,
  state: z.number(),
  openingDateTime: z.string().nullable(),
  value: z.number(),
  openingValue: z.coerce.number(),
  profit: z.number(),
  disabled: z.number(),
});

export async function getCashboxes() {
  const { data } = await AxiosFetch("/api/v1/cashboxes");
  return cashboxSchema.array().parse(data.data);
}

export async function getCashbox(id: number) {
  const { data } = await AxiosFetch(`/api/v1/cashboxes/${id}`);
  return cashboxSchema.parse(data.data);
}
//////////////////////////
////////////// Cashbox history //////////////
export type CashboxHistory = z.infer<typeof cashboxSchema>;
export const cashboxHistorySchema = z.object({
  id: z.number(),
  openingValue: z.coerce.number(),
  lastValue: z.coerce.number(),
  openingDateTime: z.string().nullable(),
  closeDateTime: z.string().nullable(),
  profit: z.number(),
  movimentsCount: z.number(),
});

export type CashboxHistoryList = z.infer<typeof cashboxSchema>;
export const cashboxHistoryListSchema = z.object({
  current: cashboxHistorySchema.nullable(),
  records: cashboxHistorySchema.array(),
});

export async function getHistoryCashbox(cashboxID: number) {
  try {
    const { data } = await AxiosFetch(`/api/v1/cashboxes/${cashboxID}/history`);
    return cashboxHistoryListSchema.parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

export async function getCashboxHistoryOperations(
  cashboxID: number,
  historyID: number,
) {
  try {
    const { data } = await AxiosFetch(
      `/api/v1/cashboxes/${cashboxID}/history/${historyID}/operations`,
    );
    return operationSchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

export async function getCashboxHistoryLoans(
  cashboxID: number,
  historyID: number,
) {
  try {
    const { data } = await AxiosFetch(
      `/api/v1/cashboxes/${cashboxID}/history/${historyID}/loans`,
    );
    return loanSchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

export async function getCashboxHistoryMoviments(
  cashboxID: number,
  historyID: number,
) {
  const { data } = await AxiosFetch(
    `/api/v1/cashboxes/${cashboxID}/history/${historyID}/moviments`,
  );
  return movimentSchema.array().parse(data.data);
}

export async function getCashboxHistoryInstallments(
  cashboxID: number,
  historyID: number,
) {
  const { data } = await AxiosFetch(
    `/api/v1/cashboxes/${cashboxID}/history/${historyID}/installments`,
  );
  return installmentHistorySchema.array().parse(data.data);
}
////////////////////////////////////////////////////////////
////////////// Cashbox current history //////////////
export async function getCashboxCurrentHistoryOperations(cashboxID: number) {
  try {
    const { data } = await AxiosFetch(
      `/api/v1/cashboxes/${cashboxID}/history/current/operations`,
    );
    return operationSchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

export async function getCashboxCurrentHistoryLoans(cashboxID: number) {
  try {
    const { data } = await AxiosFetch(
      `/api/v1/cashboxes/${cashboxID}/history/current/loans`,
    );
    return loanSchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

export async function getCashboxCurrentHistoryMoviments(cashboxID: number) {
  const { data } = await AxiosFetch(
    `/api/v1/cashboxes/${cashboxID}/history/current/moviments`,
  );
  return movimentSchema.array().parse(data.data);
}

export async function getCashboxCurrentHistoryInstallments(cashboxID: number) {
  const { data } = await AxiosFetch(
    `/api/v1/cashboxes/${cashboxID}/history/current/installments`,
  );
  return installmentHistorySchema.array().parse(data.data);
}
////////////////////////////////////////////////////////////
////////////// Cashboxes active //////////////
export async function getCashboxesActive() {
  const { data } = await AxiosFetch("/api/v1/cashboxes/active");
  return cashboxSchema.array().parse(data.data);
}

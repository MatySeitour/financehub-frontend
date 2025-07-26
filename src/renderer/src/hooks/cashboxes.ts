import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Cashbox = z.infer<typeof cashboxSchema>;
export const cashboxSchema = z.object({
  id: z.number(),
  name: z.string(),
  currency: z.string(),
  state: z.number(),
  openingDateTime: z.string().nullable(),
  value: z.number(),
  openingValue: z.coerce.number(),
  profit: z.number(),
  disabled: z.number(),
});

export async function getCashboxes() {
  try {
    const { data } = await AxiosFetch("/api/v1/cashboxes");
    return cashboxSchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}
//////////////////////////
////////////// Cashbox history //////////////
export type CashboxHistoryOperation = z.infer<typeof cashboxSchema>;
export const cashboxHistorySchema = z.object({
  id: z.number(),
  openingValue: z.coerce.number(),
  lastValue: z.coerce.number(),
  openingDateTime: z.string().nullable(),
  closeDateTime: z.string().nullable(),
  profit: z.number(),
  operationsCount: z.number(),
});

export async function getHistoryCashboxOperations(cashboxID: number) {
  try {
    const { data } = await AxiosFetch(
      `/api/v1/cashboxes/${cashboxID}/history/operations`,
    );
    return cashboxHistorySchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

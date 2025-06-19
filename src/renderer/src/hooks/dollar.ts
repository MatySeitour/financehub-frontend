import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

const currenciesSchema = z.object({
  id: z.number(),
  name: z.string(),
  update_date: z.string(),
  sale_value: z.coerce.number(),
  buy_value: z.coerce.number(),
  variation: z.coerce.number(),
});

export const getCurrencies = async () => {
  try {
    const { data } = await AxiosFetch("/api/currencies");
    return currenciesSchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
};

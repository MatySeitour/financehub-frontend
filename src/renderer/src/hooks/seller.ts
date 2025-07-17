/* IMPORTS */

import { errorsResponse } from "@renderer/utils";
import axios from "./axios";
import { z } from "zod";

/* UTILS */
//axios
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* DATA TYPES */
export type Seller = z.infer<typeof sellerSchema>;

/* DATA TYPES */
//Seller's base structure
export const sellerSchema = z.object({
  id: z.number(),
  name: z.string().max(50),
	phone: z.string().max(20),
	info: z.string().nullable(),
});

/* GETS */
//return all sellers
export async function getSellers(orgID: number) {
	try {
		const { data } = await AxiosFetch(`/api/v1/${orgID}/sellers`);

		return sellerSchema.array().parse(data?.data);
	} catch (error) {
		console.error(error);

		return errorsResponse(error);
	}
}
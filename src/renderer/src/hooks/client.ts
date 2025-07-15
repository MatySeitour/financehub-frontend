/* IMPORTS */
import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* DATA TYPES */
export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;

/* SCHEMAS */
//Client's base structure
export const clientSchema = z.object({
  id: z.number(),
	//org_id: z.number(),
  name: z.string().max(50),
	phone: z.string().max(20),
  address: z.string().max(200),
	info: z.string().nullable(),
	/* LA API NO DEVUELVE ESTO TODAVIA, TIENE QUE DEVOLVERLO */
	// referredBy: z.object({
  //   id: z.number(),
  //   name: z.string(),
  // }),
});
//Create client structure
export const createClientSchema = z.object({
  /* EN DUDA */
	//org_id: z.number(),
	name: z.string().max(50, "El nombre no puede contener mas de 50 caracteres."),
	phone: z.string().max(20, "El telefono no puede contener mas de 20 numeros."),
	address: z.string().max(200, "La direccion no puede contener mas de 200 caracteres."),
	info: z.string().nullable(),
	/* NO ESTA LISTO EN EL BACKEND TODAVIA */
	//referredBy: z.number()
});
//Edit client structure
export const editClientSchema = clientSchema.partial().extend({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
  info: z.string().optional(),
});

/* GETS */
//return all clients
export async function getClients(orgID: number) {
  try {
    const { data } = await AxiosFetch(`/api/v1/${orgID}/clients`);

    return clientSchema.array().parse(data?.data);
  } catch (error) {
    console.error(error);

    return errorsResponse(error);
  }
}

/* POST */
//create a new client
export async function createClient(orgID: number, clientData: z.infer<typeof createClientSchema>) {
	try {
		// Validar datos antes de enviar
    const validatedData = createClientSchema.parse(clientData);
    
    const { data } = await AxiosFetch.post(`/api/v1/${orgID}/clients`, validatedData);
		
    // Validar la respuesta usando el schema del cliente
    return clientSchema.parse(data?.data);
  } catch (error) {
		console.error(error);
		
    return errorsResponse(error);
  }
}

/* DELETE */
//delete a client
export async function deleteClient(orgID: number, clientID: number) {
  try {
    const { data } = await AxiosFetch.delete(`/api/v1/${orgID}/clients/${clientID}`);

    // Validar la respuesta si querés asegurarte que el backend responde correctamente
    const responseSchema = z.object({
      success: z.boolean(),
      data: clientSchema, // si querés validar el cliente eliminado
    });

    return responseSchema.parse(data);
  } catch (error) {
    console.error(error);
    return errorsResponse(error);
  }
}

/* PUT */
//update a client
export async function editClient(
  orgID: number,
  clientID: number,
  clientData: z.infer<typeof editClientSchema>
) {
  try {
    // Validar los datos antes de enviar
    const validatedData = editClientSchema.parse(clientData);

    const { data } = await AxiosFetch.put(
      `/api/v1/${orgID}/clients/${clientID}`,
      validatedData
    );

    // Validar la respuesta del backend
    const responseSchema = z.object({
      success: z.boolean(),
      data: clientSchema,
    });

    return responseSchema.parse(data);
  } catch (error) {
    console.error(error);
    return errorsResponse(error);
  }
}
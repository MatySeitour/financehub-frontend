/* IMPORTS */

import axios from "@renderer/hooks/axios";
import { ServerError } from "@renderer/utils/types";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import z from "zod";
import { errorsResponse } from "@renderer/utils";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";
import { LandmarkIcon } from "lucide-react";

/* ENUMS */
const paymentFrecuency = ["daily", "weekly", "biweekly", "monthly"] as const;

/* DATA TYPES */
//create loan structure
export type LoanForm = z.infer<typeof loanFormSchema>;
//
export type LoanPayload = z.infer<typeof loanPayloadSchema>;
/* --- ESTO SE BORRA XQ YA ESTA EN CLIENTES */
export type Client = z.infer<typeof clientSchema>;
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
export type Seller = z.infer<typeof sellerSchema>;
export const sellerSchema = z.object({
  id: z.number(),
  name: z.string().max(50),
  phone: z.string().max(20),
  info: z.string().nullable(),
});
/* --------------- */

/* INTERFACES */
//create loan parameters structure
interface CreateLoanModalProps {
  dialogRef: React.RefObject<HTMLDialogElement>;
  closeModal: () => void;
}

/* UTILS */
//axios
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* SCHEMAS */
//create and edit loan data validation
export const loanFormSchema = z.object({
  principal: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "El capital prestado no puede estar vacio"),
  ),
  installment_value: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "El valor de las cuotas no puede estar vacio"),
  ),
  number_of_installments: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "La cantidad de cuotas no puede estar vacia"),
  ),
  payment_frequency: z.enum(paymentFrecuency),
  first_due_date: z.string().min(1, "La fecha no puede estar vacia"),
  commission: z.preprocess((val) => Number(val), z.number().optional()),
  clientName: z.string().min(1, "El cliente no puede estar vacio"),
  sellerName: z.string().min(1, "El vendedor no puede estar vacio"),
});

export const loanPayloadSchema = z.object({
  client_id: z.number(),
  seller_id: z.number(),
  principal: z.number(),
  cashboxID: z.number(),
  number_of_installments: z.number(),
  payment_frequency: z.enum(paymentFrecuency),
  commission: z.number().optional(),
  total_paid: z.number(),
  first_due_date: z.string(),
  installment_value: z.number(),
});

/* MODALS */
//create loan modal
export function CreateLoanModal({
  dialogRef,
  closeModal,
}: CreateLoanModalProps) {
  /* STATES */
  //list of clients
  const [clients, setClients] = useState<Client[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);

  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  /* QUERIES */
  //get all clients
  /* --- ESTO SE BORRA XQ YA ESTA EN CLIENTES --- */
  async function getClients() {
    try {
      const { data } = await AxiosFetch(`/api/v1/clients`);

      console.log("Respuesta completa:", data);

      return clientSchema.array().parse(data?.data);
    } catch (error) {
      console.error(error);

      return errorsResponse(error);
    }
  }
  async function getSellers() {
    try {
      const { data } = await AxiosFetch(`/api/v1/sellers`);

      return sellerSchema.array().parse(data?.data);
    } catch (error) {
      console.error(error);

      return errorsResponse(error);
    }
  }
  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryFn: () => getSellers(),
    queryKey: ["sellers", "all"],
    onSuccess: (data) => {
      if (data && Array.isArray(data)) {
        setSellers(data);
      }
    },
  });
  /* ---------- */
  const clientsQuery = useQuery<
    Awaited<ReturnType<typeof getClients>>,
    ServerError
  >({
    queryFn: () => getClients(),
    queryKey: ["clients", "all"],
    onSuccess: (data) => {
      if (data && Array.isArray(data)) {
        setClients(data);
      }
    },
  });

  /* MUTATIONS */
  //mutation to create loans
  const mutation = useMutation<LoanPayload, ServerError, LoanPayload>({
    mutationFn: async (body) => {
      try {
        //send new loan to backend
        const { data } = await AxiosFetch.post(`/api/v1/loans`, body);

        //return data for the toast
        return data;
      } catch (error) {
        console.error(error);

        return errorsResponse(error);
      }
    },
    onSuccess: (data) => {
      //forces a refetch
      queryClient.invalidateQueries(["loans", "all"]);

      console.log("El prestamo se ha creado correctamente", data);

      //close modal once the loan was successfully added
      closeModal();
      //reset all fiell¿ds in the form
      reset();
      /* PENDING TOAST */
    },
  });

  /* HOOKS */
  //manipulate and validate the data from the form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanForm>({
    resolver: zodResolver(loanFormSchema),
  });

  /* EVENT HANDLERS */
  //executes the mutation when the form is submitted
  const onSubmit: SubmitHandler<LoanForm> = (data) => {
    try {
      console.log("me ejecute con exito");
      const matchedClient = clients.find((c) => c.name === data.clientName);

      if (!matchedClient) {
        alert("Cliente no válido");
        return;
      }

      const matchedSeller = sellers.find((c) => c.name === data.sellerName);

      if (!matchedSeller) {
        alert("Vendedor no válido");
        return;
      }

      const { clientName, sellerName, ...rest } = data;

      const enrichedData: LoanPayload = {
        ...rest,
        client_id: matchedClient.id,
        seller_id: matchedSeller.id,
        total_paid: 0,
        cashboxID: 1,
      };

      mutation.mutate(enrichedData);
    } catch (error) {
      console.error(error);

      return errorsResponse(error);
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        className="h-fit w-1/2 rounded-lg shadow-lg outline-none"
      >
        {clientsQuery.isLoading ||
        clientsQuery.isFetching ||
        sellersQuery.isLoading ||
        sellersQuery.isFetching ? (
          <LoadingSkeletonFormAddLoan />
        ) : (
          <>
            {/* FORM'S CONTAINER */}
            <form
              className="flex h-full w-full flex-col px-8 py-4 text-slate-500 outline-none"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* TITLE'S CONTAINER */}
              <div className="flex gap-4 border-b pb-4">
                <LandmarkIcon className="size-7" />
                <h3 className="w-full text-xl font-semibold">
                  Crear un nuevo prestamo
                </h3>
              </div>
              {/* FIELD'S CONTAINER 1 */}
              <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
                {/* CLIENT NAME INPUT */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Cliente
                  <input
                    {...register("clientName")}
                    placeholder="Nombre del cliente.."
                    list="clientsList"
                    className={`rounded-lg border p-3 shadow-sm outline-none ${
                      errors.clientName
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-green-400"
                    }`}
                  />
                  {errors.clientName && (
                    <span className="text-sm text-red-500">
                      {errors.clientName.message}
                    </span>
                  )}
                </label>
                {/* SELLER NAME INPUT */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Vendedor
                  <input
                    {...register("sellerName")}
                    list="sellersList"
                    placeholder="Nombre del vendedor.."
                    className={`rounded-lg border p-3 shadow-sm outline-none ${
                      errors.sellerName
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-green-400"
                    }`}
                  />
                  {errors.sellerName && (
                    <span className="text-sm text-red-500">
                      {errors.sellerName.message}
                    </span>
                  )}
                </label>
              </div>
              {/* FIELD'S CONTAINER 2 */}
              <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
                {/* PRINCIPAL INPUT */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Capital
                  <input
                    {...register("principal")}
                    type="number"
                    placeholder="Ej: 150000"
                    className={`rounded-lg border p-3 shadow-sm outline-none ${
                      errors.principal
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-green-400"
                    }`}
                  />
                  {errors.principal && (
                    <span className="text-sm text-red-500">
                      {errors.principal.message}
                    </span>
                  )}
                </label>
                {/* COMMISSION INPUT */}
                <label className="flex w-full flex-col gap-1 pt-4 text-sm focus-within:text-green-600">
                  Comision
                  <input
                    {...register("commission")}
                    type="number"
                    placeholder="Ej: 150000"
                    className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                  />
                </label>
              </div>
              {/* FIELD'S CONTAINER 3 */}
              <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
                {/* INSTALLMENT VALUE INPUT */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Valor de las cuotas
                  <input
                    {...register("installment_value")}
                    type="number"
                    placeholder="Ej: 20000"
                    className={`rounded-lg border p-3 shadow-sm outline-none ${
                      errors.installment_value
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-green-400"
                    }`}
                  />
                  {errors.installment_value && (
                    <span className="text-sm text-red-500">
                      {errors.installment_value.message}
                    </span>
                  )}
                </label>
                {/* NUMBER OF INSTALLMENTS VALUE */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Cantidad de cuotas
                  <input
                    {...register("number_of_installments")}
                    type="number"
                    placeholder="Ej: 12"
                    className={`rounded-lg border p-3 shadow-sm outline-none ${
                      errors.number_of_installments
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-green-400"
                    }`}
                  />
                  {errors.number_of_installments && (
                    <span className="text-sm text-red-500">
                      {errors.number_of_installments.message}
                    </span>
                  )}
                </label>
              </div>
              {/* FIELD'S CONTAINER 4 */}
              <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
                {/* PAYMENT FREQUENCY INPUT */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Frecuencia de cobro
                  <select
                    {...register("payment_frequency")}
                    className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
                  >
                    <option className="text-slate-500" value="daily">
                      Diario
                    </option>
                    <option className="text-slate-500" value="weekly">
                      Semanal
                    </option>
                    <option className="text-slate-500" value="biweekly">
                      Quincenal
                    </option>
                    <option className="text-slate-500" value="monthly">
                      Mensual
                    </option>
                  </select>
                </label>
                {/* FIRST DUE DATE INPUT */}
                <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
                  Primer vencimiento
                  <input
                    {...register("first_due_date")}
                    type="date"
                    className={`rounded-lg border p-3 shadow-sm outline-none ${
                      errors.first_due_date
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-green-400"
                    }`}
                  />
                  {errors.first_due_date && (
                    <span className="text-sm text-red-500">
                      {errors.first_due_date.message}
                    </span>
                  )}
                </label>
              </div>
              {/* END MODAL CONTAINER */}
              <div className="flex w-full gap-2 pt-4 text-center">
                {/* CONFIRM BUTTON */}
                <Button
                  isLoading={mutation.isLoading}
                  type="submit"
                  color="success"
                  className="w-full rounded-md text-white"
                >
                  Aceptar
                </Button>
                <Button
                  type="button"
                  onPress={closeModal}
                  color="danger"
                  className="w-full rounded-md text-white"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </>
        )}
      </dialog>
      {/* DATALIST FOR SEARCH CLIENTS INPUT */}
      <datalist id="clientsList">
        {clients.map((client) => (
          <option key={client.id} value={client.name} />
        ))}
      </datalist>
      {/* DATALIST FOR SEARCH SELLERS INPUT */}
      <datalist id="sellersList">
        {sellers.map((seller) => (
          <option key={seller.id} value={seller.name} />
        ))}
      </datalist>
    </>
  );
}

/* LOADINGS */
//loading skeleton for the add loan form
export function LoadingSkeletonFormAddLoan() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col px-8 py-4 text-slate-500">
      {/* TITLE'S CONTAINER */}
      <div className="flex gap-4 border-b pb-4">
        <LandmarkIcon className="size-7" />
        <h3 className="w-full text-xl font-semibold">
          Crear un nuevo prestamo
        </h3>
      </div>

      {/* FIELD GROUPS */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex w-full gap-2 pt-4">
          <div className="flex basis-1/2 flex-col gap-2">
            <div className="h-4 w-1/3 rounded bg-slate-300" />
            <div className="h-10 w-full rounded bg-slate-300" />
          </div>
          <div className="flex basis-1/2 flex-col gap-2">
            <div className="h-4 w-1/3 rounded bg-slate-300" />
            <div className="h-10 w-full rounded bg-slate-300" />
          </div>
        </div>
      ))}

      {/* COMMISSION */}
      <div className="flex flex-col gap-2 pt-4">
        <div className="h-4 w-1/3 rounded bg-slate-300" />
        <div className="h-10 w-full rounded bg-slate-300" />
      </div>

      {/* BUTTONS */}
      <div className="flex w-full gap-2 pt-4">
        <div className="h-10 w-full rounded bg-slate-300" />
        <div className="h-10 w-full rounded bg-slate-300" />
      </div>
    </div>
  );
}

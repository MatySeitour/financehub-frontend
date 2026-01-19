/* IMPORTS */
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { cn } from "@renderer/utils";
import { ModalProps, ServerError } from "@renderer/utils/types";
import {
  AlertCircleIcon,
  PackagePlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import z from "zod";
import { Button } from "../Button";
import { Client } from "@renderer/hooks/clients";
import { Seller } from "@renderer/hooks/sellers";
import { Cashbox } from "@renderer/hooks/cashboxes";
import { Mandatory } from "../Mandatory";
import { ErrorForm } from "../ErrorMessage";
import { toast } from "sonner";
import { Operation } from "@renderer/hooks/operations";

/* DATA TYPES */
//create operation structure
export type OperationForm = z.infer<ReturnType<typeof operationFormSchema>>;

/* UTILS */
//axios
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* SCHEMAS */
//create and edit operation data validation
export function operationFormSchema(clients: Client[], sellers: Seller[]) {
  return z
    .object({
      seller_id: z
        .string()
        .transform((val) => {
          if (val === "") return val;
          const matchedSeller = sellers.find((s) => s.name === val);
          return matchedSeller?.id ? matchedSeller?.id : false;
        })
        .optional()
        .refine((val) => val === "" || val !== false, {
          message: "El Vendedor no existe.",
        }),
      client_id: z
        .string()
        .transform((val) => {
          const matchedClient = clients.find((c) => c.name === val);

          return matchedClient?.id;
        })
        .refine((val) => val, {
          message: "El Cliente no existe.",
        }),
      amount: z
        .number({ message: "Este campo es requerido." })
        .gt(0, "La cantidad debe ser mayor a 0."),
      marketPrice: z
        .number({ message: "Este campo es requerido." })
        .gt(0, "La cantidad debe ser mayor a 0."),
      price: z
        .number({ message: "Este campo es requerido." })
        .gt(0, "La cantidad debe ser mayor a 0."),
      type: z.enum(["buys", "sale"]),
      increase_cashbox_id: z.number({ message: "Este campo es requerido." }),
      decrease_cashbox_id: z.number({ message: "Este campo es requerido." }),
    })
    .refine((val) => val.decrease_cashbox_id !== val.increase_cashbox_id, {
      message:
        "La caja de entrada y la caja de salida no pueden ser las mismas.",
      path: ["decrease_cashbox_id"],
    });
}

/* MODALS */
//create client modal
export function CreateOperationModal({
  isOpen,
  onClose,
  clients,
  sellers,
  cashboxes,
}: ModalProps & {
  clients: Client[];
  sellers: Seller[];
  cashboxes: Cashbox[];
}) {
  /* STATES */

  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  /* MUTATIONS */
  //mutation to create operations
  const mutation = useMutation<OperationForm, ServerError, OperationForm>({
    mutationFn: async (body) => {
      //send new client to backend
      const { data } = await AxiosFetch.post(`/api/v1/operations`, {
        ...body,
        seller_id: body.seller_id ? body.seller_id : undefined,
      });
      //return data for the toast
      return data;
    },
    onSuccess: () => {
      //Forces a refetch
      queryClient.invalidateQueries(["operations", "all"]);

      toast.success("Se ha creado una nueva operación", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  /* QUERIES */

  /* HOOKS */
  //manipulate and validate the data from the form
  const {
    register,
    setValue,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OperationForm>({
    resolver: zodResolver(operationFormSchema(clients, sellers)),
    defaultValues: {
      seller_id: undefined,
    },
  });

  /* EVENT HANDLERS */
  //Executes the mutation when the form is submitted

  const onSubmit: SubmitHandler<OperationForm> = (data) =>
    mutation.mutate(data);
  return (
    <>
      <Modal
        backdrop="opaque"
        radius="sm"
        size="3xl"
        isOpen={isOpen}
        onOpenChange={onClose}
      >
        <ModalContent className="flex flex-col gap-2">
          {(onClose) => (
            <>
              <ModalHeader className="flex h-auto items-center gap-3">
                <PackagePlusIcon className="size-8 min-w-8 text-slate-500" />
                <div className="flex w-fit flex-col justify-center">
                  <p className="text-lg text-slate-500">Crear operación</p>
                </div>
              </ModalHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <ModalBody className="py-0">
                  {/* Client & seller */}
                  <div className="flex w-full items-start gap-4">
                    {/* client name */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Cliente <Mandatory />
                      </div>
                      <input
                        {...register("client_id")}
                        className={cn(
                          errors.client_id
                            ? "border-danger"
                            : "border-slate-300",
                          "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                        )}
                        type="text"
                        autoComplete="off"
                        list="clientsList"
                      />
                      {errors.client_id && (
                        <span className="text-xs text-danger">
                          {errors.client_id?.message}
                        </span>
                      )}
                    </label>
                    {/* seller name */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">Vendedor</div>
                      <input
                        {...register("seller_id")}
                        className={cn(
                          errors.seller_id
                            ? "border-danger"
                            : "border-slate-300",
                          "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                        )}
                        type="text"
                        list="sellersList"
                      />
                      {errors.seller_id && (
                        <span className="text-xs text-danger">
                          {errors.seller_id?.message}
                        </span>
                      )}
                    </label>
                  </div>
                  {/* Increase & decrease cashbox*/}
                  <div className="flex w-full items-start gap-4">
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Divisa <Mandatory />
                      </div>
                      <select
                        onChange={(v) =>
                          setValue("decrease_cashbox_id", +v.target.value)
                        }
                        className={cn(
                          errors.decrease_cashbox_id
                            ? "border-danger"
                            : "border-slate-300",
                          "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                        )}
                      >
                        <option value={undefined}>Selecciona una divisa</option>
                        {cashboxes?.map((cashbox) => (
                          <option key={cashbox.id} value={cashbox.id}>
                            {cashbox.currency.name} - {cashbox.name}
                          </option>
                        ))}
                      </select>
                      {errors.decrease_cashbox_id && (
                        <span className="text-xs text-danger">
                          {errors.decrease_cashbox_id?.message}
                        </span>
                      )}
                    </label>
                    {/* increase cashbox */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Caja de entrada <Mandatory />
                      </div>
                      <select
                        onChange={(v) =>
                          setValue("increase_cashbox_id", +v.target.value)
                        }
                        className={cn(
                          errors.increase_cashbox_id
                            ? "border-danger"
                            : "border-slate-300",
                          "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                        )}
                      >
                        <option value={undefined}>
                          Selecciona una divisa a cobrar
                        </option>
                        {cashboxes?.map((cashbox) => (
                          <option
                            key={`${cashbox.id}-incoming`}
                            value={cashbox.id}
                          >
                            {cashbox.currency.name} - {cashbox.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {/* Amount & type */}
                  <div className="flex w-full items-start gap-4">
                    {/* decrease cashbox */}
                    <Controller
                      name="amount"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Cantidad <Mandatory />
                          </div>
                          <div
                            className={cn(
                              errors.amount
                                ? "border-danger"
                                : "border-slate-300",
                              "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                            )}
                          >
                            $
                            <input
                              onChange={(e) => {
                                const input = e.target.value;

                                const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                                if (!isValid) return;

                                if (
                                  `${field.value}` === "0" &&
                                  input.length === 2 &&
                                  !input.includes(".")
                                ) {
                                  // if the field number is 0 and the input has 2 values, remove the 0
                                  field.onChange(+input[1]);
                                } else {
                                  ////////////////////////////// if input has no values, set default 0
                                  field.onChange(
                                    input[input.length - 1] === "."
                                      ? input
                                      : +input,
                                  );
                                }
                              }}
                              value={field.value}
                              type="text"
                            />
                          </div>
                          {errors.amount && (
                            <span className="text-xs text-danger">
                              {errors.amount?.message}
                            </span>
                          )}
                        </label>
                      )}
                      control={control}
                    />

                    {/* type of operation */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Tipo de operación <Mandatory />
                      </div>
                      <select
                        {...register("type")}
                        className={cn(
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                        )}
                      >
                        <option value="buys">Compra</option>
                        <option value="sale">Venta</option>
                      </select>
                    </label>
                  </div>
                  {/* Price & market price */}
                  <div className="flex w-full items-start gap-4">
                    <Controller
                      name="price"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Precio <Mandatory />
                          </div>
                          <div
                            className={cn(
                              errors.price
                                ? "border-danger"
                                : "border-slate-300",
                              "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                            )}
                          >
                            $
                            <input
                              onChange={(e) => {
                                const input = e.target.value;

                                const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                                if (!isValid) return;

                                if (
                                  `${field.value}` === "0" &&
                                  input.length === 2 &&
                                  !input.includes(".")
                                ) {
                                  // if the field number is 0 and the input has 2 values, remove the 0
                                  field.onChange(+input[1]);
                                } else {
                                  ////////////////////////////// if input has no values, set default 0
                                  field.onChange(
                                    input[input.length - 1] === "."
                                      ? input
                                      : +input,
                                  );
                                }
                              }}
                              value={field.value}
                              type="texst"
                            />
                          </div>
                          {errors.price && (
                            <span className="text-xs text-danger">
                              {errors.price?.message}
                            </span>
                          )}
                        </label>
                      )}
                      control={control}
                    />

                    {/* increase cashbox */}
                    <Controller
                      name="marketPrice"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Precio de mercado <Mandatory />
                          </div>
                          <div
                            className={cn(
                              errors.marketPrice
                                ? "border-danger"
                                : "border-slate-300",
                              "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                            )}
                          >
                            $
                            <input
                              onChange={(e) => {
                                const input = e.target.value;

                                const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                                if (!isValid) return;

                                if (
                                  `${field.value}` === "0" &&
                                  input.length === 2 &&
                                  !input.includes(".")
                                ) {
                                  // if the field number is 0 and the input has 2 values, remove the 0
                                  field.onChange(+input[1]);
                                } else {
                                  ////////////////////////////// if input has no values, set default 0
                                  field.onChange(
                                    input[input.length - 1] === "."
                                      ? input
                                      : +input,
                                  );
                                }
                              }}
                              value={field.value}
                              type="texst"
                            />
                          </div>
                          {errors.marketPrice && (
                            <span className="text-xs text-danger">
                              {errors.marketPrice?.message}
                            </span>
                          )}
                        </label>
                      )}
                      control={control}
                    />
                  </div>
                  {mutation.isError && (
                    <ErrorForm errorMessage={mutation.error} />
                  )}
                </ModalBody>

                <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                  <Button
                    type="submit"
                    isLoading={mutation.isLoading}
                    variant="success"
                    className="w-full"
                  >
                    Confirmar
                  </Button>
                  <Button variant="error" className="w-full" onClick={onClose}>
                    Cancelar
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* DATALIST FOR SEARCH SELLERS INPUT */}
      <datalist id="clientsList">
        {clients?.map((client) => (
          <option key={client.id} value={client.name}></option>
        ))}
      </datalist>
      <datalist id="sellersList">
        {sellers?.map((seller) => (
          <option key={seller.id} value={seller.name}></option>
        ))}
      </datalist>
    </>
  );
}

export function DeleteOperationModal({
  isOpen,
  onClose,
  operation,
}: ModalProps & { operation: Operation }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.delete(
        `/api/v1/operations/${operation.id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations", "all"] });
      toast.success("Se ha eliminado una operación", {
        className: "!border-primary/70",
      });
      onClose && onClose();
    },
  });
  return (
    <Modal
      backdrop="opaque"
      radius="sm"
      size="xl"
      isOpen={isOpen}
      className="!my-0 py-2"
      onOpenChange={() => {
        onClose();
      }}
    >
      <ModalContent className="h-auto gap-2 bg-gradient-to-t from-red-200 via-white to-white">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <div className="flex h-auto w-full flex-col items-center justify-center gap-2">
                <div className="flex items-center rounded-full bg-red-200/30 p-4">
                  <TriangleAlertIcon className="size-12 min-w-12 text-danger" />
                </div>
                <span className="text-xl text-danger">Eliminar operación</span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  ¿Estás seguro que quieres eliminar esta operación? <br />
                  Al confirmar, el monto de está operación volvera a sus
                  respectivas divisas
                </span>
              </div>
            </ModalHeader>
            {mutation?.isError && (
              <div className="flex items-center justify-center px-8">
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                  <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                  <p className="text-sm font-medium text-red-500">
                    {mutation?.error?.code === "connection-error"
                      ? "Ha ocurrido un error de conexión"
                      : "Ha ocurrido un error en el servidor"}
                  </p>
                </div>
              </div>
            )}
            <ModalFooter className="flex h-auto w-full items-center justify-center gap-4 py-2">
              <Button
                isLoading={mutation?.isLoading}
                disabled={mutation?.isLoading}
                onClick={() => mutation.mutate()}
                type="submit"
                variant="error"
              >
                Confirmar
              </Button>
              <Button onClick={onClose} variant="outline">
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

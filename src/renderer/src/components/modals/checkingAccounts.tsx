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
import { cn, getErrorMessage } from "@renderer/utils";
import { ModalProps, ServerError } from "@renderer/utils/types";
import {
  AlertCircleIcon,
  BanknoteArrowUpIcon,
  PackagePlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import z from "zod";
import { Button } from "../Button";
import { Mandatory } from "../Mandatory";
import { ErrorForm } from "../ErrorMessage";
import { toast } from "sonner";
import { Cashbox } from "@renderer/hooks/cashboxes";
import { format, parseISO } from "date-fns";
import { CheckingAccount } from "@renderer/hooks/checkingAccounts";
import { Client } from "@renderer/hooks/clients";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Input = z.infer<ReturnType<typeof inputSchema>>;
function inputSchema(cashboxes: Cashbox[], clients?: Client[]) {
  return z
    .object({
      client_id: z
        .string()
        .transform((val) => {
          const matchedClient = clients?.find((c) => c.name === val);

          return matchedClient?.id;
        })
        .refine((val) => val, {
          message: "El Cliente no existe.",
        }),
      percentage: z
        .number({ message: "Este campo es requerido." })
        .gt(0, "La cantidad debe ser mayor a 0."),
      amount_borrowed: z
        .number({ message: "Este campo es requerido." })
        .gt(0, "La cantidad debe ser mayor a 0."),
      amount_gross: z
        .number({ message: "Este campo es requerido." })
        .gt(0, "La cantidad debe ser mayor a 0."),
      loan_date: z
        .date({ message: "Debe ser una fecha valida" })
        .refine((date) => date.getFullYear() >= 1940, {
          message: "Debe ser una fecha valida",
        }),
      cashbox_id: z.number({ message: "Este campo es requerido." }),
    })
    .superRefine((val, ctx) => {
      if (val.cashbox_id) {
        const cashboxSelected = cashboxes.find(
          (cashbox) => cashbox.id === val.cashbox_id,
        );

        if (cashboxSelected)
          if (cashboxSelected?.value < val.amount_borrowed) {
            ctx.addIssue({
              path: ["amount_borrowed"],
              code: z.ZodIssueCode.custom,
              message: "El monto supera al valor de la caja",
            });
          }
      }
    });
}

export function CreateCheckingAccountModal({
  isOpen,
  onClose,
  cashboxes,
  clients,
  client,
}: ModalProps & {
  cashboxes: Cashbox[];
  clients?: Client[];
  client?: {
    id: number;
    name: string;
  };
}) {
  /* STATES */

  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.post(`/api/v1/checking-accounts`, {
        ...body,
        loan_date: format(body.loan_date, "yyyy-MM-dd hh:mm"),
      });
      return data;
    },
    onSuccess: () => {
      //Forces a refetch

      client
        ? queryClient.invalidateQueries(["checking-account-client", client?.id])
        : queryClient.invalidateQueries(["checking-accounts", "all"]);

      toast.success("Se ha creado una nueva cuenta corriente", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const {
    setValue,
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema(cashboxes ?? [], clients ?? [])),
    defaultValues: {
      client_id: client?.id,
    },
  });

  /* EVENT HANDLERS */
  //Executes the mutation when the form is submitted

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);
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
                  <p className="text-lg text-slate-500">
                    Crear cuenta corriente{" "}
                    {client?.name ? `a ${client?.name}` : ""}
                  </p>
                </div>
              </ModalHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <ModalBody className="py-0">
                  <div className="grid grid-cols-2 gap-4">
                    {/* client name */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Cliente <Mandatory />
                      </div>
                      <input
                        disabled={!!client?.id}
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

                    {/* First due date */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Fecha de generación <Mandatory />
                      </div>
                      <Controller
                        control={control}
                        name="loan_date"
                        render={({ field }) => (
                          <input
                            onChange={(v) =>
                              field.onChange(parseISO(v.target.value))
                            }
                            className={cn(
                              errors.loan_date
                                ? "border-danger"
                                : "border-slate-300",
                              "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                            )}
                            type="date"
                          />
                        )}
                      />

                      {errors.loan_date && (
                        <span className="text-xs text-danger">
                          {errors.loan_date?.message}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Cashbox*/}
                  <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                    <div className="flex items-center gap-0.5">
                      Divisa <Mandatory />
                    </div>
                    <select
                      onChange={(v) => setValue("cashbox_id", +v.target.value)}
                      className={cn(
                        errors.cashbox_id
                          ? "border-danger"
                          : "border-slate-300",
                        "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                      )}
                    >
                      <option value={undefined}>Selecciona una divisa</option>
                      {cashboxes.map((cashbox) => (
                        <option key={cashbox.id} value={cashbox.id}>
                          {cashbox.currency.name} - {cashbox.name}
                        </option>
                      ))}
                    </select>
                    {errors.cashbox_id && (
                      <span className="text-xs text-danger">
                        {errors.cashbox_id?.message}
                      </span>
                    )}
                  </label>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Percentage */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="percentage"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Porcentaje <Mandatory />
                            </div>
                            <div
                              className={cn(
                                errors.percentage
                                  ? "border-danger"
                                  : "border-slate-300",
                                "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                              )}
                            >
                              %
                              <input
                                onChange={(e) => {
                                  const input = e.target.value;

                                  const isValid = /^[0-9]*\.?[0-9]*$/.test(
                                    input,
                                  );
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
                                value={field.value ?? "0"}
                                type="text"
                              />
                            </div>
                            {errors.percentage && (
                              <span className="text-xs text-danger">
                                {errors.percentage?.message}
                              </span>
                            )}
                          </label>
                        )}
                        control={control}
                      />
                    </div>

                    {/* Amount borrowed */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="amount_borrowed"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Monto prestado <Mandatory />
                            </div>
                            <div
                              className={cn(
                                errors.amount_borrowed
                                  ? "border-danger"
                                  : "border-slate-300",
                                "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                              )}
                            >
                              $
                              <input
                                onChange={(e) => {
                                  const input = e.target.value;

                                  const isValid = /^[0-9]*\.?[0-9]*$/.test(
                                    input,
                                  );
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
                                value={field.value ?? "0"}
                                type="text"
                              />
                            </div>
                            {errors.amount_borrowed && (
                              <span className="text-xs text-danger">
                                {errors.amount_borrowed?.message}
                              </span>
                            )}
                          </label>
                        )}
                        control={control}
                      />
                    </div>

                    {/* Amount received */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="amount_gross"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Monto a recibir <Mandatory />
                            </div>
                            <div
                              className={cn(
                                errors.amount_gross
                                  ? "border-danger"
                                  : "border-slate-300",
                                "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                              )}
                            >
                              $
                              <input
                                onChange={(e) => {
                                  const input = e.target.value;

                                  const isValid = /^[0-9]*\.?[0-9]*$/.test(
                                    input,
                                  );
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
                                value={field.value ?? "0"}
                                type="text"
                              />
                            </div>
                            {errors.amount_gross && (
                              <span className="text-xs text-danger">
                                {errors.amount_gross?.message}
                              </span>
                            )}
                          </label>
                        )}
                        control={control}
                      />
                    </div>
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
      <datalist id="clientsList">
        {clients?.map((client) => (
          <option key={client.id} value={client.name}></option>
        ))}
      </datalist>
    </>
  );
}

export function UpdateCheckingAccountModal({
  isOpen,
  onClose,
  client,
  cashboxes,
  checkingAccount,
}: ModalProps & {
  client: {
    id: number;
    name: string;
  };
  cashboxes: Cashbox[];
  checkingAccount: CheckingAccount;
}) {
  /* STATES */

  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.put(
        `/api/v1/checking-accounts/${checkingAccount.id}`,
        {
          ...body,
          client_id: client.id,
          loan_date: format(body.loan_date, "yyyy-MM-dd hh:mm"),
        },
      );
      return data;
    },
    onSuccess: () => {
      //Forces a refetch
      queryClient.invalidateQueries(["checking-account-client", client.id]);

      toast.success("Se ha actualizado una cuenta corriente", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const {
    setValue,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema(cashboxes ?? [])),
    defaultValues: {
      amount_borrowed: checkingAccount.amountBorrowed,
      amount_gross: checkingAccount.amountGross,
      cashbox_id: checkingAccount.cashbox.id,
      loan_date: parseISO(checkingAccount.loanDate),
      percentage: checkingAccount.percentage,
    },
  });

  /* EVENT HANDLERS */
  //Executes the mutation when the form is submitted

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);
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
                  <p className="text-lg text-slate-500">
                    Editar cuenta corriente
                  </p>
                </div>
              </ModalHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <ModalBody className="py-0">
                  <div className="grid grid-cols-2 gap-4">
                    {/* First due date */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Fecha de generación <Mandatory />
                      </div>
                      <Controller
                        control={control}
                        name="loan_date"
                        render={({ field }) => (
                          <input
                            onChange={(v) =>
                              field.onChange(parseISO(v.target.value))
                            }
                            className={cn(
                              errors.loan_date
                                ? "border-danger"
                                : "border-slate-300",
                              "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                            )}
                            type="date"
                            value={format(field.value, "yyyy-MM-dd")}
                          />
                        )}
                      />

                      {errors.loan_date && (
                        <span className="text-xs text-danger">
                          {errors.loan_date?.message}
                        </span>
                      )}
                    </label>

                    {/* Cashbox*/}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Divisa <Mandatory />
                      </div>
                      <select
                        value={watch("cashbox_id") ?? ""}
                        onChange={(e) =>
                          setValue("cashbox_id", Number(e.target.value))
                        }
                        className={cn(
                          errors.cashbox_id
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
                      {errors.cashbox_id && (
                        <span className="text-xs text-danger">
                          {errors.cashbox_id?.message}
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Percentage */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="percentage"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Porcentaje <Mandatory />
                            </div>
                            <div
                              className={cn(
                                errors.percentage
                                  ? "border-danger"
                                  : "border-slate-300",
                                "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                              )}
                            >
                              %
                              <input
                                onChange={(e) => {
                                  const input = e.target.value;

                                  const isValid = /^[0-9]*\.?[0-9]*$/.test(
                                    input,
                                  );
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
                                value={field.value ?? "0"}
                                type="text"
                              />
                            </div>
                            {errors.percentage && (
                              <span className="text-xs text-danger">
                                {errors.percentage?.message}
                              </span>
                            )}
                          </label>
                        )}
                        control={control}
                      />
                    </div>

                    {/* Amount borrowed */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="amount_borrowed"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Monto prestado <Mandatory />
                            </div>
                            <div
                              className={cn(
                                errors.amount_borrowed
                                  ? "border-danger"
                                  : "border-slate-300",
                                "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                              )}
                            >
                              $
                              <input
                                onChange={(e) => {
                                  const input = e.target.value;

                                  const isValid = /^[0-9]*\.?[0-9]*$/.test(
                                    input,
                                  );
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
                                value={field.value ?? "0"}
                                type="text"
                              />
                            </div>
                            {errors.amount_borrowed && (
                              <span className="text-xs text-danger">
                                {errors.amount_borrowed?.message}
                              </span>
                            )}
                          </label>
                        )}
                        control={control}
                      />
                    </div>

                    {/* Amount received */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="amount_gross"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Monto a recibir <Mandatory />
                            </div>
                            <div
                              className={cn(
                                errors.amount_gross
                                  ? "border-danger"
                                  : "border-slate-300",
                                "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                              )}
                            >
                              $
                              <input
                                onChange={(e) => {
                                  const input = e.target.value;

                                  const isValid = /^[0-9]*\.?[0-9]*$/.test(
                                    input,
                                  );
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
                                value={field.value ?? "0"}
                                type="text"
                              />
                            </div>
                            {errors.amount_gross && (
                              <span className="text-xs text-danger">
                                {errors.amount_gross?.message}
                              </span>
                            )}
                          </label>
                        )}
                        control={control}
                      />
                    </div>
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
    </>
  );
}

export function DeleteCheckingAccountModal({
  isOpen,
  onClose,
  checkingAccount,
}: ModalProps & { checkingAccount: CheckingAccount }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.delete(
        `/api/v1/checking-accounts/${checkingAccount.id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client", checkingAccount.client.id],
      });
      toast.success("Se ha eliminado un cuenta corriente", {
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
                <span className="text-xl text-danger">
                  Eliminar cuenta corriente
                </span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  ¿Estás seguro que quieres eliminar una cuenta corriente de{" "}
                  {checkingAccount.client.name}?
                </span>
              </div>
            </ModalHeader>
            {mutation?.isError && (
              <div className="flex items-center justify-center px-8">
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                  <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {getErrorMessage(mutation.error)}
                  </span>
                </div>
              </div>
            )}
            <ModalFooter className="flex h-auto w-full items-center justify-center gap-4 py-2">
              <Button
                isLoading={mutation?.isLoading}
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

export function PaidCheckingAccountModal({
  isOpen,
  onClose,
  checkingAccount,
}: ModalProps & { checkingAccount: CheckingAccount }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.patch(
        `/api/v1/checking-accounts/${checkingAccount.id}/paid`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client", checkingAccount.client.id],
      });
      toast.success("Se ha pagado una cuenta corriente", {
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
      <ModalContent className="h-auto gap-2 bg-white">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <div className="flex h-auto w-full flex-col items-center justify-center gap-2">
                <div className="flex items-center rounded-full bg-primary/10 p-4">
                  <BanknoteArrowUpIcon className="size-12 min-w-12 text-primary" />
                </div>
                <span className="text-xl text-slate-500">
                  Pagar cuenta corriente
                </span>
                <span className="text-balance text-center text-sm font-normal text-slate-400">
                  Esta cuenta corriente pasará a estado de{" "}
                  <b className="text-primary">Pagada</b>
                </span>
              </div>
            </ModalHeader>
            {mutation?.isError && (
              <div className="flex items-center justify-center px-8">
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                  <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {getErrorMessage(mutation.error)}
                  </span>
                </div>
              </div>
            )}
            <ModalFooter className="flex h-auto w-full items-center justify-center gap-4 py-2">
              <Button
                isLoading={mutation?.isLoading}
                onClick={() => mutation.mutate()}
                type="submit"
                variant="success"
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

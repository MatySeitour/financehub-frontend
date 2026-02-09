/* IMPORTS */

import axios from "@renderer/hooks/axios";
import { ModalProps, ServerError } from "@renderer/utils/types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import z from "zod";
import { cn } from "@renderer/utils";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../Button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import {
  AlertCircleIcon,
  BanknoteArrowUpIcon,
  InfoIcon,
  PiggyBankIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Client } from "@renderer/hooks/clients";
import { Seller } from "@renderer/hooks/sellers";
import { Cashbox, getCashboxes } from "@renderer/hooks/cashboxes";
import { Mandatory } from "../Mandatory";
import { Loan, PaymentFrequency } from "@renderer/hooks/loans";
import { toast } from "sonner";
import { ErrorForm } from "../ErrorMessage";
import { format, parseISO } from "date-fns";
import { TInstallment } from "@renderer/hooks/installments";
import { getCurrencies } from "@renderer/hooks/currencies";

/* ENUMS */
const paymentFrequency = ["daily", "weekly", "biweekly", "monthly"] as const;

/* DATA TYPES */
//create loan structure
export type LoanForm = z.infer<ReturnType<typeof loanFormSchema>>;
//
export type addPayInstallment = z.infer<
  ReturnType<typeof addPayInstallmentSchema>
>;

/* UTILS */
//axios
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

const paymentFrequencyLabels: Record<
  (typeof paymentFrequency)[number],
  string
> = {
  daily: "Diario",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export function loanFormSchema(clients: Client[], sellers: Seller[]) {
  return z.object({
    client_id: z
      .string()
      .transform((val) => {
        const matchedClient = clients.find((c) => c.name === val);

        return matchedClient?.id;
      })
      .refine((val) => val, {
        message: "El Cliente no existe.",
      }),
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
    principal: z
      .number({ message: "Este campo es requerido." })
      .gt(0, "La cantidad debe ser mayor a 0."),
    cashboxID: z.number({ message: "Este campo es requerido." }),
    number_of_installments: z
      .number({ message: "Este campo es requerido." })
      .gt(0, "La cantidad debe ser mayor a 0."),
    payment_frequency: z.enum(paymentFrequency, {
      message: "Este campo es requerido.",
    }),
    commission: z.number({ message: "Este campo es requerido." }),
    first_due_date: z.date(),
    installment_value: z
      .number({ message: "Este campo es requerido" })
      .gt(0, "La cantidad debe ser mayor a 0."),
  });
}
//
export function addPayInstallmentSchema(
  installmentValue: number,
  lastInstallmentValue: TInstallment,
) {
  return z
    .object({
      payment_amount: z
        .number({ message: "Este campo  es requerido." })
        .gt(0, { message: "El monto debe ser mayor a 0" }),
      payment_date: z.date({ message: "Debe ser una fecha valida" }),

      currency_id: z.number({ message: "Selecciona una divisa" }),
      cashbox_id: z.number({ message: "Este campo es requerido" }),
    })
    .refine(
      (val) => {
        const totalPaid =
          lastInstallmentValue.paymentAmount + val.payment_amount;

        if (totalPaid < installmentValue) return true;

        if (!val.payment_date) return false;

        const year = val.payment_date.getFullYear();
        return year >= 1900 && year <= 2100;
      },

      {
        message: "La fecha de pago es requerida si esta cuota se completa",
        path: ["payment_date"],
      },
    );
}

/* MODALS */
//create loan modal
export function CreateLoanModal({
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
  //
  const queryClient = useQueryClient();

  /* QUERIES */

  /* MUTATIONS */
  //mutation to create operations
  const mutation = useMutation<LoanForm, ServerError, LoanForm>({
    mutationFn: async (body) => {
      //send new client to backend
      const { data } = await AxiosFetch.post(`/api/v1/loans`, {
        ...body,
        seller_id: body.seller_id ? body.seller_id : undefined,
        first_due_date: format(body.first_due_date, "yyyy-MM-dd"),
      });
      //return data for the toast
      return data;
    },
    onSuccess: () => {
      //Forces a refetch
      queryClient.invalidateQueries(["loans", "all"]);

      toast.success("Se ha creado un nuevo préstamo.", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  /* HOOKS */
  //
  const {
    register,
    setValue,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanForm>({
    resolver: zodResolver(loanFormSchema(clients, sellers)),
    defaultValues: {},
  });

  /* EVENT HANDLERS */
  const onSubmit: SubmitHandler<LoanForm> = (data) => {
    mutation.mutate(data);
  };

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
                <PiggyBankIcon className="size-8 min-w-8 text-slate-500" />
                <div className="flex w-fit flex-col justify-center">
                  <p className="text-lg text-slate-500">Crear préstamo</p>
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
                  {/* Decrease cashbox & principal */}
                  <div className="flex w-full items-start gap-4">
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Divisa <Mandatory />
                      </div>
                      <select
                        onChange={(v) => setValue("cashboxID", +v.target.value)}
                        className={cn(
                          errors.cashboxID
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
                      {errors.cashboxID && (
                        <span className="text-xs text-danger">
                          {errors.cashboxID?.message}
                        </span>
                      )}
                    </label>
                    {/* Principal */}
                    <Controller
                      defaultValue={0}
                      name="principal"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Capital <Mandatory />
                          </div>
                          <div
                            className={cn(
                              errors.principal
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
                          {errors.principal && (
                            <span className="text-xs text-danger">
                              {errors.principal?.message}
                            </span>
                          )}
                        </label>
                      )}
                      control={control}
                    />
                  </div>
                  {/* installment value & commission */}
                  <div className="flex w-full items-start gap-4">
                    {/* increase cashbox */}
                    <Controller
                      defaultValue={0}
                      name="installment_value"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Valor de las cuotas <Mandatory />
                          </div>
                          <div
                            className={cn(
                              errors.installment_value
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
                          {errors.installment_value && (
                            <span className="text-xs text-danger">
                              {errors.installment_value?.message}
                            </span>
                          )}
                        </label>
                      )}
                      control={control}
                    />

                    {/* Commission */}
                    <Controller
                      defaultValue={0}
                      name="commission"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          {!watch("seller_id") ? (
                            <>
                              <Tooltip
                                offset={2}
                                color="success"
                                className="text-xs text-white"
                                closeDelay={0}
                                content="Selecciona un vendedor para ingresar la comisión"
                              >
                                <div className="flex w-fit items-center gap-1.5">
                                  Comisión{" "}
                                  <InfoIcon className="size-4 min-w-4 text-slate-400/70 transition-all hover:text-slate-400" />
                                </div>
                              </Tooltip>
                              <div
                                className={cn(
                                  errors.commission
                                    ? "border-danger"
                                    : "border-slate-300",
                                  "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm opacity-60 outline-none focus-within:border-primary",
                                )}
                              >
                                <input
                                  disabled
                                  className="w-full"
                                  placeholder="Sin comisión"
                                  value={undefined}
                                  type="text"
                                />
                              </div>
                              {errors.commission && (
                                <span className="text-xs text-danger">
                                  {errors.commission?.message}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-0.5">
                                Comisión <Mandatory />
                              </div>
                              <div
                                className={cn(
                                  errors.commission
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
                                  className="w-full"
                                  value={field.value}
                                  type="text"
                                />
                              </div>
                              {errors.commission && (
                                <span className="text-xs text-danger">
                                  {errors.commission?.message}
                                </span>
                              )}
                            </>
                          )}
                        </label>
                      )}
                      control={control}
                    />
                  </div>
                  {/* Payment frequency & first due date & number of installments */}
                  <div className="flex w-full items-start gap-4">
                    {/* Payment frequency */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Frecuencia de cobro <Mandatory />
                      </div>
                      <select
                        onChange={(v) =>
                          setValue(
                            "payment_frequency",
                            v.target.value as PaymentFrequency,
                          )
                        }
                        className={cn(
                          errors.payment_frequency
                            ? "border-danger"
                            : "border-slate-300",
                          "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                        )}
                      >
                        {paymentFrequency?.map((frequency) => (
                          <option key={frequency} value={frequency}>
                            {paymentFrequencyLabels[frequency]}
                          </option>
                        ))}
                      </select>
                      {errors.payment_frequency && (
                        <span className="text-xs text-danger">
                          {errors.payment_frequency?.message}
                        </span>
                      )}
                    </label>
                    {/* First due date */}
                    <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                      <div className="flex items-center gap-0.5">
                        Primer vencimiento <Mandatory />
                      </div>
                      <Controller
                        control={control}
                        name="first_due_date"
                        render={({ field }) => (
                          <input
                            onChange={(v) =>
                              field.onChange(parseISO(v.target.value))
                            }
                            className={cn(
                              "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                            )}
                            type="date"
                          />
                        )}
                      />
                    </label>
                    {/*  */}
                    <Controller
                      defaultValue={0}
                      name="number_of_installments"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Cantidad de cuotas <Mandatory />
                          </div>
                          <div
                            className={cn(
                              errors.number_of_installments
                                ? "border-danger"
                                : "border-slate-300",
                              "flex h-9 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
                            )}
                          >
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
                          {errors.number_of_installments && (
                            <span className="text-xs text-danger">
                              {errors.number_of_installments?.message}
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
//add pay to loan modal
export function AddPayModal({
  isOpen,
  onClose,
  loanId,
  lastInstallmentPaid,
  installmentValue,
}: ModalProps & {
  loanId: number;
  lastInstallmentPaid: TInstallment;
  installmentValue: number;
}) {
  /* UTILS */
  //
  const queryClient = useQueryClient();

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  const currenciesQuery = useQuery<
    Awaited<ReturnType<typeof getCurrencies>>,
    ServerError
  >({
    queryKey: ["currencies", "all"],
    queryFn: getCurrencies,
  });

  /* MUTATIONS */
  //mutation to create operations
  const mutation = useMutation<
    addPayInstallment,
    ServerError,
    addPayInstallment
  >({
    mutationFn: async (body) => {
      // send new client to backend
      const { data } = await AxiosFetch.put(
        `/api/v1/loans/${loanId}/installments`,
        body,
      );
      //return data for the toast
      return data;
    },
    onSuccess: () => {
      //Forces a refetch
      queryClient.invalidateQueries(["loans", loanId]);

      toast.success("Se ha actualizado el préstamo.", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  /* HOOKS */
  //
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<addPayInstallment>({
    resolver: zodResolver(
      addPayInstallmentSchema(installmentValue, lastInstallmentPaid),
    ),
    defaultValues: {
      payment_date: new Date(),
    },
  });

  /* EVENT HANDLERS */
  const onSubmit: SubmitHandler<addPayInstallment> = (data) => {
    mutation.mutate(data);
  };

  const cashboxFiltered =
    watch("currency_id") !== undefined && cashboxesQuery.data
      ? cashboxesQuery.data?.filter(
          (cashbox) => cashbox.currency.id === watch("currency_id"),
        )
      : [];

  return (
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
              <BanknoteArrowUpIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Agregar pago</p>
              </div>
            </ModalHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                {/* Payment amount & payment date */}
                <div className="flex w-full items-start gap-4">
                  {/* Payment amount */}
                  <Controller
                    defaultValue={0}
                    name="payment_amount"
                    render={({ field }) => (
                      <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                        <div className="flex items-center gap-0.5">
                          Monto <Mandatory />
                        </div>
                        <div
                          className={cn(
                            errors.payment_amount
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
                        {errors.payment_amount && (
                          <span className="text-xs text-danger">
                            {errors.payment_amount?.message}
                          </span>
                        )}
                      </label>
                    )}
                    control={control}
                  />
                  {/* Payment date */}
                  <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                    <div className="flex items-center gap-0.5">
                      Fecha de pago <Mandatory />
                    </div>
                    <Controller
                      control={control}
                      name="payment_date"
                      render={({ field }) => (
                        <input
                          onChange={(v) =>
                            field.onChange(parseISO(v.target.value))
                          }
                          className={cn(
                            errors.payment_date
                              ? "border-danger"
                              : "border-slate-300",
                            "flex h-9 w-full items-center gap-2 rounded-md border px-2 text-sm outline-none focus:border-primary",
                          )}
                          type="date"
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                        />
                      )}
                    />

                    {errors.payment_date && (
                      <span className="text-xs text-danger">
                        {errors.payment_date?.message}
                      </span>
                    )}
                  </label>
                </div>

                <div className="flex w-full items-start gap-4">
                  {/* currency */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Divisa
                    </label>

                    <Controller
                      name="currency_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona una divisa"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                          }}
                          className={cn(
                            errors.currency_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {(currenciesQuery.data ?? []).map((filter) => (
                            <SelectItem
                              textValue={`${filter.name} (${filter.nomenclature})`}
                              classNames={{
                                base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                              }}
                              className="flex items-center gap-1"
                              key={filter.id}
                            >
                              <span className="text-sm">{filter.name}</span>{" "}
                              <span className="text-xs text-slate-400">
                                ({filter.nomenclature})
                              </span>
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.currency_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.currency_id.message}
                      </p>
                    )}
                  </div>

                  {/* cashbox */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Caja
                    </label>

                    <Controller
                      name="cashbox_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          disabled={!watch("currency_id")}
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona una caja"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                          }}
                          className={cn(
                            errors.cashbox_id?.message && "!border-red-500",
                            !watch("currency_id") && "opacity-60",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {cashboxFiltered?.map((filter) => (
                            <SelectItem
                              textValue={`${filter.name}`}
                              classNames={{
                                base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                              }}
                              className="flex items-center gap-1"
                              key={filter.id}
                            >
                              <span className="text-sm">{filter.name}</span>
                              {"  "}
                              {filter.state === 0 ? (
                                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[0.63rem] text-danger">
                                  Cerrada
                                </span>
                              ) : (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.63rem] text-primary">
                                  Abierta
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.cashbox_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.cashbox_id.message}
                      </p>
                    )}
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
  );
}
//delete loan modal
export function DeleteLoanModal({
  isOpen,
  onClose,
  loan,
}: ModalProps & { loan: Loan }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.delete(`/api/v1/loans/${loan.id}`);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", "all"] });
      toast.success("Se ha eliminado un préstamo", {
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
                <span className="text-xl text-danger">Eliminar préstamo</span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  ¿Estás seguro que quieres eliminar este préstamo?
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

/* IMPORTS */
import {
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { cn, getErrorMessage } from "@renderer/utils";
import { ModalProps, ServerError } from "@renderer/utils/types";
import {
  AlertCircleIcon,
  BanknoteArrowUpIcon,
  ChevronDownIcon,
  InfoIcon,
  PackagePlusIcon,
  PercentIcon,
  ShieldCheckIcon,
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
import {
  TCheckingAccountMoviment,
  TCheckingAccountPercentage,
} from "@renderer/hooks/checkingAccounts";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

type TCheckingMovimentDetail = {
  checkingClientID: number;
  client: {
    id: number;
    name: string;
  };
  percentage: {
    id: number;
    name: string;
  };
};

export type Input = z.infer<typeof inputSchema>;
const inputSchema = z.object({
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
  increase_cashbox_id: z.number({ message: "Este campo es requerido." }),
  decrease_cashbox_id: z.number({ message: "Este campo es requerido." }),
  is_cash: z.boolean(),
});

export function CreateCheckingAccountMovimentModal({
  isOpen,
  onClose,
  cashboxes,
  checkingMovimentDetail,
}: ModalProps & {
  cashboxes: Cashbox[];
  checkingMovimentDetail: TCheckingMovimentDetail;
}) {
  /* STATES */

  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.post(
        `/api/v1/checking-accounts/${checkingMovimentDetail.client?.id}/percentages/${checkingMovimentDetail.percentage?.id}/moviments`,
        {
          ...body,
          loan_date: format(body.loan_date, "yyyy-MM-dd hh:mm"),
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["checking-account-client"]);
      queryClient.invalidateQueries(["percentages"]);

      toast.success(
        `Se ha creado un préstamo a ${checkingMovimentDetail.client?.name}`,
        {
          className: "!border-primary/70",
        },
      );
      onClose();
    },
  });

  const {
    watch,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      is_cash: false,
    },
  });

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
                    Crear préstamo a{" "}
                    {checkingMovimentDetail.client?.name
                      ? `a ${checkingMovimentDetail.client?.name}`
                      : ""}{" "}
                    con porcentaje %{checkingMovimentDetail.percentage.name}
                  </p>
                </div>
              </ModalHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <ModalBody className="py-0">
                  <div className="gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* Increment cashbox */}
                    <div className="flex w-full flex-col gap-1">
                      <label
                        htmlFor="increase_cashbox_id"
                        className="text-sm text-slate-500"
                      >
                        Divisa a recibir <Mandatory />
                      </label>

                      <Controller
                        name="increase_cashbox_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            selectedKeys={field.value ? `${field.value}` : ""}
                            placeholder="Selecciona una caja"
                            aria-label="filters"
                            classNames={{
                              innerWrapper: "rounded-md",
                              mainWrapper: "rounded-md",
                              popoverContent: "rounded-md font-normal",
                              trigger:
                                "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                              value: "!text-slate-500",
                            }}
                            className={cn(
                              errors.increase_cashbox_id?.message &&
                                "!border-red-500",

                              "min-h-9 rounded-md border border-slate-300 outline-none",
                            )}
                            //  selectedKeys={new Set([selected.name])}
                            onSelectionChange={(key) => {
                              if (key.currentKey)
                                field.onChange(+key.currentKey);
                            }}
                            renderValue={() => {
                              const selected = cashboxes?.find(
                                (cashbox) =>
                                  String(cashbox.id) === String(field.value),
                              );
                              if (!selected) return null;

                              return (
                                <div
                                  className="flex items-center gap-1"
                                  key={selected.id}
                                >
                                  <span className="text-sm">
                                    {selected.name}
                                  </span>
                                  <span className="text-xs tabular-nums text-slate-400">
                                    (${selected.value.toLocaleString("es-AR")})
                                  </span>

                                  {"  "}
                                  {selected.state === 0 ? (
                                    <span className="rounded-full bg-danger/10 px-2 text-[0.63rem] text-danger">
                                      Cerrada
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-primary/10 px-2 text-[0.63rem] text-primary">
                                      Abierta
                                    </span>
                                  )}
                                </div>
                              );
                            }}
                          >
                            {cashboxes?.map((filter) => (
                              <SelectItem
                                textValue={`${filter.name}`}
                                classNames={{
                                  base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                                }}
                                className="flex items-center"
                                key={filter.id}
                              >
                                <span className="mr-1 text-sm">
                                  {filter.name}
                                </span>
                                <span className="text-xs tabular-nums text-slate-400">
                                  (${filter.value.toLocaleString("es-AR")})
                                </span>

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
                      {errors.increase_cashbox_id && (
                        <p className="text-xs font-medium text-red-500">
                          {errors.increase_cashbox_id.message}
                        </p>
                      )}
                    </div>

                    {/* Decrement cashbox */}
                    <div className="flex w-full flex-col gap-1">
                      <label
                        htmlFor="decrease_cashbox_id"
                        className="text-sm text-slate-500"
                      >
                        Divisa a prestar <Mandatory />
                      </label>

                      <Controller
                        name="decrease_cashbox_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            selectedKeys={field.value ? `${field.value}` : ""}
                            placeholder="Selecciona una caja"
                            aria-label="filters"
                            classNames={{
                              innerWrapper: "rounded-md",
                              mainWrapper: "rounded-md",
                              popoverContent: "rounded-md font-normal",
                              trigger:
                                "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                              value: "!text-slate-500",
                            }}
                            className={cn(
                              errors.decrease_cashbox_id?.message &&
                                "!border-red-500",

                              "min-h-9 rounded-md border border-slate-300 outline-none",
                            )}
                            //  selectedKeys={new Set([selected.name])}
                            onSelectionChange={(key) => {
                              if (key.currentKey)
                                field.onChange(+key.currentKey);
                            }}
                            renderValue={() => {
                              const selected = cashboxes?.find(
                                (cashbox) =>
                                  String(cashbox.id) === String(field.value),
                              );
                              if (!selected) return null;

                              return (
                                <div
                                  className="flex items-center gap-1"
                                  key={selected.id}
                                >
                                  <span className="text-sm">
                                    {selected.name}
                                  </span>
                                  <span className="text-xs tabular-nums text-slate-400">
                                    (${selected.value.toLocaleString("es-AR")})
                                  </span>

                                  {"  "}
                                  {selected.state === 0 ? (
                                    <span className="rounded-full bg-danger/10 px-2 text-[0.63rem] text-danger">
                                      Cerrada
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-primary/10 px-2 text-[0.63rem] text-primary">
                                      Abierta
                                    </span>
                                  )}
                                </div>
                              );
                            }}
                          >
                            {cashboxes?.map((filter) => (
                              <SelectItem
                                textValue={`${filter.name}`}
                                classNames={{
                                  base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                                }}
                                className="flex items-center"
                                key={filter.id}
                              >
                                <span className="mr-1 text-sm">
                                  {filter.name}
                                </span>
                                <span className="text-xs tabular-nums text-slate-400">
                                  (${filter.value.toLocaleString("es-AR")})
                                </span>

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
                      {errors.decrease_cashbox_id && (
                        <p className="text-xs font-medium text-red-500">
                          {errors.decrease_cashbox_id.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-md border border-slate-300 bg-[#FAFAFA] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-500">
                          Tipo de préstamo
                        </span>
                        <span className="text-xs text-slate-400/80">
                          Marca si vas a entregar efectivo. Desmarca si vas a
                          entregar transferencia
                        </span>
                      </div>

                      <Controller
                        name="is_cash"
                        render={({ field }) => (
                          <Checkbox
                            aria-label={`${field.value}`}
                            isSelected={field.value ?? false}
                            onValueChange={(e) => field.onChange(e)}
                            radius="lg"
                            className="text-sm"
                            classNames={{
                              label: " text-slate-500 text-sm",
                              base: "rounded-md",
                              wrapper: " rounded-md",
                            }}
                            defaultSelected
                          ></Checkbox>
                        )}
                        control={control}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Amount received */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="amount_gross"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Monto{" "}
                              {watch("is_cash")
                                ? "en transferencia"
                                : "en efectivo"}{" "}
                              a recibir <Mandatory />
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

                    {/* Amount borrowed */}
                    <div className="flex w-full items-start gap-4">
                      <Controller
                        name="amount_borrowed"
                        render={({ field }) => (
                          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                            <div className="flex items-center gap-0.5">
                              Monto{" "}
                              {watch("is_cash")
                                ? "en efectivo"
                                : "en transferencia"}{" "}
                              a prestar <Mandatory />
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

export function UpdateCheckingAccountMovimentModal({
  isOpen,
  onClose,
  cashboxes,
  checkingMovimentDetail,
  moviment,
}: ModalProps & {
  cashboxes: Cashbox[];
  checkingMovimentDetail: TCheckingMovimentDetail;
  moviment: TCheckingAccountMoviment;
}) {
  /* STATES */

  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.put(
        `/api/v1/checking-accounts/${checkingMovimentDetail.client?.id}/percentages/${checkingMovimentDetail.percentage?.id}/moviments/${moviment.id}`,
        {
          ...body,
          loan_date: format(body.loan_date, "yyyy-MM-dd hh:mm"),
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["checking-account-client"]);
      queryClient.invalidateQueries(["percentages"]);

      toast.success(
        `Se ha modificado un préstamo a ${checkingMovimentDetail.client?.name}`,
        {
          className: "!border-primary/70",
        },
      );
      onClose();
    },
  });

  const {
    watch,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      is_cash: moviment.isCash === 1 ? true : false,
      amount_borrowed: moviment.amountBorrowed,
      amount_gross: moviment.amountGross,
      loan_date: new Date(moviment.loanDate),
      increase_cashbox_id: moviment.cashboxIncrement.id,
      decrease_cashbox_id: moviment.cashboxDecrement.id,
    },
  });

  console.log(watch("loan_date"));

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);
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
              <PackagePlusIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">
                  Editar préstamo a{" "}
                  {checkingMovimentDetail.client?.name
                    ? `a ${checkingMovimentDetail.client?.name}`
                    : ""}{" "}
                  con porcentaje %{checkingMovimentDetail.percentage.name}
                </p>
              </div>
            </ModalHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="gap-4">
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
                          onChange={(v) => {
                            console.log("este es v", v);
                            field.onChange(parseISO(v.target.value));
                          }}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Increment cashbox */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="increase_cashbox_id"
                      className="text-sm text-slate-500"
                    >
                      Divisa a recibir <Mandatory />
                    </label>

                    <Controller
                      name="increase_cashbox_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona una caja"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                            value: "!text-slate-500",
                          }}
                          className={cn(
                            errors.increase_cashbox_id?.message &&
                              "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {cashboxes?.map((filter) => (
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
                    {errors.increase_cashbox_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.increase_cashbox_id.message}
                      </p>
                    )}
                  </div>

                  {/* Decrement cashbox */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="decrease_cashbox_id"
                      className="text-sm text-slate-500"
                    >
                      Divisa a prestar <Mandatory />
                    </label>

                    <Controller
                      name="decrease_cashbox_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona una caja"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                            value: "!text-slate-500",
                          }}
                          className={cn(
                            errors.decrease_cashbox_id?.message &&
                              "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {cashboxes?.map((filter) => (
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
                    {errors.decrease_cashbox_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.decrease_cashbox_id.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 rounded-md border border-slate-300 bg-[#FAFAFA] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-500">
                        Tipo de préstamo
                      </span>
                      <span className="text-xs text-slate-400/80">
                        Marca si vas a entregar efectivo. Desmarca si vas a
                        entregar transferencia
                      </span>
                    </div>

                    <Controller
                      name="is_cash"
                      render={({ field }) => (
                        <Checkbox
                          aria-label={`${field.value}`}
                          isSelected={field.value ?? false}
                          onValueChange={(e) => field.onChange(e)}
                          radius="lg"
                          className="text-sm"
                          classNames={{
                            label: " text-slate-500 text-sm",
                            base: "rounded-md",
                            wrapper: " rounded-md",
                          }}
                          defaultSelected
                        ></Checkbox>
                      )}
                      control={control}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount received */}
                  <div className="flex w-full items-start gap-4">
                    <Controller
                      name="amount_gross"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Monto{" "}
                            {watch("is_cash")
                              ? "en transferencia"
                              : "en efectivo"}{" "}
                            a recibir <Mandatory />
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

                  {/* Amount borrowed */}
                  <div className="flex w-full items-start gap-4">
                    <Controller
                      name="amount_borrowed"
                      render={({ field }) => (
                        <label className="flex w-full flex-col gap-0.5 text-sm text-slate-500">
                          <div className="flex items-center gap-0.5">
                            Monto{" "}
                            {watch("is_cash")
                              ? "en efectivo"
                              : "en transferencia"}{" "}
                            a prestar <Mandatory />
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

export function DisabledCheckingAccountModal({
  isOpen,
  onClose,
  moviment,
  checkingMovimentDetail,
}: ModalProps & {
  moviment: TCheckingAccountMoviment;
  checkingMovimentDetail: TCheckingMovimentDetail;
}) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.patch(
        `/api/v1/checking-accounts/${checkingMovimentDetail.checkingClientID}/moviments/${moviment.id}/action`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client"],
      });
      toast.success("Se ha deshabilitado un préstamo", {
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
                  Deshabilitar préstamo de {checkingMovimentDetail.client.name}
                </span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  Esta acción provocara que se revierta el préstamo, tanto en
                  las cajas como en los movimientos involucrados
                </span>
                <span className="text-balance text-center text-sm font-medium text-red-600">
                  {" "}
                  ¿Estás seguro que desea continuar?
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

export function EnabledCheckingAccountModal({
  isOpen,
  onClose,
  moviment,
  checkingMovimentDetail,
}: ModalProps & {
  moviment: TCheckingAccountMoviment;
  checkingMovimentDetail: TCheckingMovimentDetail;
}) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.patch(
        `/api/v1/checking-accounts/${checkingMovimentDetail.checkingClientID}/moviments/${moviment.id}/action`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client"],
      });
      toast.success("Se ha deshabilitado un préstamo", {
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
      <ModalContent className="h-auto gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <div className="flex h-auto w-full flex-col items-center justify-center gap-2">
                <div className="flex items-center rounded-full bg-primary/5 p-4">
                  <ShieldCheckIcon className="size-12 min-w-12 text-primary" />
                </div>
                <span className="text-xl text-slate-400">
                  Habilitar préstamo de {checkingMovimentDetail.client.name}
                </span>
                <span className="text-balance text-center text-sm font-normal text-slate-400/70">
                  Esta acción provocara cambios tanto en las cajas como en los
                  movimientos involucrados
                </span>
                <span className="text-balance text-center text-sm font-medium text-slate-500">
                  {" "}
                  ¿Estás seguro que desea continuar?
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

export function PaidCheckingAccountModal({
  isOpen,
  onClose,
  moviment,
  checkingMovimentDetail,
}: ModalProps & {
  moviment: TCheckingAccountMoviment;
  checkingMovimentDetail: TCheckingMovimentDetail;
}) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.patch(
        `/api/v1/checking-accounts/${checkingMovimentDetail.client.id}/moviments/${moviment.id}/paid`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client"],
      });
      toast.success("Se ha pagado préstamo de una cuenta corriente", {
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
              <div className="flex h-auto w-full flex-col items-center justify-center gap-4">
                <div className="flex items-center rounded-full bg-primary/10 p-4">
                  <BanknoteArrowUpIcon className="size-12 min-w-12 text-primary" />
                </div>
                <span className="text-xl text-slate-500">
                  Pagar cuenta corriente de {checkingMovimentDetail.client.name}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="relative h-10">
                    <ChevronDownIcon className="absolute -top-3 size-10 min-w-10 translate-x-8 text-slate-300/40" />
                    <ChevronDownIcon className="absolute top-0 size-10 min-w-10 translate-x-8 text-slate-300/40" />
                    <ChevronDownIcon className="absolute top-3 size-10 min-w-10 translate-x-8 text-slate-300/40" />
                  </div>

                  <span className="text-primary">
                    ${moviment.amountGross.toLocaleString("es-AR")}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-balance text-center text-sm font-normal text-slate-400/80">
                  <InfoIcon className="size-4 min-w-4" />
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

export function CreatePercentageCheckingAccountModal({
  isOpen,
  onClose,
  checkingClientID,
}: ModalProps & { checkingClientID: number }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ percentage: string }>({
    resolver: zodResolver(
      z.object({
        percentage: z.number().min(1, { message: "Campo requerido" }),
      }),
    ),
    defaultValues: {
      percentage: "",
    },
  });

  const mutation = useMutation<void, ServerError, { percentage: string }>({
    mutationFn: async (body: { percentage: string }) => {
      const { data } = await AxiosFetch.post(
        `/api/v1/checking-accounts/${checkingClientID}/percentages`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client"],
      });
      toast.success("Se ha creado un porcentaje", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<{ percentage: string }> = (data) =>
    mutation.mutate(data);

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
            <ModalHeader className="flex h-auto items-center gap-2">
              <PercentIcon className="size-6 min-w-6 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Crear porcentaje</p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
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
                {mutation?.isError && (
                  <div className="flex items-center justify-center">
                    <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                      <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        {getErrorMessage(mutation.error)}
                      </span>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                <Button
                  isLoading={mutation?.isLoading}
                  disabled={mutation?.isLoading}
                  type="submit"
                  variant="success"
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button
                  variant="error"
                  className="w-full"
                  type="button"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export function UpdatePercentageCheckingAccountModal({
  isOpen,
  onClose,
  checkingClientID,
  percentage,
}: ModalProps & {
  checkingClientID: number;
  percentage: TCheckingAccountPercentage;
}) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ percentage: string }>({
    resolver: zodResolver(
      z.object({
        percentage: z.number().min(1, { message: "Campo requerido" }),
      }),
    ),
    defaultValues: {
      percentage: percentage.percentage,
    },
  });

  const mutation = useMutation<void, ServerError, { percentage: string }>({
    mutationFn: async (body: { percentage: string }) => {
      const { data } = await AxiosFetch.put(
        `/api/v1/checking-accounts/${checkingClientID}/percentages/${percentage.id}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checking-account-client"],
      });
      queryClient.invalidateQueries({
        queryKey: ["percentages"],
      });
      toast.success("Se ha modificado un porcentaje", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<{ percentage: string }> = (data) =>
    mutation.mutate(data);

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
            <ModalHeader className="flex h-auto items-center gap-2">
              <PercentIcon className="size-6 min-w-6 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Editar porcentaje</p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
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
                {mutation?.isError && (
                  <div className="flex items-center justify-center">
                    <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                      <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        {getErrorMessage(mutation.error)}
                      </span>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                <Button
                  isLoading={mutation?.isLoading}
                  disabled={mutation?.isLoading}
                  type="submit"
                  variant="success"
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button
                  variant="error"
                  className="w-full"
                  type="button"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { z } from "zod";
import { Cashbox } from "@renderer/hooks/cashboxes";
import { cn } from "@renderer/utils";
import { useMutation, useQueryClient } from "react-query";
import { ModalProps, ServerError } from "@renderer/utils/types";
import axios from "@renderer/hooks/axios";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HandCoinsIcon } from "lucide-react";
import { Button } from "../Button";

import { Commission } from "@renderer/hooks/commissions";
import { Mandatory } from "../Mandatory";
import { ErrorForm } from "../ErrorMessage";

type Input = z.infer<typeof inputSchema>;
const inputSchema = z.object({
  cashbox_id: z.number({ message: "Este campo es requerido" }),
  value: z
    .number({ message: "Este campo es requerido" })
    .gt(0, { message: "Debe ser mayor a 0" }),
});

export function PayCommissionModal({
  isOpen,
  onClose,
  commission,
  cashboxes,
}: ModalProps & { commission: Commission; cashboxes: Cashbox[] }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    control,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      value: commission.commission,
    },
  });

  const mutation = useMutation<Cashbox, ServerError, Input>({
    mutationFn: async (body) => {
      const dataToSend = {
        ...body,
        seller_id: commission.seller.id,
        loan_id: commission.loan_id ?? null,
        operation_id: commission.operation_id ?? null,
      };
      const { data } = await AxiosFetch.patch(
        `/api/v1/commission/${commission.id}`,
        dataToSend,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions", "all"] });
      onClose();
    },
  });

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
              <HandCoinsIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Pagar comisión</p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="flex w-full items-start gap-4">
                  <Controller
                    defaultValue={0}
                    name="value"
                    render={({ field }) => (
                      <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                        <div className="flex items-center gap-0.5">
                          Monto <Mandatory />
                        </div>
                        <div
                          className={cn(
                            errors.value ? "border-danger" : "border-slate-300",
                            "flex !h-9 min-h-7 w-full items-center gap-1 rounded-md border px-2 text-sm outline-none focus-within:border-primary",
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
                        {errors.value && (
                          <span className="text-xs text-danger">
                            {errors.value?.message}
                          </span>
                        )}
                      </label>
                    )}
                    control={control}
                  />

                  {/* cashbox */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="cashbox_id"
                      className="text-sm text-slate-500"
                    >
                      Caja <Mandatory />
                    </label>

                    <Controller
                      name="cashbox_id"
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
                          }}
                          className={cn(
                            errors.cashbox_id?.message && "!border-red-500",

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

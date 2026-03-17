/* IMPORTS */
import { useMemo } from "react";
import { ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  Calendar1Icon,
  CalendarDaysIcon,
  CircleCheckBigIcon,
  CircleDotIcon,
  ClipboardListIcon,
  DollarSignIcon,
  LandmarkIcon,
  PiggyBankIcon,
  PlusIcon,
  TrendingUpIcon,
  Undo2Icon,
  UserRoundCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { TableWork } from "@renderer/components/Table";
import { TInstallment } from "@renderer/hooks/installments";
import { getLoan } from "@renderer/hooks/loans";
import { Button } from "@renderer/components/Button";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { Progress, Tooltip, useDisclosure } from "@heroui/react";
import { AddPayModal } from "@renderer/components/modals/loans";
import { format } from "date-fns";
import { cn, getInstallmentStatusSyles } from "@renderer/utils";

//Component starts here
export function LoanDetailsSection() {
  const { id } = useParams();

  const isValidLoanID = z.string().catch("").parse(id);
  const loanID = +isValidLoanID;
  const navigate = useNavigate();

  /* QUERIES */
  //
  const loanQuery = useQuery<Awaited<ReturnType<typeof getLoan>>, ServerError>({
    queryFn: () => getLoan(loanID ?? -1),
    queryKey: ["loans", loanID],
    enabled: !!loanID,
  });
  //
  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  /* DISCLOSURES */
  //
  const { isOpen: isAddPaymentOpenModal, onOpenChange: onOpenAddPaymentModal } =
    useDisclosure();

  /* UTILS */
  //Loans table's columns
  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Cuota",
        key: "number",
        render: (item: TInstallment) => `#${item.number}`,
      },
      {
        label: "Valor",
        key: "value",
        render: (item: TInstallment) =>
          `$${item.value.toLocaleString("es-AR")}`,
      },
      {
        label: "Caja abonada",
        key: "cashbox.name",
        render: (item: TInstallment) => item.cashbox.name,
      },
      {
        label: "Vencimiento",
        key: "dueDate",
        render: (item: TInstallment) => format(item.dueDate, "dd/MM/yyyy"),
      },
      {
        label: "Pago",
        key: "paymentAmount",
        render: (item: TInstallment) => (
          <span className="font-medium text-slate-500">
            ${item.paymentAmount.toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Fecha de cobro",
        key: "paymentDate",
        render: (item: TInstallment) =>
          item.paymentDate ? format(item.paymentDate, "dd/MM/yyyy") : "-",
      },
    ];
  }, [loanQuery.data]);

  /* FUNCTIONS */
  //
  function currency(id: number) {
    const matchedCashbox = cashboxesQuery.data?.find(
      (cashbox) => id === cashbox.id,
    );

    return matchedCashbox?.currency.name;
  }

  const installmentValue = loanQuery.data?.installmentValue;
  const lastInstallmentPaid = loanQuery.data?.installments.find(
    (installment) => installment.paymentDate === null,
  );

  const currentInstallment =
    loanQuery.data &&
    Math.floor(loanQuery.data?.totalPaid / loanQuery.data.installmentValue) + 1;

  const textColorStatus =
    loanQuery.data && loanQuery.data.principal === loanQuery.data.totalPaid
      ? "text-success"
      : currentInstallment &&
        getInstallmentStatusSyles(
          currentInstallment + 8,
          loanQuery.data?.numberOfInstallments,
        );

  const bgColorStatus = (textColorStatus as string)?.replace("text", "bg");

  return (
    <section className="flex h-full w-full flex-col gap-2">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Tooltip
            closeDelay={0}
            className="rounded-md border-slate-400 text-xs text-slate-400"
            content="Volver"
          >
            <div
              onClick={() => navigate(-1)}
              className="cursor-pointer p-1.5 text-slate-300 transition-all hover:text-slate-400"
            >
              <Undo2Icon className="size-5 min-w-5" />
            </div>
          </Tooltip>
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <LandmarkIcon className="size-5 min-w-5" />
          </div>
          {loanQuery.data && (
            <h1 className="text-xl font-semibold text-slate-500">
              Detalles del préstamo
            </h1>
          )}
        </div>

        {lastInstallmentPaid && (
          <Button
            onClick={onOpenAddPaymentModal}
            disabled={loanQuery.isFetching || loanQuery.isError}
            variant="success"
            className="flex h-8 w-44 items-center gap-1 pr-5"
          >
            <PlusIcon className="size-4 min-w-4" />
            Agregar pago
          </Button>
        )}
      </div>
      {/* LOAN'S CONTAINER */}
      {loanQuery.data && (
        <>
          <div className="flex h-fit w-full flex-col gap-4 overflow-hidden px-6 py-4 text-sm text-slate-500">
            {/* Loan basic data */}
            <div className="flex w-full items-center gap-4">
              <div className="flex h-16 w-full items-center gap-2.5 rounded-lg border border-slate-300/40 bg-[#FDFDFD] p-3">
                <div className="flex items-center justify-center rounded-md bg-slate-100/70 p-2">
                  <UserRoundIcon className="size-4 min-w-4 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Cliente</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {loanQuery.data?.client.name}
                  </span>
                </div>
              </div>
              <div className="flex h-16 w-full items-center gap-2.5 rounded-lg border border-slate-300/40 bg-[#FDFDFD] p-3">
                <div className="flex items-center justify-center rounded-md bg-slate-100/70 p-2">
                  <UserRoundCheckIcon className="size-4 min-w-4 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Vendedor</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {loanQuery.data?.seller.name}
                  </span>
                </div>
              </div>
              <div className="flex h-16 w-full items-center gap-2.5 rounded-lg border border-slate-300/40 bg-[#FDFDFD] p-3">
                <div className="flex items-center justify-center rounded-md bg-slate-100/70 p-2">
                  <DollarSignIcon className="size-4 min-w-4 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Divisa</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {loanQuery.data?.cashboxID
                      ? currency(loanQuery.data.cashboxID)
                      : ""}
                  </span>
                </div>
              </div>
              <div className="flex h-16 w-full items-center gap-2.5 rounded-lg border border-slate-300/40 bg-[#FDFDFD] p-3">
                <div className="flex items-center justify-center rounded-md bg-slate-100/70 p-2">
                  <CalendarDaysIcon className="size-4 min-w-4 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">
                    Frecuencia de pago
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {loanQuery.data?.paymentFrequency == "daily"
                      ? "Diario"
                      : loanQuery.data?.paymentFrequency == "weekly"
                        ? "Semanal"
                        : loanQuery.data?.paymentFrequency == "biweekly"
                          ? "Quincenal"
                          : loanQuery.data?.paymentFrequency == "monthly"
                            ? "Mensual"
                            : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary*/}
            <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-slate-300/40 bg-[#FDFDFD] p-3">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <ClipboardListIcon className="size-5 min-w-5" />
                  Resumen del préstamo
                </div>

                <div className="flex items-center gap-1.5">
                  {loanQuery.data.totalPaid === loanQuery.data.principal ? (
                    <>
                      <CircleCheckBigIcon className="size-4 min-w-4 text-primary" />
                      <span className="text-sm text-primary">Pagado</span>
                    </>
                  ) : (
                    <>
                      <CircleDotIcon className="size-4 min-w-4 text-warning" />
                      <span className="text-sm text-warning">Pendiente</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col items-center gap-4">
                <div className="flex w-full flex-col items-center gap-2">
                  <Progress
                    size="sm"
                    className="w-full"
                    aria-label="Loading..."
                    value={loanQuery.data?.totalPaid}
                    classNames={{
                      indicator: `${bgColorStatus} !text-transparent`,
                    }}
                    maxValue={loanQuery.data.principal}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div
                      className={cn(
                        textColorStatus,
                        "flex items-center gap-1 text-xs",
                      )}
                    >
                      Total pagado:{" "}
                      <b>
                        ${loanQuery.data?.totalPaid.toLocaleString("es-AR")}
                      </b>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      Total préstamo: $
                      {loanQuery.data?.principal.toLocaleString("es-AR")}
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center gap-4">
                  <div className="flex w-full flex-col gap-2.5 rounded-lg border border-slate-300/40 p-3">
                    <div className="flex w-fit items-center gap-1">
                      <TrendingUpIcon className="size-4 min-w-4 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {" "}
                        Ganancia esperada
                      </span>
                    </div>
                    <span className="font-semibold text-slate-500">
                      ${" "}
                      {loanQuery.data?.expected_profit?.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-2.5 rounded-lg border border-slate-300/40 p-3">
                    <div className="flex w-fit items-center gap-1">
                      <PiggyBankIcon className="size-4 min-w-4 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        Ganancias acumuladas:
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-500">
                      ${" "}
                      {loanQuery.data?.retainedEarnings?.toLocaleString(
                        "es-AR",
                      )}
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-2.5 rounded-lg border border-slate-300/40 p-3">
                    <div className="flex w-fit items-center gap-1">
                      <Calendar1Icon className="size-4 min-w-4 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        Fecha de creación
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-500">
                      {format(loanQuery.data?.dateGenerated, "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6">
            <TableWork
              columns={COLUMNS}
              loading={loanQuery.isFetching}
              error={loanQuery.isError}
              searchInput={""}
              data={loanQuery.data?.installments || []}
              openModal={null}
              optionsMenu={[]}
            />
          </div>
        </>
      )}
      {isAddPaymentOpenModal &&
        loanQuery.data &&
        lastInstallmentPaid !== undefined &&
        installmentValue !== undefined && (
          <AddPayModal
            lastInstallmentPaid={lastInstallmentPaid}
            installmentValue={installmentValue}
            isOpen={isAddPaymentOpenModal}
            onClose={onOpenAddPaymentModal}
            loanId={loanID}
          />
        )}

      {!loanQuery.data && (
        <div className="flex h-full w-full items-center justify-center">
          <span className="relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
        </div>
      )}
    </section>
  );
}

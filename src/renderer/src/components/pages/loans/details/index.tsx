/* IMPORTS */
import { useMemo } from "react";
import { ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import { LandmarkIcon, PlusIcon, Undo2Icon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { TableWork } from "@renderer/components/Table";
import { TInstallment } from "@renderer/hooks/installments";
import { getLoan } from "@renderer/hooks/loans";
import { Button } from "@renderer/components/Button";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { Tooltip, useDisclosure } from "@heroui/react";
import { AddPayModal } from "@renderer/components/modals/loans";
import { format } from "date-fns";

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
            {/* SEARCH FILTER CONTAINER */}
            <div className="flex">
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">Cliente:</span>
                <br />
                {loanQuery.data?.client.name}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">Vendedor:</span>
                <br />
                {loanQuery.data?.seller.name}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">Comision:</span>
                <br />${loanQuery.data?.commission.toLocaleString("es-AR")}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">
                  Divisa del préstamo:
                </span>
                <br />
                {loanQuery.data?.cashboxID
                  ? currency(loanQuery.data.cashboxID)
                  : ""}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">Capital:</span>
                <br />${loanQuery.data?.principal.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="flex">
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">
                  Frecuencia de pago:
                </span>
                <br />
                {loanQuery.data?.paymentFrequency == "daily"
                  ? "Diario"
                  : loanQuery.data?.paymentFrequency == "weekly"
                    ? "Semanal"
                    : loanQuery.data?.paymentFrequency == "biweekly"
                      ? "Quincenal"
                      : loanQuery.data?.paymentFrequency == "monthly"
                        ? "Mensual"
                        : ""}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">
                  Fecha de creacion:
                </span>
                <br />
                {format(loanQuery.data?.dateGenerated, "dd/MM/yyyy")}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">
                  Ganancia esperada:
                </span>
                <br />${loanQuery.data?.expected_profit.toLocaleString("es-AR")}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">
                  Ganancias acumuladas:
                </span>
                <br />$
                {loanQuery.data?.retainedEarnings?.toLocaleString("es-AR")}
              </p>
              <p className="basis-1/5 border-l-3 border-green-500 pl-2">
                <span className="text-xs text-slate-400">Total pagado:</span>
                <br />${loanQuery.data?.totalPaid.toLocaleString("es-AR")}
              </p>
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

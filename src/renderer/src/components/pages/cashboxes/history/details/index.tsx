import { useQuery } from "react-query";
import { ServerError } from "@renderer/utils/types";
import { Tooltip } from "@heroui/react";
import { useState } from "react";
import { Undo2Icon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { getCashbox } from "@renderer/hooks/cashboxes";
import { OperationsHistoryCashbox } from "@renderer/components/cashboxes/histories/operations";
import { LoansHistoryCashbox } from "@renderer/components/cashboxes/histories/loans";
import { InstallmentsHistoryCashbox } from "@renderer/components/cashboxes/histories/installments";
import { cn, TabMovimentsNames, tabsMoviments } from "@renderer/utils";
import { MovimentsHistoryCashbox } from "@renderer/components/cashboxes/histories/expenses";

export function HistorySection() {
  const params = useParams();
  const navigate = useNavigate();

  const isValidCashbox = z.string().catch("").parse(params.id);
  const cashboxID = +isValidCashbox;

  const isValidHistory = z.string().catch("").parse(params.historyID);
  const historyID = +isValidHistory;

  const [tabActive, setTabActive] = useState<TabMovimentsNames>("operations");

  const cashboxQuery = useQuery<
    Awaited<ReturnType<typeof getCashbox>>,
    ServerError
  >({
    queryKey: ["cashboxes", cashboxID],
    queryFn: () => getCashbox(cashboxID ?? -1),
    retry: false,
    enabled: !!cashboxID && !!historyID,
  });

  return (
    <section className="flex h-full w-full flex-col">
      {/* Header */}
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

          {cashboxQuery.isLoading ? (
            <span className="size-8 w-44 min-w-8 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <h1 className="text-xl font-semibold text-slate-500">
              Historial #{historyID} de {cashboxQuery.data?.name}
            </h1>
          )}
        </div>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden py-2">
        <ul className="flex items-center gap-2 border-b pl-4">
          {tabsMoviments.map((tab) => (
            <li
              onClick={() => setTabActive(tab.name)}
              className={cn(
                tabActive === tab.name
                  ? "text-primary"
                  : "text-slate-400/70 hover:text-slate-400",
                "relative flex cursor-pointer items-center gap-1.5 p-2 text-sm transition-all",
              )}
              key={tab.label}
            >
              <tab.icon className="size-3.5 min-w-3.5" />
              {tab.label}

              {tabActive === tab.name && (
                <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-lg bg-primary/50" />
              )}
            </li>
          ))}
        </ul>

        <div className="flex h-auto min-h-0 flex-col gap-4 px-4">
          {tabActive === "operations" && (
            <OperationsHistoryCashbox
              cashboxID={cashboxID}
              historyID={historyID}
            />
          )}

          {tabActive === "loans" && (
            <LoansHistoryCashbox cashboxID={cashboxID} historyID={historyID} />
          )}

          {tabActive === "moviments" && (
            <MovimentsHistoryCashbox
              cashboxID={cashboxID}
              historyID={historyID}
            />
          )}

          {tabActive === "installments" && (
            <InstallmentsHistoryCashbox
              cashboxID={cashboxID}
              historyID={historyID}
            />
          )}
        </div>
      </div>
    </section>
  );
}

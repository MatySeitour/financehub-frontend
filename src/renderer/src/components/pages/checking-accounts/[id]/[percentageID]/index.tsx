/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  BanknoteArrowUpIcon,
  BanknoteIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  CircleDotDashedIcon,
  PercentIcon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  Undo2Icon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";
import { TableWork } from "@renderer/components/Table";
import { useNavigate, useParams } from "react-router";

import { z } from "zod";
import { format } from "date-fns";
import {
  CreateCheckingAccountMovimentModal,
  CreatePercentageCheckingAccountModal,
  DisabledCheckingAccountModal,
  EnabledCheckingAccountModal,
  PaidCheckingAccountModal,
  UpdateCheckingAccountMovimentModal,
  UpdatePercentageCheckingAccountModal,
} from "@renderer/components/modals/checkingAccounts";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { Tooltip } from "@heroui/react";
import {
  getCheckingAccountPercentages,
  getCheckingAccountsMoviments,
  TCheckingAccountMoviment,
  TCheckingAccountPercentage,
} from "@renderer/hooks/checkingAccounts";

const COLUMNS = [
  {
    label: "Pagado",
    key: "isPaid",
    render: (item: TCheckingAccountMoviment) =>
      item.isPaid ? (
        <div className="flex items-center gap-1.5 text-sm text-primary">
          <CircleCheckBigIcon className="size-4 min-w-4" />
          Pagado
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-yellow-500">
          <CircleDotDashedIcon className="size-4 min-w-4" />
          Pendiente
        </div>
      ),
  },
  {
    label: "Fecha de generación",
    key: "loanDate",
    render: (item: TCheckingAccountMoviment) =>
      format(item.loanDate, "dd/MM/yyyy"),
  },
  {
    label: "Monto prestado",
    key: "amountBorrowed",
    render: (item: TCheckingAccountMoviment) => (
      <span className="font-semibold tabular-nums text-slate-600">
        ${item.amountBorrowed.toLocaleString("es-AR")}
      </span>
    ),
  },
  {
    label: "Monto a recibir",
    key: "amountGross",
    render: (item: TCheckingAccountMoviment) => (
      <span className="font-semibold tabular-nums text-slate-600">
        ${item.amountGross.toLocaleString("es-AR")}
      </span>
    ),
  },
  {
    label: "Tipo de préstamo",
    key: "isCash",
    render: (item: TCheckingAccountMoviment) =>
      item.isCash ? (
        <div className="flex w-fit items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-1.5 py-1 text-xs text-primary">
          <BanknoteIcon className="size-3.5 min-w-3.5" />
          En efectivo
        </div>
      ) : (
        <div className="flex w-fit items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 px-1.5 py-1 text-xs text-yellow-500">
          <WalletIcon className="size-3.5 min-w-3.5" />
          Transferencia
        </div>
      ),
  },
  {
    label: "Caja entrada",
    key: "cashboxIncrement.name",
    render: (item: TCheckingAccountMoviment) =>
      `${item.cashboxIncrement.name} (${item.cashboxIncrement.nomenclature})`,
  },
  {
    label: "Caja salida",
    key: "cashboxDecrement.name",
    render: (item: TCheckingAccountMoviment) =>
      `${item.cashboxDecrement.name} (${item.cashboxDecrement.nomenclature})`,
  },
  {
    label: "Habilitado",
    key: "disabled",
    render: (item: TCheckingAccountMoviment) =>
      !item.disabled ? (
        <div className="flex items-center gap-1 text-xs text-primary">
          <CheckIcon className="size-4 min-w-4" /> Habilitado
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <XIcon className="size-4 min-w-4" /> Deshabilitado
        </div>
      ),
  },
];

//Component starts here
export function CheckingAccountPercentagesSection() {
  const { id, percentageID } = useParams();
  const navigate = useNavigate();

  const isValidClientID = z.string().catch("").parse(id);
  const checkingClientID = +isValidClientID;

  const isValidPercentageID = z.string().catch("").parse(percentageID);
  const percentID = +isValidPercentageID;

  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const [percentageIDSelected, setPercentageIDSelected] =
    useState<number>(percentID);
  const [isCreateCheckingAccount, setIsCreateCheckingAccountOpen] =
    useState(false);
  const [isCreatePercentageModalOpen, setIsCreatePercentageModal] =
    useState(false);
  const [percentageToUpdate, setPercentageToUpdate] =
    useState<TCheckingAccountPercentage>();

  const [checkingAccountToUpdate, setCheckingAccountToUpdate] =
    useState<TCheckingAccountMoviment>();
  const [checkingAccountToDisabled, setCheckingAccountToDisabled] =
    useState<TCheckingAccountMoviment>();
  const [checkingAccountToEnabled, setCheckingAccountToEnabled] =
    useState<TCheckingAccountMoviment>();
  const [checkingAccountToPaid, setCheckingAccountToPaid] =
    useState<TCheckingAccountMoviment>();

  const checkingAccountsQuery = useQuery<
    Awaited<ReturnType<typeof getCheckingAccountsMoviments>>,
    ServerError
  >({
    queryFn: () =>
      getCheckingAccountsMoviments(
        checkingClientID,
        percentageIDSelected,
        undefined,
        undefined,
        undefined,
        undefined,
      ),
    queryKey: [
      "checking-account-client",
      checkingClientID,
      percentageIDSelected,
    ],
  });

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  const percentagesQuery = useQuery<
    Awaited<ReturnType<typeof getCheckingAccountPercentages>>,
    ServerError
  >({
    queryKey: ["percentages", checkingClientID],
    queryFn: () => getCheckingAccountPercentages(checkingClientID),
  });

  /// Focus search with Ctrl + f
  useEffect(() => {
    const handleFocusSearch = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleFocusSearch);
    return () => window.removeEventListener("keydown", handleFocusSearch);
  }, []);

  const filteredCheckingAccounts = useMemo(() => {
    if (!checkingAccountsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return checkingAccountsQuery?.data?.moviments?.filter((checkingAccount) => {
      let searched = `${checkingAccount.amountBorrowed}${checkingAccount.amountGross}${checkingAccount.loanDate}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [checkingAccountsQuery.data, search]);

  const options: MenuOption<TCheckingAccountMoviment>[] = [
    {
      name: "Pagar",
      icon: BanknoteArrowUpIcon,
      onAction: (item) => setCheckingAccountToPaid(item),
      isDisabled: (item) => !item?.isPaid,
    },
    {
      name: "Editar",
      icon: Trash2Icon,
      onAction: (item) => setCheckingAccountToUpdate(item),
      isDisabled: (item) => !item?.isPaid,
    },
    {
      name: "Habilitar/Deshabilitar",
      icon: CircleAlertIcon,
      onAction: (item) =>
        item?.disabled
          ? setCheckingAccountToEnabled(item)
          : setCheckingAccountToDisabled(item),
    },
  ];

  return (
    <section className="flex h-full w-full flex-col">
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
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
              <PercentIcon className="size-5 min-w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-500">
              Cuenta corriente de{" "}
              {checkingAccountsQuery.data
                ? `${checkingAccountsQuery.data.clientName} con porcentaje %${Number(checkingAccountsQuery.data.percentage)}`
                : ""}
            </h1>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateCheckingAccountOpen(true)}
          disabled={
            checkingAccountsQuery.isLoading || checkingAccountsQuery.isError
          }
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar préstamo
        </Button>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        <div
          className={cn(
            checkingAccountsQuery.isFetching && "opacity-60",
            "flex h-9 min-h-9 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
          )}
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={checkingAccountsQuery.isFetching}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full text-sm text-slate-500 outline-none"
            type="text"
            placeholder="Buscar..."
          />
          <div className="flex items-center gap-1">
            <div className="flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-1 py-0.5 text-xs font-medium text-slate-500">
              Ctrl
            </div>
            <p className="text-xs text-slate-500">+</p>
            <div className="flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-1 py-0.5 text-xs font-medium text-slate-500">
              F
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-fit flex-col gap-2">
          {/* Details date and records */}
          {percentagesQuery.isFetching ? (
            <div className="h-6 w-44 translate-x-4 animate-pulse rounded-md bg-slate-200/70" />
          ) : (
            !percentagesQuery.isError && (
              <div className="flex flex-col gap-px">
                <span className="text-lg font-semibold tracking-tighter text-slate-500">
                  Otros porcentajes de este cliente
                </span>

                <div className="flex items-center gap-4">
                  <ul className="flex items-center gap-2">
                    {percentagesQuery.data?.percentages.map((percentage) => (
                      <li
                        key={percentage.id}
                        onClick={() => setPercentageIDSelected(percentage.id)}
                        className={cn(
                          percentageIDSelected === percentage.id
                            ? "border-slate-300 bg-gradient-to-b from-[#FCFCFC] via-[#FCFCFC] to-slate-200"
                            : "border-slate-200/70 bg-[#FCFCFC] hover:border-slate-300",
                          "flex h-8 w-20 min-w-20 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-xs tabular-nums text-slate-400 shadow-sm transition-all",
                        )}
                      >
                        <span className="flex items-center gap-0.5">
                          %
                          {(
                            (Number(percentage.percentage) / 100) *
                            100
                          ).toFixed(2)}
                        </span>

                        <SquarePenIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            setPercentageToUpdate(percentage);
                          }}
                          className="size-3.5 min-w-3.5 text-slate-300 transition-all hover:text-primary"
                        />
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => setIsCreatePercentageModal(true)}
                    disabled={
                      checkingAccountsQuery.isLoading ||
                      checkingAccountsQuery.isError
                    }
                    variant="success"
                    className="flex h-8 w-fit min-w-fit items-center gap-1 p-2"
                  >
                    <PlusIcon className="size-4 min-w-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {/* TABLE'S CONTAINER */}
        <TableWork
          columns={COLUMNS}
          loading={checkingAccountsQuery.isFetching}
          error={checkingAccountsQuery.error}
          searchInput={search}
          data={filteredCheckingAccounts}
          openModal={() => setIsCreateCheckingAccountOpen(true)}
          optionsMenu={options}
        />
      </div>

      {isCreateCheckingAccount && checkingAccountsQuery.data && (
        <CreateCheckingAccountMovimentModal
          isOpen={isCreateCheckingAccount}
          onClose={() => setIsCreateCheckingAccountOpen(false)}
          checkingMovimentDetail={{
            checkingClientID: checkingClientID,
            client: {
              id: checkingClientID,
              name: checkingAccountsQuery.data.clientName,
            },
            percentage: {
              id: percentID,
              name: checkingAccountsQuery.data.percentage,
            },
          }}
          cashboxes={cashboxesQuery.data ?? []}
        />
      )}

      {checkingAccountToUpdate && checkingAccountsQuery.data && (
        <UpdateCheckingAccountMovimentModal
          isOpen={!!checkingAccountToUpdate}
          onClose={() => setCheckingAccountToUpdate(undefined)}
          checkingMovimentDetail={{
            checkingClientID: checkingClientID,
            client: {
              id: checkingClientID,
              name: checkingAccountsQuery.data.clientName,
            },
            percentage: {
              id: percentID,
              name: checkingAccountsQuery.data.percentage,
            },
          }}
          cashboxes={cashboxesQuery.data ?? []}
          moviment={checkingAccountToUpdate}
        />
      )}

      {checkingAccountToDisabled && checkingAccountsQuery.data && (
        <DisabledCheckingAccountModal
          isOpen={!!checkingAccountToDisabled}
          onClose={() => setCheckingAccountToDisabled(undefined)}
          moviment={checkingAccountToDisabled}
          checkingMovimentDetail={{
            checkingClientID: checkingClientID,
            client: {
              id: checkingClientID,
              name: checkingAccountsQuery.data.clientName,
            },
            percentage: {
              id: percentID,
              name: checkingAccountsQuery.data.percentage,
            },
          }}
        />
      )}

      {checkingAccountToEnabled && checkingAccountsQuery.data && (
        <EnabledCheckingAccountModal
          isOpen={!!checkingAccountToEnabled}
          onClose={() => setCheckingAccountToEnabled(undefined)}
          moviment={checkingAccountToEnabled}
          checkingMovimentDetail={{
            checkingClientID: checkingClientID,
            client: {
              id: checkingClientID,
              name: checkingAccountsQuery.data.clientName,
            },
            percentage: {
              id: percentID,
              name: checkingAccountsQuery.data.percentage,
            },
          }}
        />
      )}

      {checkingAccountToPaid && checkingAccountsQuery.data && (
        <PaidCheckingAccountModal
          isOpen={!!checkingAccountToPaid}
          onClose={() => setCheckingAccountToPaid(undefined)}
          moviment={checkingAccountToPaid}
          checkingMovimentDetail={{
            checkingClientID: checkingClientID,
            client: {
              id: checkingClientID,
              name: checkingAccountsQuery.data.clientName,
            },
            percentage: {
              id: percentID,
              name: checkingAccountsQuery.data.percentage,
            },
          }}
        />
      )}

      {isCreatePercentageModalOpen && (
        <CreatePercentageCheckingAccountModal
          isOpen={isCreatePercentageModalOpen}
          onClose={() => setIsCreatePercentageModal(false)}
          checkingClientID={checkingClientID}
        />
      )}

      {percentageToUpdate && (
        <UpdatePercentageCheckingAccountModal
          isOpen={!!percentageToUpdate}
          onClose={() => setPercentageToUpdate(undefined)}
          checkingClientID={checkingClientID}
          percentage={percentageToUpdate}
        />
      )}
    </section>
  );
}

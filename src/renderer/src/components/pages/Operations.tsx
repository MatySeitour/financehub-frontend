/* IMPORTS */
import { Button } from "../Button";
import { MenuOption, ServerError } from "@renderer/utils/types";
import {
  BanknoteArrowUpIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useDisclosure } from "@heroui/react";
import {
  CreateOperationModal,
  DeleteOperationModal,
} from "../modals/operations";
import { useEffect, useMemo, useRef, useState } from "react";
import { getOperations, Operation } from "@renderer/hooks/operations";
import { format, parseISO } from "date-fns";
import { cn, strNormalize, withCbk } from "@renderer/utils";
import { DataPerPage, TableWork } from "../Table";
import { useQuery } from "react-query";
import { getClients } from "@renderer/hooks/clients";
import { getSellers } from "@renderer/hooks/sellers";
import { getCashboxes } from "@renderer/hooks/cashboxes";

/* ENUMS */

//Component starts here
export function OperationsSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState<number>(1);
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();
  const [limit, setLimit] = useState<DataPerPage>(10);
  const [operationToDelete, setOperationToDelete] = useState<Operation>();

  const operationsQuery = useQuery<
    Awaited<ReturnType<typeof getOperations>>,
    ServerError
  >({
    queryKey: ["operations", "all", { page, limit, from, to }],
    queryFn: withCbk({
      queryFn: () => getOperations(from, to, page, limit),
      onSuccess: (data) => {
        if (page !== 1 && data.operations.length === 0) {
          setPage((prev) => --prev);
        }
      },
    }),
  });
  //
  const clientsQuery = useQuery<
    Awaited<ReturnType<typeof getClients>>,
    ServerError
  >({
    queryKey: ["clients", "all"],
    queryFn: getClients,
  });
  //
  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryKey: ["sellers", "all"],
    queryFn: getSellers,
  });
  //
  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  /* UTILS */
  //Operations table's columns
  const COLUMNS = useMemo(() => {
    return [
      {
        label: "Fecha",
        key: "date",
        render: (item: Operation) => format(item.date, "dd/MM/yyyy HH:mm"),
      },
      {
        label: "Cliente",
        key: "clientName",
        render: (item: Operation) => item.clientName,
      },
      {
        label: "Caja entrada",
        key: "cashboxIncrement.name",
        render: (item: Operation) => item.cashboxIncrement.name,
      },
      {
        label: "Caja salida",
        key: "cashboxDecrement.name",
        render: (item: Operation) => item.cashboxDecrement.name,
      },
      {
        label: "Tipo de operación",
        key: "type",
        render: (item: Operation) =>
          item.type === "buys" ? (
            <div className="w-fit rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-500">
              Compra
            </div>
          ) : (
            <div className="flex w-fit justify-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary">
              Venta
            </div>
          ),
      },
      {
        label: "Cantidad",
        key: "amount",
        render: (item: Operation) => (
          <span
            className={cn(
              item.type === "buys" ? "text-blue-500" : "text-primary",
            )}
          >
            ${item.amount.toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Precio",
        key: "price",
        render: (item: Operation) => (
          <span className="font-medium text-slate-500">
            ${item.price.toLocaleString("es-AR")}
          </span>
        ),
      },
      {
        label: "Precio de mercado",
        key: "marketPrice",
        render: (item: Operation) => (
          <span className="">${item.marketPrice.toLocaleString("es-AR")}</span>
        ),
      },
      {
        label: "Rendimiento",
        key: "profit",
        render: (item: Operation) =>
          item.profit > 0 ? (
            <div className="flex items-center gap-2 font-medium">
              ${item.profit}
              <div className="flex min-w-10 items-center justify-center gap-1 rounded-lg bg-success/10 px-1.5 py-0.5 text-xs text-success">
                {(
                  (item.profit / (item.amount * item.price)) *
                  100
                ).toLocaleString("es-AR")}
                %
                <TrendingUpIcon className="size-3 min-w-3" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-medium">
              ${item.profit}
              <div className="flex min-w-10 items-center justify-center gap-1 rounded-lg bg-danger/10 px-1.5 py-0.5 text-xs text-danger">
                {(
                  (item.profit / (item.amount * item.price)) *
                  100
                ).toLocaleString("es-AR")}
                %
                <TrendingDownIcon className="size-3 min-w-3" />
              </div>
            </div>
          ),
      },
      {
        label: "Vendedor",
        key: "sellerName",
        render: (item: Operation) => item.sellerName,
      },
      {
        label: "Comisión",
        key: "commission",
        render: (item: Operation) => (
          <span className="">${item.commission.toLocaleString("es-AR")}</span>
        ),
      },
    ];
  }, [operationsQuery.data]);
  //
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

  const filteredOperations = useMemo(() => {
    if (!operationsQuery?.data?.operations) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return operationsQuery?.data?.operations?.filter((operation) => {
      let searched = `${operation.amount}${operation.clientName}${operation.sellerName}${operation.cashboxDecrement.name}${operation.cashboxIncrement.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [operationsQuery.data?.operations, search]);

  const {
    isOpen: isCreateOperationOpenModal,
    onOpenChange: onOpenCreateOperationModal,
  } = useDisclosure();

  /* UTILS */
  const options: MenuOption<Operation>[] = [
    {
      name: "Eliminar",
      icon: Trash2Icon,
      onAction: (item) => setOperationToDelete(item),
    },
  ];

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <BanknoteArrowUpIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Operaciones</h1>
        </div>
        <Button
          onClick={onOpenCreateOperationModal}
          disabled={operationsQuery.isLoading || operationsQuery.isError}
          variant="success"
          className="flex h-8 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar operación
        </Button>
      </div>

      {/* OPERATIONS'S SECTION CONTAINER */}
      <div className="flex h-full w-full flex-col gap-4 overflow-hidden px-6 pt-4">
        <div className="mt-[2px] flex w-[568px] flex-col gap-6 py-2">
          {/* SEARCH FILTER CONTAINER */}
          <div className="flex w-full gap-16">
            <div
              className="flex h-9 min-h-8 w-full items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary" //{cn(cashboxesQuery.isFetching && "opacity-60",
            >
              <SearchIcon className="size-4 min-w-4 text-slate-400" />
              <input
                ref={searchRef}
                disabled={operationsQuery.isFetching}
                onChange={(e) => setSearch(e.target.value)}
                className="h-full w-full text-sm text-slate-500 outline-none"
                type="text"
                placeholder="Buscar cliente o vendedor..."
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
          </div>
          {/* DATE CONTAINER */}
          <div className="flex h-9 w-full items-center gap-3">
            {/* From date */}
            <div className="flex w-1/2 flex-col gap-0.5">
              <label className="text-xs text-slate-400">Desde</label>
              <input
                onChange={(e) => setFrom(parseISO(e.target.value))}
                type="date"
                className="rounded-md border p-2 text-sm text-slate-400"
              />
            </div>
            {/* To date */}
            <div className="flex w-1/2 flex-col gap-0.5">
              <label className="text-xs text-slate-400">Hasta</label>
              <input
                onChange={(e) => setTo(parseISO(e.target.value))}
                type="date"
                className="rounded-md border p-2 text-sm text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* TABLE'S CONTAINER */}
        <TableWork
          columns={COLUMNS}
          loading={operationsQuery.isFetching}
          error={operationsQuery.error}
          searchInput={search}
          data={filteredOperations}
          openModal={onOpenCreateOperationModal}
          optionsMenu={options}
          pagination={{
            page: page,
            limit: limit,
            total: operationsQuery.data?.total ?? 0,
            nextPage: setPage,
            prevPage: setPage,
            changeLimit: setLimit,
          }}
        />
      </div>

      {isCreateOperationOpenModal &&
        operationsQuery.data &&
        clientsQuery.data &&
        sellersQuery.data &&
        cashboxesQuery.data && (
          <CreateOperationModal
            isOpen={isCreateOperationOpenModal}
            onClose={onOpenCreateOperationModal}
            clients={clientsQuery.data}
            sellers={sellersQuery.data}
            cashboxes={cashboxesQuery.data}
          />
        )}
      {operationToDelete && operationsQuery.data && (
        <DeleteOperationModal
          isOpen={!!operationToDelete}
          onClose={() => setOperationToDelete(undefined)}
          operation={operationToDelete}
        />
      )}
    </section>
  );
}

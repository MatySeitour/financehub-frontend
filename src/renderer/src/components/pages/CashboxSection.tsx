import { cn, strNormalize } from "@renderer/utils";
import { Cashbox, getCashboxes } from "@renderer/hooks/cashboxes";
import { useQuery } from "react-query";
import { BaseResponseServer } from "@renderer/utils/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  ChangeStateCashboxModal,
  CreateCashboxModal,
  DeleteCashboxModal,
  UpdateCashboxModal,
} from "../modals/cashboxes";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarArrowUpIcon,
  CircleAlertIcon,
  CircleDollarSignIcon,
  DollarSignIcon,
  EllipsisVerticalIcon,
  Package2Icon,
  PackageIcon,
  PackageOpenIcon,
  PackageSearchIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { Button } from "../Button";
import { useMediaQueryElement } from "@renderer/hooks/useMediaQueries";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorMessage } from "../ErrorMessage";
import { useNavigate } from "react-router";

const filters = [
  { label: "Todas", name: "all", color: "#0cf" },
  { label: "Abiertas", name: "opened", color: "#1c6" },
  { label: "Cerradas", name: "closed", color: "#9ab" },
  { label: "Habilitadas", name: "enabled", color: "#fa0" },
  { label: "Deshabilitadas", name: "disabled", color: "#f33" },
] as const;
type CashboxFilters = (typeof filters)[number];

export function CashBoxSection() {
  const navigate = useNavigate();

  const { isOpen: changeStateOpenModal, onOpenChange: closeChangeStateModal } =
    useDisclosure();

  const {
    isOpen: isCreateCashboxOpenModal,
    onOpenChange: onOpenCreateCashboxModal,
  } = useDisclosure();

  const sectionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const mqSection = useMediaQueryElement(sectionRef);

  const [selected, setSelected] = useState<CashboxFilters>(filters[3]);
  const [cashboxToChangeState, setCashboxToChangeState] = useState<Cashbox>();
  const [cashboxToUpdate, setCashboxToUpdate] = useState<Cashbox>();
  const [cashboxToDelete, setCashboxToDelete] = useState<Cashbox>();
  const [search, setSearch] = useState("");

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    BaseResponseServer
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
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

  const filteredCashboxes = useMemo(() => {
    if (!cashboxesQuery?.data) return [];
    let cashboxesToSearch = [...cashboxesQuery?.data];

    switch (selected.name) {
      case "enabled":
        cashboxesToSearch = cashboxesQuery?.data?.filter(
          (cashbox) => cashbox.disabled === 0,
        );
        break;

      case "disabled":
        cashboxesToSearch = cashboxesQuery?.data?.filter(
          (cashbox) => cashbox.disabled === 1,
        );
        break;

      case "opened":
        cashboxesToSearch = cashboxesQuery?.data?.filter(
          (cashbox) => cashbox.state === 1,
        );
        break;

      case "closed":
        cashboxesToSearch = cashboxesQuery?.data?.filter(
          (cashbox) => cashbox.state === 0,
        );
        break;

      default:
        break;
    }

    if (!search) return cashboxesToSearch;

    const normalizedFilter = strNormalize(search).toLowerCase();

    return cashboxesToSearch?.filter((cashbox) => {
      let searched = `${cashbox.name}${cashbox.currency}${cashbox.value}${cashbox.openingValue}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [cashboxesQuery.data, selected, search]);

  return (
    <section
      ref={sectionRef}
      className="h-full w-full bg-gradient-to-b from-white to-primary/10"
    >
      {/* Header */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <DollarSignIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Cajas</h1>
        </div>

        <Button
          onClick={onOpenCreateCashboxModal}
          disabled={cashboxesQuery.isFetching || cashboxesQuery.isError}
          variant="success"
          className="flex h-8 items-center gap-1"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar caja
        </Button>
      </div>

      {/* Cashboxes */}
      {cashboxesQuery.isError ? (
        <ErrorMessage message={cashboxesQuery.error.message} />
      ) : cashboxesQuery?.data?.length === 0 ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 pb-16 text-slate-400">
          <div className="relative">
            <Package2Icon className="size-24 min-w-24" />
            <DollarSignIcon className="absolute left-1/2 top-1/2 size-8 min-w-8 -translate-x-4 -translate-y-1" />
          </div>
          <p className="text-lg text-slate-400">No hay cajas creadas aún</p>
        </div>
      ) : (
        <article className="flex h-full w-full flex-col gap-6 p-6">
          <div className="flex items-center gap-2">
            {/* Filter */}
            <Select
              isDisabled={cashboxesQuery.isLoading || cashboxesQuery.isFetching}
              aria-label="filters"
              defaultSelectedKeys={selected.name}
              classNames={{
                innerWrapper: "rounded-md",
                mainWrapper: "rounded-md",
                popoverContent: "rounded-md text-slate-400 font-normal",
                trigger:
                  "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7 border border-slate-300/70",
                listbox: "text-slate-400",
                value: "!text-slate-400",
              }}
              className="min-h-9 max-w-44 rounded-md outline-none"
              selectedKeys={new Set([selected.name])}
              startContent={
                <div
                  style={{
                    background: `${selected.color}3`,
                  }}
                  className="flex size-3 items-center justify-center rounded-full p-0.5"
                >
                  <span
                    style={{
                      background: `${selected.color}7`,
                    }}
                    className="size-2 rounded-full"
                  />
                </div>
              }
              onSelectionChange={(e) => {
                const key = typeof e === "string" ? e : e?.currentKey;
                const filter = filters.find((f) => f.name === key);
                if (filter) setSelected(filter);
              }}
            >
              {filters.map((filter) => (
                <SelectItem
                  classNames={{
                    base: "hover:!bg-black/5 rounded-md hover:!text-slate-500 data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2",
                  }}
                  className="flex items-center gap-1"
                  onSelect={() => setSelected(filter)}
                  key={filter.name}
                  startContent={
                    <div
                      style={{
                        background: `${filter.color}3`,
                      }}
                      className="flex size-3 items-center justify-center rounded-full p-0.5"
                    >
                      <span
                        style={{
                          background: `${filter.color}7`,
                        }}
                        className="size-2 rounded-full"
                      />
                    </div>
                  }
                >
                  {filter.label}
                </SelectItem>
              ))}
            </Select>

            {/* Search */}
            <div
              className={cn(
                cashboxesQuery.isFetching && "opacity-60",
                "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
              )}
            >
              <SearchIcon className="size-4 min-w-4 text-slate-400" />

              <input
                ref={searchRef}
                disabled={cashboxesQuery.isFetching}
                onChange={(e) => setSearch(e.target.value)}
                className="h-full w-full text-sm text-slate-500 outline-none"
                type="text"
                placeholder="Buscar caja..."
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

          {/* Loadings */}
          {cashboxesQuery.isFetching ? (
            <ul className="flex h-auto w-full flex-wrap justify-center gap-2">
              {Array.from({ length: 9 }).map((_, index) => (
                <li
                  key={index}
                  className="flex h-32 w-full min-w-96 max-w-96 animate-pulse flex-col gap-4 rounded-md bg-slate-100 p-4"
                />
              ))}
            </ul>
          ) : filteredCashboxes.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 pb-16 text-slate-400">
              <PackageSearchIcon className="size-16 min-w-16" />
              <p className="text-lg text-slate-400">
                No hay resultados para la búsqueda de <b>{search}</b>
              </p>
            </div>
          ) : (
            <ul
              className={cn(
                "grid h-auto w-full grid-cols-4 gap-6",
                mqSection < 765 && "grid-cols-1",
                mqSection < 1205 && mqSection >= 765 && "grid-cols-3",
                mqSection >= 1205 && "grid-cols-3",
              )}
            >
              {/* Cashbox */}
              <AnimatePresence>
                {filteredCashboxes?.map((cashbox) => (
                  <motion.li
                    layout
                    onClick={() => navigate(`/cajas/${cashbox.id}/history`)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    key={cashbox.id}
                    className={cn(
                      !cashbox.disabled && "cursor-pointer",
                      "flex h-fit flex-col gap-4 rounded-md border border-slate-300/40 bg-white p-4 transition-all hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* Name */}
                        <p className="font-semibold capitalize text-slate-500">
                          {cashbox.name}
                        </p>

                        {/* state */}
                        <Tooltip
                          isDisabled={!!cashbox.disabled}
                          closeDelay={0}
                          className="rounded-md border-slate-400 text-xs text-slate-400"
                          content={`Presiona para ${cashbox.state ? "cerrar" : "abrir"}`}
                        >
                          <div
                            onClick={() => {
                              if (!cashbox.disabled) {
                                closeChangeStateModal();
                                setCashboxToChangeState(cashbox);
                              }
                            }}
                            className={cn(
                              cashbox.disabled
                                ? "bg-danger/5"
                                : cashbox.state
                                  ? "cursor-pointer bg-primary/5 transition-all hover:bg-primary/10"
                                  : "cursor-pointer bg-slate-400/5 transition-all hover:bg-slate-400/10",
                              "flex items-center gap-1 rounded-full px-2 py-1",
                            )}
                          >
                            <div
                              className={cn(
                                cashbox.disabled
                                  ? "bg-amber-400/20"
                                  : cashbox.state
                                    ? "bg-primary/20"
                                    : "bg-slate-400/20",
                                "flex size-3 items-center justify-center rounded-full p-0.5",
                              )}
                            >
                              <div
                                className={cn(
                                  cashbox.disabled
                                    ? "bg-danger/70"
                                    : cashbox.state
                                      ? "bg-primary/70"
                                      : "bg-slate-400/70",
                                  "size-full rounded-full",
                                )}
                              />
                            </div>
                            <p
                              className={cn(
                                cashbox.disabled
                                  ? "text-danger"
                                  : cashbox.state
                                    ? "text-primary/70"
                                    : "text-slate-400/70",
                                "text-xs font-medium",
                              )}
                            >
                              {cashbox.disabled
                                ? "Deshabilitada"
                                : cashbox.state
                                  ? "Abierta"
                                  : "Cerrada"}
                            </p>
                          </div>
                        </Tooltip>
                      </div>

                      {/* Current state */}
                      {cashbox.disabled !== 1 && (
                        <Popover
                          radius="sm"
                          placement="bottom"
                          showArrow={true}
                        >
                          <PopoverTrigger>
                            <div className="cursor-pointer rounded-md border border-slate-200 p-1.5 transition-colors hover:border-slate-300">
                              <EllipsisVerticalIcon className="size-5 min-w-5 text-slate-400" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-1.5">
                            <div className="flex flex-col">
                              {/* Change state cashbox option */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeChangeStateModal();
                                  setCashboxToChangeState(cashbox);
                                }}
                                className="flex cursor-pointer items-center gap-2 p-2 font-medium text-slate-400/70 transition-all hover:rounded-md hover:bg-slate-100 hover:text-slate-500"
                              >
                                {!cashbox.state ? (
                                  <PackageOpenIcon className="size-3.5 min-w-3.5" />
                                ) : (
                                  <PackageIcon className="size-3.5 min-w-3.5" />
                                )}
                                <p className="text-xs">
                                  {!cashbox.state ? "Abrir" : "Cerrar"} caja
                                </p>
                              </div>

                              {/* Update cashbox option */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setCashboxToUpdate(cashbox);
                                }}
                                className="flex cursor-pointer items-center gap-2 p-2 font-medium text-slate-400/70 transition-all hover:rounded-md hover:bg-slate-100 hover:text-slate-500"
                              >
                                <SquarePenIcon className="size-3.5 min-w-3.5" />
                                <p className="text-xs">Editar caja</p>
                              </div>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setCashboxToDelete(cashbox);
                                }}
                                className="flex cursor-pointer items-center gap-2 p-2 font-medium text-red-500 transition-all hover:rounded-md hover:bg-red-500/10 hover:text-red-500"
                              >
                                <Trash2Icon className="size-3.5 min-w-3.5" />
                                <p className="text-xs">Deshabilitar</p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {cashbox.disabled === 1 ? (
                      <div className="flex h-36 flex-col justify-center gap-4">
                        {/* If cashbox is disabled */}
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                          <CircleAlertIcon className="size-4 min-w-4" />
                          <p>Esta caja está deshabilitada</p>
                        </div>

                        <div className="flex items-center justify-center">
                          <Button
                            disabled
                            variant="success"
                            className="h-8 max-w-32 gap-1"
                          >
                            <PowerIcon className="size-3.5 min-w-3.5" />
                            Habilitar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Body */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {/* Current value */}
                            <div className="flex items-center gap-1">
                              <WalletIcon className="size-4 min-w-4 text-slate-400/70" />
                              <p className="text-xs text-slate-400/70">
                                Valor actual
                              </p>
                            </div>

                            <p
                              className={cn(
                                cashbox.value < 0
                                  ? "text-red-500"
                                  : cashbox.profit === 0
                                    ? "text-slate-400"
                                    : "text-primary",
                                "font-mono text-xl font-semibold",
                              )}
                            >
                              $ {cashbox.state ? cashbox.value : "-- --"}
                            </p>
                          </div>

                          {/* Profit */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <TrendingUpIcon className="size-4 min-w-4 text-slate-400/70" />
                              <p className="text-xs text-slate-400/70">
                                Ganancia
                              </p>
                            </div>

                            <p
                              className={cn(
                                cashbox.profit < 0
                                  ? "text-red-500"
                                  : cashbox.profit === 0
                                    ? "text-slate-400"
                                    : "text-primary",
                                "text-right font-mono text-xl font-semibold",
                              )}
                            >
                              {cashbox.state
                                ? `${cashbox.profit.toFixed(2)}%`
                                : "--"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2 border-t border-slate-200 pt-2">
                          {/* Opening date time */}
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-1">
                              <CalendarArrowUpIcon className="size-4 min-w-4 text-slate-400/70" />
                              <p className="text-xs text-slate-400/70">
                                Fecha de apertura
                              </p>
                            </div>
                            <p className="text-xs text-slate-400">
                              {cashbox.openingDateTime
                                ? format(
                                    cashbox.openingDateTime,
                                    "dd 'de' MMM, HH:mm aaaa",
                                    { locale: es },
                                  )
                                : "-- --"}
                            </p>
                          </div>

                          {/* Opening value */}
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-1">
                              <CircleDollarSignIcon className="size-4 min-w-4 text-slate-400/70" />
                              <p className="text-xs text-slate-400/70">
                                Valor de apertura
                              </p>
                            </div>
                            <p className="font-mono text-xs text-slate-400">
                              {cashbox.state
                                ? `$ ${cashbox.openingValue}`
                                : "-- --"}
                            </p>
                          </div>

                          {/* Currency */}
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-1">
                              <CircleDollarSignIcon className="size-4 min-w-4 text-slate-400/70" />
                              <p className="text-xs text-slate-400/70">
                                Divisa
                              </p>
                            </div>
                            <p className="font-mono text-xs text-slate-400">
                              {cashbox.currency}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </article>
      )}

      {/* Change state cashbox */}
      {cashboxesQuery.isSuccess &&
        changeStateOpenModal &&
        cashboxToChangeState && (
          <ChangeStateCashboxModal
            cashbox={cashboxToChangeState}
            isOpen={changeStateOpenModal}
            onClose={closeChangeStateModal}
          />
        )}

      {/* Create cashbox modal */}
      {cashboxesQuery.isSuccess && isCreateCashboxOpenModal && (
        <CreateCashboxModal
          isOpen={isCreateCashboxOpenModal}
          onClose={onOpenCreateCashboxModal}
        />
      )}

      {/* Update cashbox modal */}
      {cashboxesQuery.isSuccess && cashboxToUpdate && (
        <UpdateCashboxModal
          cashbox={cashboxToUpdate}
          isOpen={!!cashboxToUpdate}
          onClose={() => setCashboxToUpdate(undefined)}
        />
      )}

      {/* Delete cashbox modal */}
      {cashboxesQuery.isSuccess && cashboxToDelete && (
        <DeleteCashboxModal
          cashbox={cashboxToDelete}
          isOpen={!!cashboxToDelete}
          onClose={() => setCashboxToDelete(undefined)}
        />
      )}
    </section>
  );
}

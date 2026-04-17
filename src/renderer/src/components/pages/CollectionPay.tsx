/* IMPORTS */
import {
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarOffIcon,
  CalendarX2Icon,
  ChevronRightIcon,
  CircleDollarSignIcon,
  PaperclipIcon,
  SearchIcon,
} from "lucide-react";
import { getLoans} from "@renderer/hooks/loans";
import { useQuery } from "react-query";
import { MenuOption, ServerError } from "@renderer/utils/types";
import {
  cn,
  strNormalize,
  withCbk,
} from "@renderer/utils";
import { useMemo, useRef, useState } from "react";
import { differenceInDays, parseISO } from "date-fns";
import { ErrorMessage } from "@renderer/components/ErrorMessage";
import {getInstallmentsPagination, TInstallment } from "@renderer/hooks/installments";
import { format } from "date-fns-tz";
import { DataPerPage, TableWork } from "../Table";
import { useNavigate } from "react-router";

//Component starts here
export function CollectionPaySection() {
  const navigate = useNavigate();


  /* REFs */
  const searchRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  /* STATES */
  //
  const [search, setSearch] = useState("");
  //
  const [page, setPage] = useState<number>(1);
  //
  const [from, setFrom] = useState<Date>();
  //
  const [to, setTo] = useState<Date>();
  //
  const [limit, setLimit] = useState<DataPerPage>(10);
  //

  

  /* QUERIES */
  //
  const loansQuery = useQuery<
    Awaited<ReturnType<typeof getLoans>>,
    ServerError
  >({
    queryKey: ["loans", "all", { page, limit, from, to }],
    queryFn: withCbk({
      queryFn: () => getLoans(from, to, page, limit),
      onSuccess: (data) => {
        if (page !== 1 && data.loans.length === 0) {
          setPage((prev) => --prev);
        }
      },
    }),
    keepPreviousData: true,
  });


    const installmentsQuery = useQuery<
      Awaited<ReturnType<typeof getInstallmentsPagination>>,
      ServerError
    >({
       queryKey: ["installments-total", "all", { page, limit, from, to }],
    queryFn: withCbk({
      queryFn: () => getInstallmentsPagination(from, to),
      onSuccess: (data) => {
        if (page !== 1 && data.length === 0) {
          setPage((prev) => --prev);
        }
      },
    }),
    });

  const COLUMNS = useMemo(() => {
    return [
         {
        label: "Cliente",
        key: "clientName",
        render: (item: TInstallment) => item.clientName,
      },
        {
         label: "Fecha de cuota",
         key: "dueDate",
         render: (item: TInstallment) => format(parseISO(item.dueDate), "dd/MM/yyyy") ,
       },
      
      {
        label: "Monto acumulado",
        key: "amount",
        render: (item: TInstallment) =>  {
 const remainingDate = differenceInDays(
            item.dueDate,
            item.paymentDate ?? new Date(),
          );

          return (
          <div
            className={cn(
              item.paymentAmount === item.value
                ? "text-primary"
                :  remainingDate < 0 ? "text-red-500" :"text-slate-400",
              "flex items-center gap-2",
            )}
          >
            <span>${item.paymentAmount}</span>
            <ChevronRightIcon className={cn(
              remainingDate < 0 ? "text-red-500" :"text-slate-400",
              "size-4 min-w-4")} />
            <span>${item.value}</span>
          </div>
        )
        } 
      },
       {
              label: "Vendedor",
              key: "sellerName",
              render: (item: TInstallment) => item.sellerName,
            },

         {
        label: "Tiempo de pago",
        key: "payment_date",
        render: (item: TInstallment) => {
          const remainingDate = differenceInDays(
            item.dueDate,
            item.paymentDate ?? new Date(),
          );

          return (
            <div className="flex items-center gap-2">
              {item.paymentAmount === item.value &&
              remainingDate >= 0 &&
              item.paymentDate ? (
                <>
                  <CalendarCheck2Icon className="size-4 min-w-4 text-primary" />
                  <span className="text-primary">A tiempo</span>
                </>
              ) : item.paymentAmount !== item.value && remainingDate > 0 ? (
                <>
                  <CalendarClockIcon className="size-4 min-w-4 text-warning" />
                  <span className="text-warning">
                    Quedan {remainingDate} días
                  </span>
                </>
              ) : (
                <>
                  <CalendarX2Icon className="size-4 min-w-4 text-danger" />
                  <span className="text-danger">
                    Atrasado {remainingDate * -1} días
                  </span>
                </>
              )}
            </div>
          );
        },
      },
    ];
  }, []);


    const filteredInstallments = useMemo(() => {
      if (!installmentsQuery?.data) return [];
  
      const normalizedFilter = strNormalize(search).toLowerCase();
  
      return installmentsQuery?.data?.filter((installment) => {
        let searched = `${installment.amount}${installment.currency}${installment.clientName}${installment.sellerName}${installment.number}`;
  
        return strNormalize(searched).toLowerCase().includes(normalizedFilter);
      });
    }, [installmentsQuery.data, search]);

      const actionOptions: MenuOption<TInstallment>[] = [
        {
          name: "Pagar cuota",
          icon: PaperclipIcon,
          onAction: (installment) => navigate(`/loans/${installment?.loanID}/details`),
        },
      ];

    

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <CircleDollarSignIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Lista de cobranzas</h1>
        </div>
        {/* <Button
          onClick={onOpenCreateLoanModal}
          disabled={loansQuery.isLoading || loansQuery.isError}
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar préstamo
        </Button> */}
      </div>
      {/* LOAN'S CONTAINER */}
      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        {/* SEARCH FILTER CONTAINER */}
        <div
          className={cn(
            loansQuery.isFetching && "opacity-60",
            "flex w-full gap-16",
          )}
        >
        
          <div
            className="flex h-9 min-h-8 w-full min-w-96 max-w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary" //{cn(cashboxesQuery.isFetching && "opacity-60",
          >
            <SearchIcon className="size-4 min-w-4 text-slate-400" />
            <input
              ref={searchRef}
              disabled={loansQuery.isFetching}
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
          {/* DATE CONTAINER */}
          <div className="flex w-full items-center justify-end gap-2">
            {/* From date */}
            <label className="relative h-9 min-w-44 rounded-md border p-2 text-sm text-slate-400 transition-all focus-within:border-primary disabled:opacity-60">
              <span className="absolute -top-2.5 left-1.5 w-12 bg-white pl-1 text-xs text-slate-400/70">
                Desde
              </span>

              <input
                ref={fromRef}
                onFocus={() => {
                  // if input disabled, dont show datepicker
                  if (!loansQuery.isFetching) {
                    fromRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={loansQuery.isFetching}
                onChange={(e) => {
                  if (e.target.value === "") return setFrom(undefined);
                  setFrom(parseISO(e.target.value));
                }}
                type="date"
                className="w-full"
              />
            </label>

            {/* To date */}
            <label className="relative h-9 min-w-44 rounded-md border p-2 text-sm text-slate-400 transition-all focus-within:border-primary disabled:opacity-60">
              <span className="absolute -top-2.5 left-1.5 w-12 bg-white pl-1 text-xs text-slate-400/70">
                Hasta
              </span>

              <input
                ref={toRef}
                onFocus={() => {
                  // if input disabled, dont show datepicker
                  if (!loansQuery.isFetching) {
                    toRef.current?.showPicker?.();
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                disabled={loansQuery.isFetching}
                onChange={(e) => {
                  if (e.target.value === "") return setTo(undefined);
                  setTo(parseISO(e.target.value));
                }}
                type="date"
                className="w-full"
              />
            </label>
          </div>
        </div>

          

        {/* TABLE'S CONTAINER */}

        {loansQuery.isError ? (
          <ErrorMessage error={loansQuery.error} />
        ) : (from || to) &&
          filteredInstallments.length === 0 &&
          !loansQuery.isFetching ? (
          <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
            <CalendarOffIcon className="size-16 text-slate-400" />
            <p className="text-slate-400">
              No hay resultados de préstamos durante esa fecha
            </p>
          </div>
        ) : (
          <TableWork
            columns={COLUMNS}
            loading={installmentsQuery.isFetching}
            error={installmentsQuery.isError}
            searchInput={""}
            data={filteredInstallments}
            openModal={() => console.log()}
            optionsMenu={actionOptions}
            pagination={{
              page: page,
              limit: limit,
              total: installmentsQuery.data?.length ?? 0,
              nextPage: setPage,
              prevPage: setPage,
              changeLimit: setLimit,
            }}
          />
          
        )}
      </div>
    </section>
  );
}

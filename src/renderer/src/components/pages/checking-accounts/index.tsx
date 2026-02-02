import { Button } from "@renderer/components/Button";
import { CreateCheckingAccountModal } from "@renderer/components/modals/checkingAccounts";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { getGeneralCheckingAccounts } from "@renderer/hooks/checkingAccounts";
import { getClients } from "@renderer/hooks/clients";
import { cn, strNormalize } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import { format } from "date-fns";
import {
  CalendarIcon,
  CircleCheckBigIcon,
  CircleDotDashedIcon,
  IdCardIcon,
  PiggyBankIcon,
  PlusIcon,
  SearchIcon,
  WalletCardsIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router";

//Component starts here
export function CheckingAccountsSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isCreateCheckingAccount, setIsCreateCheckingAccountOpen] =
    useState(false);

  /* QUERIES */
  //
  const generalCheckingAccountsQuery = useQuery<
    Awaited<ReturnType<typeof getGeneralCheckingAccounts>>,
    ServerError
  >({
    queryFn: () => getGeneralCheckingAccounts(),
    queryKey: ["checking-accounts", "all"],
  });

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
  });

  const clientsQuery = useQuery<
    Awaited<ReturnType<typeof getClients>>,
    ServerError
  >({
    queryKey: ["clients", "all"],
    queryFn: getClients,
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

  const filteredCheckingAccountsClient = useMemo(() => {
    if (!generalCheckingAccountsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return generalCheckingAccountsQuery?.data?.filter((checkingAccount) => {
      let searched = `${checkingAccount.client.name}${checkingAccount.percentage}${checkingAccount.totalAmountBorrowed}${checkingAccount.totalAmountBorrowed}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [generalCheckingAccountsQuery.data, search]);

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <IdCardIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">
            Cuentas corrientes
          </h1>
        </div>
        <Button
          onClick={() => setIsCreateCheckingAccountOpen(true)}
          disabled={
            generalCheckingAccountsQuery.isLoading ||
            generalCheckingAccountsQuery.isError
          }
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar CTA/CTE
        </Button>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        <div
          className={cn(
            generalCheckingAccountsQuery.isFetching && "opacity-60",
            "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
          )}
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={generalCheckingAccountsQuery.isFetching}
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

        <ul
          className={cn(
            "grid h-auto w-full grid-cols-2 gap-6",
            // mqSection < 765 && "grid-cols-1",
            // mqSection < 1205 && mqSection >= 765 && "grid-cols-2",
            // mqSection >= 1205 && "grid-cols-3",
          )}
        >
          {filteredCheckingAccountsClient.map(
            (clientCheckingAccount, index) => (
              <li
                className="relative flex flex-col gap-1 overflow-hidden rounded-md border border-slate-200 transition-all hover:shadow-md"
                key={clientCheckingAccount.client.id}
              >
                <div className="flex items-center justify-between p-4">
                  <span className="text-lg font-medium text-slate-400">
                    {clientCheckingAccount.client.name}
                  </span>

                  {/* <div className="flex items-center gap-1.5 text-sm text-warning">
                  <CircleDotDashedIcon className="size-4 min-w-4" />
                  Pendiente
                </div> */}
                  <Button
                    onClick={() =>
                      navigate(
                        `/clients/${clientCheckingAccount.client.id}/checking-accounts`,
                      )
                    }
                    variant="blue"
                    className="h-7"
                  >
                    Ver detalles
                  </Button>
                  {/* <div className="flex items-center gap-1 rounded-lg border border-primary/5 bg-green-400/5 px-2 py-1 text-xs font-medium text-primary/70">
                    <span>%</span>{" "}
                    {clientCheckingAccount.percentage.toLocaleString("es")} de
                    interés
                  </div> */}
                </div>

                <div className="flex justify-between p-4">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="rounded-full bg-slate-100/40 p-2">
                      <WalletCardsIcon className="size-6 min-w-6 text-slate-400/70" />
                    </div>
                    <div className="flex flex-col items-start text-xs">
                      <span className="text-lg font-semibold text-slate-400">
                        {clientCheckingAccount.totalCount}
                      </span>
                      Cuentas corrientes
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="rounded-full bg-slate-100/40 p-2">
                      <PiggyBankIcon className="size-6 min-w-6 text-slate-400/70" />
                    </div>
                    <div className="flex flex-col items-end text-xs">
                      <span className="text-lg font-semibold text-primary">
                        +${clientCheckingAccount.totalAmountBorrowed}
                      </span>
                      Total prestado
                    </div>
                  </div>
                </div>

                <div className="relative z-50 flex h-full w-full flex-col gap-2.5 border-t border-slate-300/40 bg-slate-100/20 p-4 text-slate-400/70">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Ultima cuenta registrada
                    </span>

                    {index ? (
                      <div className="flex items-center gap-1.5 text-sm text-primary">
                        <CircleCheckBigIcon className="size-4 min-w-4" />
                        Pagado
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-yellow-400">
                        <CircleDotDashedIcon className="size-4 min-w-4" />
                        Pendiente
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sm">Monto prestado</span>
                    <span className="font-semibold text-slate-500">
                      $
                      {clientCheckingAccount.latestCheckingAccount.amountBorrowed.toLocaleString(
                        "es",
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarIcon className="size-4 min-w-4" />
                      Fecha de movimiento
                    </div>
                    <span className="font-semibold text-slate-500">
                      {format(
                        clientCheckingAccount.latestCheckingAccount.loanDate,
                        "dd/MM/yyyy",
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-sm">
                      <WalletCardsIcon className="size-4 min-w-4" />
                      Caja
                    </div>
                    <span className="font-semibold text-slate-500">
                      {clientCheckingAccount.latestCheckingAccount.cashboxName}
                    </span>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>

      {isCreateCheckingAccount &&
        generalCheckingAccountsQuery.data &&
        clientsQuery.data && (
          <CreateCheckingAccountModal
            isOpen={isCreateCheckingAccount}
            onClose={() => setIsCreateCheckingAccountOpen(false)}
            cashboxes={cashboxesQuery.data ?? []}
            clients={clientsQuery.data}
          />
        )}
    </section>
  );
}

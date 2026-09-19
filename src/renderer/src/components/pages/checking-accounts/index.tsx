import { Button } from "@renderer/components/Button";
import {
  CreateCheckingAccountClientModal,
  UpdateCheckingAccountClientModal,
} from "@renderer/components/modals/checkingAccountClient/checkingClient";
import {
  getCheckingAccountClients,
  TCheckingAccountClient,
} from "@renderer/hooks/checkingAccounts";
import { getClients } from "@renderer/hooks/clients";
import { cn, strNormalize } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import {
  ArrowUpRightIcon,
  CircleOffIcon,
  ExternalLinkIcon,
  IdCardIcon,
  PenSquareIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserRoundIcon,
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

  const [checkingAccountToUpdate, setCheckingAccountToUpdateOpen] =
    useState<TCheckingAccountClient>();

  /* QUERIES */
  //
  const generalCheckingAccountsQuery = useQuery<
    Awaited<ReturnType<typeof getCheckingAccountClients>>,
    ServerError
  >({
    queryFn: () => getCheckingAccountClients(),
    queryKey: ["checking-accounts-clients", "all"],
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
      let searched = `${checkingAccount.client.name}`;

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

        {generalCheckingAccountsQuery.isFetching ? (
          <div className="grid h-full w-full grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-full w-full animate-pulse rounded-md bg-slate-200/70"
              />
            ))}
          </div>
        ) : (
          <ul
            className={cn(
              "grid h-auto w-full grid-cols-3 gap-6",
              // mqSection < 765 && "grid-cols-1",
              // mqSection < 1205 && mqSection >= 765 && "grid-cols-2",
              // mqSection >= 1205 && "grid-cols-3",
            )}
          >
            {filteredCheckingAccountsClient.map((clientCheckingAccount) => (
              <li
                className="group relative flex flex-col gap-1 overflow-hidden rounded-md border border-slate-200/70 bg-[#FCFCFC] transition-all hover:shadow-md"
                key={clientCheckingAccount.id}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 p-4 text-slate-400">
                    <div className="flex items-center justify-center rounded-md bg-slate-200/40 p-1.5">
                      <UserRoundIcon className="size-4 min-w-4" />
                    </div>
                    {clientCheckingAccount.client.name}
                  </div>

                  <div className="flex translate-x-20 items-center gap-2 text-slate-300 transition-all group-hover:-translate-x-4">
                    <PenSquareIcon
                      onClick={() =>
                        setCheckingAccountToUpdateOpen(clientCheckingAccount)
                      }
                      className="size-5 min-w-5 cursor-pointer hover:text-blue-500"
                    />
                    <Trash2Icon className="size-5 min-w-5 -translate-y-px opacity-40" />
                  </div>
                </div>

                <div className="px-4">
                  <div className="h-px w-full bg-slate-200" />
                </div>

                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm tracking-tighter text-slate-400">
                      Porcentajes disponibles
                    </span>

                    <div
                      onClick={() =>
                        navigate(
                          `/checking-accounts/${clientCheckingAccount?.id}/${clientCheckingAccount.percentages[0].id}`,
                        )
                      }
                      className="flex items-center gap-0.5 text-xs text-primary hover:cursor-pointer hover:underline"
                    >
                      Ver detalles{" "}
                      <ArrowUpRightIcon className="size-4 min-w-4" />
                    </div>
                  </div>

                  {clientCheckingAccount.percentages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 pt-4">
                      <div className="flex items-center justify-center gap-1 text-sm text-slate-400">
                        <CircleOffIcon className="size-3.5 min-w-3.5" />
                        No hay porcentajes aún
                      </div>

                      <Button
                        onClick={() =>
                          setCheckingAccountToUpdateOpen(clientCheckingAccount)
                        }
                        disabled={
                          generalCheckingAccountsQuery.isLoading ||
                          generalCheckingAccountsQuery.isError
                        }
                        variant="success"
                        className="flex h-7 w-32 items-center gap-1 pr-5 text-xs"
                      >
                        <PlusIcon className="size-4 min-w-4" />
                        Agregar
                      </Button>
                    </div>
                  ) : (
                    <ul className="flex w-full flex-wrap items-center gap-2">
                      {clientCheckingAccount.percentages.map((percentage) => {
                        return (
                          <li
                            onClick={() =>
                              navigate(
                                `/checking-accounts/${clientCheckingAccount?.id}/${percentage.id}`,
                              )
                            }
                            key={percentage.id}
                            className="flex h-8 min-w-20 max-w-20 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-200/70 bg-[#FCFCFC] px-2 py-1 text-xs tabular-nums text-slate-400 shadow-sm transition-all hover:bg-slate-500 hover:text-white"
                          >
                            %{Number(percentage.percentage).toFixed(2)}
                            <ExternalLinkIcon className="size-3 min-w-3" />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="absolute -bottom-8 -right-10 z-10 size-24 rounded-full bg-slate-100/90" />

                {/* Action buttons */}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCreateCheckingAccount &&
        generalCheckingAccountsQuery.data &&
        clientsQuery.data && (
          <CreateCheckingAccountClientModal
            isOpen={isCreateCheckingAccount}
            onClose={() => setIsCreateCheckingAccountOpen(false)}
            clients={clientsQuery.data}
          />
        )}

      {checkingAccountToUpdate &&
        generalCheckingAccountsQuery.data &&
        clientsQuery.data && (
          <UpdateCheckingAccountClientModal
            isOpen={!!checkingAccountToUpdate}
            onClose={() => setCheckingAccountToUpdateOpen(undefined)}
            clients={clientsQuery.data}
            checkingAccount={checkingAccountToUpdate}
          />
        )}
    </section>
  );
}

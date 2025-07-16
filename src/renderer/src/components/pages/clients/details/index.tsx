/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import { Client, getClient, getClients } from "@renderer/hooks/client";

import {
  BanknoteArrowUpIcon,
  LandmarkIcon,
  LucideIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";
import {
  CreateClientModal,
  DeleteClientModal,
  UpdateClientModal,
} from "@renderer/components/modals/clients";
import { TableWork } from "@renderer/components/Table";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

type TabNames = "operations" | "loans" | "installments" | "expenses";

const tabs: { label: string; icon: LucideIcon; name: TabNames }[] = [
  {
    label: "Operaciones",
    icon: BanknoteArrowUpIcon,
    name: "operations",
  },
  {
    label: "Préstamos",
    icon: LandmarkIcon,
    name: "loans",
  },
] as const;

//Component starts here
export function ClientDetailsSection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isValidClientID = z.string().catch("").parse(id);
  const clientID = +isValidClientID;

  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [tabActive, setTabActive] = useState<TabNames>("operations");

  /* QUERIES */
  //
  const clientQuery = useQuery<
    Awaited<ReturnType<typeof getClient>>,
    ServerError
  >({
    queryFn: () => getClient(clientID ?? -1),
    queryKey: ["clients", clientID],
    enabled: !!clientID,
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

  return (
    <section className="flex h-full w-full flex-col gap-4">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center gap-2 border-b border-slate-200 p-6">
        <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
          <UserRoundIcon className="size-5 min-w-5" />
        </div>
        <h1 className="text-xl font-semibold text-slate-500">
          {clientQuery?.data?.name ?? ""}
        </h1>
      </div>

      <ul className="flex items-center gap-2 border-b pl-4">
        {tabs.map((tab) => (
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
              <span className="absolute -bottom-px left-0 h-[2.6px] w-full rounded-lg bg-primary/50" />
            )}
          </li>
        ))}
      </ul>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden px-6 pt-4">
        <div
          className="flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary" //{cn(cashboxesQuery.isFetching && "opacity-60",
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={clientQuery.isFetching}
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
      </div>
    </section>
  );
}

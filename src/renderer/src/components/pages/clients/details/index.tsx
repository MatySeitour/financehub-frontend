/* IMPORTS */
import { useState } from "react";
import { ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  BanknoteArrowUpIcon,
  LandmarkIcon,
  LucideIcon,
  UserRoundIcon,
} from "lucide-react";
import { cn } from "@renderer/utils";
import { useParams } from "react-router";
import { z } from "zod";
import {
  ClientDetailsLoan,
  ClientDetailsOperation,
} from "@renderer/components/clients";
import { getClient } from "@renderer/hooks/clients";

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

  const isValidClientID = z.string().catch("").parse(id);
  const clientID = +isValidClientID;

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

  return (
    <section className="flex h-full w-full flex-col gap-2">
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
              <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-lg bg-primary/50" />
            )}
          </li>
        ))}
      </ul>

      {tabActive === "operations" ? (
        <ClientDetailsOperation clientID={clientID} />
      ) : (
        <ClientDetailsLoan clientID={clientID} />
      )}
    </section>
  );
}

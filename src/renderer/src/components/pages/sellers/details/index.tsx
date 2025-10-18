/* IMPORTS */
import { useState } from "react";
import { ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  BanknoteArrowUpIcon,
  HandCoinsIcon,
  LandmarkIcon,
  LucideIcon,
  Undo2Icon,
} from "lucide-react";
import { cn } from "@renderer/utils";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { getSeller } from "@renderer/hooks/sellers";
import {
  SellerDetailsLoan,
  SellerDetailsOperation,
} from "@renderer/components/sellers";
import { Tooltip } from "@heroui/react";

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

export function SellerDetailsSection() {
  const { id } = useParams();

  const navigate = useNavigate();
  const isValidSellerID = z.string().catch("").parse(id);
  const sellerID = +isValidSellerID;

  const [tabActive, setTabActive] = useState<TabNames>("operations");

  /* QUERIES */
  //
  const sellerQuery = useQuery<
    Awaited<ReturnType<typeof getSeller>>,
    ServerError
  >({
    queryFn: () => getSeller(sellerID ?? -1),
    queryKey: ["sellers", sellerID],
    enabled: !!sellerID,
  });

  return (
    <section className="flex h-full w-full flex-col gap-2">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center gap-2 border-b border-slate-200 p-4">
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
            <HandCoinsIcon className="size-5 min-w-5" />
          </div>
          {sellerQuery.isLoading ? (
            <span className="size-8 w-44 min-w-8 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <h1 className="text-xl font-semibold text-slate-500">
              {sellerQuery?.data?.name ?? ""}
            </h1>
          )}
        </div>
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
        <SellerDetailsOperation sellerID={sellerID} />
      ) : (
        <SellerDetailsLoan sellerID={sellerID} />
      )}
    </section>
  );
}

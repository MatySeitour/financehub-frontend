import { Button, Chip, Skeleton, Tooltip } from "@heroui/react";
import { getCurrencies } from "@renderer/hooks/dollar";
import { cn, formatFullDateEs } from "@renderer/utils";
import { BaseResponseServer, ServerError, User } from "@renderer/utils/types";
// import {
//   IoCalendarOutline,
//   IoInformationCircle,
//   IoReload,
// } from "react-icons/io5";
import { useQuery } from "react-query";
import { useOutletContext } from "react-router";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  InfoIcon,
  RefreshCcwIcon,
} from "lucide-react";

export function Home() {
  const user: BaseResponseServer & { data: User } = useOutletContext();

  // const currenciesQuery = useQuery<
  //   Awaited<ReturnType<typeof getCurrencies>>,
  //   ServerError
  // >({
  //   queryFn: () => getCurrencies(),
  //   queryKey: ["currencies"],
  //   staleTime: 3 * 60 * 1000,
  //   refetchInterval: 3 * 60 * 1000,
  // });

  return (
    <></>
    // <section className="h-screen w-full bg-white">
    //   {/* Slider prices */}
    //   <div className="relative h-auto w-full">
    //     <div className="relative z-10 flex overflow-hidden border-b border-t-2 bg-gray-50">
    //       {/* Loadings */}
    //       {currenciesQuery?.isLoading ? (
    //         <ul className="flex h-12 w-full items-center justify-center gap-2 px-4 py-2">
    //           {Array.from(
    //             [1, 2, 3, 4].map((_, index) => (
    //               <li
    //                 className="flex h-full w-64 items-center justify-center gap-2.5"
    //                 key={index}
    //               >
    //                 <Skeleton className="flex h-8 w-full rounded-md" />
    //               </li>
    //             )),
    //           )}
    //         </ul>
    //       ) : !currenciesQuery?.isError ? (
    //         // Loadings
    //         <ul
    //           className={cn(
    //             "hover:pause flex h-12 animate-scroll items-center",
    //             currenciesQuery?.isFetching && "opacity-50",
    //           )}
    //         >
    //           {[
    //             ...(currenciesQuery?.data ?? []),
    //             ...(currenciesQuery?.data ?? []),
    //           ].map((currency, index) => (
    //             <li
    //               key={`${currency?.id}-${index}`}
    //               className="relative flex h-full w-72 items-center justify-center gap-2.5 after:absolute after:left-0 after:h-6 after:w-[0.5px] after:bg-slate-300 2xl:w-96"
    //             >
    //               <p className="text-sm font-medium text-slate-500">
    //                 {currency?.name}
    //               </p>
    //               <p className="text-sm font-light text-slate-400">
    //                 ${currency?.buy_value.toFixed(2)}
    //               </p>
    //               <FaCaretUp className="size-3 min-w-3 text-green-500" />
    //               <p className="text-sm font-light text-slate-400">
    //                 ${currency?.sale_value.toFixed(2)}
    //               </p>
    //               <p
    //                 className={cn(
    //                   "text-sm font-medium",
    //                   currency?.variation > 0
    //                     ? "text-green-500"
    //                     : currency?.variation === 0
    //                       ? "text-slate-500/70"
    //                       : "text-red-500",
    //                 )}
    //               >
    //                 {currency?.variation}%
    //               </p>
    //             </li>
    //           ))}
    //         </ul>
    //       ) : (
    //         <div className="flex h-12 w-full items-center justify-center gap-2 text-red-500">
    //           <MdErrorOutline className="size-4 min-w-4" />
    //           <p className="text-sm font-medium">
    //             Ha ocurrido un error intentando cargar los datos
    //           </p>
    //         </div>
    //       )}
    //     </div>

    //     {/* Prices last update date */}
    //     {currenciesQuery?.isSuccess && (
    //       <motion.div
    //         initial={{ y: 0, opacity: 0 }}
    //         animate={{ y: 52, opacity: 1 }}
    //         transition={{ duration: 0.4, ease: "easeOut" }}
    //         className="absolute left-0 top-0 flex h-auto w-full items-center justify-center gap-6 rounded-b-md bg-slate-100/70 p-2 text-slate-400"
    //       >
    //         <div className="flex h-auto items-center justify-center gap-2">
    //           <div className="flex items-center gap-1.5">
    //             <IoCalendarOutline className="size-4 min-w-4 2xl:size-5 2xl:min-w-5" />
    //             <p className="text-xs font-medium 2xl:text-sm">
    //               Ultima fecha de actualización:{" "}
    //             </p>
    //           </div>
    //           <p className="text-xs font-bold 2xl:text-sm">
    //             {" "}
    //             {formatFullDateEs(currenciesQuery?.data?.[0].update_date ?? "")}
    //           </p>
    //         </div>
    //         <div className="flex items-center gap-2">
    //           <Button
    //             size="sm"
    //             aria-label="Reload currencies"
    //             className="h-8 rounded-md 2xl:h-9 2xl:text-xs"
    //             color="primary"
    //             isLoading={currenciesQuery?.isFetching}
    //           >
    //             <IoReload className="size-4 min-w-4" />
    //           </Button>
    //           <Tooltip
    //             placement="bottom"
    //             closeDelay={0}
    //             className="rounded-md text-slate-400"
    //             content="Los valores se actualizan automaticamente cada 3 minutos"
    //             showArrow={true}
    //           >
    //             <div className="flex h-8 items-center rounded-md border border-slate-300 bg-white p-2 2xl:h-9">
    //               <IoInformationCircle className="size-5 min-w-5 text-slate-400 2xl:size-6 2xl:min-w-6" />
    //             </div>
    //           </Tooltip>
    //         </div>
    //       </motion.div>
    //     )}
    //   </div>

    //   {/* Main */}
    //   <article className="flex h-full w-full flex-col gap-4 px-8 pb-20 pt-16">
    //     <div className="flex items-center gap-2">
    //       <h1 className="text-2xl font-medium text-slate-500">
    //         Bienvenido {user?.data?.name}
    //       </h1>
    //       <Chip
    //         color="primary"
    //         variant="flat"
    //         className="capitalize text-primary"
    //       >
    //         {user.data.role.name}
    //       </Chip>
    //     </div>
    //     {/* Cashboxes list */}
    //     <div className="flex-1">
    //       <ul className="flex w-full gap-4 overflow-hidden">
    //         {Array.from({ length: 8 }).map((_, index) => (
    //           <li
    //             key={index}
    //             className="h-32 w-80 flex-shrink-0 snap-start rounded-md border border-slate-200/70 bg-slate-100/50"
    //           ></li>
    //         ))}
    //       </ul>
    //     </div>

    //     <div className="flex h-full w-full items-center gap-8">
    //       {/* Graphic cashbox history */}
    //       <article className="h-full w-full rounded-md border border-slate-200/70 p-2"></article>

    //       {/* Operations by cashbox */}
    //       <article className="h-full w-full rounded-md border border-slate-200/70 bg-slate-100/50 px-4 py-2">
    //         <div className="flex flex-col gap-1">
    //           <div className="flex w-full items-center gap-2">
    //             <p className="font-medium text-slate-400 xl:text-xl">
    //               Operaciones
    //             </p>
    //           </div>
    //           <p className="text-slate-400/70 xl:text-xs">
    //             Cajas que perteneces a tu organización.
    //           </p>
    //         </div>
    //       </article>
    //     </div>
    //   </article>
    // </section>
  );
}

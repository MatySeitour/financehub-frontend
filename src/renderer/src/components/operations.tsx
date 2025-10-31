/* IMPORTS */
import { ServerError, ServerSucces } from "@renderer/utils/types";
import {
  CalendarDaysIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  ListFilterIcon,
  UploadIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Radio,
  RadioGroup,
} from "@heroui/react";

import { useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { useMutation } from "react-query";

import { toast } from "sonner";
import axios from "axios";
import { Button } from "./Button";

const today = format(new Date(), "yyyy-MM-dd");

const fastFilters = [
  {
    value: "today",
    label: "Hoy",
    date: today,
  },
  {
    value: "yesterday",
    label: "Ayer",
    date: subDays(today, 1),
  },
  {
    value: "week",
    label: "Hace 7 días",
    date: subDays(today, 7),
  },
  {
    value: "biweek",
    label: "Hace 15 días",
    date: subDays(today, 15),
  },
  {
    value: "month",
    label: "Hace 30 días",
    date: subDays(today, 30),
  },
] as const;

type FastFilter = (typeof fastFilters)[number];

export function ExportExcelOperations({ disabled }: { disabled: boolean }) {
  const [filterFastSelected, setFilterFastSelected] = useState<FastFilter>();
  const [isOpenExportExcelPopover, setIsOpenExportExcelPopover] =
    useState(false);
  const [fromFilter, setFromFilter] = useState<Date>();
  const [toFilter, setToFilter] = useState<Date>();

  const mutationExport = useMutation<ServerSucces<Blob>, ServerError>({
    mutationFn: async () => {
      // url base
      let url = `${import.meta.env.VITE_API_BACKEND_URL}/api/v1/operations/excel?`;

      if (filterFastSelected) {
        url += `from=${filterFastSelected.date}&to=${today}`;
      } else {
        const withFrom = fromFilter
          ? `from=${format(fromFilter, "yyyy-MM-dd")}`
          : "";
        const withTo = toFilter ? `to=${format(toFilter, "yyyy-MM-dd")}` : "";

        url += `${withFrom}${withTo && withFrom ? `&${withTo}` : withTo}`;
      }

      try {
        return await axios.get(url, {
          withCredentials: true,
          responseType: "blob",
        });
      } catch (err: any) {
        // transform json error
        const res = err.response;
        const text = await res.data.text();
        throw new Error(JSON.parse(text).message);
      }
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = filterFastSelected
        ? `operaciones_${format(filterFastSelected.date, "dd-MM-yyyy")}_${today}`
        : `operaciones_${format(fromFilter ?? "", "dd-MM-yyyy")}_${format(toFilter ?? "", "dd-MM-yyyy")}`;

      link.setAttribute("download", `${fileName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setIsOpenExportExcelPopover(false);
      toast.success("Operaciones exportadas con éxito", {
        className: "!border-primary/70",
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex items-center">
      <Popover
        isOpen={isOpenExportExcelPopover}
        onOpenChange={() => setIsOpenExportExcelPopover((prev) => !prev)}
        placement="left"
        showArrow={true}
      >
        <PopoverTrigger>
          <div>
            <Button
              disabled={disabled}
              variant="blue"
              className="w-fit gap-2 text-nowrap"
            >
              <UploadIcon className="size-3.5 min-w-3.5" />
              Exportar excel
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="h-72 flex-col items-start rounded-md border border-slate-400/30 bg-slate-50 !p-0">
          <span className="flex items-center gap-1 px-2 py-3 text-left text-sm font-medium text-slate-500">
            <FileSpreadsheetIcon className="size-4 min-w-4" />
            Exportar operaciones
          </span>

          <div className="flex h-full w-full items-center border-b border-slate-400/30">
            {/* Manual filter */}
            <div className="flex h-full flex-col items-start gap-2">
              <span className="flex w-full gap-1 border-y border-slate-400/30 p-2 text-xs font-medium text-slate-500">
                <CalendarDaysIcon className="size-3.5 min-w-3.5" />
                Manual
              </span>

              <div className="flex flex-col gap-2 px-3">
                <label className="flex flex-col gap-px">
                  <span className="text-xs text-slate-500">Desde</span>

                  <input
                    value={fromFilter ? format(fromFilter, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (filterFastSelected) setFilterFastSelected(undefined);

                      setFromFilter(parseISO(e.target.value));
                    }}
                    className="relative h-8 min-w-44 rounded-md border px-2 text-xs text-slate-400 transition-all focus-within:border-primary disabled:opacity-60"
                    type="date"
                    max={today}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 px-3">
                <label className="flex flex-col gap-px">
                  <span className="text-xs text-slate-500">Hasta</span>
                  <input
                    value={toFilter ? format(toFilter, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (filterFastSelected) setFilterFastSelected(undefined);

                      setToFilter(parseISO(e.target.value));
                    }}
                    className="relative h-8 min-w-44 rounded-md border px-2 text-xs text-slate-400 transition-all focus-within:border-primary disabled:opacity-60"
                    type="date"
                    max={today}
                  />
                </label>
              </div>
            </div>

            <div className="h-full w-px bg-slate-400/30" />

            {/* Fast filter */}
            <div className="flex min-h-full w-full min-w-44 flex-col justify-start gap-2">
              <span className="flex w-full gap-1 border-y border-slate-400/30 p-2 text-xs font-medium text-slate-500">
                <ListFilterIcon className="size-3.5 min-w-3.5" />
                Filtro rápido
              </span>

              <RadioGroup
                className="flex flex-col gap-0.5 px-2"
                value={filterFastSelected?.["value"] ?? ""}
                onValueChange={(v) => {
                  if (fromFilter) {
                    setFromFilter(undefined);
                  }

                  if (toFilter) setToFilter(undefined);

                  if (fastFilters.some((f) => f.value === v)) {
                    const newFilter = fastFilters.find((f) => f.value === v);
                    setFilterFastSelected(newFilter as FastFilter);
                  }
                }}
              >
                {fastFilters.map((filter) => (
                  <Radio
                    key={filter.value}
                    classNames={{
                      label:
                        "text-slate-400/60 text-xs p-0.5 !w-full group-data-[selected=true]:text-slate-400 group-hover:text-slate-400",
                      wrapper: "size-3.5 border",
                      labelWrapper: "!ml-1 !w-full",
                    }}
                    value={filter.value}
                  >
                    {filter.label}
                  </Radio>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="flex w-full items-center justify-center p-3">
            <Button
              onClick={() => mutationExport.mutate()}
              disabled={
                (!filterFastSelected && !fromFilter && !toFilter) ||
                mutationExport.isLoading
              }
              isLoading={mutationExport.isLoading}
              variant="success"
              className="h-8 w-full"
            >
              Exportar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

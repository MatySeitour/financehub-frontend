import { getErrorMessage } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import { CircleAlertIcon } from "lucide-react";

export function ErrorMessage({ error }: { error: ServerError }) {
  const isZod = error.name === "ZodError";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 pb-16 text-danger">
      <CircleAlertIcon className="size-16 min-w-16" />
      <p className="max-w-xl text-center text-xl">
        {isZod ? "Error: Solicitud mal formada" : error.message}
      </p>
    </div>
  );
}

export function ErrorForm({ errorMessage }: { errorMessage: ServerError }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-md border border-red-500 bg-red-200/20 p-2">
      <CircleAlertIcon className="size-4 min-w-4 text-red-500" />
      <p className="text-sm text-red-500">{getErrorMessage(errorMessage)}</p>
    </div>
  );
}

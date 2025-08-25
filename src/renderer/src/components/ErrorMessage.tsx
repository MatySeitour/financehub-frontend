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

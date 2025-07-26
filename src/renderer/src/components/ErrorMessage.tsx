import { CircleAlertIcon } from "lucide-react";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 pb-16">
      <CircleAlertIcon className="size-16 min-w-16 text-danger" />
      <p className="text-lg text-danger">{message}</p>
    </div>
  );
}

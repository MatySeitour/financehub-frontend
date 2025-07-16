import { useRef, useCallback } from "react";

export function useDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = useCallback(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return {
    dialogRef,
    open,
    close,
  };
}

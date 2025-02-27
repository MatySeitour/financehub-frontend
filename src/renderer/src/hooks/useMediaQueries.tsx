import { useEffect, useState } from "react";

export type SMQ = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export const mqs = {
  xxs: 480,
  xs: 560,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};
export function useMediaQueries(): number {
  const [mq, setMq] = useState<number>();

  const mqChange = () => {
    setMq(document.body.clientWidth);
  };

  useEffect(() => {
    setMq(document.body.clientWidth);
    window.addEventListener("resize", mqChange);

    return () => {
      window.removeEventListener("resize", mqChange);
    };
  }, []);

  return mq ?? 0;
}

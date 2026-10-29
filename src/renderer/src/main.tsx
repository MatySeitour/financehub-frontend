import "./assets/index.css";
import ReactDOM from "react-dom/client";
import App from "./App";
import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { CookiesProvider } from "react-cookie";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HeroUIProvider>
    <QueryClientProvider client={queryClient}>
      <CookiesProvider>
        <App />
        <Toaster richColors />
      </CookiesProvider>
    </QueryClientProvider>
  </HeroUIProvider>,
);

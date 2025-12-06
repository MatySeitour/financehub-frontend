import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

declare global {
  interface Window {
    electronCookies?: {
      get: (name: string) => Promise<string | null>;
      getAll: () => Promise<any[]>;
      set: (cookieData: any) => Promise<{ success: boolean }>;
      remove: (url: string, name: string) => Promise<{ success: boolean }>;
    };
  }
}

const isElectronPackaged = () => {
  return (
    window.location.protocol === "file:" || window.electronCookies !== undefined
  );
};

export const useAuthToken = () => {
  const [cookies] = useCookies(["token"]);
  const [electronToken, setElectronToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      if (isElectronPackaged() && window.electronCookies) {
        const token = await window.electronCookies.get("token");
        setElectronToken(token);
      }
      setLoading(false);
    };

    fetchToken();
  }, []);

  const token = isElectronPackaged() ? electronToken : cookies.token;

  return { token, loading };
};

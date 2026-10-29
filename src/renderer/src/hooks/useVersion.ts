import { useEffect, useState } from "react";

export const useAppVersion = () => {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const version = await window.financeHub?.app.getVersion();
        setAppVersion(version ?? null);
      } catch {
        setAppVersion(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchVersion();
  }, []);

  return { appVersion, loading };
};

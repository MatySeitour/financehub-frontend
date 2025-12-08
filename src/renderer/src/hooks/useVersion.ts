import { useEffect, useState } from "react";

declare global {
  interface Window {
    electronUpdater?: {
      checkForUpdates: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      quitAndInstall: () => Promise<void>;
      onUpdateStatus: (callback: (status: any) => void) => void;
      onUpdateNotification: (callback: (info: any) => void) => void;
    };
  }
}

const isElectronPackaged = () => {
  return (
    window.location.protocol === "file:" || window.electronUpdater !== undefined
  );
};

export const useAppVersion = () => {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      if (isElectronPackaged() && window.electronUpdater) {
        const token = await window.electronUpdater.getAppVersion();
        setAppVersion(token);
      }
      setLoading(false);
    };

    fetchToken();
  }, []);

  return { appVersion, loading };
};

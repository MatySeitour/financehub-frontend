declare global {
  interface Window {
    financeHub?: {
      app: {
        getVersion: () => Promise<string>;
      };
    };
  }
}

export {};

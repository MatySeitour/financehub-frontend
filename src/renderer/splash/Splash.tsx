export function Splash() {
  return (
    <div className="flex h-64 w-full max-w-xl items-center !bg-gradient-to-t !from-white !to-slate-100">
      <div className="flex w-full flex-col items-center justify-center gap-3">
        <div className="flex w-full items-center justify-center">
          <span className="onboarding-text text-4xl font-extrabold text-slate-200">
            Finance
          </span>
          <b className="onboarding-text inline-block text-4xl font-extrabold">
            {" "}
            hub
          </b>
        </div>

        <span className="relative inline-block size-8 animate-rotateFull rounded-[50%] border-3 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>

        <span className="absolute bottom-4 text-sm font-medium text-slate-400/50">
          Un producto de <b className="text-slate-400/60">Sintelia</b>
        </span>
      </div>
    </div>
  );
}

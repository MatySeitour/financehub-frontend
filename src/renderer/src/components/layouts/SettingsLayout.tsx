import { cn, settingSectionsTabs } from "@renderer/utils";
import { Outlet, useLocation, useNavigate } from "react-router";

export function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <section className="flex h-full w-full flex-col gap-2">
      <div className="!h-[4.7rem] px-4 py-3.5 text-2xl font-medium text-slate-400">
        Configuraciones
      </div>
      <ul className="mb-4 flex items-center gap-2 border-b px-2">
        {settingSectionsTabs.map((tab) => {
          const intoSection = location.pathname.includes(tab.name);
          return (
            <li
              onClick={() => navigate(`/settings/${tab.name}`)}
              className={cn(
                intoSection
                  ? "text-primary"
                  : "text-slate-400/70 hover:text-slate-400",
                "relative flex cursor-pointer items-center gap-1.5 p-2 text-sm transition-all",
              )}
              key={tab.label}
            >
              <tab.icon className="size-3.5 min-w-3.5" />
              {tab.label}

              {intoSection && (
                <span className="absolute -bottom-px left-0 h-0.5 w-full bg-primary/50" />
              )}
            </li>
          );
        })}
      </ul>
      <Outlet />;
    </section>
  );
}

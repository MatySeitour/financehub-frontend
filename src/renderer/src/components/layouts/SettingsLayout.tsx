import { cn, settingSectionsTabs } from "@renderer/utils";
import { useLocation } from "react-router";

export function SettingsLayout() {
  const location = useLocation();

  return (
    <section className="flex h-full w-full flex-col p-4">
      <div className="p-4 text-2xl font-medium text-slate-400">
        Configuraciones
      </div>

      <ul className="mb-4 flex items-center gap-2 border-b">
        {settingSectionsTabs.map((tab) => (
          <li
            //   onClick={() => setTabActive(tab.name)}
            className={cn(
              location.pathname === tab.name
                ? "text-primary"
                : "text-slate-400/70 hover:text-slate-400",
              "relative flex cursor-pointer items-center gap-1.5 p-2 text-sm transition-all",
            )}
            key={tab.label}
          >
            <tab.icon className="size-3.5 min-w-3.5" />
            {tab.label}

            {location.pathname && (
              <span className="absolute -bottom-px left-0 h-0.5 w-full bg-primary/50" />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

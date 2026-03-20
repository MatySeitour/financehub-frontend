import { NavLink, useNavigate } from "react-router";
import { accountNavItems, cn, navItems } from "@renderer/utils";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { useMutation, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";
import { ChevronUpIcon, LogOutIcon, PanelLeftOpenIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { TSession } from "@renderer/hooks/user";

export function Navigation({ user }: { user: TSession }) {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  let navigate = useNavigate();

  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const mutationLogout = useMutation<void, any>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.post(`/api/logout`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/login");
    },
  });

  const userItemsNavigation = accountNavItems(user.organization.id ?? -1);

  const firstLetter = user.name.split(" ")[0][0];

  const secondLetter =
    user.name.split(" ")[1] !== undefined
      ? user.name.split(" ")[1][0]
      : user.name.split(" ")[0][1];

  const openLogoutModal = () => {
    onOpenChange();
    setIsAsideOpen(false);
  };

  return (
    <>
      <nav
        onMouseEnter={() => !isAccountSettingsOpen && setIsAsideOpen(true)}
        onMouseLeave={() => !isAccountSettingsOpen && setIsAsideOpen(false)}
        className={cn(
          isAsideOpen ? "max-w-60 xl:max-w-max" : "max-w-12 xl:max-w-max",
          "absolute z-50 flex h-full w-full flex-col gap-4 border-r bg-white shadow transition-all xl:static xl:min-w-72 xl:shadow-none",
        )}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between overflow-hidden border-b border-slate-200 py-1.5 pl-3 xl:h-16 xl:min-h-16 xl:p-5">
          <div className="flex items-center gap-3">
            <PanelLeftOpenIcon className="size-5 min-w-5 text-slate-400 xl:hidden" />
            <div
              className={cn(
                isAsideOpen ? "opacity-100" : "opacity-0",
                "flex items-center transition-all xl:opacity-100",
              )}
            >
              <span className="onboarding-text text-2xl font-extrabold text-slate-200">
                Finance
              </span>
              <b className="onboarding-text mr-1.5 inline-block text-2xl font-extrabold">
                {" "}
                hub
              </b>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden pb-2 pl-3.5 xl:pl-4">
          <ul className="flex flex-col gap-2">
            {navItems.map((navItem) => (
              <li key={navItem.name} className="h-auto w-full">
                {navItem.disabled ? (
                  <div className="flex h-full min-h-10 w-full items-center border-transparent font-medium text-slate-400 opacity-60 xl:pl-3">
                    <navItem.icon className="size-5 min-w-5" />
                    <p
                      className={cn(
                        isAsideOpen ? "opacity-100" : "opacity-0",
                        "rounded-lg p-2 text-sm transition-all xl:opacity-100",
                      )}
                    >
                      {navItem.name}
                    </p>
                  </div>
                ) : (
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? "relative rounded-md font-medium text-primary after:bg-primary/60"
                          : "border-transparent text-slate-400 after:bg-transparent hover:text-slate-500/80",
                        "relative flex h-full min-h-10 w-full items-center font-medium transition-all after:absolute after:-left-3.5 after:h-5 after:w-1 after:rounded-r-md xl:pl-3 xl:after:left-0 xl:after:top-1.5 xl:after:h-7 xl:after:w-[0.2rem] xl:after:rounded-sm",
                      )
                    }
                    to={navItem.linkTo}
                  >
                    <navItem.icon className="size-5 min-w-5" />
                    <p
                      className={cn(
                        isAsideOpen ? "opacity-100" : "opacity-0",
                        "rounded-lg p-2 text-sm transition-all xl:opacity-100",
                      )}
                    >
                      {navItem.name}
                    </p>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* User */}
        <div className="flex h-16 w-full items-center gap-2 overflow-hidden rounded-md border-t border-slate-200 bg-white px-1.5 py-4 xl:p-4">
          <div className="flex items-center justify-center rounded-full bg-primary/10 p-1.5">
            <span className="text-sm font-medium uppercase text-primary">
              {firstLetter}
              {secondLetter}
            </span>
          </div>
          <div
            className={cn(
              isAsideOpen ? "opacity-100" : "opacity-0 xl:opacity-100",
              "flex w-full flex-col gap-1 transition-all",
            )}
          >
            <div className="group relative h-4 w-full overflow-hidden">
              <p className="w-full cursor-default text-sm font-semibold text-slate-500">
                {user.name}
              </p>
            </div>
            <p className="text-[0.65rem] font-medium text-slate-400/70">
              {user.email}
            </p>
          </div>

          {/* User settings*/}
          <Popover
            isOpen={isAccountSettingsOpen}
            onOpenChange={(open) => {
              if (!open) setIsAsideOpen(false);
              setIsAccountSettingsOpen(open);
            }}
            placement="top"
          >
            <PopoverTrigger>
              <div
                className={cn(
                  isAccountSettingsOpen
                    ? "border-slate-100 bg-slate-100/50"
                    : "border-transparent",
                  "flex cursor-pointer items-center justify-center rounded-full border p-1 transition-all hover:border-slate-100 hover:bg-slate-100/50",
                )}
              >
                <ChevronUpIcon className="size-4 min-w-4 text-slate-500" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="min-w-44 items-start rounded-md px-0 py-0">
              <div className="flex w-full flex-col">
                {userItemsNavigation.map((nav) => (
                  <div
                    key={nav.name}
                    onClick={() => {
                      if (!nav.disabled) {
                        setIsAccountSettingsOpen(false);
                        navigate(nav.linkTo);
                      }
                    }}
                    className={cn(
                      nav.disabled
                        ? "opacity-70"
                        : "cursor-pointer transition-all first:rounded-t-md hover:bg-slate-100 hover:text-slate-400",
                      "flex w-full items-center gap-2 p-3 text-slate-400/60",
                    )}
                  >
                    <nav.icon className="size-4 min-w-4" />
                    <span className="text-xs font-medium">{nav.name}</span>
                  </div>
                ))}
                <span className="h-px w-full bg-slate-300/30" />
                <div
                  onClick={() => {
                    setIsAccountSettingsOpen(false);
                    onOpen();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-b-md p-3 text-danger/80 transition-all hover:bg-danger/5 hover:text-danger/80"
                >
                  <LogOutIcon className="size-4 min-w-4" />
                  <span className="text-xs font-semibold">Cerrar sesión</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      {/* Logout */}
      <Modal
        backdrop="opaque"
        radius="sm"
        isOpen={isOpen}
        onOpenChange={openLogoutModal}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex flex-col gap-2 px-2 py-4">
              <div className="flex justify-center">
                <LogOutIcon className="size-12 min-w-12 pl-1 text-red-500" />
              </div>
              <ModalBody className="flex items-center justify-center gap-3">
                <p className="text-2xl font-semibold text-slate-600">
                  Cerrar sesión
                </p>
                <p className="text-slate-400">
                  ¿Estás seguro que quieres cerrar sesión?
                </p>
              </ModalBody>
              <ModalFooter className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  className="min-w-32 bg-slate-200 font-medium text-slate-500"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  variant="error"
                  isLoading={
                    mutationLogout.isLoading || mutationLogout.isSuccess
                  }
                  disabled={
                    mutationLogout.isLoading || mutationLogout.isSuccess
                  }
                  className="min-w-32 bg-red-500 text-white"
                  onClick={() => {
                    mutationLogout.mutate();
                  }}
                >
                  Cerrar sesión
                </Button>
              </ModalFooter>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

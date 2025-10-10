import { NavLink, Outlet, useNavigate } from "react-router";
import {
  accountNavItems,
  cn,
  errorAuth,
  errorsResponse,
  getSession,
  navItems,
} from "@renderer/utils";
import { useCookies } from "react-cookie";
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
import { useMutation, useQuery, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";
import { ChevronUpIcon, CircleAlertIcon, LogOutIcon } from "lucide-react";
import { Button } from "../Button";
import { ServerError } from "@renderer/utils/types";
import { useState } from "react";

export default function ProtectedLayout() {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

  const [cookies] = useCookies(["token"]);
  let navigate = useNavigate();

  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  const sessionQuery = useQuery<
    Awaited<ReturnType<typeof getSession>>,
    ServerError
  >({
    queryKey: ["session"],
    queryFn: () => getSession(cookies?.token),
    onError: (error: any) => {
      if (errorAuth.includes(error?.message ?? "")) {
        navigate("/create-organization");
      } else if (
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404
      ) {
        navigate("/login");
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const mutationLogout = useMutation<void, any>({
    mutationFn: async () => {
      try {
        const { data } = await AxiosFetch.post(`/api/logout`);
        return data;
      } catch (error) {
        console.error(error);
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/login");
    },
  });

  const userItemsNavigation = accountNavItems(
    sessionQuery.data?.organization.id ?? -1,
  );

  const firstLetter =
    sessionQuery.data && sessionQuery.data?.name.split(" ")[0][0];

  const secondLetter =
    sessionQuery.data && sessionQuery.data?.name.split(" ")[1] !== undefined
      ? sessionQuery.data?.name.split(" ")[1][0]
      : sessionQuery.data?.name.split(" ")[0][1];

  if (
    sessionQuery?.isLoading ||
    sessionQuery?.isFetching ||
    errorAuth.includes(sessionQuery?.error?.message ?? "")
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <span className="relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-white">
      {sessionQuery.isError ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-4">
            <CircleAlertIcon className="size-20 min-w-20 text-red-500" />
            <p className="text-lg font-medium text-red-500">
              Ha ocurrido un error en el servidor
            </p>
            <Button onClick={() => navigate("/login")} variant="success">
              Volver al inicio
            </Button>
          </div>
        </div>
      ) : (
        <>
          <nav className="relative flex h-full min-w-72 flex-col gap-4 border-r">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <span className="onboarding-text text-2xl font-extrabold text-slate-200">
                    Finance
                  </span>
                  <b className="onboarding-text inline-block text-2xl font-extrabold">
                    {" "}
                    hub
                  </b>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">
                    {/* {sessionQuery?.data?.organization?.name} */}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation items */}
            <div className="flex h-full w-full flex-col justify-between py-4 pl-4">
              <ul className="flex flex-col gap-2">
                {navItems.map((navItem) => (
                  <li key={navItem.name} className="h-auto w-full">
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          isActive
                            ? "relative rounded-md font-medium text-primary after:bg-primary/60"
                            : "border-transparent text-slate-400 after:bg-transparent hover:text-slate-500/80",
                          "flex h-full min-h-10 w-full items-center pl-2 font-medium transition-all after:absolute after:left-0 after:top-0 after:h-full after:w-0.5 after:rounded-sm",
                        )
                      }
                      to={navItem.linkTo}
                    >
                      {/* <span
                        className={cn(
                          isActive ? "bg-primary/60" : "bg-transparent",
                          "mr-2 h-full w-0.5 rounded-sm",
                        )}
                      /> */}
                      <navItem.icon className="size-5 min-w-5" />
                      <p className="rounded-lg p-2 text-sm">{navItem.name}</p>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* User */}
            <div className="flex h-16 w-full items-center gap-2 rounded-md border-t border-slate-200 bg-white p-4">
              <div className="flex items-center justify-center rounded-full bg-primary/10 p-1.5">
                <span className="text-sm font-medium uppercase text-primary">
                  {firstLetter}
                  {secondLetter}
                </span>
              </div>
              <div className="flex w-full flex-col gap-1">
                <div className="group relative h-4 w-full overflow-hidden">
                  <p className="w-full cursor-default text-sm font-semibold text-slate-500">
                    {sessionQuery?.data?.name}
                  </p>
                </div>
                <p className="text-[0.65rem] font-medium text-slate-400/70">
                  {sessionQuery?.data?.email}
                </p>
              </div>

              <Popover
                isOpen={isAccountSettingsOpen}
                onOpenChange={(open) => setIsAccountSettingsOpen(open)}
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
                      <span className="text-xs font-semibold">
                        Cerrar sesión
                      </span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </nav>

          {/* Body */}
          <div className="flex w-2/3 flex-grow flex-col">
            <div className="flex flex-grow flex-col overflow-hidden bg-white">
              <Outlet context={sessionQuery?.data} />
            </div>
          </div>

          {/* Logout */}
          <Modal
            backdrop="opaque"
            radius="sm"
            isOpen={isOpen}
            onOpenChange={onOpenChange}
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
      )}
    </div>
  );
}

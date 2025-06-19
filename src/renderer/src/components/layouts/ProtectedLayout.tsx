import { NavLink, Outlet, useNavigate } from "react-router";
import { FaUserCircle } from "react-icons/fa";
import {
  errorAuth,
  errorsResponse,
  getSession,
  navItems,
} from "@renderer/utils";
import { useCookies } from "react-cookie";
import { SessionResponse } from "@renderer/utils/types";
import { IoLogOutOutline } from "react-icons/io5";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";
import { MdError } from "react-icons/md";

export default function ProtectedLayout() {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

  const [cookies] = useCookies(["token"]);
  let navigate = useNavigate();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const sessionQuery = useQuery<
    Awaited<ReturnType<typeof getSession>>,
    SessionResponse
  >({
    queryKey: ["session"],
    queryFn: () => getSession(cookies?.token),
    onError: (error: any) => {
      console.log("Error en sesión:", error);
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

  if (
    sessionQuery?.isLoading ||
    sessionQuery?.isFetching ||
    errorAuth.includes(sessionQuery?.error?.error?.message ?? "")
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
          <div className="flex h-96 w-full max-w-2xl flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-t from-red-200/50 via-white to-white">
            <MdError className="size-24 min-w-24 text-red-500" />
            <p className="text-2xl font-medium text-red-500">
              Ha ocurrido un error en el servidor
            </p>
          </div>
        </div>
      ) : (
        <>
          <nav className="relative flex h-full min-w-72 flex-col gap-4 border-r">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-red-200" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">
                    {sessionQuery?.data?.user?.organization?.name}
                  </p>
                </div>
              </div>
              <IoLogOutOutline
                onClick={() => onOpen()}
                className="size-6 min-w-6 cursor-pointer text-slate-300 transition-colors hover:text-red-500"
              />
            </div>
            <div className="h-[1px] w-full bg-slate-200" />
            <div className="flex h-full w-full flex-col justify-between p-4">
              <ul className="flex flex-col gap-2">
                {navItems.map((navItem) => (
                  <li key={navItem.name} className="h-auto w-full">
                    <NavLink
                      className={({ isActive }) =>
                        `${isActive ? `rounded-md bg-slate-100 text-slate-700` : `text-slate-500`} flex h-auto w-full items-center px-2 py-1 font-medium transition-all hover:bg-slate-100/60 hover:text-slate-700`
                      }
                      to={navItem.linkTo}
                    >
                      <navItem.icon className="size-5 min-w-5" />
                      <p className="rounded-lg px-4 py-2 text-sm">
                        {navItem.name}
                      </p>
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="flex h-12 w-full items-center gap-4 rounded-md bg-white px-2 py-1 shadow-md">
                <div className="rounded-full">
                  <FaUserCircle className="size-6 min-w-6 text-slate-500" />
                </div>
                <div className="flex w-full flex-col gap-1">
                  <div className="group relative h-4 w-full overflow-hidden">
                    <p className="absolute top-0 w-full cursor-default text-sm font-semibold text-slate-600 transition-transform group-hover:translate-y-full">
                      {sessionQuery?.data?.user?.name}
                    </p>
                    <p className="absolute top-0 w-full -translate-y-full cursor-default text-sm font-semibold text-slate-600 transition-transform group-hover:-translate-y-[0.100rem]">
                      {sessionQuery?.data?.user?.email}
                    </p>
                  </div>
                  <p className="text-[0.65rem] font-medium text-slate-400">
                    Administrador
                  </p>
                </div>
              </div>
            </div>
          </nav>
          <div className="flex w-2/3 flex-grow flex-col">
            <div className="flex flex-grow flex-col overflow-hidden bg-white">
              <Outlet context={sessionQuery?.data} />
            </div>
          </div>
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
                    <IoLogOutOutline className="size-12 min-w-12 pl-1 text-red-500" />
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
                      radius="sm"
                      className="min-w-32 bg-slate-200 font-medium text-slate-500"
                      onPress={onClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      radius="sm"
                      isLoading={
                        mutationLogout.isLoading || mutationLogout.isSuccess
                      }
                      isDisabled={
                        mutationLogout.isLoading || mutationLogout.isSuccess
                      }
                      className="min-w-32 bg-red-500 text-white"
                      onPress={() => {
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

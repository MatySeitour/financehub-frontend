import { NavLink, Outlet, useNavigate } from "react-router";
import { FaUserCircle } from "react-icons/fa";
import { errorsResponse, getSession, navItems } from "@renderer/utils";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import { User } from "@renderer/utils/types";
import { IoLogOutOutline } from "react-icons/io5";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { useMutation, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";

export default function ProtectedLayout() {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios("http://localhost");

  const [cookies] = useCookies(["token"]);
  let navigate = useNavigate();

  const [user, setUser] = useState<User>();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const session = async () => {
      try {
        const data = await getSession(cookies?.token);
        if (data?.user === undefined) return navigate("/login");
        setUser(data?.user);
        return data;
      } catch (error) {}
    };
    session();
  }, []);

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

  return (
    <div className="flex h-screen w-screen bg-slate-400/20">
      <nav className="relative flex h-full min-w-72 flex-col gap-4 p-4">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-red-200"></div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.organization?.name}
                </p>
              </div>
            </div>
            <IoLogOutOutline
              onClick={() => onOpen()}
              className="size-6 min-w-6 cursor-pointer text-slate-300 transition-colors hover:text-red-500"
            />
          </div>
          <div className="h-[1px] w-full bg-slate-200"></div>
        </div>
        <div className="flex h-full w-full flex-col justify-between">
          <ul className="flex flex-col gap-2">
            {navItems.map((navItem) => (
              <li key={navItem.name} className="h-auto w-full">
                <NavLink
                  className={({ isActive }) =>
                    `${isActive ? `rounded-md bg-white text-slate-700` : `text-slate-500`} flex h-auto w-full items-center px-2 py-1 font-medium transition-all hover:text-slate-700`
                  }
                  to={navItem.linkTo}
                >
                  <navItem.icon className="size-5 min-w-5" />
                  <p className="rounded-lg px-4 py-2 text-sm">{navItem.name}</p>
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex h-12 w-full items-center gap-4 rounded-md bg-white px-2 py-1 shadow-sm">
            <div className="rounded-full">
              <FaUserCircle className="size-6 min-w-6 text-slate-500" />
            </div>
            <div className="flex w-full flex-col gap-1">
              <div className="group relative h-4 w-full overflow-hidden">
                <p className="absolute top-0 w-full cursor-default text-sm font-semibold text-slate-600 transition-transform group-hover:translate-y-full">
                  {user?.name}
                </p>
                <p className="absolute top-0 w-full -translate-y-full cursor-default text-sm font-semibold text-slate-600 transition-transform group-hover:-translate-y-[0.100rem]">
                  {user?.email}
                </p>
              </div>
              <p className="text-[0.65rem] font-medium text-slate-400">
                Administrador
              </p>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex w-2/3 flex-grow flex-col px-6 py-2">
        <div className="flex flex-grow flex-col overflow-hidden rounded-md bg-white">
          <div className="flex-grow">
            <Outlet />
          </div>
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
                <div className="flex items-center justify-center rounded-full bg-red-300/30 p-3">
                  <IoLogOutOutline className="size-12 min-w-12 pl-1 text-red-500" />
                </div>
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
    </div>
  );
}

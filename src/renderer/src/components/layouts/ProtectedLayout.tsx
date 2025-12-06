import { Outlet, useNavigate } from "react-router";
import { errorAuth, getSession } from "@renderer/utils";
import { useCookies } from "react-cookie";
import { useQuery } from "react-query";
import { CircleAlertIcon } from "lucide-react";
import { Button } from "../Button";
import { ServerError } from "@renderer/utils/types";
import { Navigation } from "../navigation";

export default function ProtectedLayout() {
  const [cookies] = useCookies(["token"]);
  console.log("llega a home");

  console.log("Cookies", cookies);
  let navigate = useNavigate();

  const sessionQuery = useQuery<
    Awaited<ReturnType<typeof getSession>>,
    ServerError
  >({
    queryKey: ["session"],
    queryFn: () => getSession(cookies?.token),
    onError: (error: any) => {
      console.log("error: ", error);
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

  console.log("sessionQuery: ", sessionQuery.data);

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
    <div className="flex h-dvh w-screen bg-white">
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
          {sessionQuery?.data && <Navigation user={sessionQuery?.data} />}

          {/* Body */}
          <div className="flex w-full flex-grow flex-col pl-12 xl:w-2/3 xl:pl-0">
            <div className="flex flex-grow flex-col overflow-hidden bg-white">
              <Outlet context={sessionQuery?.data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

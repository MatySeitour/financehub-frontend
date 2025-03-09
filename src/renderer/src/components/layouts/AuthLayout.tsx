import { Outlet, useNavigate } from "react-router";
import { errorAuth, getSession } from "@renderer/utils";
import { useCookies } from "react-cookie";
import { useQuery } from "react-query";
import { ErrorResponseSession } from "@renderer/utils/types";

export function AuthLayout() {
  const [cookies] = useCookies(["token"]);
  let navigate = useNavigate();

  const sessionQuery = useQuery<
    Awaited<ReturnType<typeof getSession>>,
    ErrorResponseSession
  >({
    queryKey: ["session"],
    queryFn: () => getSession(cookies?.token),
    onSuccess: () => {
      navigate("/home");
    },
    onError: (error: ErrorResponseSession) => {
      console.log("Error en sesión:", error);
      if (errorAuth.includes(error?.message ?? "")) {
        navigate("/create-organization");
      } else {
        navigate("/login");
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (sessionQuery?.isLoading || sessionQuery?.isFetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <span className="relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
      </div>
    );
  } else {
    return <Outlet />;
  }
}

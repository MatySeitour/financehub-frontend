import { Outlet, useNavigate } from "react-router";
import { errorAuth, getSession } from "@renderer/utils";
import { useQuery } from "react-query";
import { SessionError } from "@renderer/utils/types";
import { SESSION_QUERY_KEY } from "@renderer/hooks/user";

export function AuthLayout() {
  let navigate = useNavigate();

  const sessionQuery = useQuery<
    Awaited<ReturnType<typeof getSession>>,
    SessionError
  >({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    onSuccess: () => {
      navigate("/home");
    },
    onError: (error) => {
      if (errorAuth.includes(error?.message ?? "")) {
        navigate("/create-organization");
      } else if (error.status === 401 || error.status === 403) {
        navigate("/login");
      }
    },
    retry: (failureCount, error) => error.status >= 500 && failureCount < 1,
    refetchOnWindowFocus: true,
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <span className="relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
      </div>
    );
  }
  return <Outlet />;
}

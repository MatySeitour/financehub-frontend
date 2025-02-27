import { Outlet, useNavigate } from "react-router";
import { getSession } from "@renderer/utils";
import { useCookies } from "react-cookie";
import { useEffect } from "react";

export function AuthLayout() {
  const [cookies] = useCookies(["token"]);
  let navigate = useNavigate();

  const errorAuth = [
    "not_organization",
    "org_step_1",
    "org_step_2",
    "org_step_3",
  ];

  useEffect(() => {
    const session = async () => {
      try {
        const data = await getSession(cookies?.token);
        if (data?.user !== undefined) navigate("/home");
        if (data?.user === undefined) navigate("/login");

        if (errorAuth.includes(data?.error?.message ?? ""))
          navigate("/create-organization");
        return data;
      } catch (error) {
        return console.error(error);
      }
    };
    session();
  }, []);

  return <Outlet />;
}

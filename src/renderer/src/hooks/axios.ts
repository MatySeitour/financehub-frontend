import Axios from "axios";

export default function axios(baseURL: string | undefined) {
  const AxiosFetch = Axios.create({
    withCredentials: true,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      cache: "no-store",
    },
    baseURL: baseURL,
  });

  return { AxiosFetch };
}

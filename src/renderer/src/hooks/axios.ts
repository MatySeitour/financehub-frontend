import Axios from "axios";

export default function axios(baseURL: string | undefined) {
  const AxiosFetch = Axios.create({
    allowAbsoluteUrls: false,
    withCredentials: true,
    timeout: 30_000,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/json;charset=UTF-8",
    },
    baseURL: baseURL,
  });

  return { AxiosFetch };
}

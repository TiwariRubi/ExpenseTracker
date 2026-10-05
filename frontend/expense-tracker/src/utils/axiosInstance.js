import axios from "axios";
import {API_PATHS, BASE_URL} from "./apiPaths";

const axiosInstance = axios.create({
  baseURL : BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const isLoginRequest = (config) => {
  if (!config?.url) return false;
  return new URL(config.url, config.baseURL || BASE_URL).pathname === API_PATHS.AUTH.LOGIN;
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) =>{
      const accessToken =localStorage.getItem("token");
      if(accessToken){
        config.headers.Authorization =`Bearer ${accessToken}`;

      }
      return config;
    },
    (error) =>{
      return Promise.reject(error);
    }
);

// response Inceptor
axiosInstance.interceptors.response.use(
  (response) =>{
    return response;
  },
  (error)=>{
    // Handle common errors globally
    if(error.response){
      if(error.response.status===401){
        if (!isLoginRequest(error.config)) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth:session-expired"));

          const message = "Session expired, please log in again";
          sessionStorage.setItem("sessionExpiredMessage", message);
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          } else {
            window.dispatchEvent(new Event("auth:session-expired-notice"));
          }
        }
      }else if(error.response.status===500){
        console.error("Server error. Please try again later");
      }
    } else if (error.code==="ECONNABORTED"){
        console.error("Request timeout. Please try again");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

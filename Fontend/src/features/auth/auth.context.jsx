import { createContext,useState,useEffect } from "react";
import { getme } from "./services/auth.api";


export const AuthContext = createContext()

export const AuthProvider = ({children}) => {
   const [user,setUser] = useState(null)
   const [loading,setLoading] = useState(true)
  

   return(
    <AuthContext.Provider value={{user,setUser,loading,setLoading}}>
        {children}
    </AuthContext.Provider> 
   )

}
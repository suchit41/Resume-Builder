import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import {register,login,logout,getme} from '../services/auth.api.js'
import { useEffect } from "react";


export const useAuth = () => {

    const context = useContext(AuthContext)
    const {user,setUser,loading,setLoading} = context

    const handleLogin = async ({email,password})=>{

        setLoading(true)
        try{
            const data = await login({email,password})
            setUser(data.user)
            return data;
        }catch(err){
            console.error("Error in Login" ,err);
            throw err;
        }finally{
            setLoading(false)
        }
    };


    const handleRegister = async ({username,email,password})=>{
        setLoading(true)
        try{
            const data = await register({username,email,password})
            setUser(data.user)
            return data;
        }catch(err){
            console.error("Error in Login" ,err);
            throw err;
        }finally{
            setLoading(false)
        }
    };


    const handleLogout= async ()=>{
        setLoading(true)
        try{
            const data = await logout({})
            setUser(null)
        }catch(err){
            console.error("Error in Login" ,err);
            throw err;
        }finally{
            setLoading(false)
        }
    }


     useEffect(()=>{

    const getAuthUser = async ()=>{
        try{
            const data = await getme()
            setUser(data.user)
        }catch(err){
            console.error("Error in getting auth user" ,err);
        }finally{
            setLoading(false)
        }
    }

        getAuthUser()
   },[])


    return {user,loading,handleLogin,handleRegister,handleLogout}


}
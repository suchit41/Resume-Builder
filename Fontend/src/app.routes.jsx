import {createBrowserRouter, Navigate} from "react-router-dom";
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/login";
import Protected from "./features/auth/components/protected";
import Home from "./features/interview/Pages/Home";
import Interview from "./features/interview/Pages/interview";



export const router = createBrowserRouter([

{
    path:"/register",
    element:<Register/>,

},
{
    path:"/login",
    element:<Login/>,
    
},

{
    path:"/",
    element:<Protected><Home/></Protected>
},
{
    path:"/interview",
    element:<Protected><Interview/></Protected>
}
]);
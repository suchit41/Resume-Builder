import {createBrowserRouter, Navigate} from "react-router-dom";
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/Pages/Home";
import Interview from "./features/interview/Pages/interview";
import CareerTools from "./features/career/Pages/CareerTools";



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
},
{
    path:"/interview/:interviewId",
    element:<Protected><Interview/></Protected>
},
/* ── Career Tools page — 6 AI-powered career enhancement features ── */
{
    path:"/career-tools",
    element:<Protected><CareerTools/></Protected>
}
]);
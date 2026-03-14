import React from 'react'
import "../auth.form.scss"
import "../../../styles/button.scss"
import { useNavigate,Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import {useState} from 'react'


const Login = () => {

    const navigate = useNavigate();
    const {loading,handleLogin} = useAuth()

    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")


    const handleSubmit =async (e) => {
        e.preventDefault();
        try {
            await handleLogin({email,password})
            navigate("/")
        } catch (error) {
            window.alert(error?.userMessage || "Unable to login. Please check your credentials.")
        }
    }

    if(loading){
    return <main>Loading</main>
    }

  return (
    <main>
        <div className='form-container'>
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <div className='input-group'>
                    <label htmlFor="email">Email</label>
                    <input onChange={(e)=>{setEmail(e.target.value)}}
                     type="email" name='email' id='email' placeholder='Enter your email' />
                </div>
                <div className='input-group'>
                    <label htmlFor="password">Password</label>
                    <input onChange={(e)=>{setPassword(e.target.value)}}
                     type="password" name='password' id='password' placeholder='Enter your password' />
                </div>
                <button className='button primary-button'>Login</button>
            </form>
        <p>Don't have an Account? <Link to="/register">Register</Link></p>
            
        </div>
    </main>
  )
}

export default Login

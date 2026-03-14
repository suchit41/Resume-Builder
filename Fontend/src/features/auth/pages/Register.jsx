
import React from 'react'
import "../auth.form.scss"
import "../../../styles/button.scss"
import { useNavigate,Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import {useState} from 'react'



const Register = () => {
    const navigate = useNavigate();
    const [username, setUserName] = useState("")
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const {loading, handleRegister} = useAuth()

      const handleSubmit =async (e) => {
        e.preventDefault();
        try {
          await handleRegister({username,email,password})
          navigate("/login")
        } catch (error) {
          window.alert(error?.userMessage || "Unable to register. Please try again.")
        }
    }


  return (
    <main>
         <div className='form-container'>
            <h1>Register</h1>

            <form onSubmit={handleSubmit}>
                 <div className='input-group'>
                    <label htmlFor="username">userName</label>
                    <input onChange={(e)=>{setUserName(e.target.value)}} type="text" name='username' id='username' placeholder='Enter your username' />
                </div>

                <div className='input-group'>
                    <label htmlFor="email">Email</label>
                    <input onChange={(e)=>{setEmail(e.target.value)}} type="email" name='email' id='email' placeholder='Enter your email' />
                </div>
                <div className='input-group'>
                    <label htmlFor="password">Password</label>
                    <input onChange={(e)=>{setPassword(e.target.value)}} type="password" name='password' id='password' placeholder='Enter your password' />
                </div>
                <button disabled={loading} className='button primary-button'>{loading ? 'Registering...' : 'Register'}</button>
            </form>
            <p>Already have an Account? <Link to="/login">Login</Link></p>
        </div>
    </main>
  )
}

export default Register

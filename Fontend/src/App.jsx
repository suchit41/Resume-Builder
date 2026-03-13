import React from 'react'
import { router } from "./app.routes.jsx"
import { RouterProvider } from 'react-router-dom'
import { InterviewProvider } from './features/interview/interview.context.jsx'
import { AuthProvider } from './features/auth/auth.context.jsx'
function App() {

  return (
    <AuthProvider>
      <InterviewProvider>
      <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App

import Login from "./pages/Auth/Login/Login"
import { Toaster } from "react-hot-toast"

function App() {

  return (
    <div className="bg-colorSecondary h-screen text-colorNeutral">
      <Login />
      <Toaster position="top-right" />
    </div>
  )
}

export default App

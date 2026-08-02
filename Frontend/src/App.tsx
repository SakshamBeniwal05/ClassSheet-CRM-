import { useEffect } from "react"
import { userStore } from "./store/userStore"
import Login from "./pages/Auth/Login/Login"
import { Dashboard } from "./pages/Dashboard/Dashboard"
import { Clients } from "./pages/Clients/Clients"
import { Deals } from "./pages/Deals/Deals"
import { Reminders } from "./pages/Reminders/Reminders"
import { Organisation } from "./pages/Organisation/Organisation"
import { Toaster } from "react-hot-toast"
import { Loader2 } from "lucide-react"

function App() {
    const { userData, isCheckingAuth, checkAuth, currentPage } = (userStore as any)();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isCheckingAuth) {
        return (
            <div className="h-screen w-full flex flex-col justify-center items-center bg-[#191302] text-[#f1e1bf]">
                <Loader2 className="w-10 h-10 animate-spin text-[#DB422A] mb-4" />
                <p className="text-sm font-semibold tracking-wider uppercase opacity-80">Verifying session...</p>
            </div>
        );
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />
            case 'clients':
                return <Clients />
            case 'deals':
                return <Deals />
            case 'reminders':
                return <Reminders />
            case 'employees':
                return <Organisation />
            default:
                return <Dashboard />
        }
    }

    return (
        <div className="bg-[#191302] h-screen overflow-hidden">
            {userData ? renderPage() : <Login />}
            <Toaster position="top-right" />
        </div>
    )
}

export default App

import { useEffect } from "react"
import { userStore } from "./store/userStore"
import { useClientStore } from "./store/clientStore"
import { useDealStore } from "./store/dealStore"
import { useReminderStore } from "./store/reminderStore"
import Login from "./pages/Auth/Login/Login"
import OTP from "./pages/OTP/otp"
import { Dashboard } from "./pages/Dashboard/Dashboard"
import { Clients } from "./pages/Clients/Clients"
import { Deals } from "./pages/Deals/Deals"
import { Reminders } from "./pages/Reminders/Reminders"
import { Organisation } from "./pages/Organisation/Organisation"
import { Toaster } from "react-hot-toast"
import { Loader2 } from "lucide-react"

function App() {
    const { userData, isCheckingAuth, checkAuth, currentPage, isLoggingIn, isRegistering, isJoining } = (userStore as any)();
    const { isCreatingClient, isUpdatingClient } = (useClientStore as any)();
    const { isCreatingDeal, isUpdatingDeal } = (useDealStore as any)();
    const { isCreatingReminder, isUpdatingStatus } = (useReminderStore as any)();

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

    let loadingMessage = "";
    if (isLoggingIn) loadingMessage = "Logging in to Dashboard...";
    else if (isRegistering || isJoining) loadingMessage = "Configuring Your Organization...";
    else if (isCreatingClient) loadingMessage = "Saving Client to Directory...";
    else if (isUpdatingClient) loadingMessage = "Updating Client Record...";
    else if (isCreatingDeal) loadingMessage = "Initiating New Deal Pipeline...";
    else if (isUpdatingDeal) loadingMessage = "Saving Deal Modifications...";
    else if (isCreatingReminder) loadingMessage = "Scheduling Task Alert...";
    else if (isUpdatingStatus) loadingMessage = "Updating Task Status...";

    return (
        <div className="bg-[#191302] h-screen overflow-hidden relative">
            {userData ? renderPage() : (currentPage === 'otp' ? <OTP /> : <Login />)}

            {/* Global Loader Overlay */}
            {loadingMessage && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center pointer-events-auto">
                    <div className="bg-[#242424] border border-colorNeutral/30 px-8 py-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl text-center max-w-xs">
                        <Loader2 className="w-10 h-10 animate-spin text-[#DB422A]" />
                        <p className="text-sm font-bold text-[#F1E1BF] tracking-wide uppercase font-sans animate-pulse">{loadingMessage}</p>
                    </div>
                </div>
            )}

            <Toaster position="top-right" />
        </div>
    )
}

export default App

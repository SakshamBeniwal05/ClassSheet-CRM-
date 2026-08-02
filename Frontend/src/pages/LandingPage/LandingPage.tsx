import { userStore } from "../../store/userStore"
import { LogOut, User, Shield, Briefcase, Database } from "lucide-react"

const LandingPage = () => {
    const { userData, logout, isLoggingOut } = (userStore as any)();
    const user = userData?.data?.user;

    return (
        <div className="h-screen w-full flex flex-col bg-[#191302] text-[#f1e1bf]">
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-4 bg-[#242424] border-b border-white/5 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#DB422A] flex items-center justify-center rounded-lg">
                        <Database className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tighter">Core CRM Dashboard</span>
                </div>
                <button
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#5a403c] hover:bg-[#DB422A] text-white transition-all active:scale-95 disabled:opacity-50"
                >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto space-y-6">
                <div className="glass-panel p-8 rounded-xl shadow-2xl space-y-6 w-full">
                    <div className="w-16 h-16 bg-[#DB422A]/10 border border-[#DB422A]/30 rounded-full flex items-center justify-center mx-auto text-[#DB422A]">
                        <User className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold font-sans">Welcome Back, {user?.name || "User"}!</h2>
                        <p className="text-sm text-[#e3beb7]">{user?.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-left">
                            <Shield className="w-5 h-5 text-[#ffb77a]" />
                            <div>
                                <p className="text-[10px] uppercase text-[#e3beb7] tracking-wider font-semibold">Role</p>
                                <p className="text-sm font-bold">{user?.role || "Employee"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-left">
                            <Briefcase className="w-5 h-5 text-[#ffb77a]" />
                            <div>
                                <p className="text-[10px] uppercase text-[#e3beb7] tracking-wider font-semibold">Org ID</p>
                                <p className="text-sm font-bold truncate max-w-[100px]">{user?.organisationId || "Personal"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default LandingPage
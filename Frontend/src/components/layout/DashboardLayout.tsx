import React from 'react'
import { userStore } from '../../store/userStore'
import { 
    LayoutDashboard, 
    Users, 
    Handshake, 
    Bell, 
    Contact, 
    Settings, 
    LogOut, 
    Search, 
    HelpCircle, 
    Plus
} from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab }) => {
    const { userData, logout, isLoggingOut, setCurrentPage } = (userStore as any)()
    const user = userData?.data?.user

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'deals', label: 'Deals', icon: Handshake },
        { id: 'reminders', label: 'Reminders', icon: Bell },
        { id: 'employees', label: 'Employees', icon: Contact },
    ]

    return (
        <div className="h-screen w-full flex bg-colorSecondary text-tInverted overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-[280px] h-full bg-colorSecondary border-r border-colorNeutral/30 flex flex-col py-6 flex-shrink-0 z-50">
                <div className="px-6 mb-8">
                    <h1 className="text-xl font-bold text-colorPrimary tracking-tight">CRM Admin</h1>
                    <p className="text-xs text-tPrimary opacity-70 uppercase tracking-widest font-semibold mt-1">
                        {user?.role || 'Managing Director'}
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentPage(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                                    isActive
                                        ? 'bg-tSecondary/30 text-tInverted border-l-4 border-colorPrimary rounded-l-none'
                                        : 'text-tPrimary hover:bg-tSecondary hover:text-tInverted'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-colorPrimary' : ''}`} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                <div className="px-4 mt-auto space-y-4">
                    {activeTab !== 'deals' && (
                        <button 
                            onClick={() => setCurrentPage('deals')}
                            className="w-full py-2.5 bg-colorPrimary hover:bg-hoverPrimary text-white rounded-lg font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            New Deal
                        </button>
                    )}

                    <div className="border-t border-colorNeutral/20 pt-4 space-y-1">
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className="w-full flex items-center gap-3 px-4 py-2 text-tPrimary hover:text-tInverted text-sm font-semibold"
                        >
                            <Settings className="w-5 h-5" />
                            Settings
                        </button>
                        <button
                            onClick={logout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2 text-tPrimary hover:text-red-400 text-sm font-semibold disabled:opacity-50"
                        >
                            <LogOut className="w-5 h-5" />
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 h-full flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 w-full bg-tSecondary border-b border-colorNeutral/30 flex justify-between items-center px-8 flex-shrink-0 z-40 shadow-sm">
                    <div className="flex items-center gap-8">
                        <span className="text-lg font-black text-tInverted tracking-wider uppercase">Core CRM</span>
                        <div className="relative w-80">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tPrimary/60" />
                            <input
                                className="w-full bg-colorSecondary border border-colorNeutral/30 rounded-full pl-10 pr-4 py-1.5 text-sm text-tInverted placeholder-tPrimary/50 focus:outline-none focus:border-colorPrimary focus:ring-1 focus:ring-colorPrimary transition-all"
                                placeholder="Search client directory, deals, reminders..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-1.5 hover:bg-tSecondary rounded-full text-tPrimary hover:text-tInverted transition-colors cursor-pointer active:opacity-80">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-colorPrimary rounded-full"></span>
                        </button>
                        <button className="p-1.5 hover:bg-tSecondary rounded-full text-tPrimary hover:text-tInverted transition-colors cursor-pointer active:opacity-80">
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        <div className="h-9 w-9 rounded-full overflow-hidden border border-colorPrimary ml-2 flex-shrink-0">
                            <img
                                className="object-cover w-full h-full"
                                alt="User Avatar"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuArymyrHfasz_OBBK4aWEcz2R0d8JdFpQXzrU4aYsFc5ixqefHBp8tK6OhsTOnhGT2ubgwaLYiSGfaS96LSi1iYF18m-ZAwZinx_6cbMiKut6-IMILAypYbECWoxgqGMugpeAgrmQKhtzWDE-oJlXg7Dgb0E6c-gRPG59l-z8qN2cDNamL6Z08cinTo54OwiQ-9YD1fwYNfajSPbcI0aluzdVDCJkydXnv5fZjQ1ToGIvxUQqz1ZIfFA-LgxTRuJA2ns9mjC3p-218"
                            />
                        </div>
                    </div>
                </header>

                {/* Sub-page Content */}
                <main className="flex-1 overflow-y-auto bg-colorSecondary p-8">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

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
    HelpCircle, 
    Plus,
    Sidebar,
    Menu,
    X
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { ClientDetailsModal, DealDetailsModal } from '../modals/DetailsModals'

interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab }) => {
    const { userData, logout, isLoggingOut, setCurrentPage, isSidebarMinimized, toggleSidebarMinimized } = (userStore as any)()
    const user = userData?.data?.user
    const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false)

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
            <aside className={`hidden lg:flex ${isSidebarMinimized ? 'w-20' : 'w-[280px]'} h-full bg-colorSecondary border-r border-colorNeutral/30 flex-col py-6 flex-shrink-0 z-50 transition-all duration-300`}>
                <div className={`px-4 mb-8 flex ${isSidebarMinimized ? 'flex-col gap-4 items-center' : 'justify-between items-center'}`}>
                    {!isSidebarMinimized && (
                        <div>
                            <h1 className="text-xl font-bold text-colorPrimary tracking-tight">CRM Admin</h1>
                            <p className="text-xs text-tPrimary opacity-70 uppercase tracking-widest font-semibold mt-1">
                                {user?.role || 'Managing Director'}
                            </p>
                        </div>
                    )}
                    <button 
                        onClick={toggleSidebarMinimized}
                        className="p-1.5 hover:bg-tSecondary rounded-full text-tPrimary hover:text-tInverted transition-colors cursor-pointer bg-transparent border-none"
                    >
                        <Sidebar className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentPage(item.id)}
                                title={isSidebarMinimized ? item.label : undefined}
                                className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                                    isActive
                                        ? 'bg-tSecondary/30 text-tInverted border-l-4 border-colorPrimary rounded-l-none'
                                        : 'text-tPrimary hover:bg-tSecondary hover:text-tInverted'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-colorPrimary' : ''}`} />
                                {!isSidebarMinimized && item.label}
                            </button>
                        )
                    })}
                </nav>

                <div className="px-4 mt-auto space-y-4">
                    {activeTab !== 'deals' && (
                        <button 
                            onClick={() => setCurrentPage('deals')}
                            title={isSidebarMinimized ? "New Deal" : undefined}
                            className={`w-full py-2.5 bg-colorPrimary hover:bg-hoverPrimary text-white rounded-lg font-bold transition-all active:scale-[0.98] flex items-center justify-center ${isSidebarMinimized ? '' : 'gap-2'} text-sm shadow-md`}
                        >
                            <Plus className="w-5 h-5" />
                            {!isSidebarMinimized && "New Deal"}
                        </button>
                    )}

                    <div className="border-t border-colorNeutral/20 pt-4 space-y-1">
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            title={isSidebarMinimized ? "Settings" : undefined}
                            className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3 px-4'} py-2 text-tPrimary hover:text-tInverted text-sm font-semibold bg-transparent border-none`}
                        >
                            <Settings className="w-5 h-5" />
                            {!isSidebarMinimized && "Settings"}
                        </button>
                        <button
                            onClick={logout}
                            disabled={isLoggingOut}
                            title={isSidebarMinimized ? "Logout" : undefined}
                            className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3 px-4'} py-2 text-tPrimary hover:text-red-400 text-sm font-semibold disabled:opacity-50 bg-transparent border-none`}
                        >
                            <LogOut className="w-5 h-5" />
                            {!isSidebarMinimized && (isLoggingOut ? 'Logging out...' : 'Logout')}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 h-full flex flex-col overflow-hidden">
                {/* Mobile Top Header (only visible on screens < 1024px) */}
                <header className="flex lg:hidden items-center justify-between px-6 py-4 border-b border-colorNeutral/30 bg-colorSecondary w-full h-16 flex-shrink-0 z-45 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-tInverted tracking-wider uppercase">Core CRM</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 hover:bg-tSecondary rounded-lg text-tPrimary hover:text-tInverted transition-colors cursor-pointer bg-transparent border-none"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Top Header (Desktop, only visible >= 1024px) */}
                <header className="hidden lg:flex h-16 w-full bg-tSecondary border-b border-colorNeutral/30 justify-between items-center px-8 flex-shrink-0 z-40 shadow-sm">
                    <div className="flex items-center gap-8">
                        <span className="text-lg font-black text-tInverted tracking-wider uppercase">Core CRM</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-1.5 hover:bg-tSecondary rounded-full text-tPrimary hover:text-tInverted transition-colors cursor-pointer active:opacity-80 bg-transparent border-none">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-colorPrimary rounded-full"></span>
                        </button>
                        <button className="p-1.5 hover:bg-tSecondary rounded-full text-tPrimary hover:text-tInverted transition-colors cursor-pointer active:opacity-80 bg-transparent border-none">
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
                <main className="flex-1 overflow-y-auto bg-colorSecondary p-4 lg:p-8">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Fullscreen Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-colorSecondary z-[100] flex flex-col p-6 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-colorNeutral/20 pb-4">
                            <div>
                                <h1 className="text-xl font-bold text-colorPrimary tracking-tight">CRM Admin</h1>
                                <p className="text-xs text-tPrimary opacity-70 uppercase tracking-widest font-semibold mt-1">
                                    {user?.role || 'Managing Director'}
                                </p>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 hover:bg-tSecondary rounded-lg text-tPrimary hover:text-red-400 cursor-pointer bg-transparent border-none"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Nav Items */}
                        <div className="flex-1 py-8 space-y-4 flex flex-col justify-center">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setCurrentPage(item.id)
                                            setMobileMenuOpen(false)
                                        }}
                                        className={`w-full flex items-center justify-center gap-4 py-4 rounded-xl text-lg font-bold transition-all ${
                                            isActive
                                                ? 'bg-colorPrimary text-white shadow-lg'
                                                : 'text-tPrimary hover:bg-tSecondary hover:text-tInverted'
                                        }`}
                                    >
                                        <Icon className="w-6 h-6" />
                                        {item.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-colorNeutral/20 pt-6 space-y-4">
                            {activeTab !== 'deals' && (
                                <button 
                                    onClick={() => {
                                        setCurrentPage('deals')
                                        setMobileMenuOpen(false)
                                    }}
                                    className="w-full py-4 bg-colorPrimary hover:bg-hoverPrimary text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-md shadow-lg"
                                >
                                    <Plus className="w-5 h-5" />
                                    New Deal
                                </button>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setCurrentPage('dashboard')
                                        setMobileMenuOpen(false)
                                    }}
                                    className="py-3 flex items-center justify-center gap-2 text-tPrimary hover:text-tInverted text-sm font-semibold bg-tSecondary/30 rounded-lg border-none"
                                >
                                    <Settings className="w-5 h-5" />
                                    Settings
                                </button>
                                <button
                                    onClick={() => {
                                        logout()
                                        setMobileMenuOpen(false)
                                    }}
                                    disabled={isLoggingOut}
                                    className="py-3 flex items-center justify-center gap-2 text-tPrimary hover:text-red-400 text-sm font-semibold bg-tSecondary/30 rounded-lg disabled:opacity-50 border-none"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Details Modals */}
            <ClientDetailsModal />
            <DealDetailsModal />
        </div>
    )
}

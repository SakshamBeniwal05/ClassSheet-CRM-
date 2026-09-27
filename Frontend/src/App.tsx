import React, { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { userStore } from "./store/userStore"
import { useClientStore } from "./store/clientStore"
import { useDealStore } from "./store/dealStore"
import { useReminderStore } from "./store/reminderStore"
import Login from "./pages/Auth/Login/Login"
import OTP from "./pages/OTP/otp"
import ResetPassword from "./pages/Auth/ResetPassword/ResetPassword"
import { Dashboard } from "./pages/Dashboard/Dashboard"
import { Clients } from "./pages/Clients/Clients"
import { Deals } from "./pages/Deals/Deals"
import { Reminders } from "./pages/Reminders/Reminders"
import { Organisation } from "./pages/Organisation/Organisation"
import { Toaster } from "react-hot-toast"
import { Loader2 } from "lucide-react"
import DealManagement from "./pages/Deals/DealManagement"

const pathToPage: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/clients': 'clients',
    '/deals': 'deals',
    '/dealManagement': 'dealManagement',
    '/deal-management': 'dealManagement',
    '/dealmanagement': 'dealManagement',
    '/deal%20Management': 'dealManagement',
    '/reminders': 'reminders',
    '/employees': 'employees',
    '/organisation': 'employees',
    '/login': 'login',
    '/otp': 'otp',
    '/reset-password': 'reset-password',
}

const pageToPath: Record<string, string> = {
    dashboard: '/dashboard',
    clients: '/clients',
    deals: '/deals',
    dealManagement: '/dealManagement',
    'deal Management': '/dealManagement',
    'deal-management': '/dealManagement',
    reminders: '/reminders',
    employees: '/employees',
    organisation: '/employees',
    login: '/login',
    otp: '/otp',
    'reset-password': '/reset-password',
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { userData } = (userStore as any)()
    if (!userData) {
        return <Navigate to="/login" replace />
    }
    return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { userData } = (userStore as any)()
    if (userData) {
        return <Navigate to="/dashboard" replace />
    }
    return <>{children}</>
}

function NavigationSync() {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentPage, setCurrentPage, userData } = (userStore as any)()
    const isInitialMount = React.useRef(true)
    const prevPageRef = React.useRef(currentPage)

    // Synchronize currentPage store with active route pathname
    useEffect(() => {
        const mappedPage = pathToPage[location.pathname]
        if (mappedPage && mappedPage !== currentPage) {
            prevPageRef.current = mappedPage
            setCurrentPage(mappedPage)
        }
    }, [location.pathname])

    // Synchronize router navigation when currentPage store is changed programmatically
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            const mappedPage = pathToPage[location.pathname]
            if (mappedPage) {
                prevPageRef.current = mappedPage
            }
            return
        }

        if (currentPage === prevPageRef.current) return
        prevPageRef.current = currentPage

        let targetPath = pageToPath[currentPage]
        if (!targetPath) return

        if (!userData && (currentPage === 'dashboard' || currentPage === 'login')) {
            targetPath = '/login'
        } else if (userData && (currentPage === 'login' || currentPage === 'otp' || currentPage === 'reset-password')) {
            targetPath = '/dashboard'
        }

        if (location.pathname !== targetPath) {
            navigate(targetPath)
        }
    }, [currentPage, userData, location.pathname, navigate])

    return null
}

function App() {
    const { userData, isCheckingAuth, checkAuth, isLoggingIn, isRegistering, isJoining, isSendingForgotMail, isResettingPassword } = (userStore as any)();
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

    let loadingMessage = "";
    if (isLoggingIn) loadingMessage = "Logging in to Dashboard...";
    else if (isRegistering || isJoining) loadingMessage = "Configuring Your Organization...";
    else if (isSendingForgotMail) loadingMessage = "Sending Password Reset Code...";
    else if (isResettingPassword) loadingMessage = "Updating Password...";
    else if (isCreatingClient) loadingMessage = "Saving Client to Directory...";
    else if (isUpdatingClient) loadingMessage = "Updating Client Record...";
    else if (isCreatingDeal) loadingMessage = "Initiating New Deal Pipeline...";
    else if (isUpdatingDeal) loadingMessage = "Saving Deal Modifications...";
    else if (isCreatingReminder) loadingMessage = "Scheduling Task Alert...";
    else if (isUpdatingStatus) loadingMessage = "Updating Task Status...";

    return (
        <BrowserRouter>
            <div className="bg-[#191302] h-screen overflow-hidden relative">
                <NavigationSync />
                <Routes>
                    {/* Public / Auth routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/otp"
                        element={
                            <PublicRoute>
                                <OTP />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/reset-password"
                        element={
                            <PublicRoute>
                                <ResetPassword />
                            </PublicRoute>
                        }
                    />

                    {/* Protected routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/clients"
                        element={
                            <ProtectedRoute>
                                <Clients />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/deals"
                        element={
                            <ProtectedRoute>
                                <Deals />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dealManagement"
                        element={
                            <ProtectedRoute>
                                <DealManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/deal-management"
                        element={
                            <ProtectedRoute>
                                <DealManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dealmanagement"
                        element={<Navigate to="/dealManagement" replace />}
                    />
                    <Route
                        path="/reminders"
                        element={
                            <ProtectedRoute>
                                <Reminders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees"
                        element={
                            <ProtectedRoute>
                                <Organisation />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/organisation"
                        element={<Navigate to="/employees" replace />}
                    />

                    {/* Default & Catch-all routes */}
                    <Route
                        path="/"
                        element={<Navigate to={userData ? "/dashboard" : "/login"} replace />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to={userData ? "/dashboard" : "/login"} replace />}
                    />
                </Routes>

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
        </BrowserRouter>
    );
}

export default App

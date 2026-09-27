import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const userStore = create((set, get: any) => ({
    userData: null,
    isLoggingIn: false,
    isLoggingOut: false,
    isCheckingAuth: false,
    isRegistering: false,
    isJoining: false,
    isSendingForgotMail: false,
    isResettingPassword: false,
    currentPage: 'dashboard',
    setCurrentPage: (page: string) => set({ currentPage: page }),
    isSidebarMinimized: false,
    toggleSidebarMinimized: () => set((state: any) => ({ isSidebarMinimized: !state.isSidebarMinimized })),
    
    checkAuth: async () => {
        set({ isCheckingAuth: true })
        try {
            const res = await apiCaller.get('/auth/refresh')
            set({ userData: res.data })
            return true
        } catch (error) {
            set({ userData: null })
            return false
        } finally {
            set({ isCheckingAuth: false })
        }
    },
    
    login: async (data: {email:string,password:string}) => {
        set({ isLoggingIn: true })
        try {
            const { email, password } = data
            if ([email, password].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return false;
            }
            const res = await apiCaller.post('/auth/login', data)
            set({ userData: res.data })
            toast.success("Logged in successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to login";
            toast.error(errMsg);
            return false;
        }
        finally {
            set({ isLoggingIn: false })
        }
    },
    registerUserWithNewOrg: async (data:{name:string,email:string,password:string,organisationName:string}) => {
        set({ isRegistering: true })
        try {
            const { name, email, password,organisationName } = data;
            if ([name, email, password, organisationName].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return false;
            }
            const res = await apiCaller.post('/auth/registerWithNewOrganisation', data)
            set({ userData: res.data })
            toast.success("Organisation registered and user logged in successfully");
            return true;    
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to register";
            toast.error(errMsg);
            return false;
        }
        finally { set({ isRegistering: false }) }
    },
    regitserwithExistingOrg: async (data:{name:string,email:string,password:string,}) => {
        set({ isRegistering: true })
        try {
            const { name, email, password} = data;
            if ([name, email, password].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return false;
            }
            const res = await apiCaller.post('/auth/newUserRegistration', data)
            set({ userData: res.data })
            toast.success("Registered successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to register";
            toast.error(errMsg);
            return false;
        }
        finally { set({ isRegistering: false }) }
    },
    joinOrg: async (data:{inviteToken:string}) => {
        set({ isJoining: true })
        try {
            const { inviteToken } = data;
            if ([inviteToken].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return false;
            }
            const res = await apiCaller.post('/auth/joinOrganisation', { inviteToken })
            
            const currentUserData = get().userData;
            if (currentUserData && currentUserData.data) {
                const updatedUser = res.data.data.updatedUser;
                set({
                    userData: {
                        ...currentUserData,
                        data: {
                            ...currentUserData.data,
                            user: {
                                ...currentUserData.data.user,
                                ...updatedUser
                            }
                        }
                    }
                });
            }
            
            toast.success("Joined organisation successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to join organisation";
            toast.error(errMsg);
            return false;
        }
        finally { set({ isJoining: false }) }
    },
    creatingOrgCrashed: async (data:{orgName:string}) => {
        set({ isRegistering: true })
        try {
            const { orgName } = data;
            if ([orgName].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return false;
            }
            const res = await apiCaller.post('/auth/userOwnnerWithoutOrg', orgName)
            set({ userData: res.data })
            toast.success("Organisation created successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to create organisation";
            toast.error(errMsg);
            return false;
        }
        finally { set({ isRegistering: false }) }
    },
    sendRegistrationMail: async (data: any) => {
        set({ isRegistering: true });
        try {
            const payload = typeof data === "string" ? { email: data } : data;
            const email = payload.email?.trim();
            if (!email) {
                toast.error("Email is required");
                return false;
            }

            await apiCaller.post('/auth/registerVerification', payload);

            // Store non-sensitive identifiers for OTP verification stage (NO passwords in storage!)
            sessionStorage.setItem("pending_email", email);
            if (payload.registrationPath) {
                sessionStorage.setItem("registration_path", payload.registrationPath);
            }
            localStorage.setItem("pending_email", email);
            if (payload.registrationPath) {
                localStorage.setItem("registration_path", payload.registrationPath);
            }
            localStorage.removeItem("registration_details");

            toast.success("Verification successful! OTP sent to your email.");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to send OTP";
            toast.error(errMsg);
            return false;
        } finally {
            set({ isRegistering: false });
        }
    },
    verifyOTPAndRegister: async (inputOtp: string) => {
        set({ isRegistering: true });
        try {
            const email = sessionStorage.getItem("pending_email") || localStorage.getItem("pending_email");
            const registrationPath = sessionStorage.getItem("registration_path") || localStorage.getItem("registration_path") || "newOrg";

            if (!email) {
                toast.error("No active registration session found. Please register again.");
                set({ currentPage: 'dashboard' });
                return false;
            }

            const endpoint = registrationPath === "newOrg"
                ? '/auth/registerWithNewOrganisation'
                : '/auth/newUserRegistration';

            const res = await apiCaller.post(endpoint, {
                email,
                inputOtp
            });

            set({ userData: res.data, currentPage: 'dashboard' });

            // Cleanup staging storage
            sessionStorage.removeItem("pending_email");
            sessionStorage.removeItem("registration_path");
            localStorage.removeItem("pending_email");
            localStorage.removeItem("registration_path");
            localStorage.removeItem("registration_details");

            toast.success("Registered and logged in successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to verify OTP & Register";
            toast.error(errMsg);
            return false;
        } finally {
            set({ isRegistering: false });
        }
    },
    sendForgotPasswordMail: async (email: string) => {
        set({ isSendingForgotMail: true });
        try {
            const trimmedEmail = email?.trim();
            if (!trimmedEmail) {
                toast.error("Email is required");
                return false;
            }

            await apiCaller.post('/auth/forgotPassword', { email: trimmedEmail });

            sessionStorage.setItem("pending_forgot_email", trimmedEmail);
            sessionStorage.setItem("otp_mode", "forgot_password");
            toast.success("Password reset OTP sent to your email.");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to send reset OTP";
            toast.error(errMsg);
            return false;
        } finally {
            set({ isSendingForgotMail: false });
        }
    },
    resetPasswordWithOTP: async (data: { email: string; inputOtp: string; newPassword: string }) => {
        set({ isResettingPassword: true });
        try {
            const { email, inputOtp, newPassword } = data;
            if (!email || !inputOtp || !newPassword) {
                toast.error("All fields are required");
                return false;
            }

            await apiCaller.post('/auth/resetPassword', {
                email: email.trim(),
                inputOtp: inputOtp.trim(),
                newPassword
            });

            // Clean up reset session
            sessionStorage.removeItem("pending_forgot_email");
            sessionStorage.removeItem("pending_reset_otp");
            sessionStorage.removeItem("otp_mode");

            toast.success("Password reset successfully! Please sign in.");
            set({ currentPage: 'dashboard' });
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to reset password";
            toast.error(errMsg);
            return false;
        } finally {
            set({ isResettingPassword: false });
        }
    },
    logout: async () => {
        set({ isLoggingOut: true })
        try {
            await apiCaller.post('/auth/logout')
            set({ userData: null, currentPage: 'dashboard' })
            toast.success("Logged out successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to logout";
            toast.error(errMsg);
            return false;
        }
        finally {
            set({ isLoggingOut: false })
        }
    },
    
})) 


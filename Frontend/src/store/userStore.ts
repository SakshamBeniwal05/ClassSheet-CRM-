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
    sendRegistrationMail: async (email: string) => {
        try {
            if (!email?.trim()) {
                toast.error("Email is required");
                return false;
            }
            await apiCaller.post('/auth/registrationMail', { email });
            toast.success("OTP sent to your email successfully");
            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to send OTP";
            toast.error(errMsg);
            return false;
        }
    },
    verifyOTPAndRegister: async (inputOtp: string) => {
        set({ isRegistering: true });
        try {
            const registrationDetailsStr = localStorage.getItem("registration_details");
            if (!registrationDetailsStr) {
                toast.error("No registration details found. Please start over.");
                set({ currentPage: 'dashboard' });
                return false;
            }
            const details = JSON.parse(registrationDetailsStr);
            const { name, email, password, registrationPath, organisationName, inviteToken } = details;

            if (registrationPath === "newOrg") {
                const res = await apiCaller.post('/auth/registerWithNewOrganisation', {
                    name,
                    email,
                    password,
                    organisationName,
                    inputOtp
                });
                set({ userData: res.data, currentPage: 'dashboard' });
                localStorage.removeItem("registration_details");
                toast.success("Organisation registered and user logged in successfully");
                return true;
            } else {
                const res = await apiCaller.post('/auth/newUserRegistration', {
                    name,
                    email,
                    password,
                    inputOtp
                });
                set({ userData: res.data, currentPage: 'dashboard' });
                
                // If there's an invite token, join the org
                if (inviteToken) {
                    try {
                        const joinRes = await apiCaller.post('/auth/joinOrganisation', { inviteToken });
                        
                        // Update state with joined organisation info
                        const currentUserData = res.data;
                        if (currentUserData && currentUserData.data) {
                            const updatedUser = joinRes.data.data.updatedUser;
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
                    } catch (joinError: any) {
                        const errMsg = joinError.response?.data?.error || joinError.message || "Failed to join organisation";
                        toast.error(errMsg);
                    }
                } else {
                    toast.success("Registered successfully");
                }
                
                localStorage.removeItem("registration_details");
                return true;
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to verify OTP & Register";
            toast.error(errMsg);
            return false;
        } finally {
            set({ isRegistering: false });
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
    }
})) 


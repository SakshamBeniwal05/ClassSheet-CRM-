import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const userStore = create((set, get: any) => ({
    userData: null,
    isLoggingIn: false,
    isLoggingOut: false,
    isRegistering: false,
    isCheckingAuth: false,
    isJoining: false,
    
    login: async (data: {email:string,password:string}) => {
        set({ isLoggingIn: true })
        try {
            const { email, password } = data
            if ([email, password].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/login', data)
            set({ userData: res.data })
            toast.success("Logged in successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to login";
            toast.error(errMsg);
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
                return;
            }
            const res = await apiCaller.post('/auth/registerWithNewOrganisation', data)
            set({ userData: res.data })
            toast.success("Organisation registered and user logged in successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to register";
            toast.error(errMsg);
        }
        finally { set({ isRegistering: false }) }
    },
    regitserwithExistingOrg: async (data:{name:string,email:string,password:string,}) => {
        set({ isRegistering: true })
        try {
            const { name, email, password} = data;
            if ([name, email, password].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/newUserRegistration', data)
            set({ userData: res.data })
            toast.success("Registered successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to register";
            toast.error(errMsg);
        }
        finally { set({ isRegistering: false }) }
    },
    joinOrg: async (data:{inviteToken:string}) => {
        set({ isJoining: true })
        try {
            const { inviteToken } = data;
            if ([inviteToken].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/joinOrganisation', data)
            set({ userData: res.data })
            toast.success("Joined organisation successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to join organisation";
            toast.error(errMsg);
        }
        finally { set({ isJoining: false }) }
    },
    creatingOrgCrashed: async (data:{orgName:string}) => {
        set({ isRegistering: true })
        try {
            const { orgName } = data;
            if ([orgName].some(e => !e?.trim())) {
                toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/userOwnnerWithoutOrg', orgName)
            set({ userData: res.data })
            toast.success("Organisation created successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to create organisation";
            toast.error(errMsg);
        }
        finally { set({ isRegistering: false }) }
    },
    logout: async () => {
        set({ isLoggingOut: true, })
        try {
            const access = get().userData.accessToken
            await apiCaller.post('/auth/userOwnnerWithoutOrg',access )
            set({ userData: null})
            toast.success("Logged out successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to logout";
            toast.error(errMsg);
        }
        finally {
            set({ isLoggingOut: false })
        }
    }
})) 


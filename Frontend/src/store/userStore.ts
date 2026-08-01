import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'

export const userStore = create((set, get) => ({
    userData: null,
    isLoggingIn: false,
    isLoggingOut: false,
    isRegistering: false,
    isCheckingAuth: false,
    isJoining: false,
    isLoggingOut:false,
    login: async (data: {email:string,password:string}) => {
        set({ isLoggingIn: true })
        try {
            const { email, password } = data
            if ([email, password].some(e => !e?.trim())) {
                // toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/login', data)
            set({ userData: res.data })
            // toast.success("Logged in successfully");
        } catch (error) {
            // ERROR SWITCH CASES 
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
                // toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/registerWithNewOrganisation', data)
            set({ userData: res.data })
        } catch (error) {
            // ERROR SWITCH CASES 
        }

        finally { set({ isRegistering: false }) }
    },
    regitserwithExistingOrg: async (data:{name:string,email:string,password:string,}) => {
        set({ isRegistering: true })
        try {
            const { name, email, password} = data;
            if ([name, email, password].some(e => !e?.trim())) {
                // toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/newUserRegistration', data)
            set({ userData: res.data })
        } catch (error) {
            // ERROR SWITCH CASES 
        }
        finally { set({ isRegistering: false }) }
    },
    joinOrg: async (data:{inviteToken:string}) => {
        set({ isJoining: true })
        try {
            const { inviteToken } = data;
            if ([inviteToken].some(e => !e?.trim())) {
                // toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/joinOrganisation', data)
            set({ userData: res.data })
        } catch (error) {
            // ERROR SWITCH CASES 
        }
        finally { set({ isJoining: false }) }
    },
    creatingOrgCrashed: async (data:{orgName:string}) => {
        set({ isRegistering: true })
        try {
            const { orgName } = data;
            if ([orgName].some(e => !e?.trim())) {
                // toast.error("All Fields Required");
                return;
            }
            const res = await apiCaller.post('/auth/userOwnnerWithoutOrg', orgName)
            set({ userData: res.data })
        } catch (error) {
            // ERROR SWITCH CASES 
        }
        finally { set({ isRegistering: false }) }
    },
    logout: async () => {
        set({ isLoggingOut: true, })
        try {
            const access = get({userData.accessToken})
            await apiCaller.post('/auth/userOwnnerWithoutOrg',access )
            set({ userData: null})
        } catch (error) {

        }
        finally {
            set({ isLoggingOut: false })
        }
    }
})) 


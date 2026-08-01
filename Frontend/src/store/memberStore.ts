import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const useMemberStore = create((set, get: any) => ({
    organisationDetails: null,
    members: [],
    inviteToken: null,
    isFetchingDetails: false,
    isGeneratingToken: false,
    isFetchingMembers: false,
    isRemovingMember: false,
    isChangingRole: false,

    getOrganisationDetails: async () => {
        set({ isFetchingDetails: true })
        try {
            const res = await apiCaller.get('/organisation')
            set({ organisationDetails: res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch organisation details";
            toast.error(errMsg);
        } finally {
            set({ isFetchingDetails: false })
        }
    },

    generateInviteToken: async () => {
        set({ isGeneratingToken: true })
        try {
            const res = await apiCaller.post('/organisation/invite-token')
            set({ inviteToken: res.data.data.inviteToken || res.data.data })
            toast.success("Invite token generated successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to generate invite token";
            toast.error(errMsg);
        } finally {
            set({ isGeneratingToken: false })
        }
    },

    getOrganisationMembers: async () => {
        set({ isFetchingMembers: true })
        try {
            const res = await apiCaller.get('/organisation/members')
            set({ members: res.data.data.members || res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch organisation members";
            toast.error(errMsg);
        } finally {
            set({ isFetchingMembers: false })
        }
    },

    removeMember: async (memberId: string) => {
        set({ isRemovingMember: true })
        try {
            const res = await apiCaller.delete(`/organisation/members/${memberId}`)
            set({ members: get().members.filter((m: any) => m.id !== memberId) })
            toast.success(res.data.message || "Member removed successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to remove member";
            toast.error(errMsg);
        } finally {
            set({ isRemovingMember: false })
        }
    },

    changeMemberRole: async (memberId: string, updatedRole: string) => {
        set({ isChangingRole: true })
        try {
            const res = await apiCaller.patch(`/organisation/members/${memberId}/${updatedRole}`)
            const updatedUser = res.data.data
            set({
                members: get().members.map((m: any) => m.id === memberId ? { ...m, role: updatedRole } : m)
            })
            toast.success(res.data.message || "Member role changed successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to change member role";
            toast.error(errMsg);
        } finally {
            set({ isChangingRole: false })
        }
    }
}))

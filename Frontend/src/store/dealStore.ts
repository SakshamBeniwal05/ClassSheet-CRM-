import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const useDealStore = create((set, get: any) => ({
    deals: [],
    particularDeal: null,
    isCreatingDeal: false,
    isFetchingDeals: false,
    isFetchingDeal: false,
    isUpdatingDeal: false,
    isDeletingDeal: false,

    createDeal: async (data: { clientId: string, amount: number, estimatedCost?: number, stateOfDeal: string, currency?: string, scheduled?: string }) => {
        set({ isCreatingDeal: true })
        try {
            if (!data.clientId || data.amount === undefined || !data.stateOfDeal) {
                toast.error("Client ID, Amount, and State of Deal are required");
                return;
            }
            const res = await apiCaller.post('/deals', data)
            set({ deals: [...get().deals, res.data.data.deal] })
            toast.success(res.data.message || "Deal created successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to create deal";
            toast.error(errMsg);
        } finally {
            set({ isCreatingDeal: false })
        }
    },

    getDeals: async () => {
        set({ isFetchingDeals: true })
        try {
            const res = await apiCaller.get('/deals')
            set({ deals: res.data.data.deals || res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch deals";
            toast.error(errMsg);
        } finally {
            set({ isFetchingDeals: false })
        }
    },

    getParticularDeal: async (id: string) => {
        set({ isFetchingDeal: true })
        try {
            const res = await apiCaller.get(`/deals/${id}`)
            set({ particularDeal: res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch deal details";
            toast.error(errMsg);
        } finally {
            set({ isFetchingDeal: false })
        }
    },

    updateDeal: async (id: string, data: { clientId?: string, amount?: number, estimatedCost?: number, stateOfDeal?: string, currency?: string, scheduled?: string }) => {
        set({ isUpdatingDeal: true })
        try {
            const res = await apiCaller.put(`/deals/${id}`, data)
            const updatedDeal = res.data.data.deal
            set({
                deals: get().deals.map((d: any) => d.id === id ? { ...d, ...updatedDeal } : d),
                particularDeal: get().particularDeal?.id === id ? { ...get().particularDeal, ...updatedDeal } : get().particularDeal
            })
            toast.success(res.data.message || "Deal updated successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to update deal";
            toast.error(errMsg);
        } finally {
            set({ isUpdatingDeal: false })
        }
    },

    deleteDeal: async (id: string) => {
        set({ isDeletingDeal: true })
        try {
            const res = await apiCaller.delete(`/deals/${id}`)
            set({
                deals: get().deals.filter((d: any) => d.id !== id),
                particularDeal: get().particularDeal?.id === id ? null : get().particularDeal
            })
            toast.success(res.data.message || "Deal deleted successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to delete deal";
            toast.error(errMsg);
        } finally {
            set({ isDeletingDeal: false })
        }
    }
}))

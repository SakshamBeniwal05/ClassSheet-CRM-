import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const useClientStore = create((set, get: any) => ({
    clients: [],
    particularClient: null,
    isCreatingClient: false,
    isFetchingClients: false,
    isFetchingClient: false,
    isUpdatingClient: false,
    isDeletingClient: false,

    createClient: async (data: { name: string, email: string, role?: string }) => {
        set({ isCreatingClient: true })
        try {
            const { name, email } = data
            if (!name?.trim() || !email?.trim()) {
                toast.error("Name and Email are required");
                return;
            }
            const res = await apiCaller.post('/clients', data)
            set({ clients: [...get().clients, res.data.data.client] })
            toast.success(res.data.message || "Client created successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to create client";
            toast.error(errMsg);
        } finally {
            set({ isCreatingClient: false })
        }
    },

    getClients: async () => {
        set({ isFetchingClients: true })
        try {
            const res = await apiCaller.get('/clients')
            set({ clients: res.data.data.clients || res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch clients";
            toast.error(errMsg);
        } finally {
            set({ isFetchingClients: false })
        }
    },

    getParticularClient: async (id: string) => {
        set({ isFetchingClient: true })
        try {
            const res = await apiCaller.get(`/clients/${id}`)
            set({ particularClient: res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch client details";
            toast.error(errMsg);
        } finally {
            set({ isFetchingClient: false })
        }
    },

    updateClient: async (id: string, data: { name?: string, email?: string, role?: string }) => {
        set({ isUpdatingClient: true })
        try {
            const res = await apiCaller.put(`/clients/${id}`, data)
            const updatedClient = res.data.data.client
            set({
                clients: get().clients.map((c: any) => c.id === id ? { ...c, ...updatedClient } : c),
                particularClient: get().particularClient?.id === id ? { ...get().particularClient, ...updatedClient } : get().particularClient
            })
            toast.success(res.data.message || "Client updated successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to update client";
            toast.error(errMsg);
        } finally {
            set({ isUpdatingClient: false })
        }
    },

    deleteClient: async (id: string) => {
        set({ isDeletingClient: true })
        try {
            const res = await apiCaller.delete(`/clients/${id}`)
            set({
                clients: get().clients.filter((c: any) => c.id !== id),
                particularClient: get().particularClient?.id === id ? null : get().particularClient
            })
            toast.success(res.data.message || "Client deleted successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to delete client";
            toast.error(errMsg);
        } finally {
            set({ isDeletingClient: false })
        }
    }
}))

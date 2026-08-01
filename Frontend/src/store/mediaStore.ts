import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const useMediaStore = create((set, get: any) => ({
    mediaList: [],
    isFetchingMedia: false,
    isSavingMedia: false,
    isUpdatingMedia: false,
    isDeletingMedia: false,
    isFetchingAuthParams: false,

    getUploadAuthParams: async () => {
        set({ isFetchingAuthParams: true })
        try {
            const res = await apiCaller.get('/media/auth')
            return res.data.data // Returns { token, expire, signature }
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to get upload authorization parameters";
            toast.error(errMsg);
            return null;
        } finally {
            set({ isFetchingAuthParams: false })
        }
    },

    saveMedia: async (data: { mediaUrl: string, fileName: string, dealId: string, noteId?: string }) => {
        set({ isSavingMedia: true })
        try {
            const { mediaUrl, fileName, dealId } = data
            if (!mediaUrl?.trim() || !fileName?.trim() || !dealId) {
                toast.error("Media URL, File Name (ID), and Deal ID are required");
                return;
            }
            const res = await apiCaller.post('/media', data)
            set({ mediaList: [...get().mediaList, res.data.data.media || res.data.data] })
            toast.success(res.data.message || "Media saved successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to save media details";
            toast.error(errMsg);
        } finally {
            set({ isSavingMedia: false })
        }
    },

    updateMedia: async (id: string, data: { mediaUrl?: string, fileName?: string, dealId?: string, noteId?: string }) => {
        set({ isUpdatingMedia: true })
        try {
            const res = await apiCaller.put(`/media/${id}`, data)
            const updatedMedia = res.data.data.media || res.data.data
            set({
                mediaList: get().mediaList.map((m: any) => m.id === id ? { ...m, ...updatedMedia } : m)
            })
            toast.success(res.data.message || "Media updated successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to update media";
            toast.error(errMsg);
        } finally {
            set({ isUpdatingMedia: false })
        }
    },

    getMediaByDeal: async (dealId: string) => {
        set({ isFetchingMedia: true })
        try {
            const res = await apiCaller.get(`/media/deal/${dealId}`)
            set({ mediaList: res.data.data.media || res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch media list";
            toast.error(errMsg);
        } finally {
            set({ isFetchingMedia: false })
        }
    },

    deleteMedia: async (id: string) => {
        set({ isDeletingMedia: true })
        try {
            const res = await apiCaller.delete(`/media/${id}`)
            set({ mediaList: get().mediaList.filter((m: any) => m.id !== id) })
            toast.success(res.data.message || "Media deleted successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to delete media";
            toast.error(errMsg);
        } finally {
            set({ isDeletingMedia: false })
        }
    }
}))

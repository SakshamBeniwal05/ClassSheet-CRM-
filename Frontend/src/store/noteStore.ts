import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const useNoteStore = create((set, get: any) => ({
    notes: [],
    isCreatingNote: false,
    isFetchingNotes: false,
    isUpdatingNote: false,
    isDeletingNote: false,

    createNote: async (data: { title: string, body: string, dealId: string, status?: string }) => {
        set({ isCreatingNote: true })
        try {
            const { title, body, dealId } = data
            if (!title?.trim() || !body?.trim() || !dealId) {
                toast.error("Title, Body, and Deal ID are required");
                return;
            }
            const res = await apiCaller.post('/notes', data)
            set({ notes: [...get().notes, res.data.data.note || res.data.data] })
            toast.success(res.data.message || "Note created successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to create note";
            toast.error(errMsg);
        } finally {
            set({ isCreatingNote: false })
        }
    },

    getNotesByDeal: async (dealId: string) => {
        set({ isFetchingNotes: true })
        try {
            const res = await apiCaller.get(`/notes/deal/${dealId}`)
            set({ notes: res.data.data.notes || res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch notes";
            toast.error(errMsg);
        } finally {
            set({ isFetchingNotes: false })
        }
    },

    updateNote: async (id: string, data: { title?: string, body?: string, status?: string }) => {
        set({ isUpdatingNote: true })
        try {
            const res = await apiCaller.put(`/notes/${id}`, data)
            const updatedNote = res.data.data
            set({
                notes: get().notes.map((n: any) => n.id === id ? { ...n, ...updatedNote } : n)
            })
            toast.success(res.data.message || "Note updated successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to update note";
            toast.error(errMsg);
        } finally {
            set({ isUpdatingNote: false })
        }
    },

    deleteNote: async (id: string) => {
        set({ isDeletingNote: true })
        try {
            const res = await apiCaller.delete(`/notes/${id}`)
            set({ notes: get().notes.filter((n: any) => n.id !== id) })
            toast.success(res.data.message || "Note deleted successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to delete note";
            toast.error(errMsg);
        } finally {
            set({ isDeletingNote: false })
        }
    }
}))

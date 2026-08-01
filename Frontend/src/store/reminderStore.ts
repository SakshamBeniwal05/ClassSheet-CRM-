import { create } from 'zustand'
import { apiCaller } from '../api/axiosApi'
import { toast } from 'react-hot-toast'

export const useReminderStore = create((set, get: any) => ({
    reminders: [],
    isCreatingReminder: false,
    isFetchingReminders: false,
    isUpdatingStatus: false,
    isDeletingReminder: false,

    createReminder: async (data: { title: string, description?: string, scheduledTriggerAt: string, status: string, clientId?: string, dealId?: string }) => {
        set({ isCreatingReminder: true })
        try {
            const { title, scheduledTriggerAt, status } = data
            if (!title?.trim() || !scheduledTriggerAt || !status) {
                toast.error("Title, Trigger Time, and Status are required");
                return;
            }
            const res = await apiCaller.post('/reminders', data)
            set({ reminders: [...get().reminders, res.data.data.reminder || res.data.data] })
            toast.success(res.data.message || "Reminder created successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to create reminder";
            toast.error(errMsg);
        } finally {
            set({ isCreatingReminder: false })
        }
    },

    getUserReminders: async () => {
        set({ isFetchingReminders: true })
        try {
            const res = await apiCaller.get('/reminders')
            set({ reminders: res.data.data.reminders || res.data.data })
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to fetch reminders";
            toast.error(errMsg);
        } finally {
            set({ isFetchingReminders: false })
        }
    },

    updateReminderStatus: async (id: string, status: string) => {
        set({ isUpdatingStatus: true })
        try {
            if (!status) {
                toast.error("Status is required");
                return;
            }
            const res = await apiCaller.put(`/reminders/${id}/status`, { status })
            const updatedReminder = res.data.data
            set({
                reminders: get().reminders.map((r: any) => r.id === id ? { ...r, ...updatedReminder } : r)
            })
            toast.success(res.data.message || "Reminder status updated");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to update status";
            toast.error(errMsg);
        } finally {
            set({ isUpdatingStatus: false })
        }
    },

    deleteReminder: async (id: string) => {
        set({ isDeletingReminder: true })
        try {
            const res = await apiCaller.delete(`/reminders/${id}`)
            set({ reminders: get().reminders.filter((r: any) => r.id !== id) })
            toast.success(res.data.message || "Reminder deleted successfully");
        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "Failed to delete reminder";
            toast.error(errMsg);
        } finally {
            set({ isDeletingReminder: false })
        }
    }
}))

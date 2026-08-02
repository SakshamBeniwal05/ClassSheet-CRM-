import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useReminderStore } from '../../store/reminderStore'
import { useClientStore } from '../../store/clientStore'
import { Calendar, Plus, X, Loader2, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'

export const Reminders: React.FC = () => {
    const { reminders, getUserReminders, createReminder, isFetchingReminders, isCreatingReminder, updateReminderStatus } = (useReminderStore as any)()
    const { clients, getClients } = (useClientStore as any)()
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Calendar states
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

    // Form states
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [scheduledTriggerAt, setScheduledTriggerAt] = useState('')
    const [status, setStatus] = useState('Pending')
    const [clientId, setClientId] = useState('')

    useEffect(() => {
        if (!reminders || reminders.length === 0) {
            getUserReminders()
        }
        if (!clients || clients.length === 0) {
            getClients()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await createReminder({
            title,
            description,
            scheduledTriggerAt: new Date(scheduledTriggerAt).toISOString(),
            status,
            clientId: clientId || undefined
        })
        setIsModalOpen(false)
        setTitle('')
        setDescription('')
        setScheduledTriggerAt('')
        setStatus('Pending')
        setClientId('')
    }

    const toggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending'
        await updateReminderStatus(id, nextStatus)
    }

    // Helper to check if two dates are same day
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate()
    }

    // Month calendar math
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        const startDayOfWeek = firstDay.getDay()
        const days = []
        
        // Pad days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate()
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            })
        }
        
        // Days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }
        
        return days
    }

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const handleToday = () => {
        const today = new Date()
        setSelectedDate(today)
        setCurrentMonth(today)
    }

    const handleOpenAddModal = () => {
        const now = new Date()
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const hr = String(now.getHours()).padStart(2, '0')
        const min = String(now.getMinutes()).padStart(2, '0')
        
        setScheduledTriggerAt(`${year}-${month}-${day}T${hr}:${min}`)
        setIsModalOpen(true)
    }

    const handleHourClick = (hour: number) => {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const hr = String(hour).padStart(2, '0')
        
        setScheduledTriggerAt(`${year}-${month}-${day}T${hr}:00`)
        setIsModalOpen(true)
    }

    // Filter reminders for the selected date
    const selectedDateReminders = reminders?.filter((r: any) => {
        const triggerDate = new Date(r.scheduledTriggerAt)
        return isSameDay(triggerDate, selectedDate)
    }) || []

    const dayHasReminders = (date: Date) => {
        return reminders?.some((r: any) => isSameDay(new Date(r.scheduledTriggerAt), date))
    }

    // Hours timeline array (0 to 23)
    const hoursArray = Array.from({ length: 24 }, (_, i) => i)

    const formatHourLabel = (hour: number) => {
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 === 0 ? 12 : hour % 12
        return `${displayHour} ${ampm}`
    }

    const daysData = getDaysInMonth(currentMonth)

    return (
        <DashboardLayout activeTab="reminders">
            <div className="space-y-8 h-full">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-tInverted">Reminders & Tasks</h2>
                        <p className="text-sm text-tPrimary mt-1">
                            Schedule tasks, allocate resources, and check action items.
                        </p>
                    </div>
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-6 py-3 bg-colorPrimary hover:bg-hoverPrimary text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Task
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)] overflow-hidden">
                    {/* Left Panel: Mini Month Calendar Grid */}
                    <div className="col-span-12 xl:col-span-4 space-y-6 flex flex-col overflow-y-auto pr-1">
                        {/* Month Picker Card */}
                        <div className="bg-tSecondary p-4 rounded-xl border border-colorNeutral/10 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-tInverted text-sm">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </span>
                                <div className="flex border border-colorNeutral/20 rounded-lg overflow-hidden text-xs">
                                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-colorSecondary transition-colors border-r border-colorNeutral/20 text-tPrimary">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleToday} className="px-2.5 py-1 hover:bg-colorSecondary transition-colors text-tInverted font-semibold">
                                        Today
                                    </button>
                                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-colorSecondary transition-colors border-l border-colorNeutral/20 text-tPrimary">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-tPrimary/60 mb-2">
                                {weekdayLabels.map((lbl, idx) => (
                                    <span key={idx} className="w-8 py-1">{lbl}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {daysData.map((d, index) => {
                                    const isSelected = isSameDay(d.date, selectedDate)
                                    const isToday = isSameDay(d.date, new Date())
                                    const hasReminders = dayHasReminders(d.date)

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSelectedDate(d.date)
                                                setCurrentMonth(d.date)
                                            }}
                                            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-colorPrimary text-white font-bold scale-105 shadow-md border border-colorPrimary' 
                                                    : isToday
                                                    ? 'border border-colorPrimary text-colorPrimary font-bold'
                                                    : d.isCurrentMonth
                                                    ? 'text-tInverted hover:bg-colorSecondary/40'
                                                    : 'text-tPrimary/30 hover:bg-colorSecondary/20'
                                            }`}
                                        >
                                            <span>{d.date.getDate()}</span>
                                            {hasReminders && !isSelected && (
                                                <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isToday ? 'bg-colorPrimary' : 'bg-colorTertiary'}`}></span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* selected day overview */}
                        <div className="bg-tSecondary p-4 rounded-xl border border-colorNeutral/10 shadow-xl flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-xs text-tInverted">Tasks Checklist</span>
                                <span className="text-[10px] text-tPrimary/60 font-mono">
                                    {selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                            <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[220px] custom-scrollbar">
                                {isFetchingReminders ? (
                                    <div className="text-center py-6 text-xs text-tPrimary">
                                        <Loader2 className="w-5 h-5 animate-spin text-colorPrimary mx-auto mb-1" />
                                        Loading...
                                    </div>
                                ) : selectedDateReminders.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-tPrimary/40">
                                        No tasks scheduled for this date.
                                    </div>
                                ) : (
                                    selectedDateReminders.map((rem: any) => (
                                        <div 
                                            key={rem.id} 
                                            onClick={() => toggleStatus(rem.id, rem.status)}
                                            className="flex gap-3 p-3 bg-colorSecondary/40 hover:bg-tSecondary border border-colorNeutral/20 rounded-lg cursor-pointer transition-colors group"
                                        >
                                            <div className={`w-1 h-8 rounded-full ${rem.status === 'Completed' ? 'bg-[#4ADE80]' : 'bg-colorPrimary'}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-xs truncate ${rem.status === 'Completed' ? 'line-through opacity-50' : 'text-tInverted'}`}>
                                                    {rem.title}
                                                </p>
                                                <p className="text-[10px] text-tPrimary truncate mt-0.5">
                                                    {new Date(rem.scheduledTriggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Day Hourly Timeline */}
                    <div className="col-span-12 xl:col-span-8 bg-tSecondary rounded-xl border border-colorNeutral/10 overflow-hidden flex flex-col h-full shadow-xl">
                        {/* Day Title Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/30 bg-colorSecondary/50 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-tInverted text-base">
                                    {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h3>
                                <p className="text-xs text-tPrimary">{selectedDateReminders.length} tasks scheduled</p>
                            </div>
                        </div>

                        {/* Scrolling hourly list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 bg-colorSecondary/10">
                            {hoursArray.map((hour) => {
                                const remindersInHour = selectedDateReminders.filter((r: any) => {
                                    return new Date(r.scheduledTriggerAt).getHours() === hour
                                })

                                return (
                                    <div key={hour} className="flex gap-4 group">
                                        {/* Time Label */}
                                        <div className="w-16 text-right text-xs font-bold text-tPrimary/40 pt-1 flex-shrink-0">
                                            {formatHourLabel(hour)}
                                        </div>
                                        {/* Hourly Slot Container */}
                                        <div className="flex-1 border-t border-colorNeutral/15 pt-2 pb-3 min-h-[44px] flex flex-col gap-2">
                                            {remindersInHour.length > 0 ? (
                                                remindersInHour.map((rem: any) => (
                                                    <div 
                                                        key={rem.id}
                                                        onClick={() => toggleStatus(rem.id, rem.status)}
                                                        className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:scale-[1.01] transition-all duration-150 ${
                                                            rem.status === 'Completed'
                                                                ? 'bg-[#474746]/10 border-colorNeutral/20 opacity-60'
                                                                : 'bg-colorSecondary border-colorPrimary/20 shadow-md hover:border-colorPrimary/40'
                                                        }`}
                                                    >
                                                        <div>
                                                            <h4 className={`text-xs font-bold ${rem.status === 'Completed' ? 'line-through text-tPrimary' : 'text-tInverted'}`}>
                                                                {rem.title}
                                                            </h4>
                                                            {rem.description && (
                                                                <p className="text-[10px] text-tPrimary mt-0.5 truncate max-w-lg">
                                                                    {rem.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {rem.status === 'Completed' ? (
                                                                <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                                                            ) : (
                                                                <Clock className="w-4 h-4 text-colorPrimary animate-pulse" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                /* Empty hour row slot to trigger modal add prefilled */
                                                <button 
                                                    onClick={() => handleHourClick(hour)}
                                                    className="w-full text-left py-1 text-[10px] text-tPrimary/20 hover:text-colorPrimary/60 font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Reserve Time Slot
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                            <h3 className="font-bold text-tInverted text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-colorPrimary" />
                                Create New Task
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-tPrimary hover:text-red-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Call Client Alexander"
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief task notes..."
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary h-20 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Trigger Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={scheduledTriggerAt}
                                        onChange={(e) => setScheduledTriggerAt(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Client Reference</label>
                                    <select
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    >
                                        <option value="">-- Optional --</option>
                                        {clients?.map((c: any) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-colorNeutral/20">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 border border-colorNeutral/30 text-tInverted text-sm font-semibold rounded-lg hover:bg-tSecondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingReminder}
                                    className="flex-1 py-2 bg-colorPrimary text-white text-sm font-bold rounded-lg hover:bg-hoverPrimary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isCreatingReminder ? 'Saving...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

import React, { useEffect, useState, useMemo } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useDealStore } from '../../store/dealStore'
import { useClientStore } from '../../store/clientStore'
import { userStore } from '../../store/userStore'
import { 
    Search, 
    Plus, 
    ArrowUpRight, 
    Calendar, 
    User, 
    Loader2, 
    X,
    Layers,
    Briefcase
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-hot-toast'

interface StageConfig {
    id: string
    label: string
    shortDesc: string
    color: string
    badgeBg: string
    borderAccent: string
    dropzoneBg: string
}

const DEAL_STAGES: StageConfig[] = [
    {
        id: 'Consulting',
        label: 'Consulting',
        shortDesc: 'Discovery & initial calls',
        color: '#ffb77a',
        badgeBg: 'bg-[#ffb77a]/15 text-[#ffb77a] border-[#ffb77a]/30',
        borderAccent: 'border-t-[#ffb77a]',
        dropzoneBg: 'bg-[#ffb77a]/5 border-[#ffb77a]/40',
    },
    {
        id: 'Negotiation',
        label: 'Negotiation',
        shortDesc: 'Terms & proposal review',
        color: '#e48520',
        badgeBg: 'bg-[#e48520]/15 text-[#e48520] border-[#e48520]/30',
        borderAccent: 'border-t-[#e48520]',
        dropzoneBg: 'bg-[#e48520]/5 border-[#e48520]/40',
    },
    {
        id: 'Under_Process',
        label: 'Under Process',
        shortDesc: 'Active contract & processing',
        color: '#38bdf8',
        badgeBg: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
        borderAccent: 'border-t-[#38bdf8]',
        dropzoneBg: 'bg-[#38bdf8]/5 border-[#38bdf8]/40',
    },
    {
        id: 'Completed_Win',
        label: 'Completed Win',
        shortDesc: 'Successfully closed & signed',
        color: '#4ade80',
        badgeBg: 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30',
        borderAccent: 'border-t-[#4ade80]',
        dropzoneBg: 'bg-[#4ade80]/5 border-[#4ade80]/40',
    },
    {
        id: 'Completed_Loss',
        label: 'Completed Loss',
        shortDesc: 'Declined or cancelled deals',
        color: '#f87171',
        badgeBg: 'bg-[#f87171]/15 text-[#f87171] border-[#f87171]/30',
        borderAccent: 'border-t-[#f87171]',
        dropzoneBg: 'bg-[#f87171]/5 border-[#f87171]/40',
    },
]

const normalizeStage = (stage: string): string => {
    if (!stage) return 'Consulting'
    const normalized = stage.trim().replace(/\s+/g, '_')
    if (normalized === 'Under_Process' || normalized === 'UnderProcess') return 'Under_Process'
    if (normalized === 'Completed_Loss' || normalized === 'CompletedLoss') return 'Completed_Loss'
    if (normalized === 'Completed_Win' || normalized === 'CompletedWin') return 'Completed_Win'
    if (normalized === 'Negotiation') return 'Negotiation'
    return 'Consulting'
}

const DealManagement: React.FC = () => {
    const { 
        deals, 
        getDeals, 
        updateDeal, 
        createDeal, 
        getParticularDeal, 
        setDealModalOpen, 
        isFetchingDeals, 
        isCreatingDeal 
    } = (useDealStore as any)()

    const { clients, getClients, createClient } = (useClientStore as any)()
    const { userData } = (userStore as any)()
    const currentUser = userData?.data?.user

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('')
    const [filterScope, setFilterScope] = useState<'all' | 'my'>('all')

    // Drag and Drop state
    const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
    const [dragOverStage, setDragOverStage] = useState<string | null>(null)

    // Add Deal modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newDealName, setNewDealName] = useState('')
    const [newDealAmount, setNewDealAmount] = useState('')
    const [newDealEstimatedCost, setNewDealEstimatedCost] = useState('')
    const [newDealStage, setNewDealStage] = useState('Consulting')
    const [newDealClientId, setNewDealClientId] = useState('')
    const [newDealScheduled, setNewDealScheduled] = useState('')

    // Quick client creation inside Add Deal modal
    const [isQuickClientOpen, setIsQuickClientOpen] = useState(false)
    const [quickClientName, setQuickClientName] = useState('')
    const [quickClientEmail, setQuickClientEmail] = useState('')

    useEffect(() => {
        if (!deals || deals.length === 0) {
            getDeals()
        }
        if (!clients || clients.length === 0) {
            getClients()
        }
    }, [])

    const formatCurrency = (val: number, currency: string = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0
        }).format(val || 0)
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not scheduled'
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return 'Invalid date'
        }
    }

    // Filter deals
    const filteredDeals = useMemo(() => {
        if (!deals) return []
        return deals.filter((deal: any) => {
            const matchesSearch = 
                (deal.dealName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (deal.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (deal.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

            const matchesScope = 
                filterScope === 'all' || 
                (currentUser && deal.authorId === currentUser.id)

            return matchesSearch && matchesScope
        })
    }, [deals, searchQuery, filterScope, currentUser])

    // Group deals by stage
    const dealsByStage = useMemo(() => {
        const groups: Record<string, any[]> = {
            Consulting: [],
            Negotiation: [],
            Under_Process: [],
            Completed_Win: [],
            Completed_Loss: [],
        }

        filteredDeals.forEach((deal: any) => {
            const stage = normalizeStage(deal.stateOfDeal)
            if (groups[stage]) {
                groups[stage].push(deal)
            } else {
                groups.Consulting.push(deal)
            }
        })

        return groups
    }, [filteredDeals])

    // Metrics for Pipeline Header
    const pipelineMetrics = useMemo(() => {
        const totalCount = filteredDeals.length
        const totalValue = filteredDeals.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0)
        const wonValue = (dealsByStage.Completed_Win || []).reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0)
        const activeCount = (dealsByStage.Consulting?.length || 0) + 
                            (dealsByStage.Negotiation?.length || 0) + 
                            (dealsByStage.Under_Process?.length || 0)

        return { totalCount, totalValue, wonValue, activeCount }
    }, [filteredDeals, dealsByStage])

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dealId: string) => {
        e.dataTransfer.setData('text/plain', dealId)
        e.dataTransfer.effectAllowed = 'move'
        setDraggedDealId(dealId)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverStage !== stageId) {
            setDragOverStage(stageId)
        }
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverStage(null)
        }
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStage: string) => {
        e.preventDefault()
        const dealId = e.dataTransfer.getData('text/plain') || draggedDealId
        setDraggedDealId(null)
        setDragOverStage(null)

        if (!dealId) return

        const dealToUpdate = deals?.find((d: any) => d.id === dealId)
        if (!dealToUpdate) return

        const currentStage = normalizeStage(dealToUpdate.stateOfDeal)
        if (currentStage === targetStage) return

        try {
            await updateDeal(dealId, { stateOfDeal: targetStage })
        } catch {
            toast.error("Failed to update deal status")
        }
    }

    // Open Deal Insight Analysis Modal
    const handleOpenDetails = async (dealId: string) => {
        await getParticularDeal('id', dealId)
        setDealModalOpen(true)
    }

    // Create New Deal Handler
    const handleCreateDealSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDealName.trim()) {
            toast.error("Deal name is required")
            return
        }
        if (!newDealClientId) {
            toast.error("Please select or create a client for this deal")
            return
        }
        const amt = parseFloat(newDealAmount)
        if (isNaN(amt) || amt < 0) {
            toast.error("Valid deal amount is required")
            return
        }

        const est = newDealEstimatedCost ? parseFloat(newDealEstimatedCost) : undefined

        const created = await createDeal({
            dealName: newDealName.trim(),
            clientId: newDealClientId,
            amount: amt,
            estimatedCost: est,
            stateOfDeal: newDealStage,
            scheduled: newDealScheduled ? new Date(newDealScheduled).toISOString() : undefined
        })

        if (created) {
            setIsAddModalOpen(false)
            setNewDealName('')
            setNewDealAmount('')
            setNewDealEstimatedCost('')
            setNewDealStage('Consulting')
            setNewDealClientId('')
            setNewDealScheduled('')
        }
    }

    const handleQuickClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickClientName.trim() || !quickClientEmail.trim()) {
            toast.error("Name and Email are required for quick client")
            return
        }
        const newClient = await createClient({
            name: quickClientName.trim(),
            email: quickClientEmail.trim()
        })
        if (newClient) {
            setNewDealClientId(newClient.id)
            setIsQuickClientOpen(false)
            setQuickClientName('')
            setQuickClientEmail('')
        }
    }

    return (
        <DashboardLayout activeTab="dealManagement">
            <div className="flex flex-col h-full min-h-0 overflow-hidden space-y-3">
                {/* Header & Controls Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-tSecondary/40 border border-colorNeutral/15 rounded-2xl p-4 shadow-lg flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-colorPrimary/20 border border-colorPrimary/40 flex items-center justify-center text-colorPrimary">
                                <Briefcase className="w-3.5 h-3.5" />
                            </div>
                            <h2 className="text-xl font-black text-tInverted tracking-tight">Deal Management Pipeline</h2>
                        </div>
                        <p className="text-[11px] text-tPrimary/70 mt-0.5">
                            Drag and drop deal cards across stages to instantly update pipeline status.
                        </p>
                    </div>

                    {/* Pipeline Quick Summary Counters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-colorSecondary/70 border border-colorNeutral/20 px-3 py-1 rounded-xl text-center">
                            <span className="text-[9px] uppercase font-bold text-tPrimary/60 tracking-wider">Active Deals</span>
                            <p className="text-xs font-black text-tInverted">{pipelineMetrics.activeCount}</p>
                        </div>
                        <div className="bg-colorSecondary/70 border border-colorNeutral/20 px-3 py-1 rounded-xl text-center">
                            <span className="text-[9px] uppercase font-bold text-tPrimary/60 tracking-wider">Pipeline Value</span>
                            <p className="text-xs font-black text-colorPrimary">{formatCurrency(pipelineMetrics.totalValue)}</p>
                        </div>
                        <div className="bg-colorSecondary/70 border border-colorNeutral/20 px-3 py-1 rounded-xl text-center">
                            <span className="text-[9px] uppercase font-bold text-tPrimary/60 tracking-wider">Won Revenue</span>
                            <p className="text-xs font-black text-[#4ade80]">{formatCurrency(pipelineMetrics.wonValue)}</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 bg-colorPrimary hover:bg-hoverPrimary text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer border-none"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Deal</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Header: Search & Scope Filter Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 flex-shrink-0">
                    {/* Filter Scope Pills */}
                    <div className="flex items-center gap-1 bg-tSecondary/50 p-1 rounded-xl border border-colorNeutral/20 w-full sm:w-auto">
                        <button
                            onClick={() => setFilterScope('all')}
                            className={`flex-1 sm:flex-none px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                                filterScope === 'all'
                                    ? 'bg-colorPrimary text-white shadow'
                                    : 'text-tPrimary hover:text-tInverted hover:bg-tSecondary/50'
                            }`}
                        >
                            All Deals ({deals?.length || 0})
                        </button>
                        <button
                            onClick={() => setFilterScope('my')}
                            className={`flex-1 sm:flex-none px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                                filterScope === 'my'
                                    ? 'bg-colorPrimary text-white shadow'
                                    : 'text-tPrimary hover:text-tInverted hover:bg-tSecondary/50'
                            }`}
                        >
                            My Deals
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-tPrimary/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by deal, client, or representative..."
                            className="w-full bg-tSecondary/50 border border-colorNeutral/20 rounded-xl pl-8 pr-3.5 py-1.5 text-xs text-tInverted placeholder:text-tPrimary/40 focus:outline-none focus:border-colorPrimary/60 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tPrimary/50 hover:text-tInverted bg-transparent border-none cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Kanban Board Container */}
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar">
                    {isFetchingDeals ? (
                        <div className="h-full flex flex-col items-center justify-center text-tInverted/70 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-colorPrimary" />
                            <p className="text-xs font-semibold uppercase tracking-wider">Loading Deals Pipeline...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-3.5 min-w-[1200px] h-full min-h-0">
                            {DEAL_STAGES.map((stage) => {
                                const stageDeals = dealsByStage[stage.id] || []
                                const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
                                const isDropTarget = dragOverStage === stage.id

                                return (
                                    <div
                                        key={stage.id}
                                        onDragOver={(e) => handleDragOver(e, stage.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, stage.id)}
                                        className={`flex flex-col h-full min-h-0 rounded-2xl border transition-all duration-200 bg-tSecondary/30 overflow-hidden ${
                                            isDropTarget
                                                ? `${stage.dropzoneBg} shadow-2xl scale-[1.01]`
                                                : 'border-colorNeutral/20'
                                        } border-t-4 ${stage.borderAccent}`}
                                    >
                                        {/* Column Header */}
                                        <div className="p-3.5 border-b border-colorNeutral/15 flex flex-col gap-1.5 bg-colorSecondary/30 rounded-t-xl flex-shrink-0">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        className="w-2.5 h-2.5 rounded-full" 
                                                        style={{ backgroundColor: stage.color }}
                                                    />
                                                    <h3 className="font-extrabold text-tInverted text-sm tracking-tight">
                                                        {stage.label}
                                                    </h3>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${stage.badgeBg}`}>
                                                    {stageDeals.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-tPrimary/60">
                                                <span>{stage.shortDesc}</span>
                                                <span className="font-bold text-tInverted/80 font-mono">
                                                    {formatCurrency(stageTotal)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column Cards Dropzone Area */}
                                        <div className="p-3 flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">
                                            {stageDeals.length === 0 ? (
                                                <div className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all ${
                                                    isDropTarget 
                                                        ? 'border-colorPrimary/80 bg-colorPrimary/10 text-colorPrimary' 
                                                        : 'border-colorNeutral/20 text-tPrimary/40'
                                                }`}>
                                                    <Layers className="w-5 h-5 mb-1.5 opacity-60" />
                                                    <p className="text-[11px] font-semibold">Drop deals here</p>
                                                    <p className="text-[9px] opacity-70">to mark as {stage.label}</p>
                                                </div>
                                            ) : (
                                                stageDeals.map((deal: any) => {
                                                    const isBeingDragged = draggedDealId === deal.id
                                                    return (
                                                        <div
                                                            key={deal.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, deal.id)}
                                                            className={`bg-colorSecondary/90 border border-colorNeutral/25 hover:border-colorPrimary/50 rounded-xl p-3.5 shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-xl hover:translate-y-[-1px] relative flex flex-col justify-between space-y-3 group ${
                                                                isBeingDragged ? 'opacity-40 scale-95 border-dashed border-colorPrimary' : ''
                                                            }`}
                                                        >
                                                            {/* Deal Title & Stage Pill */}
                                                            <div>
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <h4 
                                                                        className="font-bold text-xs text-tInverted line-clamp-2 leading-tight group-hover:text-colorPrimary transition-colors"
                                                                        title={deal.dealName}
                                                                    >
                                                                        {deal.dealName || 'Untitled Deal'}
                                                                    </h4>
                                                                    <span className="text-[9px] font-mono text-tPrimary/50 flex-shrink-0">
                                                                        #{deal.id?.slice(0, 6)}
                                                                    </span>
                                                                </div>

                                                                {/* Client Pill */}
                                                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-tSecondary border border-colorNeutral/25 text-[10px] font-semibold text-tPrimary max-w-[190px] truncate">
                                                                        <Briefcase className="w-3 h-3 text-colorPrimary/70 flex-shrink-0" />
                                                                        <span className="truncate">{deal.client?.name || 'Unassigned Client'}</span>
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Deal Financials & Schedule Date */}
                                                            <div className="border-t border-colorNeutral/10 pt-2.5 space-y-1.5 text-xs">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] text-tPrimary/60">Amount:</span>
                                                                    <span className="font-extrabold text-[#4ade80] text-sm font-mono">
                                                                        {formatCurrency(deal.amount, deal.currency)}
                                                                    </span>
                                                                </div>
                                                                {deal.estimatedCost && Number(deal.estimatedCost) > 0 && (
                                                                    <div className="flex justify-between items-center text-[10px]">
                                                                        <span className="text-tPrimary/55">Est. Cost:</span>
                                                                        <span className="text-tPrimary/80 font-mono">
                                                                            {formatCurrency(deal.estimatedCost, deal.currency)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between text-[10px] text-tPrimary/60 pt-0.5">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3 text-tPrimary/50" />
                                                                        <span>{formatDate(deal.scheduled)}</span>
                                                                    </span>
                                                                    {deal.author?.name && (
                                                                        <span className="flex items-center gap-1 text-[9px] text-tPrimary/50 truncate max-w-[90px]" title={`Author: ${deal.author.name}`}>
                                                                            <User className="w-2.5 h-2.5" />
                                                                            <span className="truncate">{deal.author.name}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Card Footer: Details Button in Right Bottom Corner */}
                                                            <div className="border-t border-colorNeutral/15 pt-2 flex items-center justify-between">
                                                                <span className="text-[9px] font-semibold text-tPrimary/50 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-colorTertiary"></span>
                                                                    Active
                                                                </span>

                                                                {/* Details button at right bottom corner */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleOpenDetails(deal.id)
                                                                    }}
                                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-colorPrimary/20 hover:bg-colorPrimary text-white border border-colorPrimary/40 hover:border-colorPrimary shadow-sm transition-all active:scale-95 cursor-pointer ml-auto"
                                                                    title="Open Deal Insight Analysis"
                                                                >
                                                                    <span>Details</span>
                                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Deal Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-colorSecondary border border-colorNeutral/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                                <h3 className="font-extrabold text-tInverted text-base flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-colorPrimary" />
                                    Create New Pipeline Deal
                                </h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-1 hover:bg-colorSecondary/50 text-tPrimary hover:text-red-400 rounded-lg cursor-pointer bg-transparent border-none"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateDealSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
                                <div>
                                    <label className="block text-tPrimary uppercase font-bold text-[10px] tracking-wider mb-1.5">
                                        Deal Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newDealName}
                                        onChange={(e) => setNewDealName(e.target.value)}
                                        placeholder="e.g. Enterprise Cloud Integration"
                                        className="w-full bg-tSecondary border border-colorNeutral/25 rounded-xl px-3.5 py-2.5 text-tInverted placeholder:text-tPrimary/40 focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-tPrimary uppercase font-bold text-[10px] tracking-wider mb-1.5">
                                            Deal Amount (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={newDealAmount}
                                            onChange={(e) => setNewDealAmount(e.target.value)}
                                            placeholder="45000"
                                            className="w-full bg-tSecondary border border-colorNeutral/25 rounded-xl px-3.5 py-2.5 text-tInverted placeholder:text-tPrimary/40 focus:outline-none focus:border-colorPrimary font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-tPrimary uppercase font-bold text-[10px] tracking-wider mb-1.5">
                                            Estimated Cost (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={newDealEstimatedCost}
                                            onChange={(e) => setNewDealEstimatedCost(e.target.value)}
                                            placeholder="12000"
                                            className="w-full bg-tSecondary border border-colorNeutral/25 rounded-xl px-3.5 py-2.5 text-tInverted placeholder:text-tPrimary/40 focus:outline-none focus:border-colorPrimary font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-tPrimary uppercase font-bold text-[10px] tracking-wider mb-1.5">
                                            Stage of Deal
                                        </label>
                                        <select
                                            value={newDealStage}
                                            onChange={(e) => setNewDealStage(e.target.value)}
                                            className="w-full bg-tSecondary border border-colorNeutral/25 rounded-xl px-3.5 py-2.5 text-tInverted focus:outline-none focus:border-colorPrimary"
                                        >
                                            <option value="Consulting">Consulting</option>
                                            <option value="Negotiation">Negotiation</option>
                                            <option value="Under_Process">Under Process</option>
                                            <option value="Completed_Win">Completed Win</option>
                                            <option value="Completed_Loss">Completed Loss</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-tPrimary uppercase font-bold text-[10px] tracking-wider mb-1.5">
                                            Target Close Date
                                        </label>
                                        <input
                                            type="date"
                                            value={newDealScheduled}
                                            onChange={(e) => setNewDealScheduled(e.target.value)}
                                            className="w-full bg-tSecondary border border-colorNeutral/25 rounded-xl px-3.5 py-2.5 text-tInverted focus:outline-none focus:border-colorPrimary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-tPrimary uppercase font-bold text-[10px] tracking-wider">
                                            Associated Client *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickClientOpen(!isQuickClientOpen)}
                                            className="text-colorPrimary hover:underline text-[10px] font-bold bg-transparent border-none cursor-pointer"
                                        >
                                            {isQuickClientOpen ? 'Cancel new client' : '+ Create new client'}
                                        </button>
                                    </div>

                                    {isQuickClientOpen ? (
                                        <div className="p-3 bg-tSecondary/70 border border-colorNeutral/30 rounded-xl space-y-2 mb-2">
                                            <p className="text-[10px] font-bold text-tInverted">Quick Add Client</p>
                                            <input
                                                type="text"
                                                placeholder="Client Company or Contact Name"
                                                value={quickClientName}
                                                onChange={(e) => setQuickClientName(e.target.value)}
                                                className="w-full bg-colorSecondary border border-colorNeutral/30 rounded-lg p-2 text-xs text-tInverted placeholder:text-tPrimary/40"
                                            />
                                            <input
                                                type="email"
                                                placeholder="client@company.com"
                                                value={quickClientEmail}
                                                onChange={(e) => setQuickClientEmail(e.target.value)}
                                                className="w-full bg-colorSecondary border border-colorNeutral/30 rounded-lg p-2 text-xs text-tInverted placeholder:text-tPrimary/40"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickClientSubmit}
                                                className="px-3 py-1.5 bg-colorPrimary text-white font-bold rounded-lg text-xs hover:bg-hoverPrimary border-none cursor-pointer"
                                            >
                                                Save Client
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={newDealClientId}
                                            onChange={(e) => setNewDealClientId(e.target.value)}
                                            className="w-full bg-tSecondary border border-colorNeutral/25 rounded-xl px-3.5 py-2.5 text-tInverted focus:outline-none focus:border-colorPrimary"
                                        >
                                            <option value="">-- Choose a Client --</option>
                                            {(clients || []).map((client: any) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name} ({client.email})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-colorNeutral/15 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-2.5 border border-colorNeutral/30 text-tInverted font-bold rounded-xl hover:bg-tSecondary bg-transparent cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingDeal}
                                        className="flex-1 py-2.5 bg-colorPrimary text-white font-bold rounded-xl hover:bg-hoverPrimary border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isCreatingDeal && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isCreatingDeal ? 'Creating...' : 'Create Deal'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    )
}

export default DealManagement
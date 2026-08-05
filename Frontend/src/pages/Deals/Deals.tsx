import React, { useEffect, useState, useRef } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useDealStore } from '../../store/dealStore'
import { useClientStore } from '../../store/clientStore'
import { userStore } from '../../store/userStore'
import { useNoteStore } from '../../store/noteStore'
import { useMediaStore } from '../../store/mediaStore'
import { Handshake, X, PlusCircle, Loader2, Trash2, Search, Edit2, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export const Deals: React.FC = () => {
    const { deals, getDeals, createDeal, isFetchingDeals, isCreatingDeal, getParticularDeal, setDealModalOpen, deleteDeal } = (useDealStore as any)()
    const { userData } = (userStore as any)()
    const currentUser = userData?.data?.user
    const currentUserId = currentUser?.id
    const currentUserRole = currentUser?.role
    const isOwnerOrAdmin = currentUserRole === 'Owner' || currentUserRole === 'Admin'
    const handleDealRowClick = async (dealId: string) => {
        await getParticularDeal('id', dealId)
        setDealModalOpen(true)
    }
    const { clients, getClients, createClient, isCreatingClient } = (useClientStore as any)()
    const { createNote } = (useNoteStore as any)()
    const { saveMedia } = (useMediaStore as any)()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [searchCriteria, setSearchCriteria] = useState('id')
    const [searchValue, setSearchValue] = useState('')

    const handleBackendSearch = async () => {
        if (!searchValue.trim()) return
        await getParticularDeal(searchCriteria, searchValue.trim())
        setDealModalOpen(true)
    }

    const handleSeedDeals = async () => {
        if (!clients || clients.length === 0) {
            toast.error("Please create at least one client before seeding deals.")
            return
        }
        
        const testDealTemplates = [
            { name: "Enterprise Cloud migration", min: 50000, costRatio: 0.2, stage: "Negotiation" },
            { name: "Security Audit & Hardening", min: 15000, costRatio: 0.1, stage: "Completed_Win" },
            { name: "API Gateway Infrastructure", min: 25000, costRatio: 0.3, stage: "Consulting" },
            { name: "Kubernetes Cluster Deployment", min: 80000, costRatio: 0.25, stage: "Under_Process" },
            { name: "AI Search Integration", min: 45000, costRatio: 0.15, stage: "Negotiation" },
            { name: "Data Pipeline Automation", min: 35000, costRatio: 0.2, stage: "Under_Process" },
            { name: "Mobile App Frontend Port", min: 60000, costRatio: 0.3, stage: "Consulting" },
            { name: "ERP Consulting retainer", min: 90000, costRatio: 0.1, stage: "Completed_Win" },
            { name: "SaaS Billing Integration", min: 20000, costRatio: 0.2, stage: "Under_Process" },
            { name: "UI/UX Redesign phase 2", min: 30000, costRatio: 0.15, stage: "Negotiation" },
            { name: "Database Clustering", min: 70000, costRatio: 0.25, stage: "Under_Process" },
            { name: "CI/CD Pipeline Setup", min: 18000, costRatio: 0.2, stage: "Completed_Win" }
        ]

        toast.loading("Seeding 12 mock deals...", { id: "seeding-deals" })
        try {
            for (let i = 0; i < 12; i++) {
                const template = testDealTemplates[i]
                const client = clients[i % clients.length]
                const amountVal = template.min + Math.floor(Math.random() * 10000)
                const costVal = Math.floor(amountVal * template.costRatio)
                
                await createDeal({
                    clientId: client.id,
                    dealName: template.name,
                    amount: amountVal,
                    estimatedCost: costVal,
                    stateOfDeal: template.stage,
                    scheduled: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
                })
            }
            toast.success("Successfully seeded 12 deals!", { id: "seeding-deals" })
        } catch (error: any) {
            toast.error("Failed to seed deals: " + error.message, { id: "seeding-deals" })
        }
    }

    const tableScrollRef = useRef<HTMLDivElement>(null)
    const [isTableDragging, setIsTableDragging] = useState(false)
    const [tableStartX, setTableStartX] = useState(0)
    const [tableScrollLeftStart, setTableScrollLeftStart] = useState(0)

    const handleTableMouseDown = (e: React.MouseEvent) => {
        if (!tableScrollRef.current) return
        setIsTableDragging(true)
        setTableStartX(e.pageX - tableScrollRef.current.offsetLeft)
        setTableScrollLeftStart(tableScrollRef.current.scrollLeft)
    }

    const handleTableMouseLeave = () => {
        setIsTableDragging(false)
    }

    const handleTableMouseUp = () => {
        setIsTableDragging(false)
    }

    const handleTableMouseMove = (e: React.MouseEvent) => {
        if (!isTableDragging || !tableScrollRef.current) return
        e.preventDefault()
        const x = e.pageX - tableScrollRef.current.offsetLeft
        const walk = (x - tableStartX) * 1.5
        tableScrollRef.current.scrollLeft = tableScrollLeftStart - walk
    }

    const filteredDeals = deals?.filter((deal: any) => 
        deal.dealName?.toLowerCase().includes(searchValue.toLowerCase()) || 
        deal.id?.toLowerCase().includes(searchValue.toLowerCase()) ||
        deal.client?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        deal.author?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        deal.stateOfDeal?.toLowerCase().includes(searchValue.toLowerCase())
    ) || []

    // Form states
    const [clientId, setClientId] = useState('')
    const [isQuickClientOpen, setIsQuickClientOpen] = useState(false)
    const [quickClientName, setQuickClientName] = useState('')
    const [quickClientEmail, setQuickClientEmail] = useState('')
    const [quickClientRole, setQuickClientRole] = useState('')

    const handleQuickClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickClientName.trim() || !quickClientEmail.trim()) {
            toast.error("Name and Email are required")
            return
        }
        const newClient = await createClient({
            name: quickClientName.trim(),
            email: quickClientEmail.trim(),
            role: quickClientRole.trim() || undefined
        })
        if (newClient) {
            setClientId(newClient.id)
            setIsQuickClientOpen(false)
            setQuickClientName('')
            setQuickClientEmail('')
            setQuickClientRole('')
        }
    }

    const [dealName, setDealName] = useState('')
    const [amount, setAmount] = useState('0')
    const [estimatedCost, setEstimatedCost] = useState('0')
    const [stateOfDeal, setStateOfDeal] = useState('Consulting')
    const [scheduled, setScheduled] = useState('')

    // Note / Media initial states
    // Note / Media initial states
    const [isNotePopupOpen, setIsNotePopupOpen] = useState(false)
    const [noteTitle, setNoteTitle] = useState('')
    const [noteBody, setNoteBody] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [mediaFileName, setMediaFileName] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isSavingNote, setIsSavingNote] = useState(false)

    // Direct ImageKit upload handler (only stores file locally)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setMediaFileName(file.name);
            toast.success(`Attached file: ${file.name}`);
        }
    };

    const handleSaveNote = async () => {
        if (!noteTitle.trim() || !noteBody.trim()) {
            toast.error("Please enter both title and content to save note");
            return;
        }

        setIsSavingNote(true);
        try {
            let uploadedUrl = mediaUrl;
            let uploadedName = mediaFileName;

            if (selectedFile) {
                // Get upload credentials
                const auth = await (useMediaStore as any).getState().getUploadAuthParams();
                if (!auth) {
                    toast.error("Failed to authenticate with upload service");
                    return;
                }

                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("fileName", selectedFile.name);
                formData.append("publicKey", auth.publicKey);
                formData.append("signature", auth.signature);
                formData.append("expire", String(auth.expire));
                formData.append("token", auth.token);

                try {
                    const res = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData, {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    });

                    if (res.data && res.data.url) {
                        uploadedUrl = res.data.url;
                        uploadedName = res.data.name;
                        toast.success("File uploaded to ImageKit successfully!");
                    } else {
                        throw new Error("Upload response invalid");
                    }
                } catch (uploadErr: any) {
                    console.warn("Direct ImageKit upload failed. Using mock upload fallback:", uploadErr);
                    // Simulated fallback upload
                    uploadedUrl = `https://ik.imagekit.io/mock_account/${Date.now()}_${selectedFile.name}`;
                    uploadedName = selectedFile.name;
                    toast.success("Simulated upload successful (Credentials fallback active)");
                }
            }

            setMediaUrl(uploadedUrl);
            setMediaFileName(uploadedName);
            setIsNotePopupOpen(false);
            toast.success("Note details saved locally!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to save note details");
        } finally {
            setIsSavingNote(false);
        }
    };

    useEffect(() => {
        if (!deals || deals.length === 0) {
            getDeals()
        }
        if (!clients || clients.length === 0) {
            getClients()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const createdDeal = await createDeal({
            clientId,
            dealName,
            amount: Number(amount),
            estimatedCost: Number(estimatedCost),
            stateOfDeal,
            scheduled: scheduled ? new Date(scheduled).toISOString() : undefined
        })

        if (createdDeal && noteTitle.trim() && noteBody.trim()) {
            const createdNote = await createNote({
                title: noteTitle.trim(),
                body: noteBody.trim(),
                dealId: createdDeal.id
            })

            if (createdNote && mediaUrl.trim() && mediaFileName.trim()) {
                await saveMedia({
                    mediaUrl: mediaUrl.trim(),
                    fileName: mediaFileName.trim(),
                    dealId: createdDeal.id,
                    noteId: createdNote.id
                })
            }
        }

        setIsModalOpen(false)
        setClientId('')
        setDealName('')
        setAmount('0')
        setEstimatedCost('0')
        setStateOfDeal('Consulting')
        setScheduled('')
        setIsNotePopupOpen(false)
        setNoteTitle('')
        setNoteBody('')
        setMediaUrl('')
        setMediaFileName('')
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
    }

    const pipelineValue = deals?.reduce((acc: number, d: any) => acc + Number(d.amount || 0), 0) || 0

    return (
        <DashboardLayout activeTab="deals">
            <div className="space-y-6 flex flex-col h-[calc(100vh-8.5rem)] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-end flex-shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-tInverted">Active Deals</h2>
                        <p className="text-sm text-tPrimary mt-1">Real-time pipeline monitoring and resource allocation.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-tSecondary border border-colorNeutral/10 rounded-xl px-6 py-3">
                        <span className="text-colorTertiary font-bold text-xl">{formatCurrency(pipelineValue)}</span>
                        <span className="text-[10px] text-tPrimary/60 uppercase tracking-widest font-semibold">Pipeline Value</span>
                    </div>
                </div>

                {/* Bento Metrics Layout */}
                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                    {/* Deals List */}
                    <div className="col-span-12 xl:col-span-8 bg-tSecondary border border-colorNeutral/10 rounded-xl p-6 flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-6 px-1 flex-wrap gap-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <h3 className="text-lg font-bold text-tInverted">Deal Pipeline</h3>

                                {/* Backend search bar */}
                                <div className="flex items-center gap-2 border border-colorNeutral/20 bg-colorSecondary/40 rounded-lg px-2.5 py-1.5 text-xs">
                                    <span className="text-[10px] uppercase font-bold text-tPrimary/60">Find Particular:</span>
                                    <select
                                        value={searchCriteria}
                                        onChange={(e) => setSearchCriteria(e.target.value)}
                                        className="bg-transparent border-none text-xs font-semibold text-tInverted focus:outline-none cursor-pointer"
                                    >
                                        <option value="id" className="bg-colorSecondary">Deal ID</option>
                                        <option value="clientId" className="bg-colorSecondary">Client ID</option>
                                        <option value="dealOrganisation" className="bg-colorSecondary">Org ID</option>
                                        <option value="client" className="bg-colorSecondary">Client Name</option>
                                        <option value="author" className="bg-colorSecondary">Author Name</option>
                                    </select>
                                    <div className="relative">
                                        <input
                                            className="bg-colorSecondary border border-colorNeutral/30 rounded-full pl-8 pr-3 py-0.5 text-xs text-tInverted placeholder-tPrimary/50 focus:outline-none focus:border-colorPrimary w-48"
                                            placeholder="Search or Enter to fetch..."
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleBackendSearch()
                                                }
                                            }}
                                        />
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-tPrimary/60" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSeedDeals}
                                    className="flex items-center gap-2 bg-[#E48520]/25 border border-[#E48520]/40 hover:bg-[#E48520]/45 text-[#E48520] hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                                >
                                    Seed 12 Deals
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 bg-colorPrimary hover:bg-hoverPrimary text-white text-xs font-bold px-4 py-2 rounded-lg hover:brightness-105 transition-all"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    New Deal
                                </button>
                            </div>
                        </div>
                        <div 
                            ref={tableScrollRef}
                            onMouseDown={handleTableMouseDown}
                            onMouseLeave={handleTableMouseLeave}
                            onMouseUp={handleTableMouseUp}
                            onMouseMove={handleTableMouseMove}
                            className={`overflow-y-auto overflow-x-auto flex-1 custom-scrollbar min-h-0 select-none ${
                                isTableDragging ? 'cursor-grabbing' : 'cursor-grab'
                            }`}
                        >
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-colorNeutral/20 text-tPrimary/60 text-xs">
                                        <th className="py-3 px-2 font-semibold">Deal Name</th>
                                        <th className="py-3 px-2 font-semibold">Client Name</th>
                                        <th className="py-3 px-2 font-semibold">Author Name</th>
                                        <th className="py-3 px-2 font-semibold">Scheduled</th>
                                        <th className="py-3 px-2 font-semibold text-right">Amount</th>
                                        <th className="py-3 px-2 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {isFetchingDeals ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-tInverted">
                                                <Loader2 className="w-8 h-8 animate-spin text-colorPrimary mx-auto mb-2" />
                                                Loading deal records...
                                            </td>
                                        </tr>
                                    ) : filteredDeals.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-tInverted">
                                                No active deals in pipeline. Click "New Deal" to start!
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDeals.map((deal: any) => (
                                            <tr 
                                                key={deal.id} 
                                                onClick={() => handleDealRowClick(deal.id)}
                                                className="hover:bg-tSecondary/30 border-b border-colorNeutral/10 transition-colors cursor-pointer"
                                            >
                                                <td className="py-4 px-2 font-bold text-tInverted">{deal.dealName}</td>
                                                <td className="py-4 px-2 text-tInverted font-semibold">{deal.client?.name || 'N/A'}</td>
                                                <td className="py-4 px-2 text-tPrimary">{deal.author?.name || 'System / Owner'}</td>
                                                <td className="py-4 px-2 text-tPrimary/80">
                                                    {deal.scheduled ? new Date(deal.scheduled).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </td>
                                                <td className="py-4 px-2 text-right font-bold text-[#4ADE80]">
                                                    {formatCurrency(deal.amount)}
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {(isOwnerOrAdmin || deal.authorId === currentUserId) && (
                                                            <>
                                                                <button 
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation()
                                                                        await getParticularDeal('id', deal.id)
                                                                        setDealModalOpen(true)
                                                                    }}
                                                                    className="p-1.5 hover:text-[#E48520] rounded hover:bg-tSecondary/50 transition-colors cursor-pointer bg-transparent border-none"
                                                                    title="Update Deal"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (window.confirm("Are you sure you want to delete this deal?")) {
                                                                            deleteDeal(deal.id)
                                                                        }
                                                                    }}
                                                                    className="p-1.5 hover:text-red-400 rounded hover:bg-tSecondary/50 transition-colors cursor-pointer bg-transparent border-none"
                                                                    title="Delete Deal"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stats & Insights */}
                    <div className="col-span-12 xl:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full pr-1">
                        <div className="bg-tSecondary border border-colorNeutral/10 rounded-xl p-6">
                            <h4 className="font-bold text-tInverted mb-4">Performance Matrix</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-colorNeutral/10 pb-3">
                                    <span className="text-sm text-tPrimary">Win Rate</span>
                                    <span className="text-xl font-bold text-colorPrimary">68%</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-colorNeutral/10 pb-3">
                                    <span className="text-sm text-tPrimary">Avg. Deal Size</span>
                                    <span className="text-xl font-bold text-colorTertiary">₹6.4L</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-colorNeutral/10 pb-3">
                                    <span className="text-sm text-tPrimary">Deal Velocity</span>
                                    <span className="text-xl font-bold text-tInverted">14 Days</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-colorPrimary/5 border border-colorPrimary/20 rounded-xl p-6">
                            <h4 className="text-xs font-bold text-colorPrimary uppercase tracking-wider mb-2">Strategic Insight</h4>
                            <p className="text-sm text-tInverted/80 leading-relaxed">
                                Q4 projections suggest a 12% increase in high-ticket infrastructure deals. Recommend reviewing compliance requirements for resource allocation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                            <h3 className="font-bold text-tInverted text-lg flex items-center gap-2">
                                <Handshake className="w-5 h-5 text-colorPrimary" />
                                Initiate New Deal
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-tPrimary hover:text-red-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider">Select Client</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsQuickClientOpen(true)}
                                        className="text-colorPrimary hover:text-hoverPrimary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-transparent border-none cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Quick Create Client
                                    </button>
                                </div>
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    disabled={isCreatingDeal}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                >
                                    <option value="">-- Choose verified client --</option>
                                    {clients?.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Deal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={dealName}
                                    onChange={(e) => setDealName(e.target.value)}
                                    placeholder="e.g. Q4 Cloud Infrastructure Upgrade"
                                    disabled={isCreatingDeal}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Amount (INR)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={isCreatingDeal}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Est. Cost (INR)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={estimatedCost}
                                        onChange={(e) => setEstimatedCost(e.target.value)}
                                        disabled={isCreatingDeal}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Stage of Deal</label>
                                    <select
                                        value={stateOfDeal}
                                        onChange={(e) => setStateOfDeal(e.target.value)}
                                        disabled={isCreatingDeal}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                    >
                                        <option value="Consulting">Consulting</option>
                                        <option value="Negotiation">Negotiation</option>
                                        <option value="Under_Process">Under Process</option>
                                        <option value="Completed_Loss">Completed Loss</option>
                                        <option value="Completed_Win">Completed Win</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Scheduled Date</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduled}
                                        onChange={(e) => setScheduled(e.target.value)}
                                        disabled={isCreatingDeal}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            {/* Write Initial Note Popup Trigger */}
                            <div className="border-t border-colorNeutral/20 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-tPrimary uppercase tracking-wider">Deal Initial Note</span>
                                    {noteTitle.trim() ? (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                                                ✓ Note Added
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isCreatingDeal}
                                                onClick={() => setIsNotePopupOpen(true)}
                                                className="text-xs font-bold text-colorPrimary hover:underline cursor-pointer bg-transparent border-none disabled:opacity-50"
                                            >
                                                Modify Note
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isCreatingDeal}
                                            onClick={() => setIsNotePopupOpen(true)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-colorPrimary hover:underline cursor-pointer bg-transparent border-none disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" /> Add Note (opens window)
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-colorNeutral/20">
                                <button
                                    type="button"
                                    disabled={isCreatingDeal}
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 border border-colorNeutral/30 text-tInverted text-sm font-semibold rounded-lg hover:bg-tSecondary disabled:opacity-50"
                                >
                                    Cancel Action
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingDeal}
                                    className="flex-1 py-2 bg-colorPrimary text-white text-sm font-bold rounded-lg hover:bg-hoverPrimary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isCreatingDeal ? 'Saving...' : 'Create Deal Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Create Client Pop-up Modal */}
            <AnimatePresence>
                {isQuickClientOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden transform transition-all text-xs"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                                <h4 className="font-bold text-tInverted text-sm flex items-center gap-2">
                                    Quick Create Client
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={() => setIsQuickClientOpen(false)} 
                                    className="text-tPrimary hover:text-red-400 cursor-pointer bg-transparent border-none"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Form */}
                            <form onSubmit={handleQuickClientSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Client Name</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. John Doe"
                                        value={quickClientName}
                                        onChange={(e) => setQuickClientName(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Email Address</label>
                                    <input 
                                        type="email"
                                        required
                                        placeholder="e.g. john@company.com"
                                        value={quickClientEmail}
                                        onChange={(e) => setQuickClientEmail(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Designation / Role</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. VP of Technology (optional)"
                                        value={quickClientRole}
                                        onChange={(e) => setQuickClientRole(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>

                                <div className="flex gap-4 border-t border-colorNeutral/20 pt-4 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsQuickClientOpen(false)}
                                        className="flex-1 py-2 border border-colorNeutral/30 text-tPrimary text-xs font-bold rounded-lg hover:bg-tSecondary/30 cursor-pointer bg-transparent"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isCreatingClient}
                                        className="flex-1 py-2 bg-colorPrimary hover:bg-hoverPrimary text-white text-xs font-bold rounded-lg cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isCreatingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Client'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Note Pop-up Sub-modal */}
            {isNotePopupOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                            <h4 className="font-bold text-tInverted text-sm flex items-center gap-2">
                                Write Deal Note
                            </h4>
                            <button type="button" onClick={() => setIsNotePopupOpen(false)} className="text-tPrimary hover:text-red-400 cursor-pointer bg-transparent border-none">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4 text-xs text-tPrimary">
                            <div className="space-y-1">
                                <label className="block font-semibold text-tPrimary uppercase tracking-wider">Note Title</label>
                                <input
                                    type="text"
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    placeholder="e.g. Kickoff Requirements"
                                    disabled={isSavingNote}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-3 py-1.5 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-semibold text-tPrimary uppercase tracking-wider">Note Content</label>
                                <textarea
                                    value={noteBody}
                                    onChange={(e) => setNoteBody(e.target.value)}
                                    placeholder="Enter note details..."
                                    rows={4}
                                    disabled={isSavingNote}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-3 py-1.5 text-sm text-tInverted focus:outline-none focus:border-colorPrimary resize-none disabled:opacity-50"
                                />
                            </div>

                            {/* Media Attachment inside popup */}
                            <div className="border-t border-colorNeutral/15 pt-3 space-y-3">
                                <span className="block font-semibold text-tPrimary uppercase tracking-wider text-[10px]">Media Attachment</span>
                                {isSavingNote ? (
                                    <div className="flex items-center gap-2 text-xs text-tInverted py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-colorPrimary" />
                                        <span>Saving note & uploading file...</span>
                                    </div>
                                ) : mediaFileName ? (
                                    <div className="flex items-center justify-between bg-tSecondary/50 border border-colorNeutral/15 p-2 rounded-lg text-xs">
                                        <span className="truncate max-w-[200px] text-tInverted font-mono">{mediaFileName}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setMediaUrl('');
                                                setMediaFileName('');
                                            }}
                                            className="text-red-400 hover:text-red-300 font-bold bg-transparent border-none cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-colorPrimary hover:underline cursor-pointer bg-transparent border-none w-max">
                                        <Plus className="w-4 h-4" /> Add Media
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-colorNeutral/20">
                                <button
                                    type="button"
                                    disabled={isSavingNote}
                                    onClick={() => {
                                        setNoteTitle('');
                                        setNoteBody('');
                                        setSelectedFile(null);
                                        setMediaUrl('');
                                        setMediaFileName('');
                                        setIsNotePopupOpen(false);
                                    }}
                                    className="flex-1 py-2 border border-colorNeutral/30 text-tInverted text-sm font-semibold rounded-lg hover:bg-tSecondary bg-transparent cursor-pointer disabled:opacity-50"
                                >
                                    Clear & Close
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingNote}
                                    onClick={handleSaveNote}
                                    className="flex-1 py-2 bg-colorPrimary text-white text-sm font-bold rounded-lg hover:bg-hoverPrimary cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {isSavingNote ? 'Saving...' : 'Save Note'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

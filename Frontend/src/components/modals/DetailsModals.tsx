"use client";

import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Loader2, ChevronLeft, ChevronRight, User, Activity, Download, Edit2, Trash2, Save, RotateCcw, Plus } from 'lucide-react'
import { useClientStore } from '../../store/clientStore'
import { useDealStore } from '../../store/dealStore'
import { userStore } from '../../store/userStore'
import { useNoteStore } from '../../store/noteStore'
import { useMediaStore } from '../../store/mediaStore'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export const ClientDetailsModal: React.FC = () => {
    const { particularClient, isFetchingClient, isClientModalOpen, setClientModalOpen, updateClient, deleteClient } = (useClientStore as any)()
    const { getParticularDeal, setDealModalOpen } = (useDealStore as any)()
    const { userData } = (userStore as any)()
    const carouselRef = useRef<HTMLDivElement>(null)

    // Edit states
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editRole, setEditRole] = useState('')

    // Reset edit state when modal opens/closes or particularClient changes
    useEffect(() => {
        if (particularClient) {
            setEditName(particularClient.name || '')
            setEditEmail(particularClient.email || '')
            setEditRole(particularClient.role || '')
        }
        setIsEditing(false)
    }, [particularClient, isClientModalOpen])

    if (!isClientModalOpen) return null

    const currentUser = userData?.data?.user
    const currentUserId = currentUser?.id
    const currentUserRole = currentUser?.role
    const isOwnerOrAdmin = currentUserRole === 'Owner' || currentUserRole === 'Admin'
    const canModifyClient = isOwnerOrAdmin || (particularClient && particularClient.authorId === currentUserId)

    const handleScroll = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const scrollAmount = 260
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    const handleDealClick = async (dealId: string) => {
        await getParticularDeal('id', dealId)
        setDealModalOpen(true)
    }

    const handleSave = async () => {
        if (!editName.trim() || !editEmail.trim()) {
            return
        }
        await updateClient(particularClient.id, {
            name: editName,
            email: editEmail,
            role: editRole
        })
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this client? This action is permanent.")) {
            await deleteClient(particularClient.id)
            setClientModalOpen(false)
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-colorSecondary border border-colorNeutral/30 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                        <h3 className="font-bold text-tInverted text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-colorPrimary" />
                            {isEditing ? "Modify Client Profile" : "Client Profile Details"}
                        </h3>
                        <div className="flex items-center gap-2">
                            {!isEditing && canModifyClient && (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        title="Modify Profile" 
                                        className="text-tPrimary hover:text-[#E48520] p-1.5 rounded-lg hover:bg-colorSecondary/50 cursor-pointer border-none bg-transparent"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleDelete} 
                                        title="Delete Profile" 
                                        className="text-tPrimary hover:text-red-400 p-1.5 rounded-lg hover:bg-colorSecondary/50 cursor-pointer border-none bg-transparent"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button onClick={() => setClientModalOpen(false)} className="text-tPrimary hover:text-red-400 p-1 rounded-lg hover:bg-colorSecondary/50 cursor-pointer border-none bg-transparent">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                        {isFetchingClient ? (
                            <div className="flex flex-col items-center justify-center py-12 text-tInverted text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-colorPrimary mb-3 mx-auto" />
                                <p className="text-xs font-semibold tracking-wider uppercase opacity-75">Loading Client Profile...</p>
                            </div>
                        ) : !particularClient ? (
                            <div className="text-center py-12 text-tPrimary/60">
                                No client profile details loaded.
                            </div>
                        ) : isEditing ? (
                            /* EDIT MODE */
                            <div className="space-y-4 text-xs text-tPrimary">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Client Name</label>
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Role / Designation</label>
                                    <input 
                                        type="text" 
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-colorNeutral/10">
                                    <button 
                                        onClick={handleSave} 
                                        className="flex-1 py-2.5 bg-colorPrimary hover:bg-hoverPrimary text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        className="flex-1 py-2.5 border border-colorNeutral/30 hover:bg-tSecondary text-tInverted text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* VIEW MODE */
                            <div className="space-y-6 text-xs text-tPrimary">
                                {/* Grid details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Client Name</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">{particularClient.name}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Email Address</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">{particularClient.email}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10 col-span-1 md:col-span-2">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Client ID</p>
                                        <p className="text-xs font-mono font-semibold text-tPrimary mt-1 select-all">{particularClient.id}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Created By</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">{particularClient.author?.name || 'System / Owner'}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Email of Creator</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">{particularClient.author?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Deals Carousel */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[11px] text-tPrimary uppercase tracking-wider font-bold">Associated Deals</p>
                                            <p className="text-xs text-tPrimary/60">Total: {particularClient.deals?.length || 0} deals</p>
                                        </div>
                                        {particularClient.deals && particularClient.deals.length > 2 && (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleScroll('left')} className="p-1 hover:bg-tSecondary rounded border border-colorNeutral/20 text-tPrimary cursor-pointer bg-transparent">
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleScroll('right')} className="p-1 hover:bg-tSecondary rounded border border-colorNeutral/20 text-tPrimary cursor-pointer bg-transparent">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {particularClient.deals && particularClient.deals.length > 0 ? (
                                        <div 
                                            ref={carouselRef}
                                            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                        >
                                            {particularClient.deals.map((deal: any) => (
                                                <div 
                                                    key={deal.id}
                                                    onClick={() => handleDealClick(deal.id)}
                                                    className="w-[240px] flex-shrink-0 bg-tSecondary border border-colorNeutral/25 rounded-xl overflow-hidden shadow-md cursor-pointer hover:border-colorPrimary/50 hover:scale-[1.02] transition-all snap-start"
                                                >
                                                    {/* Header Card Style (Google Classroom like) */}
                                                    <div className="bg-gradient-to-r from-colorPrimary to-colorTertiary p-4 text-white">
                                                        <h4 className="font-bold text-sm truncate">{deal.dealName}</h4>
                                                        <p className="text-[10px] opacity-85 mt-0.5 font-mono truncate">ID: {deal.id}</p>
                                                    </div>
                                                    <div className="p-4 space-y-2 bg-colorSecondary/40 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-tPrimary/60">Value:</span>
                                                            <span className="font-bold text-[#4ADE80]">{formatCurrency(deal.amount)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-tPrimary/60">Stage:</span>
                                                            <span className="font-semibold text-tInverted uppercase text-[10px] tracking-wide">{deal.stateOfDeal?.replace('_', ' ')}</span>
                                                        </div>
                                                        <div className="border-t border-colorNeutral/10 pt-2 flex items-center gap-1.5 text-tPrimary/65">
                                                            <User className="w-3.5 h-3.5" />
                                                            <span className="truncate">Creator: {particularClient.author?.name || 'Staff'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-tSecondary/20 rounded-lg border border-dashed border-colorNeutral/25 text-tPrimary/55 text-xs">
                                            No deals registered for this client.
                                        </div>
                                    )}
                                </div>

                                {/* Modify Actions Footer if authorized */}
                                {canModifyClient && (
                                    <div className="flex gap-3 pt-4 border-t border-colorNeutral/10">
                                        <button 
                                            onClick={() => setIsEditing(true)} 
                                            className="flex-1 py-2 border border-[#E48520] hover:bg-[#E48520]/25 text-[#E48520] text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Modify Profile
                                        </button>
                                        <button 
                                            onClick={handleDelete} 
                                            className="flex-1 py-2 border border-red-500 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete Profile
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export const DealDetailsModal: React.FC = () => {
    const { particularDeal, isFetchingDeal, isDealModalOpen, setDealModalOpen, updateDeal, deleteDeal, getParticularDeal } = (useDealStore as any)()
    const { userData } = (userStore as any)()
    const { createNote, updateNote } = (useNoteStore as any)()
    const { saveMedia, updateMedia } = (useMediaStore as any)()

    // Edit states
    const [isEditing, setIsEditing] = useState(false)
    const [editAmount, setEditAmount] = useState(0)
    const [editEstCost, setEditEstCost] = useState(0)
    const [editState, setEditState] = useState('Consulting')
    const [editScheduled, setEditScheduled] = useState('')

    // Note / Media edit states
    const [editNoteTitle, setEditNoteTitle] = useState('')
    const [editNoteBody, setEditNoteBody] = useState('')
    const [editMediaUrl, setEditMediaUrl] = useState('')
    const [editMediaFileName, setEditMediaFileName] = useState('')

    // Sub-modal triggers
    const [isNotePopupOpen, setIsNotePopupOpen] = useState(false)
    const [isUploadingFile, setIsUploadingFile] = useState(false)
    const [selectedViewNote, setSelectedViewNote] = useState<any>(null)
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

    // Direct ImageKit upload handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingFile(true);
        try {
            // Get upload credentials
            const auth = await (useMediaStore as any).getState().getUploadAuthParams();
            if (!auth) {
                toast.error("Failed to authenticate with upload service");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("fileName", file.name);
            formData.append("publicKey", auth.publicKey);
            formData.append("signature", auth.signature);
            formData.append("expire", String(auth.expire));
            formData.append("token", auth.token);

            // POST directly to ImageKit upload API without backend routing
            const res = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"   
                }
            });

            if (res.data && res.data.url) {
                setEditMediaUrl(res.data.url);
                setEditMediaFileName(res.data.name);
                toast.success("File uploaded to ImageKit successfully!");
            } else {
                toast.error("Upload failed");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message || "Failed to upload file");
        } finally {
            setIsUploadingFile(false);
        }
    };

    // Reset edit state when modal opens/closes or particularDeal changes
    useEffect(() => {
        if (particularDeal) {
            setEditAmount(particularDeal.amount || 0)
            setEditEstCost(particularDeal.estimatedCost || 0)
            setEditState(particularDeal.stateOfDeal || 'Consulting')
            setEditScheduled(particularDeal.scheduled ? particularDeal.scheduled.slice(0, 16) : '')
        }
        setIsEditing(false)
    }, [particularDeal, isDealModalOpen])

    if (!isDealModalOpen) return null

    const currentUser = userData?.data?.user
    const currentUserId = currentUser?.id
    const currentUserRole = currentUser?.role
    const isOwnerOrAdmin = currentUserRole === 'Owner' || currentUserRole === 'Admin'
    const canModifyDeal = isOwnerOrAdmin || (particularDeal && particularDeal.authorId === currentUserId)

    const handleSave = async () => {
        // Update deal details
        await updateDeal(particularDeal.id, {
            amount: Number(editAmount),
            estimatedCost: Number(editEstCost),
            stateOfDeal: editState,
            scheduled: editScheduled ? new Date(editScheduled).toISOString() : undefined
        })
        setIsEditing(false)
    }

    const handleSaveNote = async () => {
        if (!editNoteTitle.trim() || !editNoteBody.trim()) {
            toast.error("Please enter both title and content to save note");
            return;
        }

        try {
            let noteId = editingNoteId;
            if (editingNoteId) {
                // Update note
                await updateNote(editingNoteId, {
                    title: editNoteTitle.trim(),
                    body: editNoteBody.trim()
                });
            } else {
                // Create note
                const createdNote = await createNote({
                    title: editNoteTitle.trim(),
                    body: editNoteBody.trim(),
                    dealId: particularDeal.id
                });
                noteId = createdNote?.id;
            }

            // Media attachment handling
            const note = particularDeal.notes?.find((n: any) => n.id === noteId);
            const med = note?.media && note.media.length > 0 ? note.media[0] : null;

            if (editMediaUrl.trim() && editMediaFileName.trim()) {
                if (med) {
                    await updateMedia(med.id, {
                        mediaUrl: editMediaUrl.trim(),
                        fileName: editMediaFileName.trim()
                    });
                } else {
                    await saveMedia({
                        mediaUrl: editMediaUrl.trim(),
                        fileName: editMediaFileName.trim(),
                        dealId: particularDeal.id,
                        noteId: noteId
                    });
                }
            }

            // Reload particular deal to refresh notes list in UI
            await getParticularDeal('id', particularDeal.id);
            setIsNotePopupOpen(false);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to save note details");
        }
    }

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this deal? This action is permanent.")) {
            await deleteDeal(particularDeal.id)
            setDealModalOpen(false)
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-colorSecondary border border-colorNeutral/30 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                        <h3 className="font-bold text-tInverted text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-colorPrimary" />
                            {isEditing ? "Modify Deal Status" : "Deal Insight Analysis"}
                        </h3>
                        <div className="flex items-center gap-2">
                            {!isEditing && canModifyDeal && (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        title="Modify Status" 
                                        className="text-tPrimary hover:text-[#E48520] p-1.5 rounded-lg hover:bg-colorSecondary/50 cursor-pointer border-none bg-transparent"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleDelete} 
                                        title="Delete Deal" 
                                        className="text-tPrimary hover:text-red-400 p-1.5 rounded-lg hover:bg-colorSecondary/50 cursor-pointer border-none bg-transparent"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button onClick={() => setDealModalOpen(false)} className="text-tPrimary hover:text-red-400 p-1 rounded-lg hover:bg-colorSecondary/50 cursor-pointer border-none bg-transparent">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs text-tPrimary">
                        {isFetchingDeal ? (
                            <div className="flex flex-col items-center justify-center py-12 text-tInverted text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-colorPrimary mb-3 mx-auto" />
                                <p className="text-xs font-semibold tracking-wider uppercase opacity-75">Fetching Deal Details...</p>
                            </div>
                        ) : !particularDeal ? (
                            <div className="text-center py-12 text-tPrimary/60">
                                No deal detail parameters active.
                            </div>
                        ) : isEditing ? (
                            /* EDIT MODE */
                            <div className="space-y-4 text-xs text-tPrimary">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Deal Value (Price)</label>
                                    <input 
                                        type="number" 
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(Number(e.target.value))}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Estimated Cost</label>
                                    <input 
                                        type="number" 
                                        value={editEstCost}
                                        onChange={(e) => setEditEstCost(Number(e.target.value))}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Stage of Deal</label>
                                    <select
                                        value={editState}
                                        onChange={(e) => setEditState(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary cursor-pointer"
                                    >
                                        <option value="Consulting">Consulting</option>
                                        <option value="Negotiation">Negotiation</option>
                                        <option value="Under_Process">Under Process</option>
                                        <option value="Completed_Loss">Completed Loss</option>
                                        <option value="Completed_Win">Completed Win</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold">Scheduled Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={editScheduled}
                                        onChange={(e) => setEditScheduled(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/30 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                                {/* Deal Notes Edit List */}
                                <div className="border-t border-colorNeutral/20 pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs uppercase tracking-wider text-tPrimary/60 font-semibold font-sans">Deal Notes</h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingNoteId(null)
                                                setEditNoteTitle('')
                                                setEditNoteBody('')
                                                setEditMediaUrl('')
                                                setEditMediaFileName('')
                                                setIsNotePopupOpen(true)
                                            }}
                                            className="flex items-center gap-1 text-xs font-bold text-colorPrimary hover:underline cursor-pointer bg-transparent border-none"
                                            title="Add New Note"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Note
                                        </button>
                                    </div>

                                    {particularDeal.notes && particularDeal.notes.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                            {particularDeal.notes.map((note: any) => (
                                                <div 
                                                    key={note.id}
                                                    onClick={() => {
                                                        setEditingNoteId(note.id)
                                                        setEditNoteTitle(note.title || '')
                                                        setEditNoteBody(note.body || note.content || '')
                                                        const med = note.media && note.media.length > 0 ? note.media[0] : null
                                                        if (med) {
                                                            setEditMediaUrl(med.mediaUrl || '')
                                                            setEditMediaFileName(med.fileName || '')
                                                        } else {
                                                            setEditMediaUrl('')
                                                            setEditMediaFileName('')
                                                        }
                                                        setIsNotePopupOpen(true)
                                                    }}
                                                    className="p-3 bg-tSecondary/30 hover:bg-tSecondary/60 border border-colorNeutral/15 rounded-lg text-left cursor-pointer transition-colors space-y-1"
                                                    title="Click to edit note"
                                                >
                                                    <p className="text-tInverted font-bold truncate">{note.title || 'Untitled Note'}</p>
                                                    <p className="text-tPrimary/80 truncate text-[10px]">{note.body || note.content}</p>
                                                    <div className="flex justify-between items-center text-[8px] text-tPrimary/55 pt-1">
                                                        <span>Edit Note</span>
                                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-tSecondary/10 rounded-lg text-center text-tPrimary/45 border border-dashed border-colorNeutral/20 text-xs">
                                            No notes. Click "+ Add Note" to create one!
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-colorNeutral/10">
                                    <button 
                                        onClick={handleSave} 
                                        className="flex-1 py-2.5 bg-colorPrimary hover:bg-hoverPrimary text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        className="flex-1 py-2.5 border border-colorNeutral/30 hover:bg-tSecondary text-tInverted text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* VIEW MODE */
                            <div className="space-y-6">
                                {/* Deal Grid details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Deal Name</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">{particularDeal.dealName}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Deal ID</p>
                                        <p className="font-mono text-tPrimary mt-1 truncate select-all">{particularDeal.id}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Stage of Deal</p>
                                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-colorPrimary/25 text-colorPrimary rounded font-bold uppercase text-[10px]">
                                            {particularDeal.stateOfDeal?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Deal Value</p>
                                        <p className="text-sm font-bold text-[#4ADE80] mt-1">{formatCurrency(particularDeal.amount)}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Estimated Cost</p>
                                        <p className="text-sm font-bold text-red-400 mt-1">{formatCurrency(particularDeal.estimatedCost || 0)}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Creator Account</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">{particularDeal.author?.name || 'System'}</p>
                                    </div>
                                    <div className="bg-tSecondary/40 p-4 rounded-lg border border-colorNeutral/10">
                                        <p className="text-[10px] text-tPrimary uppercase tracking-wider font-semibold">Scheduled Date</p>
                                        <p className="text-sm font-bold text-tInverted mt-1">
                                            {particularDeal.scheduled 
                                                ? new Date(particularDeal.scheduled).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                : 'Unscheduled'}
                                        </p>
                                    </div>
                                </div>

                                {/* Notes List */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-tInverted uppercase text-[10px] tracking-wider">Linked Workspace Notes</h4>
                                    {particularDeal.notes && particularDeal.notes.length > 0 ? (
                                        <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                            {particularDeal.notes.map((note: any) => (
                                                <div 
                                                    key={note.id} 
                                                    onClick={() => setSelectedViewNote(note)}
                                                    className="p-3 bg-tSecondary/30 hover:bg-tSecondary/60 border border-colorNeutral/15 rounded-lg space-y-1 cursor-pointer transition-colors"
                                                    title="Click to view note details"
                                                >
                                                    <p className="text-tInverted font-bold leading-relaxed">{note.title || 'Untitled Note'}</p>
                                                    <p className="text-tPrimary/80 truncate text-[11px]">{note.body || note.content}</p>
                                                    <div className="flex justify-between items-center text-[9px] text-tPrimary/50 pt-1">
                                                        <span>By: {note.author?.name || 'Collaborator'}</span>
                                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-tSecondary/10 rounded-lg text-center text-tPrimary/45 border border-dashed border-colorNeutral/20">
                                            No notes attached to this deal.
                                        </div>
                                    )}
                                </div>

                                {/* Media Attachments */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-tInverted uppercase text-[10px] tracking-wider font-sans">Notes Attachments & Media</h4>
                                    {particularDeal.media && particularDeal.media.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                            {particularDeal.media.map((med: any) => (
                                                <div key={med.id} className="p-3 bg-tSecondary/30 border border-colorNeutral/15 rounded-lg flex justify-between items-center gap-2 group">
                                                    <div className="min-w-0">
                                                        <p className="text-tInverted font-semibold truncate" title={med.fileName}>{med.fileName || 'Attachment'}</p>
                                                        <p className="text-[10px] text-tPrimary/55">{med.fileType || 'binary'}</p>
                                                    </div>
                                                    <a 
                                                        href={med.fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="p-1.5 bg-[#242424] hover:bg-colorPrimary hover:text-white rounded border border-colorNeutral/25 text-tPrimary cursor-pointer flex-shrink-0"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-tSecondary/10 rounded-lg text-center text-tPrimary/45 border border-dashed border-colorNeutral/20">
                                            No attachments attached to this deal.
                                        </div>
                                    )}
                                </div>

                                {/* Modify Actions Footer if authorized */}
                                {canModifyDeal && (
                                    <div className="flex gap-3 pt-4 border-t border-colorNeutral/10">
                                        <button 
                                            onClick={() => setIsEditing(true)} 
                                            className="flex-1 py-2 border border-[#E48520] hover:bg-[#E48520]/25 text-[#E48520] text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Modify Status
                                        </button>
                                        <button 
                                            onClick={handleDelete} 
                                            className="flex-1 py-2 border border-red-500 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete Deal
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Note Pop-up Sub-modal for editing note */}
            {isNotePopupOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="bg-colorSecondary border border-colorNeutral/45 w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                            <h4 className="font-bold text-tInverted text-sm">
                                Edit Deal Note
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
                                    value={editNoteTitle}
                                    onChange={(e) => setEditNoteTitle(e.target.value)}
                                    placeholder="e.g. Kickoff Requirements"
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-3 py-1.5 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-semibold text-tPrimary uppercase tracking-wider">Note Content</label>
                                <textarea
                                    value={editNoteBody}
                                    onChange={(e) => setEditNoteBody(e.target.value)}
                                    placeholder="Enter note details..."
                                    rows={4}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-3 py-1.5 text-sm text-tInverted focus:outline-none focus:border-colorPrimary resize-none"
                                />
                            </div>

                            {/* Media Attachment inside popup */}
                            <div className="border-t border-colorNeutral/15 pt-3 space-y-3">
                                <span className="block font-semibold text-tPrimary uppercase tracking-wider text-[10px]">Media Attachment</span>
                                {isUploadingFile ? (
                                    <div className="flex items-center gap-2 text-xs text-tInverted py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-colorPrimary" />
                                        <span>Uploading file to ImageKit...</span>
                                    </div>
                                ) : editMediaUrl ? (
                                    <div className="flex items-center justify-between bg-tSecondary/50 border border-colorNeutral/15 p-2 rounded-lg text-xs">
                                        <span className="truncate max-w-[200px] text-tInverted font-mono">{editMediaFileName}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditMediaUrl('');
                                                setEditMediaFileName('');
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
                                    onClick={() => {
                                        setEditNoteTitle('');
                                        setEditNoteBody('');
                                        setEditMediaUrl('');
                                        setEditMediaFileName('');
                                        setIsNotePopupOpen(false);
                                    }}
                                    className="flex-1 py-2 border border-colorNeutral/30 text-tInverted text-sm font-semibold rounded-lg hover:bg-tSecondary bg-transparent cursor-pointer"
                                >
                                    Clear & Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveNote}
                                    className="flex-1 py-2 bg-colorPrimary text-white text-sm font-bold rounded-lg hover:bg-hoverPrimary cursor-pointer border-none"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Preview Sub-modal */}
            {selectedViewNote && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                            <h4 className="font-bold text-tInverted text-sm truncate max-w-[300px]">
                                {selectedViewNote.title || 'Note Details'}
                            </h4>
                            <button type="button" onClick={() => setSelectedViewNote(null)} className="text-tPrimary hover:text-red-400 cursor-pointer bg-transparent border-none">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-4 text-xs text-tPrimary overflow-y-auto max-h-[70vh] custom-scrollbar">
                            <div className="bg-tSecondary/30 p-4 border border-colorNeutral/15 rounded-lg space-y-2">
                                <p className="text-tInverted text-xs leading-relaxed whitespace-pre-wrap">{selectedViewNote.body || selectedViewNote.content}</p>
                                <div className="flex justify-between items-center text-[9px] text-tPrimary/40 pt-2 border-t border-colorNeutral/10">
                                    <span>Written by: {selectedViewNote.author?.name || 'Collaborator'}</span>
                                    <span>{new Date(selectedViewNote.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Media previews if note has media */}
                            {selectedViewNote.media && selectedViewNote.media.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="font-bold text-tInverted uppercase text-[10px] tracking-wider font-sans">Attachments & Preview</h5>
                                    {selectedViewNote.media.map((med: any) => {
                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(med.mediaUrl || med.fileUrl || '');
                                        return (
                                            <div key={med.id} className="bg-tSecondary/20 border border-colorNeutral/15 p-3 rounded-lg space-y-2">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="font-mono text-[10px] text-tInverted truncate max-w-[200px]" title={med.fileName}>
                                                        {med.fileName || 'file_attachment'}
                                                    </span>
                                                    <a 
                                                        href={med.mediaUrl || med.fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-colorPrimary hover:underline flex items-center gap-1"
                                                    >
                                                        <Download className="w-3 h-3" /> Download
                                                    </a>
                                                </div>
                                                {isImage && (
                                                    <div className="relative rounded overflow-hidden border border-colorNeutral/20 bg-black/20 flex justify-center">
                                                        <img 
                                                            src={med.mediaUrl || med.fileUrl} 
                                                            alt={med.fileName} 
                                                            className="max-h-48 object-contain w-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-3 bg-tSecondary/30 border-t border-colorNeutral/20 flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setSelectedViewNote(null)} 
                                className="px-4 py-1.5 bg-colorPrimary hover:bg-hoverPrimary text-white font-bold rounded text-xs cursor-pointer border-none"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}

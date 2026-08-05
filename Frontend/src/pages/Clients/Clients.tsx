import React, { useEffect, useState, useRef } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useClientStore } from '../../store/clientStore'
import { userStore } from '../../store/userStore'
import { UserPlus, Download, X, Loader2, Trash2, Search, Edit2 } from 'lucide-react'

export const Clients: React.FC = () => {
    const { clients, getClients, createClient, isFetchingClients, isCreatingClient, getParticularClient, setClientModalOpen, deleteClient } = (useClientStore as any)()
    const { userData } = (userStore as any)()
    const currentUser = userData?.data?.user
    const currentUserId = currentUser?.id
    const currentUserRole = currentUser?.role
    const isOwnerOrAdmin = currentUserRole === 'Owner' || currentUserRole === 'Admin'

    const handleRowClick = async (clientId: string) => {
        await getParticularClient('id', clientId)
        setClientModalOpen(true)
    }

    const tableScrollRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeftStart, setScrollLeftStart] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!tableScrollRef.current) return
        setIsDragging(true)
        setStartX(e.pageX - tableScrollRef.current.offsetLeft)
        setScrollLeftStart(tableScrollRef.current.scrollLeft)
    }

    const handleMouseLeave = () => {
        setIsDragging(false)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !tableScrollRef.current) return
        e.preventDefault()
        const x = e.pageX - tableScrollRef.current.offsetLeft
        const walk = (x - startX) * 1.5
        tableScrollRef.current.scrollLeft = scrollLeftStart - walk
    }
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')

    const [searchCriteria, setSearchCriteria] = useState<'email' | 'id'>('email')
    const [searchValue, setSearchValue] = useState('')

    const handleBackendSearch = async () => {
        if (!searchValue.trim()) return
        await getParticularClient(searchCriteria, searchValue.trim())
        setClientModalOpen(true)
    }

    useEffect(() => {
        if (!clients || clients.length === 0) {
            getClients()
        }
    }, [])

    const filteredClients = clients?.filter((c: any) => 
        c.name?.toLowerCase().includes(search.toLowerCase()) || 
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.id?.toLowerCase().includes(search.toLowerCase())
    ) || []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await createClient({ name, email, role })
        setIsModalOpen(false)
        setName('')
        setEmail('')
        setRole('')
    }

    return (
        <DashboardLayout activeTab="clients">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <nav className="flex gap-2 text-xs font-semibold text-tPrimary mb-1">
                            <span>Directory</span>
                            <span>/</span>
                            <span className="text-colorPrimary">Clients</span>
                        </nav>
                        <h1 className="text-3xl font-black text-tInverted">Clients Database</h1>
                        <p className="text-sm text-tPrimary mt-1">
                            Managing {clients?.length || 0} verified client records.
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-colorPrimary hover:bg-hoverPrimary text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Client
                    </button>
                </div>

                {/* Filters & Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-tSecondary border border-colorNeutral/10 p-4 rounded-xl">
                        <p className="text-[10px] text-tPrimary/60 uppercase tracking-widest mb-1">Total Verified</p>
                        <p className="text-2xl font-bold text-tInverted">{clients?.length || 0}</p>
                        <div className="mt-2 h-1 w-full bg-colorSecondary rounded-full overflow-hidden">
                            <div className="h-full bg-colorPrimary w-[70%]"></div>
                        </div>
                    </div>
                    <div className="bg-tSecondary border border-colorNeutral/10 p-4 rounded-xl">
                        <p className="text-[10px] text-tPrimary/60 uppercase tracking-widest mb-1">Response Rate</p>
                        <p className="text-2xl font-bold text-colorTertiary">94%</p>
                        <p className="text-[10px] text-colorPrimary mt-1 font-semibold">+3% this month</p>
                    </div>
                    <div className="bg-tSecondary border border-colorNeutral/10 p-4 rounded-xl">
                        <p className="text-[10px] text-tPrimary/60 uppercase tracking-widest mb-1">Active Accounts</p>
                        <p className="text-2xl font-bold text-tInverted">85%</p>
                        <p className="text-[10px] text-tPrimary mt-1">Excellent Retention</p>
                    </div>
                    <div className="bg-tSecondary border border-colorNeutral/10 p-4 rounded-xl">
                        <p className="text-[10px] text-tPrimary/60 uppercase tracking-widest mb-1">Lead Health</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-3 h-3 rounded-full bg-[#4ADE80] animate-pulse"></span>
                            <p className="text-2xl font-bold text-tInverted">Stable</p>
                        </div>
                    </div>
                </div>

                {/* Data Table Section */}
                <div className="bg-tSecondary border border-colorNeutral/10 rounded-xl overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-colorSecondary/30 flex-wrap gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter local list..."
                                className="bg-colorSecondary border border-colorNeutral/30 rounded-lg px-4 py-1.5 text-xs text-tInverted placeholder-tPrimary/50 focus:outline-none focus:border-colorPrimary"
                            />

                            {/* Backend search bar */}
                            <div className="flex items-center gap-2 border border-colorNeutral/20 bg-colorSecondary/40 rounded-lg px-2.5 py-1 text-xs">
                                <span className="text-[10px] uppercase font-bold text-tPrimary/60">Find Particular:</span>
                                <select
                                    value={searchCriteria}
                                    onChange={(e) => setSearchCriteria(e.target.value as 'email' | 'id')}
                                    className="bg-transparent border-none text-xs font-semibold text-tInverted focus:outline-none cursor-pointer"
                                >
                                    <option value="email" className="bg-colorSecondary">Email</option>
                                    <option value="id" className="bg-colorSecondary">Client ID</option>
                                </select>
                                <div className="relative">
                                    <input
                                        className="bg-colorSecondary border border-colorNeutral/30 rounded-full pl-8 pr-3 py-0.5 text-xs text-tInverted placeholder-tPrimary/50 focus:outline-none focus:border-colorPrimary w-44"
                                        placeholder={`Enter ${searchCriteria === 'email' ? 'email' : 'ID'}...`}
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

                            <span className="text-xs text-tPrimary opacity-60">
                                Showing {filteredClients.length} of {clients?.length || 0} clients
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-tSecondary rounded-lg text-tPrimary transition-colors border border-colorNeutral/20">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div 
                        ref={tableScrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className={`overflow-x-auto custom-scrollbar select-none ${
                            isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                    >
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-colorSecondary border-b border-colorNeutral/20">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Author Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider text-center">Total Deals</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-colorNeutral/10 text-sm">
                                {isFetchingClients ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-tInverted">
                                            <Loader2 className="w-8 h-8 animate-spin text-colorPrimary mx-auto mb-2" />
                                            Loading clients...
                                        </td>
                                    </tr>
                                ) : filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-tInverted">
                                            No clients found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client: any) => (
                                        <tr 
                                            key={client.id} 
                                            onClick={() => handleRowClick(client.id)}
                                            className="hover:bg-tSecondary/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-colorPrimary/10 border border-colorPrimary/20 flex items-center justify-center text-colorPrimary font-bold text-xs uppercase">
                                                        {client.name?.slice(0, 2) || 'CL'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-tInverted">{client.name}</p>
                                                        <p className="text-[10px] text-colorPrimary font-semibold">Active</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-0.5 bg-colorSecondary border border-colorNeutral/30 rounded text-xs text-colorTertiary">
                                                    {client.role || 'Client'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-tPrimary">{client.email}</td>
                                            <td className="px-6 py-4 text-tPrimary font-semibold">{client.author?.name || 'System / Owner'}</td>
                                            <td className="px-6 py-4 text-center text-tInverted font-bold">{client._count?.deals ?? 0}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {(isOwnerOrAdmin || client.authorId === currentUserId) && (
                                                        <>
                                                            <button 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation()
                                                                    await getParticularClient('id', client.id)
                                                                    setClientModalOpen(true)
                                                                }}
                                                                className="p-1.5 hover:text-[#E48520] rounded hover:bg-tSecondary/50 transition-colors cursor-pointer bg-transparent border-none"
                                                                title="Update Client"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (window.confirm("Are you sure you want to delete this client?")) {
                                                                        deleteClient(client.id)
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:text-red-400 rounded hover:bg-tSecondary/50 transition-colors cursor-pointer bg-transparent border-none"
                                                                title="Delete Client"
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
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary">
                            <h3 className="font-bold text-tInverted text-lg">Add New Client</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-tPrimary hover:text-red-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Marcus Bennett"
                                    disabled={isCreatingClient}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. m.bennett@quantum.com"
                                    disabled={isCreatingClient}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Role / Designation</label>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. Chief Strategist"
                                    disabled={isCreatingClient}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary disabled:opacity-50"
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-colorNeutral/20">
                                <button
                                    type="button"
                                    disabled={isCreatingClient}
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 border border-colorNeutral/30 text-tInverted text-sm font-semibold rounded-lg hover:bg-tSecondary disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingClient}
                                    className="flex-1 py-2 bg-colorPrimary text-white text-sm font-bold rounded-lg hover:bg-hoverPrimary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isCreatingClient ? 'Saving...' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useClientStore } from '../../store/clientStore'
import { UserPlus, Download, Edit, X, Loader2 } from 'lucide-react'

export const Clients: React.FC = () => {
    const { clients, getClients, createClient, isFetchingClients, isCreatingClient } = (useClientStore as any)()
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')

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
                    <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-colorSecondary/30">
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter by name, email or ID..."
                                className="bg-colorSecondary border border-colorNeutral/30 rounded-lg px-4 py-1.5 text-xs text-tInverted placeholder-tPrimary/50 focus:outline-none focus:border-colorPrimary"
                            />
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-colorSecondary border-b border-colorNeutral/20">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Client ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-tPrimary/60 uppercase tracking-wider">Owner ID</th>
                                    <th className="px-6 py-4"></th>
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
                                        <tr key={client.id} className="hover:bg-tSecondary/30 transition-colors group">
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
                                            <td className="px-6 py-4 text-tPrimary">{client.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-0.5 bg-colorSecondary border border-colorNeutral/30 rounded text-xs text-colorTertiary">
                                                    {client.role || 'Client'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-tPrimary">{client.id?.slice(0, 8)}...</td>
                                            <td className="px-6 py-4 font-mono text-xs text-tPrimary">{client.ownerId?.slice(0, 8)}...</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:text-colorPrimary">
                                                    <Edit className="w-4 h-4" />
                                                </button>
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
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
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
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Role / Designation</label>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. Chief Strategist"
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                />
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

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useMemberStore } from '../../store/memberStore'
import { userStore } from '../../store/userStore'
import { useDealStore } from '../../store/dealStore'
import { useClientStore } from '../../store/clientStore'
import { useReminderStore } from '../../store/reminderStore'
import { KeyRound, ShieldAlert, Trash2, ShieldCheck, Loader2, X, Handshake, Users, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export const Organisation: React.FC = () => {
    const { 
        members, 
        inviteToken, 
        getOrganisationMembers, 
        generateInviteToken, 
        removeMember,
        isFetchingMembers,
        isGeneratingToken
    } = (useMemberStore as any)()
    const { userData } = (userStore as any)()
    const currentUser = userData?.data?.user

    const { deals, getDeals, getParticularDeal, setDealModalOpen } = (useDealStore as any)()
    const { clients, getClients, getParticularClient, setClientModalOpen } = (useClientStore as any)()
    const { reminders, getUserReminders } = (useReminderStore as any)()

    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [activeSubTab, setActiveSubTab] = useState<'none' | 'deals' | 'clients'>('none')

    useEffect(() => {
        if (!members || members.length === 0) {
            getOrganisationMembers()
        }
        if (!deals || deals.length === 0) {
            getDeals()
        }
        if (!clients || clients.length === 0) {
            getClients()
        }
        if (!reminders || reminders.length === 0) {
            getUserReminders()
        }
    }, [])

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val)
    }

    return (
        <DashboardLayout activeTab="employees">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-tInverted">Team Directory</h2>
                        <p className="text-sm text-tPrimary mt-1">Manage your organization's members, invite tokens, and access controls.</p>
                    </div>
                    {/* Invite Token Generation */}
                    <div className="flex items-center gap-4 bg-tSecondary border border-colorNeutral/10 rounded-xl px-6 py-3">
                        {inviteToken ? (
                            <div className="flex items-center gap-3">
                                <span className="text-colorTertiary font-mono font-bold text-sm tracking-wider select-all">{inviteToken}</span>
                                <span className="text-[10px] text-tPrimary bg-[#5a403c] px-2 py-1 rounded">Copy Token</span>
                            </div>
                        ) : (
                            <button
                                onClick={generateInviteToken}
                                disabled={isGeneratingToken}
                                className="flex items-center gap-2 bg-colorPrimary hover:bg-hoverPrimary text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 transition-all"
                            >
                                <KeyRound className="w-4 h-4" />
                                {isGeneratingToken ? 'Generating...' : 'Get Invite Token'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Team Directory Table */}
                <div className="bg-tSecondary border border-colorNeutral/10 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-colorSecondary border-b border-colorNeutral/20">
                                <tr className="text-tPrimary/60 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    {currentUser?.role === 'Owner' && <th className="px-6 py-4 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-colorNeutral/10">
                                {isFetchingMembers ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-tInverted">
                                            <Loader2 className="w-8 h-8 animate-spin text-colorPrimary mx-auto mb-2" />
                                            Loading team members...
                                        </td>
                                    </tr>
                                ) : members?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-tInverted">
                                            No team members registered.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member: any) => {
                                        const isSelf = member.id === currentUser?.id
                                        return (
                                            <tr 
                                                key={member.id} 
                                                onClick={() => {
                                                    setSelectedMember(member)
                                                    setActiveSubTab('none')
                                                }}
                                                className="hover:bg-tSecondary/30 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-4 font-bold text-tInverted">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-colorTertiary/10 text-colorTertiary border border-colorTertiary/30 flex items-center justify-center font-bold text-xs uppercase">
                                                            {member.name?.slice(0, 2) || 'US'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-tInverted">{member.name} {isSelf && '(You)'}</p>
                                                            <p className="text-[10px] text-tPrimary/60">ID: {member.id?.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-tPrimary">{member.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        member.role === 'Owner' 
                                                            ? 'bg-colorPrimary/20 text-colorPrimary border border-colorPrimary/30' 
                                                            : 'bg-colorTertiary/10 text-colorTertiary border border-colorTertiary/20'
                                                    }`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tPrimary/10 border border-tPrimary/20 text-xs text-tPrimary font-semibold">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-colorPrimary animate-pulse"></span>
                                                        Online
                                                    </span>
                                                </td>
                                                {currentUser?.role === 'Owner' && (
                                                    <td className="px-6 py-4 text-center">
                                                        {!isSelf && (
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (window.confirm(`Are you sure you want to remove ${member.name} from the organization?`)) {
                                                                            removeMember(member.id)
                                                                        }
                                                                    }}
                                                                    className="p-1.5 hover:bg-red-500/10 text-[#ffb4ab] hover:text-red-400 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                                                                    title="Remove Member"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Team Distribution & Insights */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-8 bg-tSecondary border border-colorNeutral/10 rounded-xl p-6">
                        <h3 className="font-bold text-tInverted text-base mb-4">Team Performance Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-40">
                            <div className="bg-colorSecondary/40 rounded-lg p-4 flex flex-col justify-between border border-colorNeutral/20">
                                <span className="text-tPrimary text-xs font-semibold uppercase tracking-wider">Active Members</span>
                                <div className="text-3xl text-colorPrimary font-black">{members?.length || 1}</div>
                                <div className="text-[10px] text-colorPrimary/70 font-semibold">+12% vs last week</div>
                            </div>
                            <div className="bg-colorSecondary/40 rounded-lg p-4 flex flex-col justify-between border border-colorNeutral/20">
                                <span className="text-tPrimary text-xs font-semibold uppercase tracking-wider">Avg. Deals/Representative</span>
                                <div className="text-3xl text-colorTertiary font-black">14.2</div>
                                <div className="text-[10px] text-colorTertiary/70 font-semibold">Target: 15.0</div>
                            </div>
                            <div className="bg-colorSecondary/40 rounded-lg p-4 flex flex-col justify-between border border-colorNeutral/20">
                                <span className="text-tPrimary text-xs font-semibold uppercase tracking-wider">Meetings Handled</span>
                                <div className="text-3xl text-tInverted font-black">128</div>
                                <div className="text-[10px] text-tPrimary/60">Across all active projects</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 xl:col-span-4 bg-tSecondary border border-colorNeutral/10 rounded-xl p-6 border-l-4 border-colorPrimary">
                        <h3 className="font-bold text-tInverted text-base mb-4">Admin Controls</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between p-3 bg-colorSecondary/40 hover:bg-tSecondary rounded-lg border border-colorNeutral/20 text-xs font-bold text-tInverted transition-all">
                                <span>Audit Logs</span>
                                <ShieldAlert className="w-4 h-4 text-colorPrimary" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 bg-colorSecondary/40 hover:bg-tSecondary rounded-lg border border-colorNeutral/20 text-xs font-bold text-tInverted transition-all">
                                <span>Access Policies</span>
                                <ShieldCheck className="w-4 h-4 text-colorPrimary" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Details Modal */}
            <AnimatePresence>
                {selectedMember && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-colorSecondary border border-colorNeutral/40 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs text-tPrimary"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-colorNeutral/20 flex justify-between items-center bg-tSecondary flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-colorTertiary/10 text-colorTertiary border border-colorTertiary/30 flex items-center justify-center font-bold text-sm uppercase">
                                        {selectedMember.name?.slice(0, 2) || 'US'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-tInverted text-sm">{selectedMember.name}</h3>
                                        <p className="text-[10px] text-tPrimary/60 font-mono mt-0.5">{selectedMember.email} • {selectedMember.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="p-1 hover:bg-colorSecondary/50 text-tPrimary hover:text-red-400 rounded-lg cursor-pointer bg-transparent border-none"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                                {/* Stats Cards Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Deals Metric */}
                                    <div
                                        onClick={() => setActiveSubTab(activeSubTab === 'deals' ? 'none' : 'deals')}
                                        className={`bg-tSecondary/50 p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                            activeSubTab === 'deals' ? 'border-colorPrimary bg-tSecondary/80' : 'border-colorNeutral/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] uppercase font-bold text-tPrimary/60">Deals Assigned</span>
                                            <Handshake className={`w-4 h-4 ${activeSubTab === 'deals' ? 'text-colorPrimary' : 'text-tPrimary/60'}`} />
                                        </div>
                                        <p className="text-2xl font-black text-tInverted">
                                            {deals?.filter((d: any) => d.authorId === selectedMember.id).length || 0}
                                        </p>
                                        <p className="text-[9px] text-colorPrimary hover:underline mt-1 font-semibold">Click to view cards</p>
                                    </div>

                                    {/* Clients Metric */}
                                    <div
                                        onClick={() => setActiveSubTab(activeSubTab === 'clients' ? 'none' : 'clients')}
                                        className={`bg-tSecondary/50 p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                            activeSubTab === 'clients' ? 'border-colorPrimary bg-tSecondary/80' : 'border-colorNeutral/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] uppercase font-bold text-tPrimary/60">Clients Handled</span>
                                            <Users className={`w-4 h-4 ${activeSubTab === 'clients' ? 'text-colorPrimary' : 'text-tPrimary/60'}`} />
                                        </div>
                                        <p className="text-2xl font-black text-tInverted">
                                            {clients?.filter((c: any) => c.authorId === selectedMember.id).length || 0}
                                        </p>
                                        <p className="text-[9px] text-colorPrimary hover:underline mt-1 font-semibold">Click to view list</p>
                                    </div>

                                    {/* Reminders Metric */}
                                    <div className="bg-tSecondary/50 p-4 rounded-xl border border-colorNeutral/10 select-none">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] uppercase font-bold text-tPrimary/60">Tasks Scheduled</span>
                                            <Bell className="w-4 h-4 text-tPrimary/60" />
                                        </div>
                                        <p className="text-2xl font-black text-tInverted">
                                            {reminders?.filter((r: any) => r.userId === selectedMember.id).length || 0}
                                        </p>
                                        <p className="text-[9px] text-tPrimary/65 mt-1">Assigned alerts</p>
                                    </div>
                                </div>

                                {/* Dynamic Sub-Tab View */}
                                <div className="border-t border-colorNeutral/15 pt-6">
                                    {activeSubTab === 'deals' ? (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-tInverted text-sm flex items-center gap-2">
                                                <Handshake className="w-4 h-4 text-colorPrimary" /> Deals Portfolio
                                            </h4>
                                            {(() => {
                                                const filteredDeals = deals?.filter((d: any) => d.authorId === selectedMember.id) || [];
                                                if (filteredDeals.length === 0) {
                                                    return (
                                                        <p className="text-center py-8 text-tPrimary/60 border border-dashed border-colorNeutral/20 rounded-xl">
                                                            No deals currently assigned to this representative.
                                                        </p>
                                                    );
                                                }
                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {filteredDeals.map((deal: any, index: number) => (
                                                            <div 
                                                                key={deal.id || index} 
                                                                onClick={async () => {
                                                                    await getParticularDeal('id', deal.id)
                                                                    setDealModalOpen(true)
                                                                }}
                                                                className="p-4 bg-tSecondary/40 hover:bg-tSecondary/70 border border-colorNeutral/15 rounded-xl space-y-2 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all"
                                                                title="Click to view deal insight analysis"
                                                            >
                                                                <div>
                                                                    <div className="flex justify-between items-start">
                                                                        <h5 className="font-bold text-tInverted truncate max-w-[180px]">{deal.dealName}</h5>
                                                                        <span className="px-2 py-0.5 bg-colorPrimary/25 text-colorPrimary rounded font-bold text-[9px] uppercase">
                                                                            {deal.stateOfDeal?.replace('_', ' ') || 'Consulting'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-tPrimary/70 mt-1">Client: <span className="text-tInverted font-semibold">{deal.client?.name || 'N/A'}</span></p>
                                                                </div>
                                                                <div className="flex justify-between items-end border-t border-colorNeutral/10 pt-2 text-[10px]">
                                                                    <span className="text-tPrimary/55">Amount</span>
                                                                    <span className="text-[#4ADE80] font-bold text-xs">{formatCurrency(deal.amount || 0)}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : activeSubTab === 'clients' ? (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-tInverted text-sm flex items-center gap-2">
                                                <Users className="w-4 h-4 text-colorPrimary" /> Assigned Clients List
                                            </h4>
                                            {(() => {
                                                const filteredClients = clients?.filter((c: any) => c.authorId === selectedMember.id) || [];
                                                if (filteredClients.length === 0) {
                                                    return (
                                                        <p className="text-center py-8 text-tPrimary/60 border border-dashed border-colorNeutral/20 rounded-xl">
                                                            No clients currently handled by this representative.
                                                        </p>
                                                    );
                                                }
                                                return (
                                                    <div className="overflow-x-auto border border-colorNeutral/20 rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead className="bg-colorSecondary border-b border-colorNeutral/25 text-[10px] font-bold uppercase tracking-wider text-tPrimary/60">
                                                                <tr>
                                                                    <th className="px-4 py-3">Client Name</th>
                                                                    <th className="px-4 py-3">Designation / Role</th>
                                                                    <th className="px-4 py-3">Email Address</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-xs divide-y divide-colorNeutral/10">
                                                                {filteredClients.map((client: any, index: number) => (
                                                                    <tr 
                                                                        key={client.id || index} 
                                                                        onClick={async () => {
                                                                            await getParticularClient('id', client.id)
                                                                            setClientModalOpen(true)
                                                                        }}
                                                                        className="hover:bg-tSecondary/50 cursor-pointer transition-colors"
                                                                        title="Click to view client profile details"
                                                                    >
                                                                        <td className="px-4 py-2.5 font-bold text-tInverted">{client.name}</td>
                                                                        <td className="px-4 py-2.5 text-tPrimary">{client.role || 'N/A'}</td>
                                                                        <td className="px-4 py-2.5 text-tPrimary/80 font-mono text-[10px]">{client.email}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-tPrimary/60 space-y-1">
                                            <p className="font-semibold text-tInverted/80">Interactive Directory Details</p>
                                            <p className="text-[10px] max-w-sm">Tap on the "Deals Assigned" or "Clients Handled" cards above to view their respective lists in card and table grid formats.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    )
}

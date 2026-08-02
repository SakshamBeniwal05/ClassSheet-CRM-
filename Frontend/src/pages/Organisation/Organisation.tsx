import React, { useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useMemberStore } from '../../store/memberStore'
import { userStore } from '../../store/userStore'
import { KeyRound, ShieldAlert, Trash2, ShieldCheck, Loader2 } from 'lucide-react'

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

    useEffect(() => {
        if (!members || members.length === 0) {
            getOrganisationMembers()
        }
    }, [])

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
                                            <tr key={member.id} className="hover:bg-tSecondary/30 transition-colors group">
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
                                                                    onClick={() => removeMember(member.id)}
                                                                    className="p-1.5 hover:bg-red-500/10 text-[#ffb4ab] hover:text-red-400 rounded-lg transition-colors"
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
        </DashboardLayout>
    )
}

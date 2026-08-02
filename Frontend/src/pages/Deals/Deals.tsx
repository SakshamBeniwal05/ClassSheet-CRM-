import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useDealStore } from '../../store/dealStore'
import { useClientStore } from '../../store/clientStore'
import { Handshake, X, PlusCircle, Loader2 } from 'lucide-react'

export const Deals: React.FC = () => {
    const { deals, getDeals, createDeal, isFetchingDeals, isCreatingDeal } = (useDealStore as any)()
    const { clients, getClients } = (useClientStore as any)()
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form states
    const [clientId, setClientId] = useState('')
    const [dealName, setDealName] = useState('')
    const [amount, setAmount] = useState('0')
    const [estimatedCost, setEstimatedCost] = useState('0')
    const [stateOfDeal, setStateOfDeal] = useState('Consulting')
    const [scheduled, setScheduled] = useState('')

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
        await createDeal({
            clientId,
            dealName,
            amount: Number(amount),
            estimatedCost: Number(estimatedCost),
            stateOfDeal,
            scheduled: scheduled ? new Date(scheduled).toISOString() : undefined
        })
        setIsModalOpen(false)
        setClientId('')
        setDealName('')
        setAmount('0')
        setEstimatedCost('0')
        setStateOfDeal('Consulting')
        setScheduled('')
    }

    const formatState = (state: string) => {
        switch (state) {
            case 'Consulting': return 'Consulting'
            case 'Negotiation': return 'Negotiation'
            case 'Under_Process': return 'Under Process'
            case 'Completed_Loss': return 'Completed Loss'
            case 'Completed_Win': return 'Completed Win'
            default: return state
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
    }

    const pipelineValue = deals?.reduce((acc: number, d: any) => acc + (d.amount || 0), 0) || 0

    return (
        <DashboardLayout activeTab="deals">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
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
                <div className="grid grid-cols-12 gap-6">
                    {/* Deals List */}
                    <div className="col-span-12 xl:col-span-8 bg-tSecondary border border-colorNeutral/10 rounded-xl p-6 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h3 className="text-lg font-bold text-tInverted">Deal Pipeline</h3>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-colorPrimary hover:bg-hoverPrimary text-white text-xs font-bold px-4 py-2 rounded-lg hover:brightness-105 transition-all"
                            >
                                <PlusCircle className="w-4 h-4" />
                                New Deal
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-colorNeutral/20 text-tPrimary/60 text-xs">
                                        <th className="py-3 px-2 font-semibold">Deal Name</th>
                                        <th className="py-3 px-2 font-semibold">Client ID</th>
                                        <th className="py-3 px-2 font-semibold">Scheduled Date</th>
                                        <th className="py-3 px-2 font-semibold">Stage</th>
                                        <th className="py-3 px-2 font-semibold text-right">Amount</th>
                                        <th className="py-3 px-2 font-semibold text-right">Est. Cost</th>
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
                                    ) : deals?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-tInverted">
                                                No active deals in pipeline. Click "New Deal" to start!
                                            </td>
                                        </tr>
                                    ) : (
                                        deals.map((deal: any) => (
                                            <tr key={deal.id} className="hover:bg-tSecondary/30 border-b border-colorNeutral/10 transition-colors">
                                                <td className="py-4 px-2 font-bold text-tInverted">{deal.dealName}</td>
                                                <td className="py-4 px-2 text-colorTertiary font-mono text-xs">{deal.clientId?.slice(0, 8)}...</td>
                                                <td className="py-4 px-2 text-tPrimary/80">
                                                    {deal.scheduled ? new Date(deal.scheduled).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-4 px-2">
                                                    <span className="bg-colorPrimary/20 text-colorPrimary px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        {formatState(deal.stateOfDeal)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-right font-bold text-[#4ADE80]">
                                                    {formatCurrency(deal.amount)}
                                                </td>
                                                <td className="py-4 px-2 text-right text-tPrimary/60">
                                                    {deal.estimatedCost ? formatCurrency(deal.estimatedCost) : '₹0'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stats & Insights */}
                    <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
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
                                <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Select Client</label>
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
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
                                    className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
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
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
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
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-tPrimary uppercase tracking-wider mb-1">Stage of Deal</label>
                                    <select
                                        value={stateOfDeal}
                                        onChange={(e) => setStateOfDeal(e.target.value)}
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
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
                                        className="w-full bg-tSecondary border border-colorNeutral/40 rounded-lg px-4 py-2 text-sm text-tInverted focus:outline-none focus:border-colorPrimary"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-colorNeutral/20">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 border border-colorNeutral/30 text-tInverted text-sm font-semibold rounded-lg hover:bg-tSecondary"
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
        </DashboardLayout>
    )
}

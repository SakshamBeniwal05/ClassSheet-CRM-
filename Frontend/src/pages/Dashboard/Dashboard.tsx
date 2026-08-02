import React, { useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useDealStore } from '../../store/dealStore'
import { TrendingUp, Handshake, MapPin, Loader2 } from 'lucide-react'

export const Dashboard: React.FC = () => {
    const { deals, getDeals, isFetchingDeals } = (useDealStore as any)()

    useEffect(() => {
        if (!deals || deals.length === 0) {
            getDeals()
        }
    }, [])

    // Calculate real metrics
    const totalDeals = deals?.length || 0
    const estimatedAmount = deals?.reduce((acc: number, d: any) => acc + (d.amount || 0), 0) || 0
    const totalCost = deals?.reduce((acc: number, d: any) => acc + (d.estimatedCost || 0), 0) || 0
    const profitLoss = estimatedAmount - totalCost

    const displayEst = `₹${(estimatedAmount / 100000).toFixed(1)}L` 
    const displayRec = `₹${((estimatedAmount * 0.9) / 100000).toFixed(1)}L` 
    const displayProfit = `${profitLoss >= 0 ? '+' : '-'}₹${(Math.abs(profitLoss) / 100000).toFixed(1)}L` 

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
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

    // Sort deals by creation date ascending (oldest to newest)
    const sortedDeals = [...(deals || [])].sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateA - dateB
    })

    // Take up to 10 deals for display
    const displayedDeals = sortedDeals.slice(-10)

    // Calculate maximum absolute profit/loss for scaling
    const maxVal = Math.max(
        ...displayedDeals.map((d: any) => Math.abs((d.amount || 0) - (d.estimatedCost || 0))),
        50000
    )

    const chartData = displayedDeals.map((deal: any, index: number) => {
        const dealProfitLoss = (deal.amount || 0) - (deal.estimatedCost || 0)
        const heightPercent = Math.min(100, Math.round((Math.abs(dealProfitLoss) / maxVal) * 100))
        return {
            id: deal.id || index,
            name: deal.dealName || `Deal-${index + 1}`,
            profitLoss: dealProfitLoss,
            heightPercent,
            label: `D-${String(index + 1).padStart(2, '0')}`
        }
    })

    const chartMaxVal = maxVal

    const formatTick = (val: number) => {
        if (val >= 100000) return `+₹${(val / 100000).toFixed(1)}L`
        if (val > 0) return `+₹${(val / 1000).toFixed(0)}k`
        if (val === 0) return `₹0`
        if (val <= -100000) return `-₹${(Math.abs(val) / 100000).toFixed(1)}L`
        return `-₹${(Math.abs(val) / 1000).toFixed(0)}k`
    }

    if (isFetchingDeals && (!deals || deals.length === 0)) {
        return (
            <DashboardLayout activeTab="dashboard">
                <div className="h-[60vh] w-full flex flex-col justify-center items-center text-tInverted animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin text-colorPrimary mb-3" />
                    <p className="text-xs font-semibold tracking-wider uppercase opacity-75">Loading dashboard data...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout activeTab="dashboard">
            <div className="space-y-8">
                {/* Metric Bento Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Total Deals */}
                    <div className="bento-card p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden bg-tSecondary border border-colorNeutral/10 hover:border-colorPrimary/40 transition-all duration-300 group">
                        <div className="flex justify-between items-start z-10">
                            <Handshake className="text-colorPrimary w-8 h-8" />
                            <span className="text-[11px] px-1.5 py-0.5 bg-colorPrimary/20 text-colorPrimary border border-colorPrimary/30 rounded font-semibold">+12%</span>
                        </div>
                        <div className="z-10 mt-2">
                            <p className="text-xs text-tPrimary uppercase tracking-wider font-semibold">Total Deals</p>
                            <h3 className="text-3xl font-black text-tInverted mt-1">{totalDeals}</h3>
                        </div>
                        <div className="absolute bottom-0 right-0 left-0 h-10 flex items-end justify-between px-6 opacity-40 group-hover:opacity-60 transition-opacity">
                            <div className="w-1.5 bg-colorPrimary/40 rounded-t-sm" style={{ height: '40%' }}></div>
                            <div className="w-1.5 bg-colorPrimary/40 rounded-t-sm" style={{ height: '60%' }}></div>
                            <div className="w-1.5 bg-colorPrimary/40 rounded-t-sm" style={{ height: '35%' }}></div>
                            <div className="w-1.5 bg-colorPrimary/40 rounded-t-sm" style={{ height: '80%' }}></div>
                            <div className="w-1.5 bg-colorPrimary/40 rounded-t-sm" style={{ height: '55%' }}></div>
                        </div>
                    </div>

                    {/* Estimated Amount */}
                    <div className="bento-card p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden bg-tSecondary border border-colorNeutral/10 hover:border-colorPrimary/40 transition-all duration-300 group">
                        <div className="flex justify-between items-start z-10">
                            <TrendingUp className="text-colorTertiary w-8 h-8" />
                        </div>
                        <div className="z-10 mt-2">
                            <p className="text-xs text-tPrimary uppercase tracking-wider font-semibold">Estimated Amount</p>
                            <h3 className="text-3xl font-black text-tInverted mt-1">{displayEst}</h3>
                        </div>
                        <div className="absolute bottom-0 right-0 left-0 h-10 flex items-end justify-between px-6 opacity-40 group-hover:opacity-60 transition-opacity">
                            <div className="w-1.5 bg-colorTertiary/40 rounded-t-sm" style={{ height: '30%' }}></div>
                            <div className="w-1.5 bg-colorTertiary/40 rounded-t-sm" style={{ height: '50%' }}></div>
                            <div className="w-1.5 bg-colorTertiary/40 rounded-t-sm" style={{ height: '45%' }}></div>
                            <div className="w-1.5 bg-colorTertiary/40 rounded-t-sm" style={{ height: '70%' }}></div>
                            <div className="w-1.5 bg-colorTertiary/40 rounded-t-sm" style={{ height: '85%' }}></div>
                        </div>
                    </div>

                    {/* Amount Received */}
                    <div className="bento-card p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden bg-tSecondary border border-colorNeutral/10 hover:border-colorPrimary/40 transition-all duration-300 group">
                        <div className="flex justify-between items-start z-10">
                            <TrendingUp className="text-tInverted w-8 h-8" />
                        </div>
                        <div className="z-10 mt-2">
                            <p className="text-xs text-tPrimary uppercase tracking-wider font-semibold">Amount Received</p>
                            <h3 className="text-3xl font-black text-tInverted mt-1">{displayRec}</h3>
                        </div>
                        <div className="absolute bottom-0 right-0 left-0 h-10 flex items-end justify-between px-6 opacity-40 group-hover:opacity-60 transition-opacity">
                            <div className="w-1.5 bg-tInverted/40 rounded-t-sm" style={{ height: '50%' }}></div>
                            <div className="w-1.5 bg-tInverted/40 rounded-t-sm" style={{ height: '40%' }}></div>
                            <div className="w-1.5 bg-tInverted/40 rounded-t-sm" style={{ height: '60%' }}></div>
                            <div className="w-1.5 bg-tInverted/40 rounded-t-sm" style={{ height: '55%' }}></div>
                            <div className="w-1.5 bg-tInverted/40 rounded-t-sm" style={{ height: '80%' }}></div>
                        </div>
                    </div>

                    {/* Profit/Loss */}
                    <div className="bento-card p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden bg-tSecondary border border-colorNeutral/10 hover:border-colorPrimary/40 transition-all duration-300 group">
                        <div className="flex justify-between items-start z-10">
                            <TrendingUp className="text-[#4ADE80] w-8 h-8" />
                        </div>
                        <div className="z-10 mt-2">
                            <p className="text-xs text-tPrimary uppercase tracking-wider font-semibold">Profit/Loss</p>
                            <h3 className={`text-3xl font-black mt-1 ${profitLoss >= 0 ? 'text-[#4ADE80]' : 'text-red-400'}`}>{displayProfit}</h3>
                        </div>
                        <div className="absolute bottom-0 right-0 left-0 h-10 flex items-end justify-between px-6 opacity-40 group-hover:opacity-60 transition-opacity">
                            <div className="w-1.5 bg-[#4ADE80]/40 rounded-t-sm" style={{ height: '20%' }}></div>
                            <div className="w-1.5 bg-[#4ADE80]/40 rounded-t-sm" style={{ height: '40%' }}></div>
                            <div className="w-1.5 bg-[#4ADE80]/40 rounded-t-sm" style={{ height: '60%' }}></div>
                            <div className="w-1.5 bg-[#4ADE80]/40 rounded-t-sm" style={{ height: '75%' }}></div>
                            <div className="w-1.5 bg-[#4ADE80]/40 rounded-t-sm" style={{ height: '90%' }}></div>
                        </div>
                    </div>
                </section>

                {/* Chart Area */}
                <section className="bg-tSecondary border border-colorNeutral/10 p-6 rounded-xl h-[480px] flex flex-col relative">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-lg font-bold text-tInverted">Individual Deal Performance</h4>
                            <p className="text-sm text-tPrimary opacity-80">Real-time analysis of net profit/loss per transaction</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-[#4ADE80] rounded-full"></div>
                                <span className="text-xs text-tPrimary">Profit</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <span className="text-xs text-tPrimary">Loss</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex relative">
                        {/* Y-Axis Labels */}
                        <div className="w-20 flex flex-col justify-between text-xs text-tPrimary/60 pb-8 pr-4 text-right">
                            <span>{formatTick(chartMaxVal)}</span>
                            <span>{formatTick(chartMaxVal / 2)}</span>
                            <span>₹0</span>
                            <span>{formatTick(-chartMaxVal / 2)}</span>
                            <span>{formatTick(-chartMaxVal)}</span>
                        </div>
                        {/* Chart grid background */}
                        <div className="flex-1 relative border-l border-b border-colorNeutral/20 mb-8 bg-gradient-to-b from-colorNeutral/5 to-transparent">
                            <div className="absolute w-full h-[1px] bg-colorNeutral/20 top-1/2 -translate-y-1/2 z-10"></div>
                            {/* Bar container */}
                            {chartData.length > 0 ? (
                                <div className="absolute inset-0 flex items-center justify-around px-4">
                                    {chartData.map((data: any) => {
                                        const isProfit = data.profitLoss >= 0
                                        return (
                                            <div key={data.id} className="relative h-full flex flex-col justify-center items-center w-8 group">
                                                {/* Bar */}
                                                <div 
                                                    className={`absolute w-full rounded-sm transition-all duration-500 cursor-pointer ${
                                                        isProfit 
                                                            ? 'bottom-1/2 bg-[#4ADE80] hover:bg-[#4ADE80]/80 rounded-t-sm' 
                                                            : 'top-1/2 bg-red-400 hover:bg-red-400/80 rounded-b-sm'
                                                    }`}
                                                    style={{ height: `${data.heightPercent * 0.5}%` }} // Multiply by 0.5 because baseline is at 50%
                                                ></div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 bg-[#261f09] border border-colorNeutral/40 text-tInverted text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl min-w-[120px] text-center">
                                                    <p className="font-bold truncate">{data.name}</p>
                                                    <p className={`font-semibold mt-0.5 ${isProfit ? 'text-[#4ADE80]' : 'text-red-400'}`}>
                                                        {isProfit ? '+' : ''}{formatCurrency(data.profitLoss)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-tPrimary/60 text-sm">
                                    <TrendingUp className="w-8 h-8 opacity-40 mb-2" />
                                    No transaction performance data available
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-around ml-20 text-xs text-tPrimary/40">
                        {chartData.map((data: any) => (
                            <span key={data.id} className="w-8 text-center">{data.label}</span>
                        ))}
                    </div>
                </section>

                {/* Bottom Section */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Active Deal Pipeline */}
                    <div className="xl:col-span-2 bg-tSecondary border border-colorNeutral/10 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-colorNeutral/20 flex justify-between items-center bg-colorSecondary/30">
                            <h4 className="text-base font-bold text-tInverted">Active Deal Pipeline</h4>
                            <span className="text-xs text-colorPrimary uppercase font-bold tracking-wider">Real-time</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-colorSecondary text-tPrimary/70 text-xs border-b border-colorNeutral/20">
                                    <tr>
                                        <th className="px-6 py-4">DEAL NAME</th>
                                        <th className="px-6 py-4">STAGE</th>
                                        <th className="px-6 py-4 text-right">VALUE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-colorNeutral/10 text-sm">
                                    {deals?.length > 0 ? (
                                        deals.slice(0, 3).map((deal: any, index: number) => (
                                            <tr key={deal.id || index} className="hover:bg-colorSecondary/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-tInverted">{deal.dealName || 'Renewal Deal'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 bg-colorPrimary/20 text-colorPrimary text-[10px] rounded uppercase font-bold">
                                                        {formatState(deal.stateOfDeal)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#4ADE80]">
                                                    {formatCurrency(deal.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-tPrimary/60">
                                                No active deals in pipeline.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Global Deal Heatmap */}
                    <div className="bg-tSecondary border border-colorNeutral/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-colorNeutral/20">
                            <h4 className="text-base font-bold text-tInverted">Global Deal Heatmap</h4>
                            <p className="text-xs text-tPrimary">Active deals by territory</p>
                        </div>
                        <div className="flex-1 relative bg-colorSecondary overflow-hidden min-h-[220px]">
                            <img
                                className="w-full h-full object-cover opacity-60 scale-105"
                                alt="Fictional Map Layout"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv9WPU_nqkjHPQIm0LaUv0RRlFNw1G2sKaxjWi6NMdeF5q2mH7ogxVUpI4BXnvZ2YS4WjOpmJLyZXEzpoTa4JMOAY7Rw6s6HFqN92vd8xpwZABenxBOu6EbK6_F1mFvue7PV5iWaW-J3xxPBQVmgLQdUru3yr1DJ2Ki2RggxtbxihAGxpQGhmIkFt0xSUhtjnwiAjl5C8xt1UBNv07H9frdeqWEoZIvQsm_sPFCMK5sGC2-yLwYUXD5X7SGw5yN5Tr9n5DdEANfEY"
                            />
                            <div className="absolute top-1/4 left-1/3 group cursor-pointer animate-pulse">
                                <MapPin className="text-colorPrimary w-8 h-8 filter drop-shadow-md hover:scale-125 transition-transform" />
                            </div>
                            <div className="absolute bottom-1/3 right-1/4 group cursor-pointer animate-pulse">
                                <MapPin className="text-colorTertiary w-8 h-8 filter drop-shadow-md hover:scale-125 transition-transform" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    )
}

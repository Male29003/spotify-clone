import React, { useMemo, useState } from "react";
import { useArtistDashboardStats } from "../../hooks/analytics/useAnalytics";
import Loader from "../../components/shared/ui/Loader";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
    PieChart, Pie, Cell, Legend
 } from 'recharts';
import { PlayCircleFilled, Group, MusicNote, Download, TrendingUp } from '@mui/icons-material';
import { formatNumber } from "../../utils/formatters";
import StatCard from "../../components/main_ui/StatCard";
import { ArtistDashboardSkeleton } from "../../components/shared/skeleton/ArtistDashboardSkeleton";

const ArtistDashboard: React.FC = () => {
    // quản lý state tgian
    const [timeRange, setTimeRange] = useState("30days");
    const dateParams = useMemo(() => {
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeRange === "7days") startDate.setDate(endDate.getDate() - 7);
        else if (timeRange === "30days") startDate.setDate(endDate.getDate() - 30);
        else if (timeRange === "1year") startDate.setFullYear(endDate.getFullYear() - 1);
        else if (timeRange === "all") startDate.setFullYear(2025);

        return {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        };
    }, [timeRange]);

    const { data, isLoading, isError } = useArtistDashboardStats(dateParams);

    if (isError) {
        return <div className="p-8 text-center text-error font-bold bg-panel rounded-2xl border border-error/20">Connection lost! Cannot load data.</div>;
    }

    // Map đúng key từ cục JSON của ông
    const stats = (data as any)?.overview || {};
    const chartData = (data as any)?.performance_chart || [];
    const topTracks = (data as any)?.top_tracks || [];
    const topCountries = (data as any)?.top_countries || [];
    // Bảng màu cho chart country (tím, xanh, cyan, cam, đỏ, xám cho Unknown)
    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

    return (
        <>
            {isLoading ? 
                <ArtistDashboardSkeleton /> 
            : 
                <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-10 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-text-main mb-2">Studio Overview</h1>
                            <p className="text-text-sub font-medium">Analyze your releases' performance.</p>
                        </div>
                        
                        {/* lọc tgian thống kê */}
                        <select 
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="bg-panel text-text-main px-4 py-2 border border-border rounded-lg outline-none cursor-pointer focus:border-highlight"
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="1year">Last 1 Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    {/* Hàng 1
                        chỉ số tổng quan - 4 cột
                        * lượt nghe tháng
                        * luong57 follower
                        * tổng số release
                        * tổng lượt tải 
                    */}
                    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="sm:min-w-[240px] flex-1 lg:min-w-0">
                                <StatCard 
                                    title="Monthly Listens" 
                                    value={stats.period_listens} 
                                    icon={<PlayCircleFilled fontSize="large" />} 
                                    bgColor="bg-highlight/10" 
                                    iconColor="text-highlight" 
                                />
                            </div>
                            <div className="sm:min-w-[240px] flex-1 lg:min-w-0">
                                <StatCard 
                                    title="Followers" 
                                    value={stats.total_followers} 
                                    icon={<Group fontSize="large" />} 
                                    bgColor="bg-info/10" 
                                    iconColor="text-info" 
                                />
                            </div>
                            <div className="sm:min-w-[240px] flex-1 lg:min-w-0">
                                <StatCard 
                                    title="Total Releases" 
                                    value={stats.total_releases} 
                                    icon={<MusicNote fontSize="large" />} 
                                    bgColor="bg-accent-purple/10" 
                                    iconColor="text-accent-purple" 
                                />
                            </div>
                            <div className="sm:min-w-[240px] flex-1 lg:min-w-0">
                                <StatCard 
                                    title="Downloads" 
                                    value={stats.total_downloads} 
                                    icon={<Download fontSize="large" />} 
                                    bgColor="bg-warning/10" 
                                    iconColor="text-warning" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hàng 2: lượt nghe + quốc gia */}
                    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 ">
                            {/* lượt nghe */}
                            <div className="lg:col-span-2 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:min-w-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                        <TrendingUp className="text-highlight" /> 
                                        Listens Performance (Last 30 days)
                                    </h3>
                                </div>
                                <div className="min-h-[350px] w-full flex-1">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart 
                                                data={chartData} 
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient 
                                                        id="colorListens" 
                                                        x1="0" 
                                                        y1="0" 
                                                        x2="0" 
                                                        y2="1"
                                                    >
                                                        <stop offset="5%" stopColor="var(--theme-highlight)" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="var(--theme-highlight)" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid 
                                                    strokeDasharray="3 3" 
                                                    stroke="#333" 
                                                    vertical={false} 
                                                />
                                                <XAxis 
                                                    dataKey="date" 
                                                    stroke="var(--theme-text-sub)" 
                                                    tick={{fill: 'var(--theme-text-sub)', fontSize: 12}} 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    minTickGap={20} 
                                                />
                                                <YAxis 
                                                    stroke="var(--theme-text-sub)" 
                                                    tick={{fill: 'var(--theme-text-sub)', fontSize: 12}} 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    allowDecimals={false} 
                                                />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'var(--theme-panel)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-main)', borderRadius: '8px', fontWeight: 'bold' }}
                                                    itemStyle={{ color: 'var(--theme-highlight)' }}
                                                />
                                                <Area 
                                                    dataKey="listens" 
                                                    name="Listens" 
                                                    type="monotone" 
                                                    stroke="var(--theme-highlight)" 
                                                    strokeWidth={3} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorListens)" 
                                                    activeDot={{ r: 6, fill: 'var(--theme-highlight)', strokeWidth: 0 }} 
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-sub border-2 border-dashed border-border rounded-xl">
                                            No data.
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Biểu đồ quốc gia */}
                            <div className="lg:col-span-1 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:min-w-[250px]">
                                <h3 className="text-lg font-bold text-text-main mb-2">Audience by Country</h3>
                                
                                <div className="min-h-[250px] md:min-h-[350px] w-full relative">
                                    {topCountries.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={topCountries}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={60} 
                                                    outerRadius={85}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    stroke="none"
                                                >
                                                    {topCountries.map((entry: any, index: number) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={entry.name === 'Unknown' ? COLORS[5] : COLORS[index % (COLORS.length - 1)]} 
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: any) => [formatNumber(value), "Listens"]}
                                                    contentStyle={{ backgroundColor: 'var(--theme-panel)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-main)', borderRadius: '8px', fontWeight: 'bold' }}
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={36}
                                                    iconType="circle"
                                                    formatter={(value) => <span className="text-text-main text-sm font-medium">{value}</span>}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-sm text-text-sub italic border-2 border-dashed border-border rounded-xl">
                                            No demographic data.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 3: danh sách top song */}
                    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:min-w-[350px]">
                            {/* top songs */}
                            <div className="lg:col-span-1 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                                <h3 className="text-lg font-bold text-text-main mb-6">Top songs</h3>
                                <div className="overflow-y-auto custom-scrollbar pr-2">   
                                    {topTracks.length > 0 ? (
                                        topTracks.map((track: any, index: number) => {
                                            const imageUrl = track.image

                                            return (
                                                <div key={index} className="flex items-center gap-4 group p-2 hover:bg-hover rounded-lg transition-colors cursor-pointer">
                                                    <div className="text-text-sub font-bold w-4 text-center text-sm">{index + 1}</div>
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={track.title} 
                                                        className="w-12 h-12 rounded object-cover shadow-md"
                                                        onError={(e) => { 
                                                            console.error(e);
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-text-main font-semibold truncate group-hover:text-highlight transition-colors">{track.title}</h4>
                                                        <p className="text-text-sub text-xs mt-0.5">{formatNumber(track.listens)} listens</p>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-sm text-text-sub italic">
                                            No trending songs.
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* <div className="lg:col-span-1 bg-panel p-6 rounded-2xl border border-dashed border-border shadow-sm flex flex-col items-center justify-center text-text-sub opacity-50">
                                <p>Space for future widgets</p>
                                <p className="text-xs">(e.g. Recent Comments, Top Fans)</p>
                            </div> */}
                        </div>
                    </div>
                </div>
            }
        </>
    );
};

export default ArtistDashboard;
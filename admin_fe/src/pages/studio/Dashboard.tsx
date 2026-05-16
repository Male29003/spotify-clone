import React from "react";
import { useArtistDashboardStats } from "../../hooks/analytics/useAnalytics";
import Loader from "../../components/shared/ui/Loader";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { PlayCircleFilled, Group, MusicNote, Download, TrendingUp } from '@mui/icons-material';
import { formatNumber } from "../../utils/formatters";

const StatCard = ({ title, value, icon, bgColor, textColor }: any) => (
    <div className="bg-panel p-6 rounded-2xl border border-border shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform cursor-default">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgColor} ${textColor}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-text-sub uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-text-main">{formatNumber(value)}</h3>
        </div>
    </div>
);

const ArtistDashboard: React.FC = () => {
    const { data, isLoading, isError } = useArtistDashboardStats();

    if (isLoading) return <Loader />;
    
    if (isError) {
        return <div className="p-8 text-center text-error font-bold bg-panel rounded-2xl border border-error/20">Connection lost! Cannot load data.</div>;
    }

    // Map đúng key từ cục JSON của ông
    const stats = (data as any)?.overview || {};
    const chartData = (data as any)?.performance_chart || [];
    const topTracks = (data as any)?.top_tracks || [];

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-10 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-text-main mb-2">Studio Overview</h1>
                <p className="text-text-sub font-medium">Analyze releases's performance in closest 30 days.</p>
            </div>

            {/* chỉ số tổng quan - 4 cột
                * lượt nghe tháng
                * luong57 follower
                * tổng số release
                * tổng lượt tải 
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Monthly Listens" 
                    value={stats.monthly_listens} 
                    icon={<PlayCircleFilled fontSize="large" />} 
                    bgColor="bg-highlight/10" textColor="text-highlight" 
                />
                <StatCard 
                    title="Followers" 
                    value={stats.total_followers} 
                    icon={<Group fontSize="large" />} 
                    bgColor="bg-info/10" textColor="text-info" 
                />
                <StatCard 
                    title="Total Releases" 
                    value={stats.total_releases} 
                    icon={<MusicNote fontSize="large" />} 
                    bgColor="bg-accent-purple/10" textColor="text-accent-purple" 
                />
                <StatCard 
                    title="Downloads" 
                    value={stats.total_downloads} 
                    icon={<Download fontSize="large" />} 
                    bgColor="bg-warning/10" textColor="text-warning" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <TrendingUp className="text-highlight" /> 
                            Listens Performance (Last 30 days)
                        </h3>
                    </div>
                    <div className="h-[350px] w-full flex-1">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
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

                <div className="lg:col-span-1 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-text-main mb-6">Top songs</h3>
                    
                    <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
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

            </div>
        </div>
    );
};

export default ArtistDashboard;
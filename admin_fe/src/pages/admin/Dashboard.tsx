import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAdminDashboardStats } from '../../hooks/analytics/useAnalytics';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useMemo, useState } from 'react';
import { AdminDashboardSkeleton } from '../../components/shared/skeleton/AdminDashboardSkeleton';
import StatCard from '../../components/main_ui/StatCard';
import { AttachMoneyOutlined, GroupAdd, MicExternalOn } from '@mui/icons-material';

const AdminDashboard = () => {
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
  const { data, isLoading } = useAdminDashboardStats(dateParams);

  if (isLoading || !data) {
    return <div className="p-10 text-center text-lg font-semibold text-text-main">Loading data......</div>;
  }
  const totalRevenue = (data as any)?.revenue_chart?.reduce((sum: number, item: any) => sum + item.revenue, 0) || 0;
  const totalNewUsers = (data as any)?.user_growth_chart?.reduce((sum: number, item: any) => sum + item.new_users, 0) || 0;
  const topCountries = (data as any)?.top_countries || [];
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <>
    {isLoading ? 
      <AdminDashboardSkeleton />
    :
      <div className="p-6 bg-base min-h-screen"> 
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border pb-4">
            <div>
                <h1 className="text-3xl font-bold text-text-main mb-2">System Overview (Last 30 days)</h1>
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
        {/* tổng quan (thu nhập - user mới - top ns)*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-5">
          <StatCard 
            title='Total Revenue'
            value={formatCurrency(totalRevenue)}
            icon={<AttachMoneyOutlined fontSize='large'/>}
            bgColor='bg-highlight/10'
            iconColor='text-highlight'
            valueColor='text-highlight'
          />
          <StatCard 
            title='New Users'
            value={totalNewUsers}
            icon={<GroupAdd fontSize='large'/>}
            bgColor='bg-info/10'
            iconColor='text-info'
            valueColor='text-info'
          />
          <StatCard 
            title='Top 1 Artist'
            value={(data as any).top_artists.length > 0 ? ((data as any).top_artists as any)[0].artist__stage_name : "N/A"}
            icon={<MicExternalOn fontSize='large'/>}
            bgColor='bg-accent-purple/10'
            iconColor='text-accent-purple'
            valueColor='text-accent-purple'
          />
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Doanh thu */}
          <div className="min-w-0 bg-panel p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-bold text-text-main mb-4">
              Revenue Chart
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                <AreaChart 
                  data={(data as any).revenue_chart} 
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient 
                      id="colorRevenue" 
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
                    vertical={false} 
                    stroke="var(--theme-border)"
                  />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12}} 
                    stroke="var(--theme-text-sub)"
                  />
                  <YAxis 
                    tickFormatter={(val) => `${val / 1000000}M`} 
                    tick={{fontSize: 12}} 
                    stroke="var(--theme-text-sub)"
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [formatCurrency(value), "Revenue"]} 
                    contentStyle={{ backgroundColor: 'var(--theme-panel)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-main)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--theme-highlight)"
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tăng trưởng User */}
          <div className="min-w-0 bg-panel p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-bold text-text-main mb-4">
              User Growth
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={1}>
                <BarChart 
                  data={(data as any).user_growth_chart} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="var(--theme-border)" 
                  />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12}} 
                    stroke="var(--theme-text-sub)" 
                  />
                  <YAxis 
                    tick={{fontSize: 12}} 
                    stroke="var(--theme-text-sub)" 
                  />
                  <RechartsTooltip 
                    formatter={(value) => [value, "New users"]} 
                    cursor={{fill: 'var(--theme-search)'}}
                    contentStyle={{ backgroundColor: 'var(--theme-panel)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-main)' }}
                  />
                  <Bar 
                    dataKey="new_users" 
                    fill="var(--theme-info)"
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* bieuểu dồ theo quốc gia */}
          <div className="min-w-0 bg-panel p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-bold text-text-main mb-4">
              Global Audience
            </h3>
            <div className="h-72 flex items-center justify-center">
              {topCountries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={topCountries}
                              cx="50%"
                              cy="45%"
                              innerRadius={70}
                              outerRadius={95}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {topCountries.map((entry: any, index: number) => (
                                  <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.name === 'Unknown' ? COLORS[5] : COLORS[index % (COLORS.length - 1)]} 
                                  />
                              ))}
                          </Pie>
                          <RechartsTooltip 
                              formatter={(value: any) => [formatNumber(value), "Total Streams"]}
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
                  <div className="w-full h-full flex items-center justify-center text-sm text-text-sub italic border-2 border-dashed border-border rounded-xl">
                      No global data available.
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* BXH  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Top Artists */}
          <div className="bg-panel p-5 rounded-xl shadow-sm border border-border">
            <h3 className="text-md font-bold text-text-main mb-4">Top 5 Artists</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-search text-text-sub">
                    <th className="px-3 py-2 font-medium">Rank</th>
                    <th className="px-3 py-2 font-medium">Artist</th>
                    <th className="px-3 py-2 font-medium text-right">Streams</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as any).top_artists?.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border hover:bg-hover transition-colors">
                      <td className="px-3 py-3 font-bold text-text-sub">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-3 font-semibold text-text-main truncate max-w-30">
                        {item.artist__stage_name}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-accent-purple">
                        {formatNumber(item.total_listens)}
                      </td>
                    </tr>
                  ))}
                  {(!(data as any).top_artists || (data as any).top_artists.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-text-sub">No statistical data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Songs */}
          <div className="bg-panel p-5 rounded-xl shadow-sm border border-border">
            <h3 className="text-md font-bold text-text-main mb-4">Top 5 Streamed Songs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-search text-text-sub">
                    <th className="px-3 py-2 font-medium">Rank</th>
                    <th className="px-3 py-2 font-medium">Song Title</th>
                    <th className="px-3 py-2 font-medium text-right">Streams</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as any).top_tracks?.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border hover:bg-hover transition-colors">
                      <td className="px-3 py-3 font-bold text-text-sub">#{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-text-main truncate max-w-30">
                          {item.track__title}
                        </div>
                        <div className="text-xs text-text-sub truncate max-w-30">
                          {item.track__artist__stage_name}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-info">
                        {formatNumber(item.total_listens)}
                      </td>
                    </tr>
                  ))}
                  {(!(data as any).top_tracks || (data as any).top_tracks.length === 0) && (
                    <tr><td colSpan={3} className="px-3 py-6 text-center text-text-sub">No statistical data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Releases */}
          <div className="bg-panel p-5 rounded-xl shadow-sm border border-border">
            <h3 className="text-md font-bold text-text-main mb-4">Top 5 Releases</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-search text-text-sub">
                    <th className="px-3 py-2 font-medium">Rank</th>
                    <th className="px-3 py-2 font-medium">Release</th>
                    <th className="px-3 py-2 font-medium text-right">Streams</th>
                  </tr>
                </thead>
                <tbody>
                  {(data as any).top_releases?.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border hover:bg-hover transition-colors">
                      <td className="px-3 py-3 font-bold text-text-sub">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-text-main truncate max-w-30">
                          {item.track__release__title}
                        </div>
                        <div className="text-xs px-1.5 py-0.5 bg-search text-text-sub border border-border inline-block mt-1 rounded uppercase font-medium">
                          {item.track__release__release_type}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-highlight">
                        {formatNumber(item.total_listens)}
                      </td>
                    </tr>
                  ))}
                  {(!(data as any).top_releases || (data as any).top_releases.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-text-sub">No statistical data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    }
    </>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { Project, ProjectStatus, WeatherData } from '../types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Globe, ShieldCheck, Zap, Sun, Briefcase, PieChart as PieChartIcon, Search, Bell, Menu, ArrowUpRight, TrendingUp, CloudRain, Wind, Thermometer, Clock, Map, Target, DollarSign, Hexagon, Database } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  weather: WeatherData;
  currentTime: Date;
  plnRate: number;
  setPlnRate: React.Dispatch<React.SetStateAction<number>>;
}

const COLORS = ['#9333ea', '#f97316', '#10b981', '#ef4444', '#8b5cf6'];

// Mock Data
const GRID_LOAD_DATA = Array.from({length: 24}, (_, i) => ({ 
    time: i, 
    load: 40 + Math.random() * 40,
    solar: i > 6 && i < 18 ? (Math.sin((i-6)/12 * Math.PI) * 50) + Math.random()*5 : 0
}));

// Tactical Map Component (Simulated Radar)
const TacticalMap = ({ projects }: { projects: Project[] }) => {
    return (
        <div className="relative w-full h-64 bg-[#0a0210] rounded-xl overflow-hidden border border-purple-900/30 group">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            {/* Radar Sweep Animation */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(249,115,22,0.1)_60deg,transparent_60deg)] animate-[spin_4s_linear_infinite] rounded-full opacity-50 origin-center scale-150"></div>

            {/* Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,1)] z-10 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-orange-500/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-purple-500/20 rounded-full"></div>

            {/* Simulated Points */}
            {projects.slice(0, 8).map((p, i) => {
                const angle = (i * 137.5) * (Math.PI / 180);
                const radius = 30 + (i * 10) % 40;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                return (
                    <div key={p.id} className="absolute w-3 h-3 group-hover:scale-125 transition-transform duration-300" style={{ top: `${y}%`, left: `${x}%` }}>
                        <div className={`w-2 h-2 rounded-full ${p.status === 'Konstruksi' ? 'bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]' : 'bg-orange-500'}`}></div>
                        <div className="absolute -top-6 -left-8 bg-black/90 text-[9px] text-orange-200 px-1.5 py-0.5 rounded border border-orange-900/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 font-mono">
                            {p.clientName}
                        </div>
                    </div>
                )
            })}
            
            <div className="absolute bottom-2 left-2 text-[10px] text-orange-400 font-mono flex items-center gap-1 bg-black/50 px-2 py-1 rounded border border-orange-900/30">
                <Target size={10} /> LIVE TACTICAL FEED
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, weather, currentTime, plnRate, setPlnRate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const totalValue = projects.reduce((acc, curr) => acc + curr.financials.agreedValue, 0);
  const activeProjects = projects.filter(p => p.status === ProjectStatus.CONSTRUCTION).length;

  return (
    <div className="p-6 h-full overflow-y-auto pb-20 bg-[#05010a] text-slate-200 font-sans">
      
      {/* TOP BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
          <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">COMMAND DECK</span>
              </h1>
              <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-purple-400 font-mono">GENESIS V11.0 // ONLINE</p>
                  <div className="h-4 w-[1px] bg-purple-900"></div>
                  <div className="flex items-center gap-2 text-orange-400 font-mono text-xs">
                      <Clock size={12} /> {currentTime.toLocaleTimeString()}
                  </div>
              </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
              {/* PLN Rate Tracker */}
              <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border-orange-500/20 bg-orange-900/10">
                  <div className="text-orange-500 p-1.5 rounded-lg bg-orange-500/10"><Zap size={16} /></div>
                  <div>
                      <div className="text-[9px] text-orange-300/70 uppercase tracking-wider font-bold">PLN Rate (IDR/kWh)</div>
                      <input 
                        type="number" 
                        value={plnRate} 
                        onChange={(e) => setPlnRate(Number(e.target.value))}
                        className="bg-transparent text-white font-bold w-24 outline-none border-b border-dashed border-orange-700 focus:border-orange-500 text-sm font-mono"
                      />
                  </div>
              </div>

              {/* Weather Card */}
              <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-4 border-purple-500/20">
                  <div className="text-purple-400">
                      {weather.condition === 'Sunny' ? <Sun size={24} className="animate-pulse" /> : <CloudRain size={24} />}
                  </div>
                  <div>
                      <div className="text-lg font-bold text-white leading-none font-mono">{weather.temp.toFixed(1)}°C</div>
                      <div className="text-[10px] text-purple-300/70 uppercase tracking-wider">{weather.condition}</div>
                  </div>
                  <div className="space-y-1 border-l border-purple-900/50 pl-3">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Wind size={10} /> {weather.windSpeed} km/h
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Thermometer size={10} /> {weather.humidity}%
                      </div>
                  </div>
              </div>

              {/* Global Search */}
              <div className="relative flex-1 md:w-64 group">
                  <Search className="absolute left-3 top-2.5 text-purple-500 group-hover:text-orange-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search System..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full glass-input rounded-xl py-2 pl-10 pr-4 text-sm bg-[#0f0518]/80 border-purple-900/50 focus:border-orange-500"
                  />
              </div>
          </div>
      </div>

      {/* STRATEGIC INSIGHT */}
      <div className="glass-panel p-1 rounded-2xl mb-8 relative overflow-hidden group bg-gradient-to-r from-purple-900/20 to-orange-900/20 border-purple-500/30">
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-5">
              <Activity size={140} className="text-purple-500" />
          </div>
          <div className="bg-[#05010a]/80 backdrop-blur-sm p-6 rounded-xl h-full relative z-10">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Hexagon size={12} className="animate-spin text-purple-500"/> Strategic Intelligence
              </h3>
              <p className="text-lg text-white font-medium max-w-3xl leading-relaxed font-mono">
                  <span className="text-purple-400">>></span> Analysis indicates <span className="text-orange-400 font-bold">15% surge</span> in Cikarang demand.
                  <br/><span className="text-purple-400">>></span> Material stock for "550Wp Panels" is critically low.
                  <br/><span className="text-purple-400">>></span> Recommendation: Initiate procurement from Supplier #4 immediately to avoid construction delays.
              </p>
          </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Total Pipeline" value={`IDR ${(totalValue / 1000000000).toFixed(2)} B`} icon={DollarSign} color="purple" trend="+12.5%" />
          <MetricCard title="Active Sites" value={`${activeProjects}`} subValue={`/ ${projects.length}`} icon={Globe} color="orange" trend="Stable" />
          <MetricCard title="Safety Index" value="99.2%" icon={ShieldCheck} color="emerald" trend="+0.4%" />
          <MetricCard title="Grid Freq" value="50.01 Hz" icon={Zap} color="blue" trend="Nominal" />
      </div>

      {/* CHARTS & MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Complex Energy Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-purple-500/20">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap size={16} className="text-orange-500"/> Grid Load vs Solar Production
                  </h3>
                  <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-purple-400"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Grid Load</span>
                      <span className="flex items-center gap-1 text-[10px] text-orange-400"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> Solar Gen</span>
                  </div>
              </div>
              <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={GRID_LOAD_DATA}>
                             <defs>
                                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1b4b" vertical={false} />
                            <XAxis dataKey="time" stroke="#4c1d95" fontSize={10} tickFormatter={(val) => `${val}:00`} axisLine={false} tickLine={false} />
                            <YAxis stroke="#4c1d95" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{backgroundColor: '#05010a', borderColor: '#9333ea', borderRadius: '8px', color: '#fff'}} />
                            <Area type="monotone" dataKey="load" stroke="#9333ea" strokeWidth={2} fill="url(#colorLoad)" />
                            <Area type="monotone" dataKey="solar" stroke="#f97316" strokeWidth={2} fill="url(#colorSolar)" />
                        </AreaChart>
                    </ResponsiveContainer>
              </div>
          </div>

          {/* Side Panel: Tactical Map */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col border-purple-500/20">
               <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                   <Map size={16} className="text-purple-400"/> Geo-Spatial Tracking
               </h3>
               <TacticalMap projects={projects} />
               <div className="mt-4 flex justify-between text-xs text-slate-500 font-mono">
                   <span className="text-orange-400">Sat-Link: ACTIVE</span>
                   <span>Latency: 24ms</span>
               </div>
          </div>
      </div>
      
      <p className="text-center text-[10px] text-purple-900/50 font-mono mt-12 mb-4">SPARKO CORP ENTERPRISE OS // PROPRIETARY SOFTWARE</p>
    </div>
  );
};

const MetricCard = ({ title, value, subValue, icon: Icon, color, trend }: any) => {
    const colorClasses: any = {
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    };

    return (
        <div className="glass-panel p-5 rounded-2xl hover:bg-white/5 transition duration-300 border-t border-white/5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 bg-white/5 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/10 transition"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl border ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                        <TrendingUp size={10} /> {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-bold text-white tracking-tight font-mono">
                    {value} <span className="text-sm text-slate-500 font-normal">{subValue}</span>
                </p>
            </div>
        </div>
    );
};

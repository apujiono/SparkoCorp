
import React, { useState, useEffect } from 'react';
import { Project, Manpower, InventoryItem, InventoryTransaction, StorageFile, CompanySettings, WeatherData, SafetyIncident, TrainingCourse, Supplier } from './types';
import { Dashboard } from './components/Dashboard';
import { ProjectModule, ManpowerModule, NegotiationModule } from './components/OperationalModules';
import { InventoryModule } from './components/InventoryModule';
import { StorageModule } from './components/StorageModule';
import { CalculatorModule } from './components/CalculatorModule';
import { CommunicationHub } from './components/Communication';
import { SafetyModule, TrainingModule, AnalyticsModule } from './components/ExtraModules';
import { AICoreModule } from './components/AICoreModule';
import { LayoutDashboard, Users, Briefcase, MessageSquare, Menu, X, Package, Cloud, Calculator, Zap, Database, ShieldAlert, GraduationCap, BarChart2, Cpu, Activity, Server, Radio, Save, RotateCcw, Download } from 'lucide-react';

/* --- EMPTY STATE START --- */
const SEED_PROJECTS: Project[] = [];
const SEED_MANPOWER: Manpower[] = [];
const SEED_INVENTORY: InventoryItem[] = [];
/* --- EMPTY STATE END --- */

enum View {
  DASHBOARD = 'Dashboard',
  PROJECTS = 'Projects',
  MANPOWER = 'Manpower',
  NEGOTIATION = 'Negotiation',
  COMMUNICATION = 'Communication',
  INVENTORY = 'Inventory',
  STORAGE = 'Cloud Storage',
  CALCULATOR = 'Calculator',
  SAFETY = 'Safety (HSE)',
  TRAINING = 'Training (LMS)',
  ANALYTICS = 'Analytics (BI)',
  AI_CORE = 'Genesis AI Core'
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dbStatus, setDbStatus] = useState<'Saved' | 'Saving'>('Saved');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: 32, condition: 'Sunny', humidity: 65, windSpeed: 12, location: 'Unknown' });

  // --- DATABASE ENGINE (LocalStorage Wrapper) ---
  const [projects, setProjects] = useState<Project[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_projects_v3') || '[]') } catch { return [] } });
  const [manpower, setManpower] = useState<Manpower[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_manpower_v3') || '[]') } catch { return [] } });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_inventory_v3') || '[]') } catch { return [] } });
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_transactions_v3') || '[]') } catch { return [] } });
  const [storage, setStorage] = useState<StorageFile[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_storage_v3') || '[]') } catch { return [] } });
  const [settings, setSettings] = useState<CompanySettings>(() => { try { return JSON.parse(localStorage.getItem('sparko_settings_v3') || '{"companyName": "Sparko Corp", "baseCurrency": "IDR", "taxRate": 11}') } catch { return {companyName: "Sparko Corp", baseCurrency: "IDR", taxRate: 11} } });
  
  // New Modules State
  const [incidents, setIncidents] = useState<SafetyIncident[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_safety_v3') || '[]') } catch { return [] } });
  const [courses, setCourses] = useState<TrainingCourse[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_training_v3') || '[]') } catch { return [] } });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_suppliers_v3') || '[]') } catch { return [] } });

  // Real-time PLN Rate Tracker (Default to avg 1444.70)
  const [plnRate, setPlnRate] = useState<number>(() => Number(localStorage.getItem('sparko_pln_rate')) || 1444.70);

  // Persistence Hooks
  const saveData = (key: string, data: any) => {
      setDbStatus('Saving');
      localStorage.setItem(key, JSON.stringify(data));
      setTimeout(() => setDbStatus('Saved'), 500);
  };

  useEffect(() => saveData('sparko_projects_v3', projects), [projects]);
  useEffect(() => saveData('sparko_manpower_v3', manpower), [manpower]);
  useEffect(() => saveData('sparko_inventory_v3', inventory), [inventory]);
  useEffect(() => saveData('sparko_transactions_v3', transactions), [transactions]);
  useEffect(() => saveData('sparko_storage_v3', storage), [storage]);
  useEffect(() => saveData('sparko_settings_v3', settings), [settings]);
  
  // New Persistence
  useEffect(() => saveData('sparko_safety_v3', incidents), [incidents]);
  useEffect(() => saveData('sparko_training_v3', courses), [courses]);
  useEffect(() => saveData('sparko_suppliers_v3', suppliers), [suppliers]);

  useEffect(() => {
    localStorage.setItem('sparko_pln_rate', plnRate.toString());
  }, [plnRate]);

  // Real-time Clock & Weather Simulation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate Weather based on Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            // Simple mock logic based on coordinates
            const isHot = Math.abs(lat) < 30;
            setWeather({
                temp: isHot ? 32 + Math.random() * 2 : 20 + Math.random() * 5,
                condition: Math.random() > 0.7 ? 'Cloudy' : 'Sunny',
                humidity: 60 + Math.floor(Math.random() * 20),
                windSpeed: 10 + Math.floor(Math.random() * 10),
                location: `Lat: ${lat.toFixed(2)}`
            });
        }, () => {
             // Fallback if denied
             setWeather({ temp: 30, condition: 'Partly Cloudy', humidity: 70, windSpeed: 8, location: 'Local' });
        });
    }

    return () => clearInterval(timer);
  }, []);

  const handleBackup = () => {
      const data = {
          projects, manpower, inventory, transactions, storage, settings, incidents, courses, suppliers, plnRate
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sparko_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  const handleReset = () => {
      if (confirm("CRITICAL WARNING: This will WIPE ALL DATA and factory reset the OS. Are you sure?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeView) {
      case View.DASHBOARD: return <Dashboard projects={projects} weather={weather} currentTime={currentTime} plnRate={plnRate} setPlnRate={setPlnRate} />;
      case View.PROJECTS: return <ProjectModule projects={projects} setProjects={setProjects} />;
      case View.MANPOWER: return <ManpowerModule manpowerList={manpower} setManpowerList={setManpower} />;
      case View.NEGOTIATION: return <NegotiationModule projects={projects} />;
      case View.COMMUNICATION: return (
          <CommunicationHub 
            projects={projects} setProjects={setProjects}
            manpower={manpower} setManpower={setManpower}
            inventory={inventory} setInventory={setInventory}
            transactions={transactions}
          />
        );
      case View.INVENTORY: return <InventoryModule inventory={inventory} setInventory={setInventory} transactions={transactions} setTransactions={setTransactions} suppliers={suppliers} setSuppliers={setSuppliers} />;
      case View.STORAGE: return <StorageModule storage={storage} setStorage={setStorage} />;
      case View.CALCULATOR: return <CalculatorModule inventory={inventory} plnRate={plnRate} />;
      case View.SAFETY: return <SafetyModule incidents={incidents} setIncidents={setIncidents} />;
      case View.TRAINING: return <TrainingModule courses={courses} setCourses={setCourses} manpower={manpower} />;
      case View.ANALYTICS: return <AnalyticsModule projects={projects} />;
      case View.AI_CORE: return <AICoreModule />;
      default: return <Dashboard projects={projects} weather={weather} currentTime={currentTime} plnRate={plnRate} setPlnRate={setPlnRate} />;
    }
  };

  const NavButton = ({ view, icon: Icon, label }: any) => (
    <button onClick={() => { setActiveView(view); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative mb-1 overflow-hidden
        ${activeView === view 
            ? 'bg-gradient-to-r from-purple-900/50 to-orange-900/50 text-white border-l-2 border-orange-500 shadow-lg shadow-purple-900/20' 
            : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        
        {activeView === view && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-orange-600/10 opacity-50 blur-xl"></div>
        )}
        
        <Icon size={18} className={`relative z-10 transition-colors ${activeView === view ? 'text-orange-400' : 'text-slate-500 group-hover:text-purple-400'}`} />
        <span className="font-medium text-sm tracking-wide relative z-10">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#05010a] text-slate-200 font-sans overflow-hidden selection:bg-purple-500/30">
      <button onClick={toggleSidebar} className="fixed top-4 left-4 z-50 p-2 bg-purple-900/20 border border-purple-800 rounded-lg md:hidden text-white"><Menu size={24} /></button>

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#090214] border-r border-purple-900/30 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="h-24 flex items-center px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-orange-500"></div>
            <div className="flex items-center gap-3 relative z-10">
               <div className="p-2.5 bg-gradient-to-br from-purple-600 to-orange-600 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                   <Zap className="text-white" size={24} />
               </div>
               <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1">Sparko<span className="text-orange-500">.OS</span></h1>
                  <p className="text-[9px] text-purple-400 font-mono tracking-[0.2em] uppercase glow-text-purple">Enterprise</p>
               </div>
            </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto space-y-8 py-4 custom-scrollbar">
             <div>
                 <div className="px-4 mb-3 text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2"><Activity size={10}/> Main Console</div>
                 <NavButton view={View.DASHBOARD} icon={LayoutDashboard} label="Command Deck" />
                 <NavButton view={View.COMMUNICATION} icon={MessageSquare} label="Genesis Uplink" />
                 <NavButton view={View.AI_CORE} icon={Cpu} label="AI Core & Modules" />
                 <NavButton view={View.ANALYTICS} icon={BarChart2} label="Business Intel (BI)" />
             </div>
             <div>
                 <div className="px-4 mb-3 text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2"><Briefcase size={10}/> Operations</div>
                 <NavButton view={View.PROJECTS} icon={Briefcase} label="Project Ops" />
                 <NavButton view={View.MANPOWER} icon={Users} label="Workforce" />
                 <NavButton view={View.INVENTORY} icon={Package} label="Supply Chain" />
             </div>
             <div>
                 <div className="px-4 mb-3 text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={10}/> QHSE & Dev</div>
                 <NavButton view={View.SAFETY} icon={ShieldAlert} label="Safety (HSE)" />
                 <NavButton view={View.TRAINING} icon={GraduationCap} label="Academy (LMS)" />
             </div>
             <div>
                 <div className="px-4 mb-3 text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2"><Cpu size={10}/> Utilities</div>
                 <NavButton view={View.CALCULATOR} icon={Calculator} label="Cost & Wiring" />
                 <NavButton view={View.STORAGE} icon={Cloud} label="Data Vault" />
                 <NavButton view={View.NEGOTIATION} icon={Zap} label="Negotiation" />
             </div>
        </nav>

        <div className="p-4 bg-[#05010a] border-t border-purple-900/30">
           <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-2">
               <div className="flex items-center gap-1 text-slate-500"><Server size={10}/> SERVER: ONLINE</div>
               <div className="flex items-center gap-1 text-slate-500"><Radio size={10}/> PING: 12ms</div>
           </div>
           
           {/* Database Controls */}
           <div className="flex gap-2 mb-2">
               <button onClick={handleBackup} className="flex-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-purple-400 py-1.5 rounded border border-slate-800 flex items-center justify-center gap-1 transition">
                   <Download size={10} /> Backup
               </button>
               <button onClick={handleReset} className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-[10px] text-red-400 py-1.5 rounded border border-red-900/30 flex items-center justify-center gap-1 transition">
                   <RotateCcw size={10} /> Reset
               </button>
           </div>

           <div className="flex items-center justify-between text-xs text-slate-500 bg-purple-900/10 p-2 rounded border border-purple-900/30">
               <span className="flex items-center gap-2"><Database size={12} className={dbStatus === 'Saved' ? 'text-emerald-500' : 'text-orange-500 animate-pulse'}/> Database</span>
               <span className={dbStatus === 'Saved' ? 'text-emerald-500 font-bold' : 'text-orange-500 font-bold'}>{dbStatus === 'Saved' ? 'SYNCED' : 'SAVING...'}</span>
           </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-hidden relative bg-[#05010a]">
         {/* Background Ambient Effects */}
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(88,28,135,0.15),_transparent_50%)] pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_rgba(234,88,12,0.1),_transparent_50%)] pointer-events-none"></div>
         
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

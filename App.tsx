import React, { useState, useEffect } from 'react';
import { BootLoader, LoginScreen, Taskbar, WindowFrame, DesktopIcon } from './components/OSInterface';
import { Project, Manpower, InventoryItem, InventoryTransaction, StorageFile, CompanySettings, WeatherData, SafetyIncident, TrainingCourse, Supplier } from './types';
import { Dashboard } from './components/Dashboard';
import { ProjectModule, ManpowerModule, NegotiationModule } from './components/OperationalModules';
import { InventoryModule } from './components/InventoryModule';
import { StorageModule } from './components/StorageModule';
import { CalculatorModule } from './components/CalculatorModule';
import { CommunicationHub } from './components/Communication';
import { SafetyModule, TrainingModule, AnalyticsModule } from './components/ExtraModules';
import { AICoreModule } from './components/AICoreModule';
import { LayoutDashboard, Users, Briefcase, MessageSquare, Package, Cloud, Calculator, Zap, ShieldAlert, GraduationCap, BarChart2, Cpu } from 'lucide-react';

/* --- APP KERNEL (OS LOGIC) --- */
const App: React.FC = () => {
    // OS States
    const [booting, setBooting] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [activeApp, setActiveApp] = useState<string | null>('Command Deck'); // Default open
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- DATA STORE (LocalStorage) ---
    const [projects, setProjects] = useState<Project[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_projects_v3') || '[]') } catch { return [] } });
    const [manpower, setManpower] = useState<Manpower[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_manpower_v3') || '[]') } catch { return [] } });
    const [inventory, setInventory] = useState<InventoryItem[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_inventory_v3') || '[]') } catch { return [] } });
    const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_transactions_v3') || '[]') } catch { return [] } });
    const [storage, setStorage] = useState<StorageFile[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_storage_v3') || '[]') } catch { return [] } });
    const [settings, setSettings] = useState<CompanySettings>(() => { try { return JSON.parse(localStorage.getItem('sparko_settings_v3') || '{"companyName": "Sparko Corp", "baseCurrency": "IDR", "taxRate": 11}') } catch { return {companyName: "Sparko Corp", baseCurrency: "IDR", taxRate: 11} } });
    const [incidents, setIncidents] = useState<SafetyIncident[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_safety_v3') || '[]') } catch { return [] } });
    const [courses, setCourses] = useState<TrainingCourse[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_training_v3') || '[]') } catch { return [] } });
    const [suppliers, setSuppliers] = useState<Supplier[]>(() => { try { return JSON.parse(localStorage.getItem('sparko_suppliers_v3') || '[]') } catch { return [] } });
    const [plnRate, setPlnRate] = useState<number>(() => Number(localStorage.getItem('sparko_pln_rate')) || 1444.70);
    const [weather, setWeather] = useState<WeatherData>({ temp: 32, condition: 'Sunny', humidity: 65, windSpeed: 12, location: 'Unknown' });

    // Persistence Effects
    useEffect(() => { localStorage.setItem('sparko_projects_v3', JSON.stringify(projects)) }, [projects]);
    useEffect(() => { localStorage.setItem('sparko_manpower_v3', JSON.stringify(manpower)) }, [manpower]);
    useEffect(() => { localStorage.setItem('sparko_inventory_v3', JSON.stringify(inventory)) }, [inventory]);
    useEffect(() => { localStorage.setItem('sparko_transactions_v3', JSON.stringify(transactions)) }, [transactions]);
    useEffect(() => { localStorage.setItem('sparko_storage_v3', JSON.stringify(storage)) }, [storage]);
    useEffect(() => { localStorage.setItem('sparko_safety_v3', JSON.stringify(incidents)) }, [incidents]);
    useEffect(() => { localStorage.setItem('sparko_training_v3', JSON.stringify(courses)) }, [courses]);
    useEffect(() => { localStorage.setItem('sparko_suppliers_v3', JSON.stringify(suppliers)) }, [suppliers]);
    useEffect(() => { localStorage.setItem('sparko_pln_rate', plnRate.toString()) }, [plnRate]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- MODULE RENDERING ---
    const renderModule = () => {
        switch (activeApp) {
            case 'Command Deck': return <Dashboard projects={projects} weather={weather} currentTime={currentTime} plnRate={plnRate} setPlnRate={setPlnRate} />;
            case 'Project Ops': return <ProjectModule projects={projects} setProjects={setProjects} />;
            case 'Workforce': return <ManpowerModule manpowerList={manpower} setManpowerList={setManpower} />;
            case 'Negotiation': return <NegotiationModule projects={projects} />;
            case 'Genesis Uplink': return <CommunicationHub projects={projects} setProjects={setProjects} manpower={manpower} setManpower={setManpower} inventory={inventory} setInventory={setInventory} transactions={transactions} />;
            case 'Supply Chain': return <InventoryModule inventory={inventory} setInventory={setInventory} transactions={transactions} setTransactions={setTransactions} suppliers={suppliers} setSuppliers={setSuppliers} />;
            case 'Data Vault': return <StorageModule storage={storage} setStorage={setStorage} />;
            case 'Engineering': return <CalculatorModule inventory={inventory} plnRate={plnRate} />;
            case 'Safety (HSE)': return <SafetyModule incidents={incidents} setIncidents={setIncidents} />;
            case 'Academy': return <TrainingModule courses={courses} setCourses={setCourses} manpower={manpower} />;
            case 'Analytics': return <AnalyticsModule projects={projects} />;
            case 'AI Core': return <AICoreModule />;
            default: return null;
        }
    };

    // --- RENDER ---
    if (booting) return <BootLoader onComplete={() => setBooting(false)} />;
    if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

    return (
        <div className="h-screen w-screen bg-[#05010a] overflow-hidden relative font-sans text-slate-200">
            {/* Themed Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-[#05010a] to-orange-900/20 z-0"></div>
            
            {/* Grid Overlay for Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0"></div>

            {/* Desktop Icons Grid */}
            <div className="relative z-10 p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 content-start h-[calc(100vh-48px)]">
                <DesktopIcon label="Command Deck" icon={LayoutDashboard} onClick={() => setActiveApp('Command Deck')} />
                <DesktopIcon label="Project Ops" icon={Briefcase} onClick={() => setActiveApp('Project Ops')} />
                <DesktopIcon label="Genesis Uplink" icon={MessageSquare} onClick={() => setActiveApp('Genesis Uplink')} />
                <DesktopIcon label="Supply Chain" icon={Package} onClick={() => setActiveApp('Supply Chain')} />
                <DesktopIcon label="Workforce" icon={Users} onClick={() => setActiveApp('Workforce')} />
                <DesktopIcon label="Engineering" icon={Calculator} onClick={() => setActiveApp('Engineering')} />
                <DesktopIcon label="AI Core" icon={Cpu} onClick={() => setActiveApp('AI Core')} />
                <DesktopIcon label="Analytics" icon={BarChart2} onClick={() => setActiveApp('Analytics')} />
                <DesktopIcon label="Safety (HSE)" icon={ShieldAlert} onClick={() => setActiveApp('Safety (HSE)')} />
                <DesktopIcon label="Academy" icon={GraduationCap} onClick={() => setActiveApp('Academy')} />
                <DesktopIcon label="Negotiation" icon={Zap} onClick={() => setActiveApp('Negotiation')} />
                <DesktopIcon label="Data Vault" icon={Cloud} onClick={() => setActiveApp('Data Vault')} />
            </div>

            {/* Active Window */}
            {activeApp && (
                <WindowFrame title={activeApp} onClose={() => setActiveApp(null)}>
                    {renderModule()}
                </WindowFrame>
            )}

            {/* Taskbar */}
            <Taskbar activeApp={activeApp} toggleApp={setActiveApp} currentTime={currentTime} />
        </div>
    );
};

export default App;

import React, { useState, useEffect } from 'react';
import { AIModule } from '../types';
import { generateJobSafetyAnalysis, draftJobDescription, analyzeContract } from '../services/geminiService';
import { Cpu, ShieldCheck, FileText, Zap, Search, Play, Download, Settings, Database, Code, DollarSign, Activity, Users, Lock, Globe, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Clock, ToggleLeft, ToggleRight, Terminal, Box, Briefcase, Eye, GitBranch, Server, PenTool, LayoutTemplate, MessageSquare } from 'lucide-react';

const MOCK_MODULES: AIModule[] = [
    { 
        id: '1', name: 'Legal Eagle', category: 'Legal', description: 'Advanced Contract Analysis & Risk Detection.', status: 'Active', icon: 'Lock', version: 'v2.1',
        automation: { enabled: false, schedule: 'Event', triggerEvent: 'New Contract' },
        feedback: { positive: 120, negative: 5 }
    },
    { 
        id: '2', name: 'Safety Sentinel', category: 'Safety', description: 'Auto-generate JSA & Incident Reports.', status: 'Active', icon: 'ShieldCheck', version: 'v3.0',
        automation: { enabled: true, schedule: 'Daily', lastRun: new Date().toISOString() },
        feedback: { positive: 85, negative: 2 }
    },
    { 
        id: '3', name: 'HR Recruiter', category: 'HR', description: 'Drafts JDs & screens candidate profiles.', status: 'Active', icon: 'Users', version: 'v1.5',
        automation: { enabled: false, schedule: 'Weekly' },
        feedback: { positive: 45, negative: 1 } 
    },
    { 
        id: '4', name: 'Grid Guardian', category: 'Technical', description: 'Validates SLD & Wiring Configs.', status: 'Inactive', icon: 'Zap', version: 'v4.2',
        feedback: { positive: 200, negative: 12 }
    },
    { 
        id: '5', name: 'Market Watcher', category: 'Financial', description: 'Tracks competitor pricing & trends.', status: 'Inactive', icon: 'DollarSign', version: 'v1.0' 
    },
    { 
        id: '6', name: 'Code Master', category: 'Technical', description: 'Assists with SCADA/Monitoring scripts.', status: 'Inactive', icon: 'Code', version: 'v2.0' 
    },
    // Generate distinct mocks
    { id: '7', name: 'Ops Optimizer', category: 'Operational', description: 'Resource allocation & scheduling.', status: 'Inactive', icon: 'Activity', version: 'v1.1' },
    { id: '8', name: 'Finance Flow', category: 'Financial', description: 'Cash flow prediction.', status: 'Inactive', icon: 'Briefcase', version: 'v0.9' },
    { id: '9', name: 'Site Seer', category: 'Operational', description: 'Remote site monitoring AI.', status: 'Inactive', icon: 'Eye', version: 'v2.2' },
    { id: '10', name: 'Docu Mind', category: 'Operational', description: 'Document OCR and archival.', status: 'Inactive', icon: 'FileText', version: 'v1.8' },
];

export const AICoreModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [modules, setModules] = useState<AIModule[]>(MOCK_MODULES);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    
    // Derived state for the selected module to ensure sync
    const selectedModule = modules.find(m => m.id === selectedModuleId) || null;

    // Module Tool States
    const [toolInput, setToolInput] = useState('');
    const [toolOutput, setToolOutput] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Toast State
    const [toast, setToast] = useState<{message: string, active: boolean} | null>(null);

    const toggleStatus = (id: string, name: string) => {
        setModules(prev => prev.map(m => {
            if (m.id === id) {
                const newStatus = m.status === 'Active' ? 'Inactive' : 'Active';
                setToast({ 
                    message: `${name.toUpperCase()} SYSTEM ${newStatus.toUpperCase()}`, 
                    active: newStatus === 'Active' 
                });
                setTimeout(() => setToast(null), 3000);
                return { ...m, status: newStatus };
            }
            return m;
        }));
    };

    const updateAutomation = (moduleId: string, updates: Partial<any>) => {
        setModules(prev => prev.map(m => {
            if (m.id === moduleId) {
                const currentConfig = m.automation || { enabled: false, schedule: 'Daily' };
                return { ...m, automation: { ...currentConfig, ...updates } };
            }
            return m;
        }));
    };

    const handleFeedback = (type: 'up' | 'down') => {
        if (!selectedModule) return;
        setModules(prev => prev.map(m => {
            if (m.id === selectedModule.id) {
                const stats = m.feedback || { positive: 0, negative: 0 };
                const newStats = type === 'up' 
                    ? { ...stats, positive: stats.positive + 1 }
                    : { ...stats, negative: stats.negative + 1 };
                return { ...m, feedback: newStats };
            }
            return m;
        }));
        setToast({ message: "FEEDBACK RECORDED. RETRAINING NODE...", active: true });
        setTimeout(() => setToast(null), 2000);
    };

    const handleRunTool = async () => {
        if (!selectedModule || !toolInput) return;
        setLoading(true);
        let result = '';

        if (selectedModule.id === '1') result = await analyzeContract(toolInput);
        else if (selectedModule.id === '2') result = await generateJobSafetyAnalysis(toolInput);
        else if (selectedModule.id === '3') result = await draftJobDescription(toolInput);
        else result = `[GENESIS SIMULATION]\nTarget: ${selectedModule.name}\nInput Processed: "${toolInput}"\n\n> Neural net confidence: 98.4%\n> Output generated successfully.`;

        setToolOutput(result);
        setLoading(false);
        
        // Auto-log "Run" timestamp if automation is enabled
        if (selectedModule.automation?.enabled) {
             updateAutomation(selectedModule.id, { lastRun: new Date().toISOString() });
        }
    };

    const filteredModules = modules.filter(m => 
        (activeCategory === 'All' || m.category === activeCategory) &&
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = ['All', 'Operational', 'Financial', 'Technical', 'Legal', 'HR', 'Safety'];

    const renderIcon = (iconName: string, className: string) => {
        const icons: any = { 
            Lock, ShieldCheck, Users, Zap, DollarSign, Code, Activity, 
            Briefcase, Eye, FileText, Box, GitBranch, Server, PenTool, LayoutTemplate
        };
        const Icon = icons[iconName] || Activity;
        return <Icon className={className}/>;
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#05010a] text-slate-200 font-sans relative">
             {/* Cyberpunk Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

             {/* Toast Notification */}
             {toast && (
                 <div className="fixed top-6 right-6 z-50 animate-fade-in">
                     <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.active ? 'bg-purple-900/90 border-purple-500 text-purple-100' : 'bg-slate-800/90 border-slate-600 text-slate-300'} backdrop-blur-md`}>
                         {toast.active ? <CheckCircle size={20} className="text-purple-400" /> : <AlertCircle size={20} />}
                         <span className="font-bold font-mono text-sm tracking-wider">{toast.message}</span>
                     </div>
                 </div>
             )}

             <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-2 tracking-tight">
                        <Cpu className="text-orange-500" /> GENESIS <span className="text-purple-500">CORE</span>
                    </h2>
                    <p className="text-xs text-purple-400 font-mono mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        SYSTEM ONLINE: {modules.length} NEURAL NODES ACTIVE
                    </p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 text-purple-500" size={16} />
                    <input 
                        type="text" placeholder="Search Neural Modules..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-sm bg-[#0f0518]/80 focus:border-orange-500" 
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 relative z-10">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} 
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap uppercase tracking-wider ${activeCategory === cat ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white hover:border-orange-500'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10">
                {/* MODULE GRID */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min content-start">
                    {filteredModules.map(m => (
                        <div key={m.id} 
                            onClick={() => { setSelectedModuleId(m.id); setToolOutput(''); setToolInput(''); }}
                            className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group 
                                ${selectedModule?.id === m.id ? 'ring-1 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : ''}
                                ${m.status === 'Active' ? 'bg-[#130722]/80 border-purple-500/40' : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100'}
                            `}
                        >
                            {/* Active Glow */}
                            {m.status === 'Active' && <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full pointer-events-none"></div>}

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-2.5 rounded-lg transition-colors ${m.status === 'Active' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
                                    {renderIcon(m.icon, "w-6 h-6")}
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); toggleStatus(m.id, m.name); }}>
                                    {m.status === 'Active' ? <ToggleRight size={32} className="text-orange-500 cursor-pointer hover:text-orange-400"/> : <ToggleLeft size={32} className="text-slate-600 cursor-pointer hover:text-slate-400"/>}
                                </div>
                            </div>
                            
                            <h3 className={`font-bold text-sm truncate transition-colors font-mono ${m.status === 'Active' ? 'text-white' : 'text-slate-400'}`}>{m.name}</h3>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 h-8 leading-tight">{m.description}</p>
                            
                            <div className="mt-4 flex justify-between items-center relative z-10">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${m.status === 'Active' ? 'bg-purple-900 text-purple-300 border border-purple-700' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                    {m.version}
                                </span>
                                <span className={m.status === 'Active' ? 'text-[9px] text-green-400 font-bold flex items-center gap-1 uppercase' : 'text-[9px] text-slate-600 uppercase'}>
                                    {m.status === 'Active' && <Activity size={8} className="animate-spin"/>}
                                    {m.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODULE DETAIL CONSOLE */}
                <div className="xl:col-span-1 glass-panel p-0 rounded-2xl h-[calc(100vh-200px)] flex flex-col border border-purple-500/20 sticky top-6 overflow-hidden">
                    {selectedModule ? (
                        <>
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-b from-purple-900/20 to-transparent border-b border-purple-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-br from-purple-600 to-orange-600 rounded-xl text-white shadow-lg">
                                        {renderIcon(selectedModule.icon, "w-8 h-8")}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-xl font-bold text-white tracking-wide leading-tight">{selectedModule.name}</h2>
                                            <span className="text-[10px] bg-white/10 text-white px-2 py-1 rounded font-mono border border-white/20 shadow-sm">{selectedModule.version}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                             <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 uppercase font-bold">{selectedModule.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-300 mt-4 leading-relaxed border-l-2 border-orange-500 pl-3 italic">
                                    "{selectedModule.description}"
                                </p>
                                
                                {selectedModule.feedback && (
                                    <div className="flex gap-4 mt-4 text-[10px] font-mono text-slate-400 bg-black/20 p-2 rounded">
                                        <div className="flex items-center gap-1"><ThumbsUp size={12} className="text-green-500"/> {selectedModule.feedback.positive} Positive</div>
                                        <div className="flex items-center gap-1"><ThumbsDown size={12} className="text-red-500"/> {selectedModule.feedback.negative} Issues</div>
                                    </div>
                                )}
                            </div>

                            {/* Automation Config */}
                            <div className="px-6 py-4 border-b border-white/5 bg-black/20">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-orange-400 uppercase flex items-center gap-2">
                                        <Clock size={12}/> Auto-Run Automation
                                    </h4>
                                    <div onClick={() => updateAutomation(selectedModule.id, { enabled: !selectedModule.automation?.enabled })} className="cursor-pointer">
                                        {selectedModule.automation?.enabled ? <ToggleRight size={24} className="text-green-500"/> : <ToggleLeft size={24} className="text-slate-600"/>}
                                    </div>
                                </div>
                                {selectedModule.automation?.enabled && (
                                    <div className="space-y-3 mt-3 animate-fade-in">
                                        <div className="flex gap-2">
                                            {['Daily', 'Weekly', 'Event'].map(opt => (
                                                <button key={opt} 
                                                    onClick={() => updateAutomation(selectedModule.id, { schedule: opt })} 
                                                    className={`text-[10px] flex-1 py-1.5 rounded border transition ${selectedModule.automation?.schedule === opt ? 'bg-orange-500/20 text-orange-300 border-orange-500' : 'border-slate-700 text-slate-500 hover:text-white'}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedModule.automation.schedule === 'Event' && (
                                            <select 
                                                className="w-full glass-input text-xs p-2 rounded"
                                                value={selectedModule.automation.triggerEvent || ''}
                                                onChange={(e) => updateAutomation(selectedModule.id, { triggerEvent: e.target.value })}
                                            >
                                                <option value="">-- Select Event Trigger --</option>
                                                <option value="New Project">On New Project Created</option>
                                                <option value="Safety Incident">On Safety Incident Reported</option>
                                                <option value="New Contract">On Contract Upload</option>
                                                <option value="Low Stock">On Low Stock Alert</option>
                                            </select>
                                        )}
                                        {selectedModule.automation.lastRun && (
                                            <div className="text-[9px] text-slate-500 text-right italic">
                                                Last Run: {new Date(selectedModule.automation.lastRun).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tool Interface */}
                            <div className="flex-1 flex flex-col p-6 bg-[#0a0210] overflow-hidden">
                                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Terminal size={14} className="text-purple-500"/> Input Console</h3>
                                
                                {['1','2','3'].includes(selectedModule.id) ? (
                                    <>
                                        <textarea 
                                            value={toolInput} onChange={e => setToolInput(e.target.value)}
                                            className="w-full bg-[#130722] border border-purple-900/50 rounded-lg p-3 text-sm text-purple-100 focus:border-orange-500 outline-none h-24 mb-4 font-mono resize-none placeholder-purple-900/50"
                                            placeholder="> Awaiting input stream..."
                                        />
                                        <button onClick={handleRunTool} disabled={loading} 
                                            className="w-full bg-gradient-to-r from-purple-700 to-purple-600 hover:to-orange-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 mb-6 transition shadow-lg shadow-purple-900/30 text-sm uppercase tracking-wider">
                                            {loading ? <Activity className="animate-spin"/> : <Play size={16}/>} 
                                            Execute
                                        </button>
                                        
                                        <div className="flex-1 bg-black rounded-lg p-4 border border-slate-800 overflow-hidden flex flex-col relative group">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-orange-500"></div>
                                            <div className="flex-1 overflow-y-auto font-mono text-xs text-green-400 pb-8 custom-scrollbar whitespace-pre-wrap">
                                                {toolOutput || "// SYSTEM READY. STANDBY FOR OUTPUT."}
                                            </div>
                                            
                                            {/* Feedback Loop */}
                                            {toolOutput && (
                                                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-1 rounded border border-slate-700">
                                                    <span className="text-[9px] text-slate-500 flex items-center px-1">RATE OUTPUT:</span>
                                                    <button onClick={() => handleFeedback('up')} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-green-400 transition" title="Good Output"><ThumbsUp size={12}/></button>
                                                    <button onClick={() => handleFeedback('down')} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition" title="Bad Output"><ThumbsDown size={12}/></button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 text-slate-600 text-center p-4 border border-dashed border-slate-800 rounded-lg">
                                        <Database size={48} className="mb-4 opacity-20 text-purple-500"/>
                                        <p className="text-xs font-mono uppercase">API CONNECTION RESTRICTED</p>
                                        <p className="text-[10px] mt-1">This neural node is operating in passive mode.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <Cpu size={64} className="mb-6 opacity-50 text-purple-900 animate-pulse"/>
                            <p className="text-sm font-bold text-purple-400 font-mono tracking-widest">GENESIS CORE ONLINE</p>
                            <p className="text-xs mt-2 text-slate-500">Select a module to configure parameters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

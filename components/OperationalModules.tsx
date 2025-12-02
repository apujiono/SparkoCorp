import React, { useState, useRef, useEffect } from 'react';
import { Project, Manpower, ProjectStatus, AttendanceRecord, WorkerDocument } from '../types';
import { analyzeProjectRisk, generateStandardSchedule, generateProjectProposal, getNegotiationReply, analyzeProjectPlan, analyzeSkillMatrix, calculateProjectEfficiency } from '../services/geminiService';
import { Users, Briefcase, Plus, Trash2, MapPin, ListTodo, ShieldAlert, CheckCircle, AlertTriangle, X, LayoutGrid, HardHat, Zap, FileText, MessageSquare, Send, Calendar, DollarSign, FileCheck, Target, ChevronRight, UserCheck, Paperclip, Sparkles, Save, Upload, Filter, Search, Link as LinkIcon, AlertCircle, Calculator } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

/* --- SHARED COMPONENTS --- */
const Card = ({ children, className = '' }: any) => <div className={`glass-panel rounded-xl p-6 ${className}`}>{children}</div>;
const Badge = ({ children, color = 'slate' }: any) => {
    const colors: any = {
        slate: 'bg-slate-800 text-slate-300 border-slate-700',
        blue: 'bg-purple-900/30 text-purple-300 border-purple-800',
        emerald: 'bg-orange-900/30 text-orange-300 border-orange-800',
        yellow: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
        red: 'bg-red-900/30 text-red-300 border-red-800',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${colors[color] || colors.slate}`}>{children}</span>;
};

/* --- MANPOWER MODULE (A-Z) --- */
interface ManpowerProps {
  manpowerList: Manpower[];
  setManpowerList: React.Dispatch<React.SetStateAction<Manpower[]>>;
}

const PREDEFINED_ROLES = [
    'Solar Technician', 
    'Electrician', 
    'Project Manager', 
    'Safety Officer', 
    'Site Supervisor',
    'Helper',
    'Engineer'
];

export const ManpowerModule: React.FC<ManpowerProps> = ({ manpowerList, setManpowerList }) => {
  const [viewMode, setViewMode] = useState<'List' | 'Profile' | 'Payroll' | 'SkillMatrix'>('List');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditResult, setAuditResult] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const [newWorker, setNewWorker] = useState<Partial<Manpower>>({
    name: '', role: 'Solar Technician', status: 'Available', dailyRate: 150000, skills: [], performanceScore: 80, projectsCompleted: 0
  });

  const handleAddWorker = () => {
    if (!newWorker.name) return;
    setManpowerList(prev => [...prev, {
        id: Date.now().toString(),
        name: newWorker.name!,
        role: newWorker.role as string,
        status: 'Available',
        skills: newWorker.skills || [],
        dailyRate: Number(newWorker.dailyRate),
        performanceScore: 80,
        projectsCompleted: 0,
        joinDate: new Date().toISOString(),
        attendanceDaysThisMonth: 0,
        totalEarnedThisMonth: 0,
        attendanceHistory: [],
        documents: []
    }]);
    setShowAddModal(false);
  };

  const handleToggleAttendance = (workerId: string, date: string) => {
      setManpowerList(prev => prev.map(m => {
          if (m.id !== workerId) return m;
          const history = m.attendanceHistory || [];
          const existing = history.find(h => h.date === date);
          
          let newHistory;
          if (existing) {
              // Cycle: Present -> Absent -> Sick -> Remove
              const nextStatus: any = existing.status === 'Present' ? 'Absent' : existing.status === 'Absent' ? 'Sick' : null;
              if (nextStatus) {
                  newHistory = history.map(h => h.date === date ? { ...h, status: nextStatus } : h);
              } else {
                  newHistory = history.filter(h => h.date !== date);
              }
          } else {
              newHistory = [...history, { date, status: 'Present' } as AttendanceRecord];
          }
          
          const daysPresent = newHistory.filter(h => h.status === 'Present').length;
          return { 
              ...m, 
              attendanceHistory: newHistory,
              attendanceDaysThisMonth: daysPresent,
              totalEarnedThisMonth: daysPresent * m.dailyRate
          };
      }));
  };

  const handleAudit = async () => {
      setIsAuditing(true);
      const result = await analyzeSkillMatrix(manpowerList);
      setAuditResult(result);
      setIsAuditing(false);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedWorkerId) {
          const reader = new FileReader();
          reader.onload = () => {
              const base64 = reader.result as string;
              const newDoc: WorkerDocument = {
                  id: Date.now().toString(),
                  name: file.name,
                  type: file.type.includes('pdf') ? 'PDF' : 'Image',
                  url: base64
              };
              setManpowerList(prev => prev.map(m => m.id === selectedWorkerId ? {
                  ...m, documents: [...(m.documents || []), newDoc]
              } : m));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteDoc = (docId: string) => {
      if (selectedWorkerId && confirm("Delete document?")) {
          setManpowerList(prev => prev.map(m => m.id === selectedWorkerId ? {
              ...m, documents: m.documents?.filter(d => d.id !== docId)
          } : m));
      }
  };

  const selectedWorker = manpowerList.find(m => m.id === selectedWorkerId);
  const filteredList = manpowerList.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Skill Data (Key Solar Skills)
  const KEY_SKILLS = ["Safety/K3", "DC Wiring", "AC Install", "Inverter Config", "Roof Work", "Civil Work"];
  // Mock distribution logic based on roles if explicit skills missing
  const skillDistribution = KEY_SKILLS.map(skill => {
      // Logic: If user has skill string OR their role implies it
      const count = manpowerList.filter(m => {
          if (m.skills.includes(skill)) return true;
          // Implicit skills by role
          if (skill === "Safety/K3" && (m.role === "Safety Officer" || m.role === "Site Supervisor")) return true;
          if (skill === "DC Wiring" && (m.role === "Solar Technician" || m.role === "Electrician")) return true;
          if (skill === "Roof Work" && (m.role === "Solar Technician" || m.role === "Helper")) return true;
          return false;
      }).length;
      return { skill, count, fullMark: manpowerList.length };
  });

  // Performance Distribution Data
  const performanceData = [
      { range: '<70%', count: manpowerList.filter(m => m.performanceScore < 70).length },
      { range: '70-80%', count: manpowerList.filter(m => m.performanceScore >= 70 && m.performanceScore < 80).length },
      { range: '80-90%', count: manpowerList.filter(m => m.performanceScore >= 80 && m.performanceScore < 90).length },
      { range: '90%+', count: manpowerList.filter(m => m.performanceScore >= 90).length },
  ];

  // Generate Calendar Days for Attendance
  const getDaysInMonth = () => {
      const days = [];
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) days.push(i);
      return days;
  };

  return (
    <div className="p-6 h-full overflow-y-auto pb-20 bg-[#05010a] text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Users size={24}/></div>
                Human Resources (A-Z)
            </h2>
            <div className="flex gap-4 text-sm mt-2 text-slate-400 font-medium overflow-x-auto">
                {['List', 'Profile', 'Payroll', 'SkillMatrix'].map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode as any)} 
                        className={`hover:text-white transition whitespace-nowrap ${viewMode === mode ? 'text-purple-400 border-b-2 border-purple-400' : ''}`}>
                        {mode.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex gap-3">
            <input 
                type="text" placeholder="Search personnel..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                className="glass-input px-4 py-2 rounded-lg text-sm w-48 md:w-64 border-purple-900/50" 
            />
            <button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Recruit
            </button>
        </div>
      </div>

      {viewMode === 'List' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredList.map((worker) => (
              <Card key={worker.id} className="relative group hover:border-purple-500/50 transition duration-300">
                <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => { setSelectedWorkerId(worker.id); setViewMode('Profile'); }}>
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${worker.status === 'On-Site' ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>
                            {worker.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg group-hover:text-purple-400 transition">{worker.name}</h4>
                            <p className="text-slate-400 text-sm">{worker.role}</p>
                        </div>
                    </div>
                    <Badge color={worker.status === 'Available' ? 'blue' : worker.status === 'On-Site' ? 'emerald' : 'red'}>{worker.status}</Badge>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Performance</span>
                        <span className="text-orange-400 font-mono">{worker.performanceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{width: `${worker.performanceScore}%`}}></div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {worker.skills.slice(0, 3).map(s => <span key={s} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300">{s}</span>)}
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                        <span>Joined: {new Date(worker.joinDate || Date.now()).toLocaleDateString()}</span>
                        <button onClick={() => { setSelectedWorkerId(worker.id); setViewMode('Profile'); }} className="text-purple-400 hover:underline">View Profile</button>
                    </div>
                </div>
              </Card>
            ))}
          </div>
      )}

      {viewMode === 'Profile' && selectedWorker ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Sidebar */}
              <Card className="lg:col-span-1 h-fit">
                  <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-slate-500 mb-4 border-2 border-slate-700">
                          {selectedWorker.name.charAt(0)}
                      </div>
                      <h2 className="text-2xl font-bold text-white">{selectedWorker.name}</h2>
                      <p className="text-purple-400">{selectedWorker.role}</p>
                      <div className="mt-2"><Badge>{selectedWorker.status}</Badge></div>
                  </div>
                  <div className="space-y-4 text-sm">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Daily Rate</span>
                          <span className="text-white font-mono">Rp {selectedWorker.dailyRate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Phone</span>
                          <span className="text-white">{selectedWorker.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-500">Projects Done</span>
                          <span className="text-white">{selectedWorker.projectsCompleted}</span>
                      </div>
                  </div>
                  <button onClick={() => {
                      if(confirm("Terminate this contract?")) {
                          setManpowerList(prev => prev.filter(m => m.id !== selectedWorker.id));
                          setViewMode('List');
                      }
                  }} className="w-full mt-6 bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900 py-2 rounded-lg transition text-sm">
                      Terminate Contract
                  </button>
              </Card>

              {/* Attendance & Docs */}
              <div className="lg:col-span-2 space-y-6">
                  <Card>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar size={18}/> Attendance Tracker (Current Month)</h3>
                      <div className="flex flex-wrap gap-1">
                          {getDaysInMonth().map(day => {
                              const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                              const record = selectedWorker.attendanceHistory?.find(h => h.date === dateStr);
                              let colorClass = 'bg-slate-800 text-slate-500 hover:bg-slate-700'; // Default
                              if (record?.status === 'Present') colorClass = 'bg-purple-600 text-white';
                              if (record?.status === 'Absent') colorClass = 'bg-red-600 text-white';
                              if (record?.status === 'Sick') colorClass = 'bg-yellow-600 text-white';

                              return (
                                  <button 
                                    key={day} 
                                    onClick={() => handleToggleAttendance(selectedWorker.id, dateStr)}
                                    className={`w-9 h-9 rounded text-xs font-mono font-bold transition ${colorClass}`}
                                    title={`Day ${day}: ${record?.status || 'No Record'}`}
                                  >
                                      {day}
                                  </button>
                              );
                          })}
                      </div>
                      <div className="flex gap-4 mt-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-600 rounded"></div> Present</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-600 rounded"></div> Absent</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-600 rounded"></div> Sick</span>
                      </div>
                  </Card>

                  <Card>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileCheck size={18}/> Document Vault</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <input type="file" ref={docInputRef} className="hidden" onChange={handleDocUpload} />
                          <div onClick={() => docInputRef.current?.click()} className="border border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:border-purple-500 hover:text-purple-500 transition cursor-pointer">
                              <Plus size={24} />
                              <span className="text-xs mt-2">Upload KTP/Cert</span>
                          </div>
                          {selectedWorker.documents?.map(doc => (
                              <div key={doc.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between group">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText size={16} className="text-purple-400 shrink-0"/>
                                      <span className="text-sm text-white truncate" title={doc.name}>{doc.name}</span>
                                  </div>
                                  <button onClick={() => handleDeleteDoc(doc.id)} className="text-slate-500 hover:text-red-400"><X size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </Card>
              </div>
          </div>
      ) : viewMode === 'Profile' ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500">
              <UserCheck size={48} className="mb-4 opacity-20"/>
              <p>Please select a personnel from the list.</p>
              <button onClick={() => setViewMode('List')} className="mt-4 text-purple-400 hover:underline">Back to List</button>
          </div>
      ) : null}

      {viewMode === 'Payroll' && (
          <Card>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><DollarSign size={18} className="text-orange-400"/> Payroll Estimation (This Month)</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-900 text-slate-500 text-xs uppercase">
                          <tr>
                              <th className="p-4">Name</th>
                              <th className="p-4">Daily Rate</th>
                              <th className="p-4">Days Present</th>
                              <th className="p-4">Bonus</th>
                              <th className="p-4 text-right">Total Payout</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                          {manpowerList.map(m => (
                              <tr key={m.id} className="hover:bg-slate-800/30">
                                  <td className="p-4 font-bold text-white">{m.name}</td>
                                  <td className="p-4 text-slate-400">Rp {m.dailyRate.toLocaleString()}</td>
                                  <td className="p-4 text-purple-400 font-bold">{m.attendanceDaysThisMonth} Days</td>
                                  <td className="p-4 text-slate-500">-</td>
                                  <td className="p-4 text-right font-mono font-bold text-orange-400">
                                      Rp {m.totalEarnedThisMonth.toLocaleString()}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>
      )}

      {viewMode === 'SkillMatrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                  <h3 className="text-lg font-bold text-white mb-6">Competency Radar (Key Solar Skills)</h3>
                  <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillDistribution}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="skill" stroke="#94a3b8" />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#475569" />
                                <Radar name="Staff Count" dataKey="count" stroke="#9333ea" fill="#9333ea" fillOpacity={0.5} />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff'}} />
                            </RadarChart>
                        </ResponsiveContainer>
                  </div>
              </Card>
              <Card>
                   <h3 className="text-lg font-bold text-white mb-6">Performance Distribution</h3>
                   <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Personnel" />
                             </BarChart>
                        </ResponsiveContainer>
                   </div>
              </Card>
              <Card className="flex flex-col h-full lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={18}/> Genesis Audit
                    </h3>
                    <button onClick={handleAudit} disabled={isAuditing} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                        {isAuditing ? <Sparkles className="animate-spin" size={14}/> : <Zap size={14}/>} 
                        {isAuditing ? 'Auditing...' : 'Run Analysis'}
                    </button>
                  </div>
                  
                  {/* Visual Gap Analysis */}
                  {!auditResult && !isAuditing && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 border border-dashed border-slate-700 rounded-xl mb-4">
                          <Target size={48} className="mb-4 opacity-20"/>
                          <p className="text-xs uppercase tracking-widest text-center">System Idle.<br/>Initiate Audit to detect gaps.</p>
                      </div>
                  )}

                  {auditResult && (
                    <div className="flex-1 overflow-y-auto bg-slate-900/50 p-5 rounded-xl border border-purple-500/20 shadow-lg shadow-purple-900/10">
                        <div className="flex items-center gap-2 mb-4 text-xs font-mono text-purple-400">
                             <CheckCircle size={12}/> AUDIT_COMPLETE
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {auditResult}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <h4 className="text-xs font-bold text-white uppercase mb-3">Quick Actions</h4>
                            <div className="flex gap-2">
                                <button onClick={() => { setShowAddModal(true); setNewWorker(p => ({...p, role: 'Safety Officer'})) }} className="text-xs bg-red-900/30 text-red-300 px-3 py-2 rounded hover:bg-red-900/50">Recruit Safety Officer</button>
                                <button onClick={() => { setShowAddModal(true); setNewWorker(p => ({...p, role: 'Electrician'})) }} className="text-xs bg-purple-900/30 text-purple-300 px-3 py-2 rounded hover:bg-purple-900/50">Recruit Electrician</button>
                            </div>
                        </div>
                    </div>
                  )}
              </Card>
          </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-6">New Recruitment</h3>
                  <input className="w-full glass-input p-3 rounded-lg mb-4" placeholder="Full Name" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} />
                  <select className="w-full glass-input p-3 rounded-lg mb-4" value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})}>
                      {PREDEFINED_ROLES.map(role => <option key={role}>{role}</option>)}
                  </select>
                  <input className="w-full glass-input p-3 rounded-lg mb-4" type="number" placeholder="Daily Rate (IDR)" value={newWorker.dailyRate} onChange={e => setNewWorker({...newWorker, dailyRate: Number(e.target.value)})} />
                  <div className="flex justify-end gap-4">
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400">Cancel</button>
                      <button onClick={handleAddWorker} className="bg-purple-600 px-6 py-2 rounded-lg text-white font-medium">Hire</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

/* --- PROJECT MODULE (FIXED & UPGRADED) --- */
export const ProjectModule: React.FC<{projects: Project[], setProjects: React.Dispatch<React.SetStateAction<Project[]>>}> = ({ projects, setProjects }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ clientName: '', location: '', capacityKWp: 0, value: 0, projectType: 'Commercial' });
    const [analyzingPlan, setAnalyzingPlan] = useState(false);
    const [analyzingRisk, setAnalyzingRisk] = useState(false);
    const [projectFilter, setProjectFilter] = useState('All');
    
    // New State for Efficiency Calculator
    const [efficiencyResult, setEfficiencyResult] = useState<any>(null);
    const [isCalculatingEff, setIsCalculatingEff] = useState(false);
    
    // Auto-save logic for notes
    useEffect(() => {
        if (selectedProject) {
            const timer = setTimeout(() => {
                setProjects(prev => prev.map(p => p.id === selectedProject.id ? selectedProject : p));
            }, 30000); // 30s debounce
            return () => clearTimeout(timer);
        }
    }, [selectedProject?.notes]); // Trigger when notes change

    const handleCreateProject = () => {
        if (!newProject.clientName) return;
        const project: Project = {
            id: Date.now().toString(),
            clientName: newProject.clientName,
            projectType: newProject.projectType,
            location: newProject.location || 'Unknown',
            capacityKWp: Number(newProject.capacityKWp),
            status: ProjectStatus.LEAD,
            progress: 0,
            lastUpdate: new Date().toISOString(),
            financials: { agreedValue: Number(newProject.value), materialCost: 0, laborCost: 0, operationalCost: 0, invoiced: 0, paid: 0 },
            assignedManpowerIds: [],
            schedule: generateStandardSchedule(),
            notes: ''
        };
        setProjects(prev => [project, ...prev]);
        setShowCreateModal(false);
        setNewProject({ clientName: '', location: '', capacityKWp: 0, value: 0, projectType: 'Commercial' });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedProject) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, projectPlan: base64} : p));
                setSelectedProject(prev => prev ? {...prev, projectPlan: base64} : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzePlan = async () => {
        if (!selectedProject || !selectedProject.projectPlan) return;
        setAnalyzingPlan(true);
        const analysis = await analyzeProjectPlan(selectedProject.projectPlan.split(',')[1], 'application/pdf'); // Assume PDF/Doc
        
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...p, planAnalysis: analysis} : p));
        setSelectedProject(prev => prev ? {...prev, planAnalysis: analysis} : null);
        setAnalyzingPlan(false);
    };

    const handleRiskAnalysis = async () => {
        if (!selectedProject) return;
        setAnalyzingRisk(true);
        const risk = await analyzeProjectRisk(selectedProject, projects);
        if (risk) {
            const updated = { ...selectedProject, riskAssessment: risk };
            setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
            setSelectedProject(updated);
        }
        setAnalyzingRisk(false);
    }
    
    const handleCalculateEfficiency = async () => {
        if(!selectedProject) return;
        setIsCalculatingEff(true);
        const result = await calculateProjectEfficiency(selectedProject.capacityKWp);
        setEfficiencyResult(result);
        setIsCalculatingEff(false);
    };

    const handleStatusUpdate = (newStatus: string) => {
        if (!selectedProject) return;
        const updated = { ...selectedProject, status: newStatus as ProjectStatus, lastUpdate: new Date().toISOString() };
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
        setSelectedProject(updated);
    }

    const getRiskColor = (level: string) => {
        switch(level) {
            case 'Low': return 'text-emerald-500 border-emerald-500 bg-emerald-500/20';
            case 'Medium': return 'text-yellow-500 border-yellow-500 bg-yellow-500/20';
            case 'High': return 'text-orange-500 border-orange-500 bg-orange-500/20';
            case 'Critical': return 'text-red-500 border-red-500 bg-red-500/20';
            default: return 'text-slate-500';
        }
    };

    const filteredProjects = projectFilter === 'All' ? projects : projects.filter(p => p.projectType === projectFilter);

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#05010a] text-slate-200">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Briefcase size={24}/></div>
                    Project Operations
                </h2>
                <button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Plus size={16} /> New Project
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LIST */}
                <div className="xl:col-span-1 space-y-4 h-[calc(100vh-200px)] overflow-hidden flex flex-col">
                    <div className="mb-2">
                         <select 
                            value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-300"
                        >
                            <option value="All">All Types</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Residential">Residential</option>
                            <option value="Government">Government</option>
                            <option value="Social">Social</option>
                        </select>
                    </div>
                    <div className="overflow-y-auto pr-2 flex-1 space-y-4">
                        {filteredProjects.map(p => (
                            <div key={p.id} onClick={() => { setSelectedProject(p); setEfficiencyResult(null); }} 
                                className={`p-4 rounded-xl cursor-pointer transition border ${selectedProject?.id === p.id ? 'bg-orange-900/20 border-orange-500/50' : 'glass-panel border-transparent hover:border-orange-500/30'}`}>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-white">{p.clientName}</span>
                                    <Badge color={p.status === 'Konstruksi' ? 'emerald' : 'slate'}>{p.status}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                    <MapPin size={12}/> {p.location} • {p.capacityKWp} kWp
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                     <span className="bg-slate-800 px-1.5 rounded">{p.projectType}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full transition-all" style={{width: `${p.progress}%`}}></div>
                                </div>
                            </div>
                        ))}
                        {filteredProjects.length === 0 && <div className="text-center text-slate-500 py-10">No projects found.</div>}
                    </div>
                </div>

                {/* DETAILS */}
                <div className="xl:col-span-2 glass-panel rounded-2xl p-8 h-[calc(100vh-200px)] overflow-y-auto">
                    {selectedProject ? (
                        <>
                            <div className="flex justify-between items-start mb-8 border-b border-slate-700 pb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedProject.clientName}</h2>
                                    <div className="flex gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><MapPin size={14}/> {selectedProject.location}</span>
                                        <span className="flex items-center gap-1"><Zap size={14}/> {selectedProject.capacityKWp} kWp</span>
                                        <span className="flex items-center gap-1 text-orange-400 font-mono">Rp {selectedProject.financials.agreedValue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                    <select 
                                        value={selectedProject.status} 
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm outline-none focus:border-orange-500"
                                    >
                                        {Object.values(ProjectStatus).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => {
                                        if(confirm("Delete Project?")) {
                                            setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
                                            setSelectedProject(null);
                                        }
                                    }} className="block ml-auto mt-2 text-xs text-red-500 hover:text-red-400">Delete Project</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><ListTodo size={16}/> Construction Schedule</h4>
                                    <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar">
                                        {selectedProject.schedule.map((task, i) => (
                                            <div key={i} className="flex flex-col p-2 hover:bg-slate-800 rounded group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-orange-500' : 'bg-slate-600'}`}></div>
                                                    <span className="text-xs text-slate-300 flex-1">{task.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">W{task.weekStart}</span>
                                                </div>
                                                {task.dependencies && task.dependencies.length > 0 && (
                                                    <div className="ml-5 mt-1 text-[9px] text-slate-600 flex items-center gap-1">
                                                        <LinkIcon size={8} /> Requires: {task.dependencies.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2"><ShieldAlert size={16}/> AI Risk Analysis</h4>
                                            <button onClick={handleRiskAnalysis} disabled={analyzingRisk} className="text-[10px] text-yellow-500 border border-yellow-800 bg-yellow-900/20 px-2 py-1 rounded hover:bg-yellow-900/40">
                                                {analyzingRisk ? 'Analyzing...' : 'Run Analysis'}
                                            </button>
                                        </div>
                                        {selectedProject.riskAssessment ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className={`px-3 py-1 rounded border text-sm font-bold flex items-center gap-2 ${getRiskColor(selectedProject.riskAssessment.level)}`}>
                                                        <AlertTriangle size={14} /> {selectedProject.riskAssessment.level.toUpperCase()}
                                                    </div>
                                                    <span className="text-xl font-bold text-white">{selectedProject.riskAssessment.score}/100</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div className={`h-full ${selectedProject.riskAssessment.score > 70 ? 'bg-red-500' : selectedProject.riskAssessment.score > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{width: `${selectedProject.riskAssessment.score}%`}}></div>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed pl-1 border-l-2 border-slate-700">
                                                    {selectedProject.riskAssessment.analysis}
                                                </p>
                                                {selectedProject.riskAssessment.factors && (
                                                    <div className="text-xs">
                                                        <span className="font-bold text-red-400 uppercase text-[10px]">Risk Factors:</span>
                                                        <ul className="list-disc pl-4 text-slate-400 mt-1 space-y-1">
                                                            {selectedProject.riskAssessment.factors.map((f, i) => <li key={i}>{f}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {selectedProject.riskAssessment.mitigationSuggestions && (
                                                    <div className="text-xs">
                                                        <span className="font-bold text-orange-400 uppercase text-[10px]">Mitigation Plans:</span>
                                                        <ul className="list-disc pl-4 text-slate-400 mt-1 space-y-1">
                                                            {selectedProject.riskAssessment.mitigationSuggestions.map((m, i) => <li key={i}>{m}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500 py-10 text-xs">Analysis not run. Click 'Run Analysis'.</div>
                                        )}
                                    </div>
                                    
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Paperclip size={16}/> Project Plan & Documents</h4>
                                        {!selectedProject.projectPlan ? (
                                            <div className="text-center py-4 border border-dashed border-slate-700 rounded text-slate-500 hover:border-orange-500 cursor-pointer relative">
                                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
                                                <p className="text-xs">Upload PDF/DOC Plan</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-orange-400">
                                                    <FileCheck size={14}/> <span>Plan Uploaded</span>
                                                </div>
                                                <button onClick={handleAnalyzePlan} disabled={analyzingPlan} className="w-full bg-orange-900/30 text-orange-300 border border-orange-700 rounded px-3 py-2 text-xs flex items-center justify-center gap-2">
                                                    <Sparkles size={12}/> {analyzingPlan ? 'Analyzing...' : 'Analyze Plan'}
                                                </button>
                                                {selectedProject.planAnalysis && (
                                                    <div className="text-[10px] text-slate-300 bg-slate-950 p-2 rounded max-h-32 overflow-y-auto">
                                                        {selectedProject.planAnalysis}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="glass-panel p-4 rounded-xl border border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><FileText size={16}/> Site Notes (Auto-saved)</h4>
                                    <textarea 
                                        className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-sm text-slate-200 h-32"
                                        placeholder="Enter project notes here..."
                                        value={selectedProject.notes}
                                        onChange={(e) => setSelectedProject({...selectedProject, notes: e.target.value})}
                                    />
                                    <div className="text-right text-[10px] text-slate-500 mt-1 italic">Saved to LocalDB automatically.</div>
                                </div>
                                <div className="glass-panel p-4 rounded-xl border border-purple-900/30">
                                     <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2"><Calculator size={16} className="text-purple-500"/> Efficiency & Resourcing</h4>
                                        <button 
                                            onClick={handleCalculateEfficiency} 
                                            disabled={isCalculatingEff}
                                            className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                                        >
                                            {isCalculatingEff ? 'Calculating...' : 'Calculate Efficiency'}
                                        </button>
                                     </div>
                                     {efficiencyResult ? (
                                         <div className="space-y-3">
                                             <div className="grid grid-cols-2 gap-2">
                                                 <div className="bg-slate-900 p-2 rounded">
                                                     <div className="text-[10px] text-slate-500 uppercase">Est. Manpower</div>
                                                     <div className="text-lg font-bold text-white">{efficiencyResult.manpowerNeeded} Persons</div>
                                                 </div>
                                                 <div className="bg-slate-900 p-2 rounded">
                                                     <div className="text-[10px] text-slate-500 uppercase">Duration</div>
                                                     <div className="text-lg font-bold text-white">{efficiencyResult.estimatedDurationDays} Days</div>
                                                 </div>
                                             </div>
                                             <div className="bg-slate-900 p-2 rounded">
                                                  <div className="text-[10px] text-slate-500 uppercase">Benchmark Cost / kWp</div>
                                                  <div className="text-sm font-bold text-orange-400 font-mono">Rp {efficiencyResult.costPerKwp?.toLocaleString()}</div>
                                             </div>
                                             <p className="text-[10px] text-slate-400 italic border-l-2 border-purple-500 pl-2">
                                                 "{efficiencyResult.analysis}"
                                             </p>
                                         </div>
                                     ) : (
                                         <div className="h-32 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded">
                                             <Calculator size={24} className="opacity-30 mb-2"/>
                                             <p className="text-xs">Run analysis to see resource estimates per kWp.</p>
                                         </div>
                                     )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">Select a project to view details.</div>
                    )}
                </div>
            </div>

            {/* CREATE PROJECT MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-panel p-8 rounded-2xl w-full max-w-lg border border-orange-900/50">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus className="text-orange-500"/> Initiate New Project
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400">Client / Project Name</label>
                                <input className="w-full glass-input p-3 rounded-lg" value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} placeholder="e.g. PT. Sejahtera Solar" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Project Type</label>
                                <select className="w-full glass-input p-3 rounded-lg" value={newProject.projectType} onChange={e => setNewProject({...newProject, projectType: e.target.value})}>
                                    <option>Commercial</option>
                                    <option>Residential</option>
                                    <option>Government</option>
                                    <option>Social</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Location</label>
                                <input className="w-full glass-input p-3 rounded-lg" value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} placeholder="e.g. Cikarang Industrial Estate" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400">Capacity (kWp)</label>
                                    <input className="w-full glass-input p-3 rounded-lg" type="number" value={newProject.capacityKWp} onChange={e => setNewProject({...newProject, capacityKWp: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Agreed Value (IDR)</label>
                                    <input className="w-full glass-input p-3 rounded-lg" type="number" value={newProject.value} onChange={e => setNewProject({...newProject, value: Number(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-sm">Cancel</button>
                            <button onClick={handleCreateProject} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium">Create Project</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- NEGOTIATION MODULE (EXPANDED) --- */
export const NegotiationModule: React.FC<{projects: Project[]}> = ({ projects }) => {
    const [selectedTab, setSelectedTab] = useState<'Proposal' | 'Simulator' | 'Contract' | 'Competitor'>('Proposal');
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [proposalText, setProposalText] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Competitor Logic
    const [competitorPrice, setCompetitorPrice] = useState(0);
    const [analysisResult, setAnalysisResult] = useState('');

    // Sim Chat
    const [simMessages, setSimMessages] = useState<{sender: string, text: string}[]>([
        {sender: 'Client', text: 'Harganya masih terlalu tinggi. Bisa turun lagi?'}
    ]);
    const [simInput, setSimInput] = useState('');

    const handleGenerateProposal = async () => {
        const project = projects.find(p => p.id === selectedProject);
        if(!project) return;
        setLoading(true);
        const text = await generateProjectProposal(project);
        setProposalText(text);
        setLoading(false);
    };

    const handleSimSend = async () => {
        if(!simInput) return;
        const newHistory = [...simMessages, {sender: 'Me', text: simInput}];
        setSimMessages(newHistory);
        setSimInput('');
        
        const reply = await getNegotiationReply(newHistory, simInput);
        setSimMessages(prev => [...prev, {sender: 'Client', text: reply}]);
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#05010a] text-slate-200">
             <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Zap size={24}/></div>
                Negotiation Command Center
            </h2>

            <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
                {['Proposal', 'Simulator', 'Contract', 'Competitor'].map(tab => (
                    <button key={tab} onClick={() => setSelectedTab(tab as any)}
                        className={`px-4 py-2 text-sm rounded-t-lg transition ${selectedTab === tab ? 'bg-purple-900/30 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:text-white'}`}>
                        {tab} Tool
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {selectedTab === 'Proposal' && (
                <Card className="border border-purple-900/30">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText size={18}/> Proposal Generator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                             <div>
                                <label className="text-xs text-slate-500 block mb-2">Select Project</label>
                                <select 
                                    className="w-full glass-input p-3 rounded-lg text-sm"
                                    value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                                >
                                    <option value="">-- Choose Project --</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.clientName}</option>)}
                                </select>
                            </div>
                            <button onClick={handleGenerateProposal} disabled={loading} className="w-full bg-purple-600 py-3 rounded-lg text-white font-medium flex justify-center items-center gap-2">
                                {loading ? 'Generating...' : 'Generate PDF Proposal'}
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <textarea 
                                className="w-full h-96 glass-input p-4 rounded-lg text-xs font-mono border-purple-500/20"
                                value={proposalText} readOnly placeholder="AI Generated Proposal will appear here..."
                            />
                        </div>
                    </div>
                </Card>
                )}

                {selectedTab === 'Simulator' && (
                <Card>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MessageSquare size={18}/> Battle Simulator (Roleplay)</h3>
                    <div className="h-80 bg-slate-900/50 rounded-xl p-4 overflow-y-auto space-y-3 mb-4 border border-slate-700">
                        {simMessages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.sender === 'Me' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    <div className="text-[10px] opacity-50 mb-1">{m.sender}</div>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            value={simInput} onChange={e => setSimInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSimSend()}
                            className="flex-1 glass-input p-3 rounded-lg text-sm" placeholder="Type your counter-offer..."
                        />
                        <button onClick={handleSimSend} className="bg-purple-600 p-3 rounded-lg text-white"><Send size={18}/></button>
                    </div>
                </Card>
                )}

                {selectedTab === 'Competitor' && (
                    <Card>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Target size={18}/> Competitor Analysis</h3>
                        <p className="text-sm text-slate-400 mb-4">Input competitor pricing to find weaknesses in their offer.</p>
                        <div className="flex gap-4 mb-4">
                            <input className="glass-input p-3 rounded-lg w-64" type="number" placeholder="Competitor Price (IDR)" value={competitorPrice || ''} onChange={e => setCompetitorPrice(Number(e.target.value))} />
                            <button onClick={() => setAnalysisResult("ANALYSIS:\n1. Competitor price is 10% lower.\n2. LIKELY WEAKNESS: Using Tier-2 Inverters or Aluminum Wiring.\n3. COUNTER-ARGUMENT: Highlight our 25-Year Warranty vs their likely 10-Year standard.")} className="bg-red-600 px-6 rounded-lg text-white text-sm font-bold">ANALYZE WEAKNESS</button>
                        </div>
                        {analysisResult && (
                            <div className="bg-slate-900 p-4 rounded-lg border border-red-900/50 text-slate-300 whitespace-pre-wrap font-mono text-sm">
                                {analysisResult}
                            </div>
                        )}
                    </Card>
                )}

                {selectedTab === 'Contract' && (
                    <Card>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileCheck size={18}/> Contract Drafter (SPK)</h3>
                        <p className="text-sm text-slate-400 mb-6">Automatically generates legal SPK documents for Solar Construction.</p>
                        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
                             <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                             <p>Select a Project to Draft Contract</p>
                             <button className="mt-4 text-purple-400 hover:text-purple-300">Browse Projects</button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
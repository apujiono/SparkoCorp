
import React, { useState } from 'react';
import { SafetyIncident, TrainingCourse, Manpower, Project } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Plus, BookOpen, GraduationCap, Users, BarChart2, TrendingUp, Activity, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePie, Pie, Cell } from 'recharts';

/* --- SAFETY (HSE) MODULE --- */
export const SafetyModule: React.FC<{
    incidents: SafetyIncident[], 
    setIncidents: React.Dispatch<React.SetStateAction<SafetyIncident[]>>
}> = ({ incidents, setIncidents }) => {
    const [showModal, setShowModal] = useState(false);
    const [newIncident, setNewIncident] = useState<Partial<SafetyIncident>>({
        type: 'Hazard', description: '', status: 'Open', date: new Date().toISOString().split('T')[0]
    });

    const handleAdd = () => {
        setIncidents(prev => [{
            id: Date.now().toString(),
            type: newIncident.type as any,
            description: newIncident.description || '',
            status: 'Open',
            date: newIncident.date || '',
        }, ...prev]);
        setShowModal(false);
    };

    const safetyScore = Math.max(0, 100 - (incidents.filter(i => i.type !== 'Hazard').length * 5));

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#020617] text-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="text-emerald-500" /> HSE Command Center
                </h2>
                <button onClick={() => setShowModal(true)} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white text-sm font-bold flex items-center gap-2">
                    <AlertTriangle size={16}/> Report Incident
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-xl border border-emerald-900/50">
                    <p className="text-xs text-slate-500 uppercase">Site Safety Score</p>
                    <p className={`text-4xl font-bold font-mono mt-2 ${safetyScore > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{safetyScore}%</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-blue-900/50">
                    <p className="text-xs text-slate-500 uppercase">Days Without Incident</p>
                    <p className="text-4xl font-bold font-mono mt-2 text-blue-400">14 Days</p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-red-900/50">
                    <p className="text-xs text-slate-500 uppercase">Open Hazards</p>
                    <p className="text-4xl font-bold font-mono mt-2 text-red-400">{incidents.filter(i => i.status === 'Open').length}</p>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
                <h3 className="font-bold text-white mb-4">Incident Log</h3>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {incidents.map(inc => (
                            <tr key={inc.id}>
                                <td className="p-3 text-slate-400">{inc.date}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-[10px] ${inc.type === 'Hazard' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>{inc.type}</span>
                                </td>
                                <td className="p-3 text-white">{inc.description}</td>
                                <td className="p-3">
                                    <span className={`flex items-center gap-1 ${inc.status === 'Resolved' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {inc.status === 'Resolved' ? <CheckCircle size={14}/> : <Activity size={14}/>} {inc.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="glass-panel p-6 rounded-xl w-96">
                        <h3 className="font-bold text-white mb-4">Report Incident</h3>
                        <select className="w-full glass-input p-2 rounded mb-3" value={newIncident.type} onChange={e => setNewIncident({...newIncident, type: e.target.value as any})}>
                            <option>Hazard</option><option>Near Miss</option><option>Minor Injury</option><option>Equipment Damage</option>
                        </select>
                        <textarea className="w-full glass-input p-2 rounded mb-3" placeholder="Description..." value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="text-slate-400">Cancel</button>
                            <button onClick={handleAdd} className="bg-red-600 px-4 py-2 rounded text-white">Submit Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- TRAINING (LMS) MODULE --- */
export const TrainingModule: React.FC<{
    courses: TrainingCourse[],
    setCourses: React.Dispatch<React.SetStateAction<TrainingCourse[]>>,
    manpower: Manpower[]
}> = ({ courses, setCourses, manpower }) => {
    const [showModal, setShowModal] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', duration: 0 });

    const handleAdd = () => {
        setCourses(prev => [...prev, {
            id: Date.now().toString(),
            title: newCourse.title,
            description: 'Standard Module',
            durationHours: Number(newCourse.duration),
            enrolledManpowerIds: []
        }]);
        setShowModal(false);
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#020617] text-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="text-blue-500" /> Training Academy
                </h2>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white text-sm font-bold flex items-center gap-2">
                    <Plus size={16}/> New Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="glass-panel p-6 rounded-xl border border-blue-900/30 hover:border-blue-500 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                                <BookOpen size={24}/>
                            </div>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{course.durationHours} Hours</span>
                        </div>
                        <h3 className="font-bold text-white text-lg mb-2">{course.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                            <Users size={14}/> {course.enrolledManpowerIds.length} Enrolled
                        </div>
                        <button className="w-full py-2 bg-slate-800 hover:bg-blue-600 hover:text-white rounded text-sm transition">Manage Enrollment</button>
                    </div>
                ))}
            </div>

             {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="glass-panel p-6 rounded-xl w-96">
                        <h3 className="font-bold text-white mb-4">Create Course</h3>
                        <input className="w-full glass-input p-2 rounded mb-3" placeholder="Course Title" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                        <input className="w-full glass-input p-2 rounded mb-3" type="number" placeholder="Duration (Hours)" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: Number(e.target.value)})} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="text-slate-400">Cancel</button>
                            <button onClick={handleAdd} className="bg-blue-600 px-4 py-2 rounded text-white">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- BUSINESS INTELLIGENCE (BI) MODULE --- */
export const AnalyticsModule: React.FC<{ projects: Project[] }> = ({ projects }) => {
    // Mock Data based on real props
    const data = projects.map(p => ({
        name: p.clientName,
        revenue: p.financials.agreedValue,
        cost: p.financials.materialCost + p.financials.laborCost,
        profit: p.financials.agreedValue - (p.financials.materialCost + p.financials.laborCost)
    }));

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#020617] text-slate-200">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-8">
                <BarChart2 className="text-purple-500" /> Business Intelligence
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-6 rounded-xl h-80">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16}/> Revenue vs Cost</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                             <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                             <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                             <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                             <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                 <div className="glass-panel p-6 rounded-xl h-80">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><PieChart size={16}/> Profit Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RePie data={data} dataKey="profit" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                            ))}
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                        </RePie>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
                 <h3 className="font-bold text-white mb-4">Financial Heatmap</h3>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-slate-900 text-slate-500 uppercase text-xs">
                             <tr>
                                 <th className="p-3">Project</th>
                                 <th className="p-3">Revenue</th>
                                 <th className="p-3">Cost</th>
                                 <th className="p-3">Net Profit</th>
                                 <th className="p-3">Margin %</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                             {data.map((row, i) => {
                                 const margin = (row.profit / row.revenue) * 100;
                                 return (
                                     <tr key={i} className="hover:bg-slate-900/50">
                                         <td className="p-3 text-white font-medium">{row.name}</td>
                                         <td className="p-3 text-slate-300">Rp {row.revenue.toLocaleString()}</td>
                                         <td className="p-3 text-red-300">Rp {row.cost.toLocaleString()}</td>
                                         <td className="p-3 text-emerald-400 font-bold">Rp {row.profit.toLocaleString()}</td>
                                         <td className="p-3">
                                             <span className={`px-2 py-1 rounded text-xs ${margin > 20 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                                 {margin.toFixed(1)}%
                                             </span>
                                         </td>
                                     </tr>
                                 )
                             })}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};

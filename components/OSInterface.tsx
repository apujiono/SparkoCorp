import React, { useState, useEffect } from 'react';
import { Power, Lock, LayoutGrid, Battery, Wifi, Volume2, Search, X, Square, Minus, Globe, ShieldCheck, Zap, Activity } from 'lucide-react';

/* --- 1. BOOT LOADER --- */
export const BootLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);
    
    useEffect(() => {
        const sequence = [
            "BIOS CHECK... OK",
            "LOADING KERNEL... [SPARKO_CORE_V11]",
            "MOUNTING FILE SYSTEMS... SUCCESS",
            "CONNECTING TO NEURAL NET... OK",
            "INITIALIZING GRAPHICS ENGINE... DONE",
            "LOADING USER PROFILE... OK",
            "SYSTEM READY."
        ];
        
        let delay = 0;
        sequence.forEach((line, index) => {
            delay += Math.random() * 500 + 200;
            setTimeout(() => {
                setLines(prev => [...prev, line]);
                if (index === sequence.length - 1) {
                    setTimeout(onComplete, 800);
                }
            }, delay);
        });
    }, []);

    return (
        <div className="fixed inset-0 bg-black text-green-500 font-mono p-10 z-50 flex flex-col justify-end crt">
            {lines.map((line, i) => (
                <div key={i} className="mb-2 text-sm md:text-base animate-pulse">
                    <span className="text-purple-500 mr-2">root@sparko-os:~#</span>
                    {line}
                </div>
            ))}
            <div className="h-2 w-4 bg-green-500 animate-bounce mt-2"></div>
        </div>
    );
};

/* --- 2. LOGIN SCREEN --- */
export const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [scanning, setScanning] = useState(false);

    const handleLogin = (e?: React.FormEvent) => {
        e?.preventDefault();
        setScanning(true);
        setTimeout(() => {
            if (password === 'admin' || password === '') { // Simple for demo
                onLogin();
            } else {
                setError(true);
                setScanning(false);
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-[#05010a] flex items-center justify-center z-40 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            
            <div className="glass-panel p-10 rounded-2xl w-full max-w-md relative z-10 flex flex-col items-center border-purple-500/30">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-orange-600 p-1 mb-6 shadow-[0_0_30px_rgba(147,51,234,0.5)]">
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                        <Zap size={40} className="text-white" />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-white tracking-widest mb-1">SPARKO CORP</h1>
                <p className="text-xs text-purple-400 font-mono mb-8 uppercase tracking-[0.3em]">Enterprise OS v11.0</p>

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                        <input 
                            type="password" 
                            placeholder="Enter Passkey" 
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(false); }}
                            className="w-full glass-input py-3 pl-10 pr-4 rounded-lg text-sm bg-black/50"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={scanning}
                        className="w-full bg-gradient-to-r from-purple-700 to-orange-700 hover:from-purple-600 hover:to-orange-600 text-white font-bold py-3 rounded-lg transition shadow-lg relative overflow-hidden"
                    >
                        {scanning ? (
                            <span className="flex items-center justify-center gap-2">
                                <Activity className="animate-spin" size={16} /> AUTHENTICATING...
                            </span>
                        ) : "INITIALIZE SESSION"}
                    </button>
                    
                    {error && <p className="text-red-500 text-xs text-center font-mono">ACCESS DENIED. INVALID CREDENTIALS.</p>}
                </form>
                
                <div className="mt-8 text-[10px] text-slate-500 font-mono">
                    SECURE CONNECTION ESTABLISHED
                </div>
            </div>
        </div>
    );
};

/* --- 3. DESKTOP ENVIRONMENT --- */
export const Taskbar: React.FC<{ 
    activeApp: string | null, 
    toggleApp: (app: string) => void,
    currentTime: Date 
}> = ({ activeApp, toggleApp, currentTime }) => {
    return (
        <div className="h-12 glass-panel border-t border-purple-500/30 fixed bottom-0 left-0 right-0 flex items-center px-4 justify-between z-30">
            <div className="flex items-center gap-4">
                <button className="p-2 rounded hover:bg-white/10 text-orange-500 transition">
                    <LayoutGrid size={20} />
                </button>
                <div className="h-6 w-[1px] bg-white/10"></div>
                
                <div className="flex items-center gap-2">
                    {/* Running App Indicator */}
                    {activeApp && (
                        <button className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded border-b-2 border-orange-500 text-xs font-bold text-white transition">
                            <Zap size={14} className="text-purple-400" />
                            {activeApp}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
                    <ShieldCheck size={14} className="text-emerald-500" /> Secure
                </div>
                <div className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
                    <Wifi size={14} /> Sparko_Net_5G
                </div>
                <div className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
                    <Volume2 size={14} /> 80%
                </div>
                <div className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
                    <Battery size={14} className="text-green-500" /> 100%
                </div>
                <div className="pl-4 border-l border-white/10 text-orange-400 font-bold">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </div>
    );
};

export const WindowFrame: React.FC<{ 
    title: string, 
    children: React.ReactNode, 
    onClose: () => void,
    isMaximized?: boolean
}> = ({ title, children, onClose }) => {
    return (
        <div className="absolute inset-2 md:inset-8 bottom-14 bg-[#05010a] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-purple-500/30 animate-fade-in z-20">
            {/* Window Header */}
            <div className="h-10 bg-[#0f0518] border-b border-purple-900/50 flex items-center justify-between px-4 select-none drag-handle">
                <div className="flex items-center gap-3">
                    <Zap size={16} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-white/10 rounded text-slate-500"><Minus size={14} /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded text-slate-500"><Square size={14} /></button>
                    <button onClick={onClose} className="p-1.5 hover:bg-red-500 rounded text-slate-500 hover:text-white transition"><X size={14} /></button>
                </div>
            </div>
            {/* Window Content */}
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </div>
    );
};

export const DesktopIcon: React.FC<{ 
    label: string, 
    icon: any, 
    onClick: () => void 
}> = ({ label, icon: Icon, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="w-24 h-24 flex flex-col items-center justify-center gap-2 rounded-xl hover:bg-white/10 cursor-pointer transition group"
        >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-900/50 to-slate-900 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:border-orange-500 transition shadow-lg group-hover:shadow-orange-500/20">
                <Icon className="text-slate-300 group-hover:text-white" size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-black/50 px-2 py-0.5 rounded shadow-sm group-hover:text-white text-center leading-tight">
                {label}
            </span>
        </div>
    );
};
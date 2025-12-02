import React, { useState } from 'react';
import { calculateSolarProject } from '../services/geminiService';
import { Calculator, Zap, DollarSign, TrendingUp, CheckCircle, Loader2, BatteryCharging, Cable, Settings, Sun, Power } from 'lucide-react';
import { InventoryItem, WiringCalculation } from '../types';

interface CalculatorProps {
    inventory: InventoryItem[];
    plnRate?: number; // Added PLN Rate prop
}

export const CalculatorModule: React.FC<CalculatorProps> = ({ inventory, plnRate = 1444 }) => {
    const [activeTab, setActiveTab] = useState<'Cost' | 'Wiring'>('Cost');
    const [capacity, setCapacity] = useState<number>(10);
    const [roofType, setRoofType] = useState('Genteng Metal');
    const [systemType, setSystemType] = useState('On-Grid');
    
    // Hybrid/Off-Grid Params
    const [dailyLoad, setDailyLoad] = useState(15); // kWh
    const [autonomyDays, setAutonomyDays] = useState(1);
    const [systemVoltage, setSystemVoltage] = useState(48); // 48V

    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Wiring State
    const [panelWattage, setPanelWattage] = useState(550);
    const [inverterSize, setInverterSize] = useState(5000); // 5kW
    const [wiringResult, setWiringResult] = useState<WiringCalculation | null>(null);

    const handleCalculate = async () => {
        setLoading(true);
        const hybridParams = { dailyLoad, autonomyDays, systemVoltage };
        const jsonString = await calculateSolarProject(capacity, roofType, systemType, inventory, hybridParams, plnRate);
        try {
            setResult(JSON.parse(jsonString));
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
        setLoading(false);
    };

    const handleWiringCalculate = () => {
        const totalPanels = Math.ceil((capacity * 1000) / panelWattage);
        const totalInverters = Math.ceil((capacity * 1000) / inverterSize);
        const panelsPerString = Math.floor(totalPanels / totalInverters); // Simple heuristic
        
        // Cable Estimate: (Panels * 1.5m) + (Home Run * Inverters * 2)
        const estimatedCable = (totalPanels * 1.5) + (totalInverters * 50);

        setWiringResult({
            targetKWp: capacity,
            panelWattage,
            inverterCapacity: inverterSize,
            totalPanels,
            totalInverters,
            stringConfig: `${totalInverters} x Inverters with ${panelsPerString} Panels/String`,
            estimatedCableDC: estimatedCable
        });
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#020617] text-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calculator className="text-orange-500" />
                    System Engineer
                </h2>
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button onClick={() => setActiveTab('Cost')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'Cost' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>Cost Estimator</button>
                    <button onClick={() => setActiveTab('Wiring')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'Wiring' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>Wiring & Sizing</button>
                </div>
            </div>

            {activeTab === 'Cost' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
                        <h3 className="text-lg font-semibold text-white mb-4">System Parameters</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-2">System Topology</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['On-Grid', 'Off-Grid', 'Hybrid'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setSystemType(type)}
                                        className={`p-2 text-xs font-mono uppercase border rounded-lg transition ${systemType === type ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-2">Capacity (kWp)</label>
                            <input 
                                type="number" 
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                            />
                        </div>

                        {/* Hybrid/Off-Grid Inputs */}
                        {(systemType === 'Hybrid' || systemType === 'Off-Grid') && (
                            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3 animate-fade-in">
                                <h4 className="text-xs font-bold text-yellow-500 uppercase flex items-center gap-2"><BatteryCharging size={12}/> Battery Config</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Daily Load (kWh)</label>
                                        <input type="number" value={dailyLoad} onChange={(e) => setDailyLoad(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Autonomy (Days)</label>
                                        <input type="number" value={autonomyDays} onChange={(e) => setAutonomyDays(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Sys Voltage (V)</label>
                                        <select value={systemVoltage} onChange={(e) => setSystemVoltage(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white">
                                            <option value={12}>12V</option>
                                            <option value={24}>24V</option>
                                            <option value={48}>48V</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm text-slate-400 mb-2">Roof Type</label>
                            <select 
                                value={roofType}
                                onChange={(e) => setRoofType(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                            >
                                <option value="Genteng Metal">Genteng Metal</option>
                                <option value="Dak Beton">Dak Beton</option>
                                <option value="Spandek/Zincalume">Spandek / Zincalume</option>
                                <option value="Genteng Keramik">Genteng Keramik</option>
                                <option value="Ground Mount">Ground Mount (Tanah)</option>
                            </select>
                        </div>
                        
                        <div className="mb-6">
                             <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                <span>Ref. PLN Rate</span>
                                <span className="text-orange-500 font-mono">Rp {plnRate}/kWh</span>
                             </div>
                        </div>

                        <button 
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-lg shadow-purple-900/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                            {loading ? 'CALCULATING SYSTEM...' : 'RUN ESTIMATION'}
                        </button>
                    </div>

                    {/* Result Section */}
                    <div className="space-y-4">
                        {result ? (
                            <>
                                <div className="bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-800 p-6 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Zap size={100} />
                                    </div>
                                    <h3 className="text-purple-400 font-bold text-lg mb-1 uppercase tracking-wide">Total Estimate</h3>
                                    <p className="text-3xl font-bold text-white font-mono">Rp {result.systemPrice?.toLocaleString()}</p>
                                    <p className="text-sm text-slate-400 mt-1 font-mono">@ Rp {result.pricePerKwp?.toLocaleString()} / kWp</p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="text-[10px] bg-purple-900/50 text-purple-300 border border-purple-700 px-2 py-1 rounded">{systemType}</span>
                                        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded">{capacity} kWp</span>
                                    </div>
                                </div>

                                {(systemType === 'Hybrid' || systemType === 'Off-Grid') && result.batteryCapacityAh && (
                                    <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl">
                                        <h4 className="text-yellow-500 font-bold text-sm mb-3 flex items-center gap-2">
                                            <BatteryCharging size={16}/> Battery Requirement
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase">Bank Capacity</p>
                                                <p className="text-xl font-bold text-white font-mono">{result.batteryCapacityAh} Ah</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase">Total Batteries</p>
                                                <p className="text-xl font-bold text-white font-mono">~ {result.totalBatteries} Units</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <TrendingUp size={16} className="text-purple-500" />
                                            <span className="text-xs uppercase">ROI (Years)</span>
                                        </div>
                                        <p className="text-xl font-bold text-white font-mono">{result.roiYears} Tahun</p>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <DollarSign size={16} className="text-orange-500" />
                                            <span className="text-xs uppercase">Saving / Month</span>
                                        </div>
                                        <p className="text-xl font-bold text-white font-mono">Rp {result.monthlySaving?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                                    <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14} className="text-orange-500"/> Profitability Analysis</h4>
                                    <div className="space-y-3 font-mono">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Material Cost</span>
                                            <span className="text-white">Rp {result.materialCost?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Labor Cost</span>
                                            <span className="text-white">Rp {result.laborCost?.toLocaleString()}</span>
                                        </div>
                                        <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                                            <span className="text-orange-400">Net Margin</span>
                                            <span className="text-orange-400">Rp {result.margin?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-slate-800 rounded-lg text-xs text-slate-300 italic font-sans leading-relaxed border-l-2 border-purple-500">
                                        "{result.analysis}"
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-8">
                                <Calculator size={48} className="opacity-20 mb-4" />
                                <p className="text-xs font-mono uppercase tracking-widest">AWAITING PARAMETER INPUT</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
                        <h3 className="text-lg font-semibold text-white mb-4">Technical Sizing</h3>
                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-2">Total System Capacity (kWp)</label>
                            <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full glass-input p-3 rounded-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Panel Model (Wp)</label>
                                <select value={panelWattage} onChange={(e) => setPanelWattage(Number(e.target.value))} className="w-full glass-input p-3 rounded-lg">
                                    <option value={450}>450 Wp</option>
                                    <option value={550}>550 Wp</option>
                                    <option value={600}>600 Wp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Inverter (W)</label>
                                <select value={inverterSize} onChange={(e) => setInverterSize(Number(e.target.value))} className="w-full glass-input p-3 rounded-lg">
                                    <option value={3000}>3 kW</option>
                                    <option value={5000}>5 kW</option>
                                    <option value={10000}>10 kW</option>
                                    <option value={20000}>20 kW</option>
                                    <option value={50000}>50 kW</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleWiringCalculate} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                             <Settings size={18} /> Run Sizing
                        </button>
                    </div>

                    <div className="space-y-4">
                        {wiringResult ? (
                            <div className="glass-panel p-6 rounded-xl border border-purple-500/30">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Cable className="text-purple-400" /> Configuration
                                </h3>
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Total Panels</p>
                                        <p className="text-2xl font-bold text-white font-mono">{wiringResult.totalPanels} <span className="text-sm font-normal text-slate-400">pcs</span></p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Total Inverters</p>
                                        <p className="text-2xl font-bold text-white font-mono">{wiringResult.totalInverters} <span className="text-sm font-normal text-slate-400">units</span></p>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
                                    <p className="text-xs text-slate-500 uppercase mb-2">String Config</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <p className="text-orange-400 font-mono text-lg">{wiringResult.stringConfig}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase mb-2">Est. DC Cable (PV Cable)</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <p className="text-yellow-400 font-mono text-lg">~ {wiringResult.estimatedCableDC} Meters</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-8">
                                <Settings size={48} className="opacity-20 mb-4" />
                                <p className="text-xs font-mono uppercase tracking-widest">AWAITING SIZING INPUT</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
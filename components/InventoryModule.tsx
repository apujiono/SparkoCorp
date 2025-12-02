
import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryTransaction, Supplier } from '../types';
import { analyzeInventorySpec, analyzeStockItem } from '../services/geminiService';
import { Package, ArrowUpRight, ArrowDownLeft, AlertTriangle, Search, Plus, History, FileText, X, Sparkles, Filter, Users, Link as LinkIcon, ArrowUpDown } from 'lucide-react';

interface InventoryProps {
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    transactions: InventoryTransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
}

export const InventoryModule: React.FC<InventoryProps> = ({ inventory, setInventory, transactions, setTransactions, suppliers, setSuppliers }) => {
    const [view, setView] = useState<'Stock' | 'History' | 'Suppliers'>('Stock');
    const [filter, setFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState<{type: 'IN' | 'OUT', item: InventoryItem} | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<{itemId: string, text: string} | null>(null);
    const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryTransaction, direction: 'asc' | 'desc' } | null>(null);

    // History Filters
    const [historyFilter, setHistoryFilter] = useState({ start: '', end: '', type: 'ALL', pic: '' });

    // New Item Form
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
        name: '', category: 'Solar Panel', stock: 0, unit: 'pcs', minStock: 5, location: 'Gudang A', pricePerUnit: 0, supplierId: ''
    });

    // New Supplier Form
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
        name: '', contactPerson: '', phone: '', category: 'Panels', rating: 5
    });

    // Transaction Form
    const [txForm, setTxForm] = useState({ amount: 0, notes: '', pic: 'Admin' });

    const handleCreateItem = () => {
        if(!newItem.name) return;
        const item: InventoryItem = {
            id: Date.now().toString(),
            name: newItem.name!,
            category: newItem.category as any,
            stock: Number(newItem.stock),
            unit: newItem.unit || 'pcs',
            minStock: Number(newItem.minStock),
            location: newItem.location || 'Gudang',
            pricePerUnit: Number(newItem.pricePerUnit),
            lastUpdated: new Date().toISOString(),
            supplierId: newItem.supplierId
        };
        setInventory(prev => [item, ...prev]);
        setShowAddModal(false);
        setNewItem({ name: '', category: 'Solar Panel', stock: 0, unit: 'pcs', minStock: 5, location: 'Gudang A', pricePerUnit: 0, supplierId: '' });
    };

    const handleCreateSupplier = () => {
        if(!newSupplier.name) return;
        setSuppliers(prev => [...prev, {
            id: Date.now().toString(),
            name: newSupplier.name!,
            contactPerson: newSupplier.contactPerson || '-',
            phone: newSupplier.phone || '-',
            category: newSupplier.category || 'General',
            rating: 5
        }]);
        setShowSupplierModal(false);
        setNewSupplier({ name: '', contactPerson: '', phone: '', category: 'Panels', rating: 5 });
    };

    const handleAnalyzeStock = async (item: InventoryItem) => {
        setAnalyzingItem(item.id);
        const result = await analyzeStockItem(item);
        setAiAnalysis({ itemId: item.id, text: result });
        setAnalyzingItem(null);
    };

    const handleTransaction = () => {
        if (!showActionModal || txForm.amount <= 0) return;
        
        const { type, item } = showActionModal;
        const newStock = type === 'IN' ? item.stock + txForm.amount : item.stock - txForm.amount;
        
        if (newStock < 0) {
            alert('Stok tidak mencukupi!');
            return;
        }

        // Update Stock
        setInventory(prev => prev.map(i => i.id === item.id ? { ...i, stock: newStock, lastUpdated: new Date().toISOString() } : i));

        // Record Transaction
        const transaction: InventoryTransaction = {
            id: Date.now().toString(),
            itemId: item.id,
            itemName: item.name,
            type: type,
            amount: txForm.amount,
            date: new Date().toISOString(),
            notes: txForm.notes || '-',
            PIC: txForm.pic
        };
        setTransactions(prev => [transaction, ...prev]);

        setShowActionModal(null);
        setTxForm({ amount: 0, notes: '', pic: 'Admin' });
    };

    const handleSort = (key: keyof InventoryTransaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredItems = inventory.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()));

    const filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date).getTime();
        const start = historyFilter.start ? new Date(historyFilter.start).getTime() : 0;
        const end = historyFilter.end ? new Date(historyFilter.end).getTime() + 86400000 : Infinity;
        const typeMatch = historyFilter.type === 'ALL' || t.type === historyFilter.type;
        const picMatch = t.PIC.toLowerCase().includes(historyFilter.pic.toLowerCase());
        return date >= start && date < end && typeMatch && picMatch;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="p-6 h-full overflow-y-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Package className="text-orange-500" />
                        Gudang Material & Logistik
                    </h2>
                    <div className="flex gap-4 text-sm mt-2 overflow-x-auto">
                         {['Stock', 'History', 'Suppliers'].map(v => (
                             <button key={v} onClick={() => setView(v as any)} className={`${view === v ? 'text-orange-400 border-b border-orange-400' : 'text-slate-400 hover:text-white'} pb-1 transition whitespace-nowrap`}>
                                 {v}
                             </button>
                         ))}
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {view === 'Stock' && (
                        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex items-center flex-1">
                            <Search className="text-slate-500 mr-2" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari item..." 
                                className="bg-transparent outline-none text-white placeholder-slate-500 w-full"
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                    )}
                    {view === 'Suppliers' && (
                        <button onClick={() => setShowSupplierModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 whitespace-nowrap">
                            <Plus size={16}/> New Supplier
                        </button>
                    )}
                    {view === 'Stock' && (
                        <>
                            <button 
                                onClick={() => { setShowActionModal({type:'IN', item: inventory[0]}); /* Hacky quick access */}}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs flex items-center gap-2 whitespace-nowrap border border-slate-600"
                            >
                                <ArrowDownLeft size={14} /> Quick Adjust
                            </button>
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} /> New Item
                            </button>
                        </>
                    )}
                </div>
            </div>

            {view === 'Stock' ? (
                <>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4 hidden md:table-cell">Category</th>
                                    <th className="p-4 hidden md:table-cell">Supplier</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4 text-center">AI Analysis</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredItems.map(item => {
                                    const supplier = suppliers.find(s => s.id === item.supplierId);
                                    const isLow = item.stock <= item.minStock;
                                    return (
                                    <React.Fragment key={item.id}>
                                    <tr className={`hover:bg-slate-800/50 transition ${isLow ? 'bg-red-900/10' : ''}`}>
                                        <td className="p-4">
                                            <div className="font-medium text-white flex items-center gap-2">
                                                {item.name}
                                                {isLow && <AlertTriangle size={14} className="text-red-500 animate-pulse"/>}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                ID: {item.id.slice(-4)} • Rp {item.pricePerUnit.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-sm text-blue-400">
                                            {supplier ? supplier.name : <span className="text-slate-600 italic">No Link</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className={`font-bold ${isLow ? 'text-red-500' : 'text-emerald-400'}`}>
                                                {item.stock} {item.unit}
                                            </div>
                                            <div className="text-[10px] text-slate-500">Min: {item.minStock}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleAnalyzeStock(item)} disabled={analyzingItem === item.id} className="bg-purple-900/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-900/40 transition text-xs flex items-center gap-2 mx-auto">
                                                {analyzingItem === item.id ? <Sparkles size={12} className="animate-spin"/> : <Sparkles size={12}/>} Analyze
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setShowActionModal({ type: 'IN', item })} className="p-1.5 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 rounded-lg">
                                                    <ArrowDownLeft size={16} />
                                                </button>
                                                <button onClick={() => setShowActionModal({ type: 'OUT', item })} className="p-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg">
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {aiAnalysis?.itemId === item.id && (
                                        <tr>
                                            <td colSpan={6} className="bg-purple-900/10 p-4 border-b border-slate-800">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="text-xs font-bold text-purple-400 uppercase mb-1">AI Recommendation</h4>
                                                        <p className="text-xs text-purple-200 font-mono leading-relaxed whitespace-pre-wrap">{aiAnalysis.text}</p>
                                                    </div>
                                                    <button onClick={() => setAiAnalysis(null)} className="ml-4 hover:bg-slate-800 p-1 rounded"><X size={14} className="text-slate-400"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : view === 'Suppliers' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {suppliers.map(sup => (
                        <div key={sup.id} className="glass-panel p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400">
                                    <Users size={24}/>
                                </div>
                                <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400">{sup.category}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{sup.name}</h3>
                            <p className="text-sm text-slate-400 mb-4">{sup.contactPerson} • {sup.phone}</p>
                            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300">View Catalog</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {/* HISTORY VIEW */}
                    <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center">
                         {/* Existing Filters Code */}
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400 text-xs uppercase cursor-pointer">
                            <tr>
                                <th className="p-4 hover:text-white" onClick={() => handleSort('date')}>Date <ArrowUpDown size={10} className="inline"/></th>
                                <th className="p-4 hover:text-white" onClick={() => handleSort('type')}>Type <ArrowUpDown size={10} className="inline"/></th>
                                <th className="p-4 hover:text-white" onClick={() => handleSort('itemName')}>Item <ArrowUpDown size={10} className="inline"/></th>
                                <th className="p-4 hover:text-white" onClick={() => handleSort('amount')}>Amount <ArrowUpDown size={10} className="inline"/></th>
                                <th className="p-4 hover:text-white" onClick={() => handleSort('PIC')}>PIC <ArrowUpDown size={10} className="inline"/></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                                    <td className="p-4 text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{tx.type}</span></td>
                                    <td className="p-4 text-white text-sm">{tx.itemName}</td>
                                    <td className="p-4 font-mono text-white">{tx.amount}</td>
                                    <td className="p-4 text-sm text-slate-300">{tx.PIC}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD ITEM MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Input Material Baru</h3>
                        <div className="space-y-3">
                            <input className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" 
                                placeholder="Nama Barang" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                    value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})}>
                                    <option>Solar Panel</option><option>Inverter</option><option>Cable</option><option>Mounting</option><option>Accessories</option><option>Tools</option>
                                </select>
                                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                    value={newItem.supplierId} onChange={e => setNewItem({...newItem, supplierId: e.target.value})}>
                                    <option value="">-- Link Supplier --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <input className="bg-slate-800 border border-slate-700 rounded p-2 text-white" type="number" placeholder="Initial Stock" 
                                    value={newItem.stock} onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})} />
                                <input className="bg-slate-800 border border-slate-700 rounded p-2 text-white" placeholder="Unit (e.g. pcs, m)" 
                                    value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                            </div>
                            <input className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" placeholder="Lokasi Gudang" 
                                value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} />
                            <input className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" type="number" placeholder="Harga per Unit (IDR)" 
                                value={newItem.pricePerUnit} onChange={e => setNewItem({...newItem, pricePerUnit: Number(e.target.value)})} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400">Cancel</button>
                            <button onClick={handleCreateItem} className="bg-orange-600 px-4 py-2 rounded text-white">Simpan Barang</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD SUPPLIER MODAL */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Register New Supplier</h3>
                        <div className="space-y-3">
                            <input className="w-full glass-input p-2 rounded" placeholder="Company Name" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                            <input className="w-full glass-input p-2 rounded" placeholder="Contact Person" value={newSupplier.contactPerson} onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})} />
                            <input className="w-full glass-input p-2 rounded" placeholder="Phone" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                            <input className="w-full glass-input p-2 rounded" placeholder="Category (e.g. Panels)" value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowSupplierModal(false)} className="text-slate-400">Cancel</button>
                            <button onClick={handleCreateSupplier} className="bg-blue-600 px-4 py-2 rounded text-white">Register</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION MODAL (IN/OUT) */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6">
                         <h3 className={`text-lg font-bold mb-1 ${showActionModal.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {showActionModal.type === 'IN' ? 'Barang Masuk (IN)' : 'Barang Keluar (OUT)'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">{showActionModal.item.name}</p>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500">Jumlah ({showActionModal.item.unit})</label>
                                <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-lg font-bold" 
                                    autoFocus
                                    value={txForm.amount} onChange={e => setTxForm({...txForm, amount: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">PIC</label>
                                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" 
                                    value={txForm.pic} onChange={e => setTxForm({...txForm, pic: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => {setShowActionModal(null); setTxForm({amount:0, notes:'', pic:'Admin'})}} className="text-slate-400">Cancel</button>
                            <button onClick={handleTransaction} className={`px-4 py-2 rounded text-white ${showActionModal.type === 'IN' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

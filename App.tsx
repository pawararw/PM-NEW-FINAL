import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area
} from 'recharts';
import { 
  CheckCircle, 
  Monitor, 
  TrendingUp, 
  FileText,
  Layers,
  Edit2,
  Plus,
  X,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  Settings,
  Wrench,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  Share2,
  Cpu,
  Activity,
  Home,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Printer,
  PrinterIcon,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Download,
  Unlock,
  Calendar,
  ShieldCheck,
  Info,
  Camera,
  Image as ImageIcon,
  Upload,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_PM_DATA, DEPARTMENTS, DEVICE_STATUS_OPTIONS, COMPUTER_STANDARD_ACTIVITIES, PRINTER_STANDARD_ACTIVITIES } from './constants';
import { PMItem } from './types';
import * as XLSX from 'xlsx';

// --- CONFIGURATION ---
const COMPANY_NAME = 'TCITRENDROUP'; 
const LOGO_TEXT = 'T.T.g';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbz33ZEnFiGga00KxZ452_nsgVWGkOsO351GBmEK1fJziXSYzVBFTp03gBbofp3-J7ATMQ/exec';
const SECURITY_PIN = '1234';

// Theme Palette: Midnight Emerald (ไล่เฉดเขียวมรกต, เทาเข้ม, และน้ำเงินเข้ม)
const CHART_COLORS = [
  '#065f46', // Emerald 800
  '#0f172a', // Slate 900 (Dark Blue/Grey)
  '#059669', // Emerald 600
  '#1e293b', // Slate 800
  '#10b981', // Emerald 500
  '#334155', // Slate 700
  '#34d399', // Emerald 400
  '#064e3b', // Deep Dark Green
];

// Bouncy Animation Config
const bouncySpring = { type: "spring" as const, stiffness: 400, damping: 25 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const bouncyItem = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: bouncySpring }
};

const modalAnimate = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: bouncySpring },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

/**
 * Helper: Convert date to Thai locale (GMT+7)
 */
const formatDateDisplay = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined' || dateStr === '') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'Asia/Bangkok'
    });
  } catch (e) {
    return String(dateStr);
  }
};

/**
 * Helper: Convert date for <input type="date" />
 */
const toISODate = (dateStr?: any) => {
  if (!dateStr || dateStr === 'undefined') return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const BouncyIcon = ({ icon: Icon = Wrench, size = 20, className = "text-emerald-500" }) => (
  <motion.div
    animate={{ y: [0, -6, 0], scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    className={className}
  >
    <Icon size={size} />
  </motion.div>
);

const AppLogo: React.FC<{ size?: number; light?: boolean }> = ({ size = 35, light = false }) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex items-center justify-center rounded-lg ${light ? 'bg-white/20' : 'bg-emerald-600'} shadow-sm border ${light ? 'border-white/30' : 'border-emerald-500'}`}
        style={{ width: size, height: size }}
      >
        <span className={`font-black text-[12px] ${light ? 'text-white' : 'text-white'} tracking-tighter`}>{LOGO_TEXT}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [pmModule, setPmModule] = useState<'computer' | 'printer'>('computer');
  const [publicViewId, setPublicViewId] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [userRole, setUserRole] = useState<'admin' | 'general'>('general');
  const [isAdminSession, setIsAdminSession] = useState(false); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [items, setItems] = useState<PMItem[]>(() => {
    try {
      const saved = localStorage.getItem('pm_dashboard_data');
      if (!saved) return INITIAL_PM_DATA;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(i => i !== null) : INITIAL_PM_DATA;
    } catch (e) {
      return INITIAL_PM_DATA;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrItem, setQrItem] = useState<PMItem | null>(null);
  const [editingItem, setEditingItem] = useState<PMItem | null>(null);
  const [otherDeptValue, setOtherDeptValue] = useState('');
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('pm_sheet_url') || DEFAULT_GAS_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [itemsToPrint, setItemsToPrint] = useState<PMItem[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId) setPublicViewId(viewId);
  }, []);

  useEffect(() => { if (sheetUrl) { fetchFromSheet(true); } }, [sheetUrl]);
  
  useEffect(() => { 
    localStorage.setItem('pm_dashboard_data', JSON.stringify(items)); 
  }, [items]);

  useEffect(() => { 
    if (sheetUrl) localStorage.setItem('pm_sheet_url', sheetUrl); 
  }, [sheetUrl]);

  const filteredItems = useMemo(() => {
    const type = pmModule === 'computer' ? 'Computer' : 'Printer';
    return items.filter(item => item && item.device === type);
  }, [items, pmModule]);

  const getMaintenanceAlert = (dateStr?: any) => {
    if (!dateStr || dateStr === 'undefined' || dateStr === null) return null;
    try {
      const targetStr = toISODate(dateStr);
      if (!targetStr) return null;
      const target = new Date(targetStr);
      if (isNaN(target.getTime())) return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffDays = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 15) return 'near';
    } catch (e) { return null; }
    return null;
  };

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter(i => i && i.status === 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const deptMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item && item.department) deptMap[String(item.department)] = (deptMap[String(item.department)] || 0) + 1; });
    const deptStats = Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const trendMap: Record<string, number> = {};
    filteredItems.forEach(item => { if(item && item.date) trendMap[String(item.date)] = (trendMap[String(item.date)] || 0) + 1; });
    const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date: formatDateDisplay(date), count })).sort((a, b) => a.date.localeCompare(b.date));
    let overdueCount = 0, nearDueCount = 0, brokenCount = 0;
    filteredItems.forEach(item => {
      if (item) {
        if (item.nextPmDate) {
          const alert = getMaintenanceAlert(item.nextPmDate);
          if (alert === 'overdue') overdueCount++; else if (alert === 'near') nearDueCount++;
        }
        const health = String(item.deviceStatus || '').toLowerCase();
        if (health.includes('broken') || health.includes('repair') || health.includes('เสีย')) brokenCount++;
      }
    });
    return { total, completionRate, deptStats, dailyTrend, overdueCount, nearDueCount, brokenCount };
  }, [filteredItems]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'tci@1234') {
      setUserRole('admin'); setIsAdminSession(false); setIsLoginModalOpen(false); setLoginForm({ username: '', password: '' }); setLoginError('');
      setSyncMessage("Welcome Admin"); setTimeout(() => setSyncMessage(null), 3000);
    } else { setLoginError('Login Invalid'); }
  };

  const handleLogout = () => {
    setUserRole('general'); setIsAdminSession(false);
    setSyncMessage("Logged Out"); setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleRequestUnlock = () => {
    const pin = window.prompt("Enter Admin PIN (1234):");
    if (pin === SECURITY_PIN) {
      setIsAdminSession(true); setSyncMessage("Unlocked"); setTimeout(() => setSyncMessage(null), 3000);
    } else if (pin !== null) { alert("Invalid PIN"); }
  };

  const handleEdit = (item: PMItem) => {
    if (!item || userRole !== 'admin') return;
    setEditingItem({ ...item });
    setOtherDeptValue(DEPARTMENTS.includes(item.department) ? '' : item.department);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!id || userRole !== 'admin') return;
    if (window.confirm('ยืนยันการลบ?')) {
      setItems(prev => prev.filter(i => i && i.id !== id));
      setSyncMessage("Deleted"); setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const handleShowQr = (item: PMItem) => {
    if (!item) return;
    setQrItem(item);
    setIsQrModalOpen(true);
  };

  const pushToCloud = async (item: PMItem) => {
    if (!sheetUrl || !item) return;
    try {
      setSyncMessage("กำลังซิงค์... / Syncing...");
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      setSyncMessage("ซิงค์สำเร็จ! / Success!");
    } catch (err) { 
      setSyncMessage("ซิงค์ล้มเหลว / Error");
    } finally {
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const handleAddNew = () => {
    if (userRole !== 'admin') return;
    const deviceType = pmModule === 'computer' ? 'Computer' : 'Printer';
    setEditingItem({
      id: '', date: new Date().toISOString().split('T')[0], department: DEPARTMENTS[0], device: deviceType, 
      personnel: '', status: 'Pending', deviceStatus: DEVICE_STATUS_OPTIONS[0],
      activity: '', computerName: '', computerUser: '', password: '', serverPassword: '', antivirus: '',
      startDate: '', warrantyExpiry: '', spareField: '', imageUrl: ''
    });
    setOtherDeptValue(''); setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || userRole !== 'admin') return;
    if (!editingItem.id) return alert('Enter Device ID');
    
    let finalItem = { ...editingItem };
    if (finalItem.department === 'Others / อื่นๆ') finalItem.department = otherDeptValue || 'Others';
    if (finalItem.status === 'Completed') {
      const baseDateStr = toISODate(finalItem.date);
      if (baseDateStr) {
        const nextDate = new Date(baseDateStr);
        if (!isNaN(nextDate.getTime())) {
          nextDate.setDate(nextDate.getDate() + (finalItem.device === 'Computer' ? 180 : 60));
          finalItem.nextPmDate = nextDate.toISOString().split('T')[0];
        }
      }
    }
    setItems(prev => {
      const exists = prev.find(i => i && i.id === finalItem.id);
      return exists ? prev.map(i => (i && i.id === finalItem.id) ? finalItem : i) : [...prev, finalItem];
    });
    setIsModalOpen(false); 
    setEditingItem(null); 
    await pushToCloud(finalItem);
  };

  const fetchFromSheet = async (silent = false) => {
    if (!sheetUrl) return; setIsSyncing(true);
    try {
      const response = await fetch(`${sheetUrl}?_t=${Date.now()}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      if (Array.isArray(data)) { 
        setItems(data.filter(i => i !== null)); 
        if (!silent) setSyncMessage('Updated'); 
      }
    } catch (err) { 
      if (!silent) setSyncMessage('Sync Error');
    } finally { 
      setIsSyncing(false); 
      setTimeout(() => setSyncMessage(null), 3000); 
    }
  };

  const exportToExcel = () => {
    const data = filteredItems.map(it => ({
      ID: it.id, Date: formatDateDisplay(it.date), Next_PM: formatDateDisplay(it.nextPmDate),
      Dept: it.department, Device: it.device, Staff: it.personnel, Status: it.status,
      Health: it.deviceStatus, Host: it.computerName, Activities: it.activity,
      Start: it.startDate, Warranty: it.warrantyExpiry, Info: it.spareField,
      Image: it.imageUrl ? 'Yes' : 'No', Pass_PC: it.password, Pass_SRV: it.serverPassword
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "PM_Report");
    XLSX.writeFile(wb, `${COMPANY_NAME}_PM_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrintSingle = (item: PMItem) => { if(!item) return; setItemsToPrint([item]); setTimeout(() => { window.print(); setItemsToPrint([]); }, 500); };
  const handlePrintAll = () => { if (filteredItems.length === 0) return; setItemsToPrint(filteredItems); setTimeout(() => { window.print(); setItemsToPrint([]); }, 500); };
  const resetFiltersAndGoHome = () => { setActiveTab('dashboard'); setPmModule('computer'); };

  const getDeviceStatusColor = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-500 border-slate-200';
    const s = String(status).toLowerCase();
    if (s.includes('standby')) return 'bg-orange-500 text-white border-orange-600 shadow-sm';
    if (s.includes('ready') || s.includes('ใช้งานได้ปกติ')) return 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
    if (s.includes('broken') || s.includes('repair') || s.includes('เสีย')) return 'bg-red-600 text-white border-red-700 shadow-sm';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const getPMStatusColor = (status?: string) => {
    if (status === 'Completed') return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-700';
    if (status === 'In Progress' || status === 'Pending') return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-600';
    return 'bg-slate-200 text-slate-600 border-slate-300';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) return alert("Limit 1.5MB for stability");
    const reader = new FileReader();
    reader.onloadend = () => {
      if (editingItem) setEditingItem({ ...editingItem, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // --- PUBLIC REPORT VIEW ---
  if (publicViewId) {
    const item = items.find(i => i && i.id === publicViewId);
    if (isSyncing && !item) return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" /><h2 className="text-xl font-bold text-slate-800">Synchronizing...</h2>
      </div>
    );

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 select-none overflow-x-hidden relative">
        <button onClick={() => setPublicViewId(null)} className="fixed top-6 right-6 z-[100] p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl text-slate-600 hover:text-red-600 transition-all border border-white no-print"><X size={20} /></button>
        {!item ? (<div className="text-center"><h2 className="text-xl font-bold text-slate-800">Asset Not Found</h2></div>) : (
          <motion.div initial="hidden" animate="visible" variants={modalAnimate} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden print-visible relative">
            <div className={`p-8 text-white ${item.status === 'Completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
              <div className="flex items-center gap-3 mb-2"><AppLogo size={30} light /><h2 className="text-xl font-black uppercase tracking-tighter">Asset Health Report</h2></div>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">{COMPANY_NAME} • Official Document</p>
            </div>
            <div className="p-8 space-y-6">
              {item.imageUrl && (<div className="w-full h-52 rounded-[2rem] overflow-hidden border-2 border-slate-50 shadow-inner"><img src={item.imageUrl} alt="Asset" className="w-full h-full object-cover" /></div>)}
              <div className="flex justify-between border-b pb-4">
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Device</p><p className="text-lg font-black text-slate-800">{item.computerName || 'N/A'}</p></div>
                <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">ID</p><p className="font-mono font-bold text-slate-600">{item.id}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-2xl border text-center font-black text-[9px] uppercase ${getPMStatusColor(item.status)}`}>PM: {item.status}</div>
                <div className={`p-3 rounded-2xl border text-center font-black text-[9px] uppercase transition-all ${getDeviceStatusColor(item.deviceStatus)}`}>Health: {String(item.deviceStatus || '').split(' / ')[0]}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase">Inspection Date</p><p className="text-xs font-bold text-slate-700">{formatDateDisplay(item.date)}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase">Department</p><p className="text-xs font-bold text-slate-700 truncate">{item.department || '-'}</p></div>
              </div>
              <div className="space-y-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Technician Checklist</p>
                 {item.activity && String(item.activity).split(' | ').filter(a => a).map((a, i) => (<div key={i} className="flex gap-2 items-center text-[10px] text-slate-600 font-bold bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50"><CheckCircle size={12} className="text-emerald-600" /><span>{a}</span></div>))}
              </div>
              {item.spareField && (<div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="text-[10px] italic text-slate-600 leading-relaxed">"{item.spareField}"</p></div>)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 no-print">
                <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2"><Printer size={14} /> Print</button>
                <button onClick={() => setPublicViewId(null)} className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2"><X size={14} /> Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative font-sans">
      <AnimatePresence>{syncMessage && (
        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }} className="fixed top-0 left-1/2 z-[200] px-6 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl font-black text-xs uppercase pointer-events-none text-center">
          {syncMessage}
        </motion.div>
      )}</AnimatePresence>
      <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 p-8 flex-col gap-8 sticky top-0 h-screen z-10 no-print">
        <div className="flex items-center gap-4 mb-4 cursor-pointer" onClick={resetFiltersAndGoHome}>
           <AppLogo size={35} /><div><h1 className="text-lg font-black text-white tracking-tighter leading-none">{COMPANY_NAME}</h1><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">PM Systems</p></div>
        </div>
        <nav className="space-y-2 flex-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-6 mb-2">Category</p>
          <button onClick={() => { setPmModule('computer'); setActiveTab('dashboard'); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border-2 ${pmModule === 'computer' && activeTab === 'dashboard' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800'}`}><Monitor size={18} /> <span className="text-sm font-bold">Computer</span></button>
          <button onClick={() => { setPmModule('printer'); setActiveTab('dashboard'); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border-2 ${pmModule === 'printer' && activeTab === 'dashboard' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'text-slate-400 border-transparent hover:bg-slate-800'}`}><Printer size={18} /> <span className="text-sm font-bold">Printer</span></button>
          <div className="h-px bg-slate-800 my-4 mx-4"></div>
          <button onClick={() => setActiveTab('table')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border-2 ${activeTab === 'table' ? 'bg-slate-800 border-slate-700 text-emerald-400 font-black' : 'text-slate-400 border-transparent hover:bg-slate-800'}`}><FileText size={18} /> <span className="text-sm font-bold">Records</span></button>
          <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="w-full flex items-center gap-4 px-6 py-4 text-emerald-400 bg-emerald-950/30 rounded-2xl font-black text-[10px] uppercase shadow-sm mt-4 border border-emerald-800/50">
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} <span>Refresh Cloud</span>
          </button>
        </nav>
        <div className="space-y-4">
          {userRole === 'general' ? (<button onClick={() => setIsLoginModalOpen(true)} className="w-full py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-emerald-500 transition-all shadow-xl">Admin Authentication</button>) : (<button onClick={handleLogout} className="w-full py-4 bg-rose-900/40 text-rose-400 rounded-[1.5rem] font-black text-[10px] uppercase border border-rose-800/30">Sign Out</button>)}
        </div>
      </aside>
      
      <main ref={dashboardRef} className="flex-1 p-4 md:p-12 overflow-y-auto w-full mb-20 md:mb-0 bg-[#f9fafb]">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 no-print">
          <div>
            <div className="flex items-center gap-3 mb-1"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><BouncyIcon icon={pmModule === 'computer' ? Cpu : Printer} size={20} /></div><h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight capitalize">{pmModule} Inspection</h2></div>
            <p className="text-slate-400 font-medium text-xs md:text-sm">{COMPANY_NAME} • Maintenance Excellence GMT+7</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {userRole === 'admin' && (<button onClick={handleAddNew} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black shadow-lg text-xs uppercase hover:scale-95 transition-all"><Plus size={18} /> New Entry</button>)}
            <button onClick={() => fetchFromSheet()} disabled={isSyncing} className="flex-1 lg:flex-none p-3 text-emerald-700 bg-white rounded-xl border border-emerald-100 shadow-sm font-black text-xs uppercase flex items-center justify-center gap-2">{isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}Sync</button>
            <button onClick={exportToExcel} className="flex-1 lg:flex-none p-3 text-slate-700 bg-white rounded-xl border border-slate-200 shadow-sm font-black text-xs uppercase flex items-center justify-center gap-2"><Download size={16} /> Export Excel</button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dash" variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <MetricCard icon={Layers} title="Total Assets" value={stats.total.toString()} subtitle="Managed Units" color="emerald" />
                <MetricCard icon={CheckCircle} title="Efficiency" value={`${stats.completionRate}%`} subtitle="Maintenance Done" color="teal" />
                <MetricCard icon={ShieldAlert} title="Overdue" value={stats.overdueCount.toString()} subtitle="Urgent Action" color="amber" />
                <MetricCard icon={AlertTriangle} title="Failures" value={stats.brokenCount.toString()} subtitle="Broken Units" color="rose" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                <motion.div variants={bouncyItem} className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="flex items-center gap-4 mb-6"><BouncyIcon icon={Activity} size={20} /><h3 className="text-lg font-black text-slate-800">Workload Statistics</h3></div>
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.deptStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={120} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(5, 150, 105, 0.05)' }} 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(5, 150, 105, 0.1)', 
                            borderRadius: '16px', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>
                          {stats.deptStats.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
                <motion.div variants={bouncyItem} className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="flex items-center gap-4 mb-6"><BouncyIcon icon={TrendingUp} size={20} className="text-emerald-500" /><h3 className="text-lg font-black text-slate-800">Activities Timeline</h3></div>
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats.dailyTrend}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            backdropFilter: 'blur(8px)',
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)' 
                          }} 
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" initial="hidden" animate="show" variants={containerVariants} className="space-y-4">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-md no-print">
                 <div className="flex items-center gap-3"><BouncyIcon icon={pmModule === 'computer' ? Monitor : Printer} size={22} /><h3 className="text-lg font-black text-slate-800">{pmModule} Asset Logs</h3></div>
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {pmModule === 'computer' && (<button onClick={handleRequestUnlock} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-xl shadow-lg transition-all hover:bg-emerald-700">Unlock Credentials</button>)}
                    <button onClick={handlePrintAll} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-xl hover:bg-emerald-100 border border-emerald-100">Batch QR Print</button>
                    <button onClick={exportToExcel} className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 text-slate-700 text-[9px] font-black uppercase rounded-xl hover:bg-slate-100 border border-slate-200">Export Report</button>
                 </div>
               </div>
               
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden print-visible">
                 <div className="overflow-x-auto w-full">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <tr><th className="px-8 py-6">Asset Details</th><th className="px-8 py-6">Status</th><th className="px-8 py-6">Technician</th><th className="px-8 py-6 text-emerald-600">Inspection (Thai)</th>{pmModule === 'computer' && <th className="px-8 py-6">Auth Data</th>}<th className="px-8 py-6 text-right no-print">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {filteredItems.map((it) => {
                         if (!it) return null;
                         const alert = getMaintenanceAlert(it.nextPmDate);
                         return (
                           <motion.tr key={it.id} variants={bouncyItem} className={`transition-colors group ${alert === 'overdue' ? 'bg-red-50/30' : 'hover:bg-emerald-50/10'}`}>
                             <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  {it.imageUrl ? (
                                    <img src={it.imageUrl} alt="Asset" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200"><ImageIcon size={16} /></div>
                                  )}
                                  <div><p className="font-black text-slate-800 text-sm">{it.computerName || 'N/A'}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{it.id} • {it.department}</p></div>
                               </div>
                             </td>
                             <td className="px-8 py-6"><span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border shadow-sm ${getPMStatusColor(it.status)}`}>{it.status}</span></td>
                             <td className="px-8 py-6"><p className="text-xs font-bold text-slate-600">{it.personnel || '-'}</p></td>
                             <td className="px-8 py-6"><span className={`text-[11px] font-black ${alert === 'overdue' ? 'text-red-600' : 'text-emerald-600'}`}>{formatDateDisplay(it.date)}</span></td>
                             {pmModule === 'computer' && (<td className="px-8 py-6"><div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">PC: <span className="text-slate-600">{isAdminSession ? it.password || 'none' : '••••'}</span></p><p className="text-[9px] font-black text-slate-400 uppercase">SRV: <span className="text-slate-600">{isAdminSession ? it.serverPassword || 'none' : '••••'}</span></p></div></td>)}
                             <td className="px-10 py-6 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print"><button onClick={() => handlePrintSingle(it)} className="p-3 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100"><PrinterIcon size={18} /></button><button onClick={() => handleShowQr(it)} className="p-3 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100"><QrCode size={18} /></button>{userRole === 'admin' ? (<><button onClick={() => handleEdit(it)} className="p-3 text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100"><Edit2 size={18} /></button><button onClick={() => handleDelete(it.id)} className="p-3 text-red-600 bg-rose-50 rounded-xl hover:bg-rose-100"><Trash2 size={18} /></button></>) : (<div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase"><Lock size={10}/> Private</div>)}</td>
                           </motion.tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bulk QR Section */}
      <div id="qr-print-section" className="hidden"><div className="qr-print-grid">{itemsToPrint.map((item) => (
            <div key={item.id} className="qr-tag-card">
              <div style={{ marginBottom: '10px' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?view=${item.id}`)}`} alt="QR" style={{ width: '130px', height: '130px' }} /></div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{item.computerName || 'N/A'}</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>{item.id} • {item.department}</div>
              <div style={{ fontSize: '9px', color: '#059669', fontWeight: '900', marginTop: '6px' }}>TCITRENDROUP - PM HISTORY</div>
            </div>
      ))}</div></div>

      {/* Admin Login Modal */}
      <AnimatePresence>{isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[2rem] shadow-3xl w-full max-w-sm overflow-hidden p-8 space-y-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
            <div className="text-center space-y-3 relative z-10"><div className="inline-block p-4 bg-emerald-600 text-white rounded-2xl shadow-xl"><BouncyIcon icon={Lock} size={24} className="text-white" /></div><h3 className="text-xl font-black uppercase tracking-tight">Admin Portal</h3></div>
            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <FormInput label="Account User" value={loginForm.username} onChange={val => setLoginForm({...loginForm, username: val})} placeholder="Username" />
              <FormInput label="Security Key" value={loginForm.password} onChange={val => setLoginForm({...loginForm, password: val})} placeholder="Password" type="password" />
              {loginError && <p className="text-[10px] font-black text-red-500 uppercase text-center bg-red-50 py-3 rounded-xl">{loginError}</p>}
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-emerald-500 transition-all">Sign In</button>
              <button type="button" onClick={() => setIsLoginModalOpen(false)} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest">Discard</button>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* Edit/Add Modal */}
      <AnimatePresence>{isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm no-print overflow-y-auto">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3"><div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md"><BouncyIcon icon={editingItem.device === 'Computer' ? Monitor : Printer} size={18} className="text-white" /></div><h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{items.find(i => i && i.id === editingItem.id) ? 'Modify Record' : 'Add New Hardware'}</h3></div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-8 overflow-y-auto space-y-6 md:space-y-8 flex-1 pb-24">
              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2"><ImageIcon size={18} className="text-emerald-500" /><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware Image (Column P)</label></div>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                   <div className="w-full sm:w-44 h-44 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group relative shadow-inner">
                      {editingItem.imageUrl ? (
                        <>
                          <img src={editingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setEditingItem({...editingItem, imageUrl: ''})} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={16} /></button>
                        </>
                      ) : (
                        <div className="text-center p-4"><Camera size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-[9px] font-black text-slate-400 uppercase">Attach Photo</p></div>
                      )}
                   </div>
                   <div className="flex-1 w-full space-y-3">
                      <p className="text-xs font-bold text-slate-500 tracking-tight leading-relaxed">Add a visual identification for this asset. Photos are synced to TCITRENDROUP database.</p>
                      <label className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase cursor-pointer hover:bg-emerald-100 transition-all shadow-sm">
                        <Upload size={16} /> <span>Capture/Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <p className="text-[9px] text-slate-400">Supported: JPG, PNG • Max: 1.5MB</p>
                   </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full my-2"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput label="Asset identity (ID)" value={editingItem.id} onChange={val => setEditingItem({...editingItem, id: val})} placeholder="e.g. IT-PC-001" />
                <FormInput label="Last inspection (Date)" type="date" value={toISODate(editingItem.date)} onChange={val => setEditingItem({...editingItem, date: val})} />
                <FormSelect label="Assigned Dept" value={editingItem.department} options={DEPARTMENTS} onChange={val => setEditingItem({...editingItem, department: val})} />
                <FormInput label="Technician name" value={editingItem.personnel || ''} onChange={val => setEditingItem({...editingItem, personnel: val})} placeholder="Lead Inspector" />
                
                {editingItem.device === 'Computer' && (
                  <>
                    <FormInput label="Primary System User" value={editingItem.computerUser || ''} onChange={val => setEditingItem({...editingItem, computerUser: val})} placeholder="Staff Username" />
                    <FormInput label="AV Solution" value={editingItem.antivirus || ''} onChange={val => setEditingItem({...editingItem, antivirus: val})} placeholder="e.g. Kaspersky" />
                  </>
                )}
                
                <FormSelect label="PM Workflow Status" value={editingItem.status} options={['Pending', 'In Progress', 'Completed']} onChange={val => setEditingItem({...editingItem, status: val as any})} />
                <FormSelect label="Hardware Health Condition" value={editingItem.deviceStatus || ''} options={DEVICE_STATUS_OPTIONS} onChange={val => setEditingItem({...editingItem, deviceStatus: val})} />
                <FormInput label={editingItem.device === 'Computer' ? 'Network Hostname' : 'Hardware Model'} value={editingItem.computerName} onChange={val => setEditingItem({...editingItem, computerName: val})} />
                
                <FormInput label="Warranty Expiry" type="date" value={toISODate(editingItem.warrantyExpiry)} onChange={val => setEditingItem({...editingItem, warrantyExpiry: val})} />
                
                {editingItem.device === 'Computer' && (
                  <>
                    <FormInput label="PC Auth (Column K)" value={editingItem.password || ''} onChange={val => setEditingItem({...editingItem, password: val})} showToggle isLocked={!isAdminSession} onUnlock={handleRequestUnlock} />
                    <FormInput label="Server Auth (Column L)" value={editingItem.serverPassword || ''} onChange={val => setEditingItem({...editingItem, serverPassword: val})} showToggle isLocked={!isAdminSession} onUnlock={handleRequestUnlock} />
                  </>
                )}

                <div className="md:col-span-2">
                   <FormInput label="Technical Findings & Info (Spare Field)" value={editingItem.spareField || ''} onChange={val => setEditingItem({...editingItem, spareField: val})} placeholder="Any additional hardware details..." />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2"><BouncyIcon icon={CheckSquare} size={18} /><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Protocols</label></div>
                <div className="grid grid-cols-1 gap-2 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner">
                  {(editingItem.device === 'Computer' ? COMPUTER_STANDARD_ACTIVITIES : PRINTER_STANDARD_ACTIVITIES).map((act, i) => {
                    const isChecked = editingItem.activity && String(editingItem.activity).includes(act);
                    return (<label key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-emerald-300 transition-colors shadow-sm">
                      <input type="checkbox" className="hidden" checked={!!isChecked} onChange={() => {
                        const acts = String(editingItem.activity || '').split(' | ').filter(x => x);
                        const next = isChecked ? acts.filter(x => x !== act) : [...acts, act];
                        setEditingItem({...editingItem, activity: next.join(' | ')});
                      }} /><div className={`p-1 rounded transition-colors ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>{isChecked ? <CheckCircle size={14} /> : <Square size={14} />}</div><span className={`text-[11px] font-bold ${isChecked ? 'text-emerald-700' : 'text-slate-500'}`}>{act}</span>
                    </label>);
                  })}
                </div>
              </div>
              <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t border-slate-100 z-10 flex gap-4"><button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-500 transition-all active:scale-95">Commit Record & Sync</button></div>
            </form>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* QR Identity Modal */}
      <AnimatePresence>{isQrModalOpen && qrItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalAnimate} className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-sm overflow-hidden p-8 text-center space-y-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
            <div className="flex justify-between items-center relative z-10"><h3 className="text-xl font-black text-slate-800 tracking-tight">Identity Tag</h3><button onClick={() => setIsQrModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 transition-colors"><X size={20} /></button></div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 inline-block shadow-inner relative z-10"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?view=${qrItem.id}`)}`} alt="QR" className="w-40 h-40 rounded-xl" /></div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100 relative z-10 shadow-sm"><p className="text-sm font-black text-emerald-800">{qrItem.computerName || 'N/A'}</p><p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">{qrItem.id}</p></div>
            <div className="flex flex-col gap-3 relative z-10">
              <button onClick={() => setPublicViewId(qrItem.id)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-500 transition-all">Preview Digital Card</button>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?view=${qrItem.id}`); setSyncMessage("Copied!"); setTimeout(() => setSyncMessage(null), 2000); }} className="w-full p-4 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase border border-slate-200 hover:bg-slate-200 transition-all"><Share2 size={16} /> Copy URL</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ElementType; color: 'emerald' | 'teal' | 'rose' | 'amber' }> = ({ title, value, subtitle, icon: Icon, color }) => {
  const themes = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    rose: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-orange-50 text-orange-600 border-orange-100'
  };
  return (
    <motion.div variants={bouncyItem} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-50 transition-colors"></div>
      <div className={`p-3 rounded-xl inline-block mb-4 ${themes[color] || themes.emerald} border shadow-sm relative z-10`}><Icon size={20} /></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{title}</p>
      <h4 className="text-xl md:text-2xl font-black text-slate-900 truncate relative z-10">{value}</h4>
      <p className="text-[9px] text-slate-400 font-bold mt-1 relative z-10 uppercase tracking-tight">{subtitle}</p>
    </motion.div>
  );
};

// Form Components
const FormInput: React.FC<{ label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string; readOnly?: boolean; showToggle?: boolean; isLocked?: boolean; onUnlock?: () => void; }> = ({ label, value, onChange, type = "text", placeholder, readOnly = false, showToggle = false, isLocked = false, onUnlock }) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const inputType = showToggle ? (internalVisible && !isLocked ? "text" : "password") : type;
  const handleToggle = () => { if (isLocked && !internalVisible) onUnlock?.(); else setInternalVisible(!internalVisible); };
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input type={inputType} value={value || ''} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} className={`w-full px-4 py-3.5 rounded-2xl text-[12px] font-bold border outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all ${readOnly ? 'bg-slate-50 border-slate-100 text-slate-400 shadow-inner cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 shadow-sm'}`} />
        {showToggle && (<button type="button" onClick={handleToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-600 transition-colors">{internalVisible && !isLocked ? <EyeOff size={16} /> : <Eye size={16} />}</button>)}
      </div>
    </div>
  );
};

const FormSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 appearance-none cursor-pointer shadow-sm">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

export default App;
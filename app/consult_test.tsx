// Test code

"use client";
import React, { useState } from 'react';
import {
  Stethoscope, LogOut, Plus, Trash2, Printer, Download,
  Search, User, CheckCircle, Clock, Pill, FileText,
  ChevronRight, Calendar, GraduationCap, Briefcase, MapPin,
  Phone, Mail, Lock, ShieldCheck, Activity
} from 'lucide-react';

// --- Interfaces ---
interface Vitals {
  temp: string;
  bp: string;
  pulse: string;
  weight: string;
}

interface Patient {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  medicalHistory: string;
  vitals: Vitals;
}

interface Medicine {
  id: number;
  name: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  meal: string;
  [key: string]: string | number | boolean;
}

type Page = 'login' | 'signup' | 'dashboard' | 'consultation';

const EZShifaPortal = () => {
  // --- Auth & Profile State ---
  const [activePage, setActivePage] = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState({
    name: "Dr. Demo",
    specialization: "Cardiologist",
    qualification: "MBBS, FCPS",
    experience: "8",
    clinic: "City Health Hospital",
    email: "demo12@gmail.com"
  });

  // --- Consultation State ---
  const [token, setToken] = useState('');
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }
  ]);
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  // --- Handlers ---
  // const handleAuth = (e: React.FormEvent, target: Page) => {
  //   e.preventDefault(); // Prevents the page from refreshing
  //   setIsLoggedIn(true); // Manually sets user as logged in
  //   setActivePage('dashboard'); // Switches view to the dashboard
  // };
  const handleAuth = (e: React.FormEvent, target: Page) => {
    e.preventDefault();
    console.log("Password entered:", password);
    // Here is where you would usually call your API (fetch/axios)
    setIsLoggedIn(true);
    setActivePage('dashboard');
  };

  const handleFetchPatient = () => {
    // Validates Token & Fetches Vitals (Requirement 4)
    if (!token) return alert("Please enter a valid token");
    setPatientData({
      firstName: "Ahmed",
      lastName: "Khan",
      age: 45,
      gender: "Male",
      medicalHistory: "Type 2 Diabetes, Hypertension",
      vitals: { temp: "98.6°F", bp: "140/90", pulse: "82 bpm", weight: "78kg" }
    });
  };

  const updateMedicine = (id: number, field: string, value: string | boolean) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // --- UI Components ---

  const Navbar = () => (
    <nav className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('dashboard')}>
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
          <Stethoscope size={24} />
        </div>
        <span className="font-black text-2xl text-slate-800 tracking-tight">MediFlow <span className="text-blue-600">Pro</span></span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex gap-4">
          <button onClick={() => setActivePage('dashboard')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activePage === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Dashboard</button>
          <button onClick={() => setActivePage('consultation')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activePage === 'consultation' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Consultation</button>
        </div>
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-800">{doctorProfile.name}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase">{doctorProfile.specialization}</p>
          </div>
          <button onClick={() => { setIsLoggedIn(false); setActivePage('login'); }} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors border border-slate-100">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );

  // --- Authentication Views (Requirement 1 & 2) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 w-full max-w-xl overflow-hidden border border-white flex flex-col md:flex-row">
          <div className="bg-blue-600 md:w-1/3 p-10 text-white flex flex-col justify-between">
            <div className="bg-white/20 p-3 rounded-2xl w-fit"><ShieldCheck size={32} /></div>
            <div>
              <h2 className="text-2xl font-black leading-tight">Secure Doctor Portal</h2>
              <p className="text-blue-100 text-xs mt-2">HIPAA Compliant Data Handling</p>
            </div>
          </div>
          <div className="p-10 md:w-2/3">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-slate-800">{activePage === 'login' ? 'Welcome Back' : 'Join MediFlow'}</h1>
              <p className="text-slate-400 text-sm">{activePage === 'login' ? 'Sign in to access patient records' : 'Register your medical practice'}</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => handleAuth(e, 'dashboard')}>
              {activePage === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 font-medium" required />
                    <input type="text" placeholder="Phone Number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 font-medium text-slate-500">
                      <option>Specialization</option>
                      <option>Cardiologist</option>
                      <option>General Physician</option>
                    </select>
                    <input type="text" placeholder="Exp (Years)" className="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 font-medium" />
                  </div>
                  <input type="text" placeholder="Clinic/Hospital Name" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 font-medium" />
                </>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email} // <-- Add this
                  onChange={(e) => setEmail(e.target.value)} // <-- Add this
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 ..."
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all uppercase tracking-wider text-xs">
                {activePage === 'login' ? 'Authorize & Enter' : 'Complete Registration'}
              </button>
            </form>
            <button onClick={() => setActivePage(activePage === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
              {activePage === 'login' ? "Don't have an account? Sign Up" : "Already registered? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 lg:p-10">

        {/* Dashboard View (Requirement 3) */}
        {activePage === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Doctor Dashboard</h1>
                <p className="text-slate-400 font-bold text-sm flex items-center gap-2 mt-1">
                  <MapPin size={14} className="text-blue-500" /> {doctorProfile.clinic}
                </p>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <Calendar size={18} className="text-blue-600" />
                <span className="text-sm font-black text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-all">
                <div className="p-5 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={40} /></div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">In Queue</p>
                  <h3 className="text-4xl font-black text-slate-800">12</h3>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-all">
                <div className="p-5 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle size={40} /></div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Completed</p>
                  <h3 className="text-4xl font-black text-slate-800">45</h3>
                </div>
              </div>
              <div className="bg-blue-600 p-8 rounded-[2rem] shadow-xl shadow-blue-100 text-white relative overflow-hidden flex flex-col justify-between">
                <Activity size={80} className="absolute -right-4 -bottom-4 opacity-20" />
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Next Patient</p>
                <div className="flex justify-between items-center mt-2">
                  <h3 className="text-2xl font-black uppercase">Token #204</h3>
                  <button onClick={() => setActivePage('consultation')} className="bg-white text-blue-600 p-3 rounded-xl hover:translate-x-1 transition-transform">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <User className="text-blue-600" size={24} /> Queue Management
                </h2>
                <button className="text-blue-600 font-bold text-sm">Refresh List</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-5 text-left">Token</th>
                      <th className="px-8 py-5 text-left">Patient Name</th>
                      <th className="px-8 py-5 text-left">Check-In Time</th>
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[204, 205, 206].map((t) => (
                      <tr key={t} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6 font-mono font-black text-blue-600">#{t}</td>
                        <td className="px-8 py-6 font-bold text-slate-700">Patient Registry ID-{t}</td>
                        <td className="px-8 py-6 text-slate-400 text-sm font-medium">10:30 AM</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => { setToken(t.toString()); setActivePage('consultation'); }} className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl text-xs font-black uppercase opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">
                            Start Consultation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Consultation View (Requirement 4, 5, 6, 7) */}
        {activePage === 'consultation' && (
          <div className="animate-in slide-in-from-bottom-6 duration-500 pb-20">
            {/* Token Input (Requirement 4) */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50 flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Validate Patient Token</label>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                  <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter Token (e.g. 204)" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-700 outline-none transition-all text-lg" />
                </div>
              </div>
              <button onClick={handleFetchPatient} className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3">
                <Activity size={18} /> Fetch Patient Data
              </button>
            </div>

            {patientData && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Patient Overview (Requirement 4) */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-sm">
                        <User size={40} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800">{patientData.firstName} {patientData.lastName}</h2>
                      <p className="text-blue-600 font-black text-xs uppercase tracking-widest">{patientData.gender} • {patientData.age} Years</p>
                    </div>

                    <div className="mt-8 space-y-4">
                      <div className="p-5 bg-slate-50 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">History</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{patientData.medicalHistory}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(patientData.vitals).map(([key, val]) => (
                          <div key={key} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{key}</p>
                            <p className="text-sm font-black text-slate-800">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rx Builder (Requirement 5 & 6) */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Pill className="text-blue-600" /> Prescription Builder
                      </h3>
                      <button onClick={() => setMedicines([...medicines, { id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }])} className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition-all">
                        <Plus size={16} /> Add Row
                      </button>
                    </div>

                    <div className="space-y-4">
                      {medicines.map((med) => (
                        <div key={med.id} className="p-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl relative group transition-all hover:bg-white hover:border-blue-100">
                          <button onClick={() => setMedicines(medicines.filter(m => m.id !== med.id))} className="absolute -right-2 -top-2 bg-white border border-slate-100 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all">
                            <Trash2 size={16} />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input placeholder="Medicine Name" className="p-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" value={med.name} onChange={(e) => updateMedicine(med.id, 'name', e.target.value)} />
                            <select className="p-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-500" value={med.meal} onChange={(e) => updateMedicine(med.id, 'meal', e.target.value)}>
                              <option>After Meal</option>
                              <option>Before Meal</option>
                            </select>
                          </div>
                          <div className="flex gap-8 items-center pl-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</span>
                            {['morning', 'afternoon', 'night'].map(time => (
                              <label key={time} className="flex items-center gap-2 cursor-pointer group/item">
                                <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded-lg" checked={!!med[time]} onChange={(e) => updateMedicine(med.id, time, e.target.checked)} />
                                <span className="text-xs font-black text-slate-500 group-hover/item:text-blue-600 transition-colors uppercase">{time}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Clinical Remarks (Requirement 6)</label>
                      <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter extra instructions, lifestyle changes, or follow-up date..." className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700" />
                    </div>
                  </div>

                  {/* ── High-End Prescription Preview (Optimized for Printing) ── */}
                  <div id="prescription-paper" className="bg-white rounded-[2rem] p-10 text-slate-900 shadow-2xl relative overflow-hidden border-t-12 border-blue-600 print:shadow-none print:m-0 print:rounded-none">

                    {/* Header Decor (Hidden on Print) */}
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none print:hidden">
                      <Stethoscope size={240} />
                    </div>

                    {/* Header: Clinic & Rx Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 relative z-10">
                      <div className="flex items-center gap-4 mb-6 md:mb-0">
                        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                          <Stethoscope size={32} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">MediFlow</h2>
                          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">{doctorProfile.clinic}</p>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <h1 className="text-6xl font-black text-slate-200 italic uppercase tracking-tighter leading-none mb-2">Rx</h1>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <p>Date: {new Date().toLocaleDateString()}</p>
                          <p>Token ID: #{token || '---'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Patient & Doctor Detail Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                      <div className="space-y-4">
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em]">Patient Identification</p>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <h4 className="text-2xl font-black text-slate-800">{patientData.firstName} {patientData.lastName}</h4>
                          <p className="text-slate-500 font-bold">{patientData.age} Years • {patientData.gender}</p>
                          <div className="flex gap-4 mt-4 text-[11px] font-bold uppercase text-slate-400">
                            <span>BP: <b className="text-slate-700">{patientData.vitals.bp}</b></span>
                            <span>Weight: <b className="text-slate-700">{patientData.vitals.weight}</b></span>
                          </div>
                        </div>
                      </div>
                      <div className="md:text-right space-y-2 self-end">
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em]">Attending Physician</p>
                        <h4 className="text-2xl font-black text-slate-800">{doctorProfile.name}</h4>
                        <p className="text-slate-500 font-bold uppercase text-xs">{doctorProfile.specialization}</p>
                        <p className="text-slate-400 text-[10px] font-bold">{doctorProfile.qualification}</p>
                      </div>
                    </div>

                    {/* Medications Table-style */}
                    <div className="space-y-1 mb-10">
                      <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Prescribed Medication</p>
                      <div className="border-2 border-slate-50 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                              <th className="px-6 py-4">Medicine Name</th>
                              <th className="px-6 py-4 text-center">Dosage (M-A-N)</th>
                              <th className="px-6 py-4">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {medicines.filter(m => m.name).map((m, i) => (
                              <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5 font-black text-slate-800">{m.name}</td>
                                <td className="px-6 py-5">
                                  <div className="flex justify-center gap-1">
                                    {[m.morning, m.afternoon, m.night].map((active, idx) => (
                                      <span key={idx} className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] font-bold border ${active ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-300'}`}>
                                        {active ? '1' : '0'}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-xs font-bold text-blue-600 italic uppercase">{m.meal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Advice Section */}
                    {notes && (
                      <div className="mb-12 p-8 bg-blue-50/50 border-l-[6px] border-blue-600 rounded-r-3xl">
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2">Advice & Clinical Notes</p>
                        <p className="text-slate-700 italic font-medium text-lg leading-relaxed">{notes}</p>
                      </div>
                    )}

                    {/* Footer (For Print) */}
                    <div className="border-t pt-8 flex justify-between items-center opacity-60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        <p>System Generated Prescription</p>
                        <p>Verified by MediFlow</p>
                      </div>
                      <div className="h-12 w-32 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Doctor's Stamp</span>
                      </div>
                    </div>

                    {/* Action Buttons (Hidden on Print) */}
                    <div className="flex gap-4 mt-10 print:hidden">
                      <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                        <Printer size={18} /> Generate Print
                      </button>
                      <button className="flex-1 bg-blue-50 text-blue-600 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-blue-100 transition-all">
                        <Download size={18} /> Save Digital Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <style jsx global>{`
  @media print {
    /* Hide everything else on the page */
    body * { visibility: hidden; }
    /* Show only the prescription paper and its children */
    #prescription-paper, #prescription-paper * { visibility: visible; }
    /* Position the prescription at the very top left of the printed page */
    #prescription-paper {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
    }
    /* Hide buttons inside the prescription while printing */
    .print\:hidden { display: none !important; }
  }
`}</style>
    </div>
  );
};

export default EZShifaPortal;
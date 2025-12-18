
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import PatientProfile from './components/PatientProfile';
import Laboratory from './components/Laboratory';
import { User, UserRole, Patient } from './types';
import { MOCK_USERS, MOCK_PATIENTS } from './constants';
import { LogIn, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      setError('');
    } else {
      setError('Invalid credentials for demo. Try doctor@medflow.com');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    setSelectedPatientId(null);
  };

  const renderContent = () => {
    if (selectedPatientId && user) {
      const patient = MOCK_PATIENTS.find(p => p.id === selectedPatientId);
      if (patient) {
        return <PatientProfile patient={patient} onBack={() => setSelectedPatientId(null)} currentUser={user} />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients onViewProfile={(id) => setSelectedPatientId(id)} />;
      case 'appointments':
        return (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Appointment Calendar</h2>
            <p className="text-slate-500 font-medium">Integration with clinic calendar module...</p>
          </div>
        );
      case 'consultations':
        return (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Active Consultations</h2>
            <p className="text-slate-500 font-medium">Doctor's workstation module...</p>
          </div>
        );
      case 'laboratory':
        return user ? <Laboratory currentUser={user} /> : null;
      case 'billing':
        return (
           <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Billing & Invoicing</h2>
            <p className="text-slate-500 font-medium">Manage patient accounts and payments...</p>
          </div>
        );
      case 'reports':
        return (
           <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Clinic Analytics</h2>
            <p className="text-slate-500 font-medium">Advanced reporting and data export...</p>
          </div>
        );
      case 'settings':
        return (
           <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">System Settings</h2>
            <p className="text-slate-500 font-medium">Configure roles, permissions, and audit logs...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">MedFlow Pro</h1>
            <p className="text-slate-500 font-medium">Clinic Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                <ShieldAlert size={16} /> {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="doctor@medflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              Log In to Portal
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">Demo Roles Available:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">doctor@medflow.com</span>
              <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">admin@medflow.com</span>
              <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">lab@medflow.com</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;

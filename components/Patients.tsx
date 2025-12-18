
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, MoreVertical, Eye, X, CheckCircle2, Plus, AlertCircle } from 'lucide-react';
import { MOCK_PATIENTS } from '../constants';
import { Patient, PatientStatus, FitnessStatus } from '../types';

interface PatientsProps {
  onViewProfile: (patientId: string) => void;
}

const Patients: React.FC<PatientsProps> = ({ onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastRegisteredId, setLastRegisteredId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historyInput, setHistoryInput] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    birthDate: '',
    address: '',
    contactNumber: '',
    emergencyContact: '',
    medicalHistory: [] as string[],
    isHypertensive: false,
    isDiabetic: false,
  });

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const generateNextId = () => {
    const numericIds = patients
      .map(p => parseInt(p.id.split('-')[1]))
      .filter(id => !isNaN(id));
    
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
    return `P-${maxId + 1}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Birth Date validation
    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const birth = new Date(formData.birthDate);
      if (birth > new Date()) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
    }

    // Contact Number validation (Flexible regex for phone numbers)
    const phoneRegex = /^\+?[\d\s-]{7,15}$/;
    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Invalid phone format (e.g., +1 234 567 890)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newId = generateNextId();
    
    const newPatient: Patient = {
      id: newId,
      fullName: formData.fullName,
      gender: formData.gender,
      birthDate: formData.birthDate,
      age: calculateAge(formData.birthDate),
      address: formData.address,
      contactNumber: formData.contactNumber,
      emergencyContact: formData.emergencyContact,
      medicalHistory: formData.medicalHistory,
      status: PatientStatus.ACTIVE,
      fitnessStatus: FitnessStatus.FIT,
      isHypertensive: formData.isHypertensive,
      isDiabetic: formData.isDiabetic,
    };

    setPatients([newPatient, ...patients]);
    setLastRegisteredId(newId);
    setIsModalOpen(false);
    setShowSuccess(true);
    
    // Reset form
    setFormData({
      fullName: '',
      gender: 'Male',
      birthDate: '',
      address: '',
      contactNumber: '',
      emergencyContact: '',
      medicalHistory: [],
      isHypertensive: false,
      isDiabetic: false,
    });
    setHistoryInput('');
    setErrors({});

    setTimeout(() => setShowSuccess(false), 5000);
  };

  const addHistoryTag = () => {
    if (historyInput.trim() && !formData.medicalHistory.includes(historyInput.trim())) {
      setFormData({
        ...formData,
        medicalHistory: [...formData.medicalHistory, historyInput.trim()]
      });
      setHistoryInput('');
    }
  };

  const removeHistoryTag = (tag: string) => {
    setFormData({
      ...formData,
      medicalHistory: formData.medicalHistory.filter(t => t !== tag)
    });
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-20 right-6 z-[70] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-bold">Patient Registered Successfully</p>
              <p className="text-xs opacity-90">Assigned ID: <span className="font-mono font-bold">{lastRegisteredId}</span></p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-4 p-1 hover:bg-white/20 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95"
          >
            <UserPlus size={18} />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Patient ID</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Fitness</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500 font-mono">#{patient.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                        <p className="text-xs text-slate-500">{patient.gender}, {patient.age} yrs</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      patient.status === PatientStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 
                      patient.status === PatientStatus.COMPLETED ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      patient.fitnessStatus === FitnessStatus.FIT ? 'bg-emerald-50 text-emerald-600' : 
                      patient.fitnessStatus === FitnessStatus.TEMPORARILY_UNFIT ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {patient.fitnessStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">2024-05-15</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onViewProfile(patient.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No patients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Register New Patient</h2>
                <p className="text-sm text-slate-500 font-medium">Automatic ID: <span className="font-mono font-bold text-blue-600">{generateNextId()}</span></p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-slate-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Birth Date</label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.birthDate ? 'border-red-500 ring-red-500/10' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    />
                    {errors.birthDate && (
                      <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.birthDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Number</label>
                  <div className="relative">
                    <input
                      required
                      type="tel"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.contactNumber ? 'border-red-500 ring-red-500/10' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
                      placeholder="e.g. +1 555-0100"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                    />
                    {errors.contactNumber && (
                      <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.contactNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    rows={2}
                    placeholder="Full residential address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Emergency Contact</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    placeholder="Name and Phone Number"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  />
                </div>
                
                {/* Enhanced Medical History Tags */}
                <div className="md:col-span-2 space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical History</label>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    {formData.medicalHistory.length === 0 && <span className="text-xs text-slate-400 italic py-1">No history tags added.</span>}
                    {formData.medicalHistory.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 group">
                        {tag}
                        <button type="button" onClick={() => removeHistoryTag(tag)} className="hover:text-blue-900">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-sm"
                      placeholder="Type a condition (e.g. Asthma, Allergies)"
                      value={historyInput}
                      onChange={(e) => setHistoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHistoryTag())}
                    />
                    <button
                      type="button"
                      onClick={addHistoryTag}
                      className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={formData.isHypertensive}
                      onChange={(e) => setFormData({...formData, isHypertensive: e.target.checked})}
                    />
                    <div className="h-6 w-11 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 bg-white h-4 w-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Hypertensive</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={formData.isDiabetic}
                      onChange={(e) => setFormData({...formData, isDiabetic: e.target.checked})}
                    />
                    <div className="h-6 w-11 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 bg-white h-4 w-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Diabetic</span>
                </label>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;

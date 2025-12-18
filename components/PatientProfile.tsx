
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, User, History, Beaker, ReceiptText, BrainCircuit, Activity, Heart, 
  Thermometer, Ruler, Weight, X, Plus, CheckCircle2, AlertCircle, Calendar, 
  ClipboardList, UserRound, Sparkles, Send, Clock, Pill, ChevronDown, ChevronUp, 
  FileText, Microscope, FileSearch, Download, Info, FlaskConical, ClipboardCheck
} from 'lucide-react';
import { Patient, VitalSigns, Consultation, LabTest, User as AppUser } from '../types';
import { geminiService } from '../services/geminiService';
import { MOCK_VITALS, MOCK_CONSULTATIONS, MOCK_USERS, MOCK_LAB_TESTS } from '../constants';

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  currentUser: AppUser;
}

const AVAILABLE_TESTS = {
  'Hematology': ['Complete Blood Count (CBC)', 'Blood Typing', 'Platelet Count', 'Peripheral Blood Smear'],
  'Urinalysis': ['Routine Urinalysis', 'Urine Culture', 'Pregnancy Test (Urine)'],
  'Biochemistry': ['Lipid Profile', 'HbA1c', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'Blood Glucose (FBS/RBS)'],
  'Imaging': ['Chest X-Ray', 'Abdominal Ultrasound', 'ECG (12-Lead)', 'CT Scan']
};

const PatientProfile: React.FC<PatientProfileProps> = ({ patient, onBack, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'vitals' | 'visits' | 'labs' | 'billing'>('info');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Local state for persistence during session
  const [vitalsHistory, setVitalsHistory] = useState<VitalSigns[]>(MOCK_VITALS);
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>(MOCK_CONSULTATIONS);
  const [labTests, setLabTests] = useState<LabTest[]>(MOCK_LAB_TESTS);
  
  // Expandable items
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null);

  // AI Interpretation
  const [isInterpretingLab, setIsInterpretingLab] = useState<string | null>(null);
  const [labInterpretations, setLabInterpretations] = useState<Record<string, string>>({});

  // Modals and Alerts
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isLabRequestModalOpen, setIsLabRequestModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  const [vitalsErrors, setVitalsErrors] = useState<Record<string, string>>({});

  // AI Diagnostic Assistance
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{diagnoses: string[], recommendedTests: string[]} | null>(null);

  // Form states
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressure: '', heartRate: '', temperature: '', height: '', weight: '',
  });

  const [consultForm, setConsultForm] = useState({
    notes: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpDate: '',
    vitalsId: '',
  });

  const [labRequestForm, setLabRequestForm] = useState({
    category: 'Hematology' as keyof typeof AVAILABLE_TESTS,
    testName: AVAILABLE_TESTS['Hematology'][0],
    remarks: '',
    priority: 'Routine'
  });

  const patientVitals = useMemo(() => 
    vitalsHistory
      .filter(v => v.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [vitalsHistory, patient.id]);

  const patientVisits = useMemo(() => 
    consultationHistory
      .filter(c => c.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [consultationHistory, patient.id]);

  const patientLabs = useMemo(() => 
    labTests
      .filter(l => l.patientId === patient.id)
      .sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
  , [labTests, patient.id]);

  const bmi = useMemo(() => {
    const h = parseFloat(vitalsForm.height) / 100;
    const w = parseFloat(vitalsForm.weight);
    return h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : '0.0';
  }, [vitalsForm.height, vitalsForm.weight]);

  const handleGenerateSummary = async () => {
    setLoadingAi(true);
    const summary = await geminiService.summarizeMedicalHistory(patient.fullName, patient.medicalHistory);
    setAiSummary(summary);
    setLoadingAi(false);
  };

  const handleAiSuggest = async () => {
    if (!consultForm.notes) return;
    setIsAiSuggesting(true);
    const results = await geminiService.getDiagnosticSuggestions(consultForm.notes);
    setAiSuggestions(results);
    setIsAiSuggesting(false);
  };

  const handleInterpretLab = async (lab: LabTest) => {
    if (!lab.results) return;
    setIsInterpretingLab(lab.id);
    const interpretation = await geminiService.interpretLabResults(lab.testName, lab.results);
    setLabInterpretations(prev => ({ ...prev, [lab.id]: interpretation }));
    setIsInterpretingLab(null);
  };

  const validateVitals = () => {
    const errors: Record<string, string> = {};
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!vitalsForm.bloodPressure || !bpRegex.test(vitalsForm.bloodPressure)) errors.bloodPressure = 'Format: XXX/XX';
    if (!vitalsForm.heartRate || parseInt(vitalsForm.heartRate) < 30) errors.heartRate = 'Invalid';
    if (!vitalsForm.temperature || parseFloat(vitalsForm.temperature) < 30) errors.temperature = 'Invalid';
    if (!vitalsForm.height) errors.height = 'Required';
    if (!vitalsForm.weight) errors.weight = 'Required';
    setVitalsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVitals()) return;

    const newReading: VitalSigns = {
      id: `V-${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      bloodPressure: vitalsForm.bloodPressure,
      heartRate: parseInt(vitalsForm.heartRate),
      temperature: parseFloat(vitalsForm.temperature),
      height: parseFloat(vitalsForm.height),
      weight: parseFloat(vitalsForm.weight),
      bmi: parseFloat(bmi),
    };

    setVitalsHistory([newReading, ...vitalsHistory]);
    setIsVitalsModalOpen(false);
    setShowSuccessToast({show: true, msg: 'Vitals recorded successfully!'});
    setVitalsForm({ bloodPressure: '', heartRate: '', temperature: '', height: '', weight: '' });
    setTimeout(() => setShowSuccessToast({show: false, msg: ''}), 3000);
  };

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    const newConsult: Consultation = {
      id: `C-${Date.now()}`,
      patientId: patient.id,
      doctorId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      vitalsId: consultForm.vitalsId || (patientVitals[0]?.id || ''),
      notes: consultForm.notes,
      diagnosis: consultForm.diagnosis,
      treatmentPlan: consultForm.treatmentPlan,
      followUpDate: consultForm.followUpDate,
    };

    setConsultationHistory([newConsult, ...consultationHistory]);
    setIsConsultModalOpen(false);
    setShowSuccessToast({show: true, msg: 'Consultation recorded successfully!'});
    setConsultForm({ notes: '', diagnosis: '', treatmentPlan: '', followUpDate: '', vitalsId: '' });
    setAiSuggestions(null);
    setTimeout(() => setShowSuccessToast({show: false, msg: ''}), 3000);
  };

  const handleSaveLabRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: LabTest = {
      id: `L-${Date.now()}`,
      patientId: patient.id,
      testName: labRequestForm.testName,
      category: labRequestForm.category,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      remarks: labRequestForm.remarks
    };

    setLabTests([newRequest, ...labTests]);
    setIsLabRequestModalOpen(false);
    setShowSuccessToast({show: true, msg: 'Lab test requested successfully!'});
    setLabRequestForm({
      category: 'Hematology',
      testName: AVAILABLE_TESTS['Hematology'][0],
      remarks: '',
      priority: 'Routine'
    });
    setTimeout(() => setShowSuccessToast({show: false, msg: ''}), 3000);
  };

  const getDoctorName = (id: string) => MOCK_USERS.find(u => u.id === id)?.name || 'Unknown Doctor';

  const tabs = [
    { id: 'info', label: 'Patient Info', icon: <User size={18} /> },
    { id: 'vitals', label: 'Vital Signs', icon: <Activity size={18} /> },
    { id: 'visits', label: 'Visits & Notes', icon: <History size={18} /> },
    { id: 'labs', label: 'Lab Results', icon: <Beaker size={18} /> },
    { id: 'billing', label: 'Invoices', icon: <ReceiptText size={18} /> },
  ];

  const bmiCat = (val: string) => {
    const n = parseFloat(val);
    if (n < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (n < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (n < 30) return { label: 'Overweight', color: 'text-amber-600' };
    return { label: 'Obese', color: 'text-rose-600' };
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4">
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Patients</span>
      </button>

      {showSuccessToast.show && (
        <div className="fixed top-20 right-6 z-[70] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500">
            <CheckCircle2 size={24} />
            <p className="font-bold">{showSuccessToast.msg}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Patient Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-inner">
              {patient.fullName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{patient.fullName}</h2>
            <p className="text-slate-500 text-sm mb-4">ID: {patient.id} • {patient.age} yrs</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase">{patient.status}</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase">{patient.fitnessStatus}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Clinical Alerts</h3>
              <BrainCircuit className="text-blue-500" size={18} />
            </div>
            <div className="space-y-3">
              {patient.isHypertensive && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                   <Activity size={14} /> Hypertensive
                </div>
              )}
              {patient.isDiabetic && (
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-orange-100">
                   <Activity size={14} /> Diabetic
                </div>
              )}
              {!patient.isHypertensive && !patient.isDiabetic && (
                <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs">Healthy Baseline</div>
              )}
            </div>
            <button 
              onClick={handleGenerateSummary}
              disabled={loadingAi}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} />
              {loadingAi ? 'Analyzing...' : 'AI Medical Summary'}
            </button>
          </div>

          {aiSummary && (
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg animate-in slide-in-from-bottom-2 fade-in">
              <p className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-wider">
                <BrainCircuit size={14} /> Clinical Intelligence
              </p>
              <p className="text-xs leading-relaxed opacity-90">{aiSummary}</p>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all
                  ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">General Profile</h3>
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Birthdate</p>
                      <p className="text-sm font-semibold">{patient.birthDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Gender</p>
                      <p className="text-sm font-semibold">{patient.gender}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Address</p>
                      <p className="text-sm font-semibold">{patient.address}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clinical History</h3>
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalHistory.map((item, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vitals' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Health Indicators</h3>
                  <button onClick={() => setIsVitalsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md">
                    <Plus size={16} /> Record Vitals
                  </button>
                </div>
                
                {patientVitals.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {[
                        { label: 'BP', value: patientVitals[0].bloodPressure, unit: 'mmHg', icon: <Activity className="text-red-600" /> },
                        { label: 'HR', value: patientVitals[0].heartRate, unit: 'bpm', icon: <Heart className="text-rose-500" /> },
                        { label: 'Temp', value: patientVitals[0].temperature, unit: '°C', icon: <Thermometer className="text-orange-500" /> },
                        { label: 'Height', value: patientVitals[0].height, unit: 'cm', icon: <Ruler className="text-blue-500" /> },
                        { label: 'Weight', value: patientVitals[0].weight, unit: 'kg', icon: <Weight className="text-indigo-500" /> }
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-2 mb-3 opacity-60">
                            {item.icon} <span className="text-[10px] font-bold uppercase">{item.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900 leading-none">{item.value}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{item.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Activity className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">No vital signs on record.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Clinical Encounters</h3>
                  <button 
                    onClick={() => {
                      setConsultForm({ ...consultForm, vitalsId: patientVitals[0]?.id || '' });
                      setIsConsultModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
                  >
                    <ClipboardList size={18} /> New Consultation
                  </button>
                </div>

                {patientVisits.length > 0 ? (
                  <div className="space-y-4">
                    {patientVisits.map((visit) => {
                      const isExpanded = expandedVisitId === visit.id;
                      const visitVitals = vitalsHistory.find(v => v.id === visit.vitalsId);

                      return (
                        <div key={visit.id} className={`bg-white border rounded-[2rem] transition-all overflow-hidden ${isExpanded ? 'border-blue-200 shadow-xl ring-4 ring-blue-50' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                          <button 
                            onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}
                            className={`w-full text-left px-8 py-6 flex items-center justify-between transition-colors ${isExpanded ? 'bg-blue-50/30' : 'bg-white'}`}
                          >
                            <div className="flex items-center gap-6">
                              <div className={`p-3 rounded-2xl border transition-all ${isExpanded ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 text-blue-600'}`}>
                                <Calendar size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{visit.date}</p>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                                  <UserRound size={12} /> {getDoctorName(visit.doctorId)}
                                </p>
                              </div>
                              <div className="hidden sm:block border-l border-slate-200 h-8 mx-2" />
                              <div className="hidden sm:block">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Primary Diagnosis</p>
                                <span className="text-sm font-bold text-slate-800">{visit.diagnosis}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                <ChevronDown size={20} />
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 space-y-8">
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <FileText size={14} className="text-blue-500" /> Narrative & Observations
                                    </h4>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                                      "{visit.notes}"
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <Pill size={14} className="text-emerald-500" /> Plan of Action & Treatment
                                    </h4>
                                    <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 text-sm text-emerald-900 font-medium">
                                      {visit.treatmentPlan}
                                    </div>
                                  </div>
                                </div>
                                <div className="lg:col-span-4 space-y-6">
                                  {visitVitals && (
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={14} className="text-red-500" /> Baseline Vitals
                                      </h5>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-2xl">
                                          <p className="text-[9px] font-bold text-slate-400 uppercase">BP</p>
                                          <p className="text-sm font-bold text-slate-900">{visitVitals.bloodPressure}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl">
                                          <p className="text-[9px] font-bold text-slate-400 uppercase">HR</p>
                                          <p className="text-sm font-bold text-slate-900">{visitVitals.heartRate}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <History className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">No clinical history recorded.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Laboratory Investigations</h3>
                  <button 
                    onClick={() => setIsLabRequestModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md"
                  >
                    <Microscope size={18} /> Request New Test
                  </button>
                </div>

                {patientLabs.length > 0 ? (
                  <div className="space-y-4">
                    {patientLabs.map((lab) => {
                      const isExpanded = expandedLabId === lab.id;
                      const isReleased = lab.status === 'Released';

                      return (
                        <div key={lab.id} className={`bg-white border rounded-[2rem] transition-all overflow-hidden ${isExpanded ? 'border-purple-200 shadow-xl ring-4 ring-purple-50' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                          <button 
                            onClick={() => setExpandedLabId(isExpanded ? null : lab.id)}
                            className={`w-full text-left px-8 py-6 flex items-center justify-between transition-colors ${isExpanded ? 'bg-purple-50/30' : 'bg-white'}`}
                          >
                            <div className="flex items-center gap-6">
                              <div className={`p-3 rounded-2xl border transition-all ${isExpanded ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 border-slate-100 text-purple-600'}`}>
                                <Beaker size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{lab.testName}</p>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                                  <Calendar size={12} /> {lab.requestedDate} • {lab.category}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                lab.status === 'Released' ? 'bg-emerald-100 text-emerald-700' : 
                                lab.status === 'Processing' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {lab.status}
                              </span>
                              <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-purple-100 text-purple-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                <ChevronDown size={20} />
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                              {isReleased && lab.results ? (
                                <div className="space-y-8">
                                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                          <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Parameter</th>
                                          <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Result</th>
                                          <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Unit</th>
                                          <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Reference Range</th>
                                          <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Flag</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {lab.results.map((res, i) => (
                                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">{res.parameter}</td>
                                            <td className={`px-6 py-4 font-mono font-bold ${res.flag !== 'Normal' ? 'text-red-600' : 'text-blue-600'}`}>{res.value}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{res.unit}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs font-medium">{res.referenceRange}</td>
                                            <td className="px-6 py-4 text-right">
                                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                res.flag === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                              }`}>
                                                {res.flag}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                                        <FileSearch size={14} className="text-purple-500" /> Lab Remarks
                                      </h4>
                                      <div className="p-5 bg-white border border-slate-100 rounded-3xl text-sm text-slate-600 italic">
                                        {lab.remarks || "No clinical remarks recorded."}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between ml-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                          <Sparkles size={14} className="text-blue-500" /> AI Doctor's Interpretation
                                        </h4>
                                        <button 
                                          onClick={() => handleInterpretLab(lab)}
                                          disabled={isInterpretingLab === lab.id}
                                          className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all uppercase"
                                        >
                                          {isInterpretingLab === lab.id ? "Interpreting..." : "Regenerate Analysis"}
                                        </button>
                                      </div>
                                      
                                      <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-100 min-h-[100px] flex flex-col justify-center relative overflow-hidden">
                                        {labInterpretations[lab.id] ? (
                                          <p className="text-xs leading-relaxed font-medium">{labInterpretations[lab.id]}</p>
                                        ) : (
                                          <div className="text-center space-y-3">
                                            <BrainCircuit className="mx-auto opacity-50 animate-pulse" size={32} />
                                            <p className="text-[11px] font-bold opacity-70 uppercase tracking-wider">Ready for AI Analysis</p>
                                            <button 
                                              onClick={() => handleInterpretLab(lab)}
                                              className="px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-50 transition-colors"
                                            >
                                              Analyze Results with Gemini
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-3 pt-4">
                                    <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 font-bold text-[10px] uppercase tracking-wider transition-colors">
                                      <Download size={14} /> Download PDF Report
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                      Email to Patient
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                  <Clock className="mx-auto text-slate-300 mb-3" size={40} />
                                  <p className="text-slate-600 font-bold">Investigation in Progress</p>
                                  <p className="text-xs text-slate-400 mt-1">Results will be available once the lab releases the official report.</p>
                                  <div className="mt-6 flex justify-center gap-3">
                                    <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase">View Order Detail</div>
                                    <div className="px-3 py-1.5 bg-blue-600 rounded-xl text-[10px] font-bold text-white uppercase shadow-sm">Remind Lab Staff</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Beaker className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">No laboratory test history found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                 <ReceiptText className="mx-auto text-slate-300 mb-4" size={48} />
                 <p className="text-slate-500 font-bold">No billing records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vitals Modal */}
      {isVitalsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40">
          <div className="fixed inset-0" onClick={() => setIsVitalsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Record Vitals</h2>
                  <p className="text-slate-500 text-sm font-medium">Capture patient biometric data.</p>
                </div>
                <button onClick={() => setIsVitalsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveVitals} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'bloodPressure', label: 'Blood Pressure', placeholder: '120/80' },
                    { id: 'heartRate', label: 'Heart Rate', placeholder: 'bpm', type: 'number' },
                    { id: 'temperature', label: 'Temp', placeholder: '°C', type: 'number', step: '0.1' },
                    { id: 'weight', label: 'Weight', placeholder: 'kg', type: 'number', step: '0.1' },
                    { id: 'height', label: 'Height', placeholder: 'cm', type: 'number' }
                  ].map((field) => (
                    <div key={field.id} className={field.id === 'bloodPressure' ? 'col-span-2' : ''}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">{field.label}</label>
                      <input
                        required
                        type={field.type || 'text'}
                        step={field.step}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${vitalsErrors[field.id] ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all`}
                        placeholder={field.placeholder}
                        value={(vitalsForm as any)[field.id]}
                        onChange={(e) => setVitalsForm({...vitalsForm, [field.id]: e.target.value})}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Calculated BMI</p>
                    <p className="text-2xl font-bold text-blue-600">{bmi}</p>
                  </div>
                  <span className={`px-4 py-1.5 bg-white text-xs font-bold rounded-xl shadow-sm border border-blue-100 ${bmiCat(bmi).color}`}>
                    {bmiCat(bmi).label}
                  </span>
                </div>

                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
                  Confirm and Save
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsConsultModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden my-8">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-600 rounded-3xl shadow-lg">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">New Consultation</h2>
                  <p className="text-slate-400 font-medium">Examining {patient.fullName}</p>
                </div>
              </div>
              <button onClick={() => setIsConsultModalOpen(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={14} className="text-blue-500" /> Patient Notes & Symptoms
                      </label>
                      <button 
                        type="button" 
                        onClick={handleAiSuggest}
                        disabled={!consultForm.notes || isAiSuggesting}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles size={12} /> {isAiSuggesting ? 'Analyzing...' : 'Get AI Suggestions'}
                      </button>
                    </div>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-300"
                      placeholder="Describe symptoms, duration, and patient reports..."
                      value={consultForm.notes}
                      onChange={(e) => setConsultForm({...consultForm, notes: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Diagnosis</label>
                      <input
                        required
                        type="text"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-sm font-bold"
                        placeholder="e.g. Acute Bronchitis"
                        value={consultForm.diagnosis}
                        onChange={(e) => setConsultForm({...consultForm, diagnosis: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Follow-up Date</label>
                      <input
                        type="date"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-sm font-bold"
                        value={consultForm.followUpDate}
                        onChange={(e) => setConsultForm({...consultForm, followUpDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Pill size={14} className="text-emerald-500" /> Treatment Plan & Prescription
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all text-sm font-medium"
                      placeholder="Medication dosage, lifestyle changes, lab requests..."
                      value={consultForm.treatmentPlan}
                      onChange={(e) => setConsultForm({...consultForm, treatmentPlan: e.target.value})}
                    />
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-blue-500" /> Select Baseline Vitals
                    </h4>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={consultForm.vitalsId}
                      onChange={(e) => setConsultForm({...consultForm, vitalsId: e.target.value})}
                    >
                      {patientVitals.map(v => (
                        <option key={v.id} value={v.id}>{v.date} — BP: {v.bloodPressure}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => setIsVitalsModalOpen(true)}
                      className="w-full py-2 bg-white text-blue-600 text-[10px] font-bold uppercase border border-blue-200 rounded-xl hover:bg-blue-50"
                    >
                      Record New Vitals First
                    </button>
                  </div>

                  {aiSuggestions && (
                    <div className="bg-emerald-600 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-emerald-100 animate-in slide-in-from-right-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} /> AI Suggestions
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] opacity-70 font-bold uppercase mb-2">Likely Diagnoses</p>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.diagnoses.map((d, i) => (
                              <button 
                                key={i} 
                                type="button"
                                onClick={() => setConsultForm({...consultForm, diagnosis: d})}
                                className="px-2.5 py-1 bg-white/20 text-xs font-medium rounded-lg hover:bg-white/30 transition-colors"
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 font-bold uppercase mb-2">Recommended Tests</p>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.recommendedTests.map((t, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-700/40 text-xs font-medium rounded-lg border border-emerald-500/30">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">{currentUser.name.charAt(0)}</div>
                       <div>
                         <p className="text-xs font-bold">{currentUser.name}</p>
                         <p className="text-[10px] opacity-50 uppercase font-bold tracking-wider">Signing Physician</p>
                       </div>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      <Send size={18} /> Finalize Encounter
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Request Modal */}
      {isLabRequestModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsLabRequestModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="bg-purple-600 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Microscope size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Request Laboratory Test</h2>
                  <p className="text-purple-100 text-sm font-medium">Order investigations for {patient.fullName}</p>
                </div>
              </div>
              <button onClick={() => setIsLabRequestModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveLabRequest} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Investigation Category</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 outline-none transition-all"
                    value={labRequestForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as keyof typeof AVAILABLE_TESTS;
                      setLabRequestForm({
                        ...labRequestForm,
                        category: cat,
                        testName: AVAILABLE_TESTS[cat][0]
                      });
                    }}
                  >
                    {Object.keys(AVAILABLE_TESTS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Specific Test Name</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 outline-none transition-all"
                    value={labRequestForm.testName}
                    onChange={(e) => setLabRequestForm({...labRequestForm, testName: e.target.value})}
                  >
                    {AVAILABLE_TESTS[labRequestForm.category].map(test => (
                      <option key={test} value={test}>{test}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clinical Instructions / Reason for Test</label>
                  <textarea
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 focus:outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Fasting 8-10 hours, patient reports severe pain..."
                    value={labRequestForm.remarks}
                    onChange={(e) => setLabRequestForm({...labRequestForm, remarks: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3">Order Priority</p>
                   <div className="flex gap-4">
                      {['Routine', 'Urgent', 'STAT'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setLabRequestForm({...labRequestForm, priority: p})}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                            labRequestForm.priority === p 
                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {aiSuggestions && aiSuggestions.recommendedTests.length > 0 && (
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles size={12} /> Recommended based on AI consultation analysis:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.recommendedTests.map((test, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          // Search for the category containing this test if possible, or just set name
                          setLabRequestForm({ ...labRequestForm, testName: test });
                        }}
                        className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-[11px] font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {test}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLabRequestModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-2"
                >
                  <FlaskConical size={18} /> Generate Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;

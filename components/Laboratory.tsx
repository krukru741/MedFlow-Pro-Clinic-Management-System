
import React, { useState, useMemo } from 'react';
import { 
  Beaker, Search, Filter, Clock, CheckCircle2, FlaskConical, 
  MoreVertical, Eye, FileEdit, Sparkles, Send, X, AlertCircle,
  Microscope, ClipboardCheck, Download
} from 'lucide-react';
import { LabTest, LabResultItem, User as AppUser } from '../types';
import { MOCK_LAB_TESTS, MOCK_PATIENTS } from '../constants';
import { geminiService } from '../services/geminiService';

interface LaboratoryProps {
  currentUser: AppUser;
}

const Laboratory: React.FC<LaboratoryProps> = ({ currentUser }) => {
  const [tests, setTests] = useState<LabTest[]>(MOCK_LAB_TESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state for result entry
  const [resultItems, setResultItems] = useState<LabResultItem[]>([]);
  const [remarks, setRemarks] = useState('');

  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      const patient = MOCK_PATIENTS.find(p => p.id === t.patientId);
      const matchesSearch = t.testName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tests, searchTerm, filterStatus]);

  const handleOpenResultEntry = (test: LabTest) => {
    setSelectedTest(test);
    // Initialize result items based on common parameters if none exist
    if (test.results) {
      setResultItems(test.results);
    } else {
      // Default parameters based on test type
      const defaults: Record<string, LabResultItem[]> = {
        'Complete Blood Count (CBC)': [
          { parameter: 'Hemoglobin', value: '', unit: 'g/dL', referenceRange: '13.5 - 17.5' },
          { parameter: 'WBC Count', value: '', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0' },
          { parameter: 'Platelets', value: '', unit: 'x10^3/uL', referenceRange: '150 - 450' }
        ],
        'Urinalysis': [
          { parameter: 'Color', value: '', unit: 'n/a', referenceRange: 'Straw - Amber' },
          { parameter: 'pH', value: '', unit: 'n/a', referenceRange: '4.5 - 8.0' },
          { parameter: 'Glucose', value: '', unit: 'n/a', referenceRange: 'Negative' }
        ],
        'Lipid Profile': [
          { parameter: 'Total Cholesterol', value: '', unit: 'mg/dL', referenceRange: '< 200' },
          { parameter: 'HDL', value: '', unit: 'mg/dL', referenceRange: '> 40' },
          { parameter: 'LDL', value: '', unit: 'mg/dL', referenceRange: '< 100' }
        ]
      };
      setResultItems(defaults[test.testName] || [{ parameter: 'Value', value: '', unit: '', referenceRange: '' }]);
    }
    setRemarks(test.remarks || '');
    setIsResultModalOpen(true);
  };

  const handleResultChange = (index: number, field: keyof LabResultItem, value: string) => {
    const updated = [...resultItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-flag based on basic numeric comparison if reference range is standard
    if (field === 'value' && updated[index].referenceRange.includes('-')) {
      const [min, max] = updated[index].referenceRange.split('-').map(v => parseFloat(v.trim()));
      const val = parseFloat(value);
      if (!isNaN(val) && !isNaN(min) && !isNaN(max)) {
        updated[index].flag = val < min ? 'Low' : val > max ? 'High' : 'Normal';
      }
    }
    setResultItems(updated);
  };

  const handleSaveResults = (status: 'Released' | 'Processing') => {
    if (!selectedTest) return;
    
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      const updatedTests = tests.map(t => {
        if (t.id === selectedTest.id) {
          return {
            ...t,
            status,
            results: resultItems,
            remarks,
            labStaffId: currentUser.id
          };
        }
        return t;
      });
      setTests(updatedTests);
      setIsProcessing(false);
      setIsResultModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-[70] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500">
            <CheckCircle2 size={24} />
            <p className="font-bold">Test Status Updated Successfully</p>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Beaker size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Lab Information System (LIS)</h2>
            <p className="text-slate-500 text-sm">Managing clinical investigations and results</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search patient, test, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Released">Released</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Clock size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pending Requests</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{tests.filter(t => t.status === 'Pending').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Microscope size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">In Processing</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{tests.filter(t => t.status === 'Processing').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <CheckCircle2 size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Completed Today</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{tests.filter(t => t.status === 'Released').length}</p>
        </div>
      </div>

      {/* Test Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Investigation</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Ordered Date</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTests.map((test) => {
                const patient = MOCK_PATIENTS.find(p => p.id === test.patientId);
                return (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{test.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{patient?.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{patient?.id} • {patient?.gender}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FlaskConical size={14} /></span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{test.testName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{test.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{test.requestedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        test.status === 'Released' ? 'bg-emerald-50 text-emerald-600' : 
                        test.status === 'Processing' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenResultEntry(test)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          test.status === 'Released' 
                            ? 'text-slate-500 hover:bg-slate-100' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                        }`}
                      >
                        {test.status === 'Released' ? <Eye size={16} /> : <FileEdit size={16} />}
                        {test.status === 'Released' ? 'View Results' : 'Enter Results'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Entry Modal */}
      {isResultModalOpen && selectedTest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => !isProcessing && setIsResultModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden my-8">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-600 rounded-3xl">
                  <Microscope size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedTest.status === 'Released' ? 'Laboratory Report' : 'Enter Lab Results'}</h2>
                  <p className="text-slate-400 font-medium">{selectedTest.testName} for {MOCK_PATIENTS.find(p => p.id === selectedTest.patientId)?.fullName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResultModalOpen(false)} 
                disabled={isProcessing}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Investigation Details</p>
                  <p className="text-sm font-bold text-slate-900">{selectedTest.testName}</p>
                  <p className="text-xs text-slate-500">Category: {selectedTest.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Requested Date</p>
                  <p className="text-sm font-bold text-slate-900">{selectedTest.requestedDate}</p>
                  <p className="text-xs text-slate-500">Priority: Routine</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardCheck size={14} className="text-blue-500" /> Result Parameters
                  </h3>
                  {selectedTest.status !== 'Released' && (
                    <button 
                      onClick={() => setResultItems([...resultItems, { parameter: '', value: '', unit: '', referenceRange: '' }])}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      + Add Parameter
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-[2rem] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[9px]">Parameter</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[9px]">Result</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[9px]">Unit</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[9px]">Reference Range</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[9px] text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resultItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-3">
                            <input 
                              disabled={selectedTest.status === 'Released'}
                              className="w-full bg-transparent font-bold text-slate-900 focus:outline-none"
                              value={item.parameter}
                              onChange={(e) => handleResultChange(idx, 'parameter', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input 
                              disabled={selectedTest.status === 'Released'}
                              className={`w-full bg-slate-50 px-3 py-1.5 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500/20 outline-none ${item.flag !== 'Normal' && item.flag ? 'text-red-600' : 'text-blue-600'}`}
                              placeholder="0.00"
                              value={item.value}
                              onChange={(e) => handleResultChange(idx, 'value', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input 
                              disabled={selectedTest.status === 'Released'}
                              className="w-full bg-transparent text-slate-500 text-xs focus:outline-none"
                              value={item.unit}
                              onChange={(e) => handleResultChange(idx, 'unit', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input 
                              disabled={selectedTest.status === 'Released'}
                              className="w-full bg-transparent text-slate-500 text-xs font-medium focus:outline-none"
                              value={item.referenceRange}
                              onChange={(e) => handleResultChange(idx, 'referenceRange', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              item.flag === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 
                              item.flag ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {item.flag || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Clinical Remarks</h3>
                <textarea 
                  disabled={selectedTest.status === 'Released'}
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  placeholder="Enter any clinical observations or notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {selectedTest.status !== 'Released' && (
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => handleSaveResults('Processing')}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Clock size={18} /> Mark as Processing
                  </button>
                  <button 
                    onClick={() => handleSaveResults('Released')}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? 'Saving...' : <><Send size={18} /> Finalize & Release Result</>}
                  </button>
                </div>
              )}

              {selectedTest.status === 'Released' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest flex items-center gap-2">
                    {/* Add comment: Fixed missing Download icon from lucide-react */}
                    <Download size={16} /> Download Signed PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Laboratory;

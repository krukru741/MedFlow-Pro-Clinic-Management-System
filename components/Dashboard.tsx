
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS } from '../constants';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Patients', value: MOCK_PATIENTS.length, icon: <Users className="text-blue-600" />, trend: '+12% this month' },
    { label: 'Today\'s Appointments', value: 12, icon: <Calendar className="text-green-600" />, trend: '3 remaining' },
    { label: 'Pending Lab Tests', value: 8, icon: <Activity className="text-orange-600" />, trend: 'Action required' },
    { label: 'Monthly Revenue', value: '$12,450', icon: <TrendingUp className="text-purple-600" />, trend: '+5.4% vs last month' },
  ];

  const fitnessData = [
    { name: 'Fit', value: MOCK_PATIENTS.filter(p => p.fitnessStatus === 'Fit').length },
    { name: 'Temp Unfit', value: MOCK_PATIENTS.filter(p => p.fitnessStatus === 'Temporarily Unfit').length },
    { name: 'Unfit', value: MOCK_PATIENTS.filter(p => p.fitnessStatus === 'Unfit').length },
  ];

  const conditionData = [
    { name: 'Hypertensive', count: MOCK_PATIENTS.filter(p => p.isHypertensive).length },
    { name: 'Diabetic', count: MOCK_PATIENTS.filter(p => p.isDiabetic).length },
    { name: 'Healthy', count: MOCK_PATIENTS.filter(p => !p.isHypertensive && !p.isDiabetic).length },
  ];

  const COLORS = ['#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-xl">{stat.icon}</div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{stat.trend}</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Fitness-to-Work Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fitnessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fitnessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Patient Health Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Appointments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 font-semibold text-slate-600 text-sm">Patient</th>
                <th className="pb-3 font-semibold text-slate-600 text-sm">Doctor</th>
                <th className="pb-3 font-semibold text-slate-600 text-sm">Time</th>
                <th className="pb-3 font-semibold text-slate-600 text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_APPOINTMENTS.map((app) => (
                <tr key={app.id}>
                  <td className="py-4 text-sm text-slate-900 font-medium">
                    {MOCK_PATIENTS.find(p => p.id === app.patientId)?.fullName}
                  </td>
                  <td className="py-4 text-sm text-slate-600">Dr. Sarah Smith</td>
                  <td className="py-4 text-sm text-slate-600">{app.time}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      app.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

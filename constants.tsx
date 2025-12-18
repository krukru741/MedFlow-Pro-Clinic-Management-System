
import React from 'react';
import { UserRole, Patient, User, Appointment, LabTest, PatientStatus, FitnessStatus, VitalSigns, Consultation } from './types';
import { LayoutDashboard, Users, Calendar, Stethoscope, Beaker, ReceiptText, FileBarChart, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: 'dashboard', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.LAB_STAFF, UserRole.CASHIER] },
  { label: 'Patients', icon: <Users size={20} />, path: 'patients', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST] },
  { label: 'Appointments', icon: <Calendar size={20} />, path: 'appointments', roles: [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE] },
  { label: 'Consultations', icon: <Stethoscope size={20} />, path: 'consultations', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE] },
  { label: 'Laboratory', icon: <Beaker size={20} />, path: 'laboratory', roles: [UserRole.ADMIN, UserRole.LAB_STAFF, UserRole.DOCTOR] },
  { label: 'Billing', icon: <ReceiptText size={20} />, path: 'billing', roles: [UserRole.ADMIN, UserRole.CASHIER] },
  { label: 'Reports', icon: <FileBarChart size={20} />, path: 'reports', roles: [UserRole.ADMIN] },
  { label: 'Settings', icon: <Settings size={20} />, path: 'settings', roles: [UserRole.ADMIN] },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Sarah Smith', role: UserRole.DOCTOR, email: 'doctor@medflow.com' },
  { id: 'u2', name: 'John Admin', role: UserRole.ADMIN, email: 'admin@medflow.com' },
  { id: 'u3', name: 'Nurse Joy', role: UserRole.NURSE, email: 'nurse@medflow.com' },
  { id: 'u4', name: 'Lisa Reception', role: UserRole.RECEPTIONIST, email: 'reception@medflow.com' },
  { id: 'u5', name: 'Mike Lab', role: UserRole.LAB_STAFF, email: 'lab@medflow.com' },
  { id: 'u6', name: 'Alice Cash', role: UserRole.CASHIER, email: 'cashier@medflow.com' },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1001',
    fullName: 'Robert De Niro',
    gender: 'Male',
    birthDate: '1943-08-17',
    age: 80,
    address: '123 Hollywood Blvd, CA',
    contactNumber: '555-0101',
    emergencyContact: 'Jane De Niro (555-0102)',
    medicalHistory: ['Hypertension', 'Former Smoker'],
    status: PatientStatus.ACTIVE,
    fitnessStatus: FitnessStatus.FIT,
    isHypertensive: true,
    isDiabetic: false,
  },
  {
    id: 'P-1002',
    fullName: 'Meryl Streep',
    gender: 'Female',
    birthDate: '1949-06-22',
    age: 74,
    address: '456 Academy Rd, NY',
    contactNumber: '555-0202',
    emergencyContact: 'Don Gummer (555-0203)',
    medicalHistory: ['Type 2 Diabetes'],
    status: PatientStatus.ACTIVE,
    fitnessStatus: FitnessStatus.TEMPORARILY_UNFIT,
    isHypertensive: false,
    isDiabetic: true,
  },
  {
    id: 'P-1003',
    fullName: 'Denzel Washington',
    gender: 'Male',
    birthDate: '1954-12-28',
    age: 69,
    address: '789 Oscar Way, WA',
    contactNumber: '555-0303',
    emergencyContact: 'Pauletta Washington (555-0304)',
    medicalHistory: ['Asthma'],
    status: PatientStatus.ACTIVE,
    fitnessStatus: FitnessStatus.FIT,
    isHypertensive: false,
    isDiabetic: false,
  }
];

export const MOCK_VITALS: VitalSigns[] = [
  {
    id: 'V1',
    patientId: 'P-1001',
    date: '2024-05-15',
    bloodPressure: '145/95',
    heartRate: 78,
    temperature: 36.6,
    height: 177,
    weight: 82,
    bmi: 26.2
  },
  {
    id: 'V2',
    patientId: 'P-1001',
    date: '2024-04-10',
    bloodPressure: '150/100',
    heartRate: 82,
    temperature: 36.8,
    height: 177,
    weight: 84,
    bmi: 26.8
  },
  {
    id: 'V3',
    patientId: 'P-1002',
    date: '2024-05-12',
    bloodPressure: '120/80',
    heartRate: 72,
    temperature: 37.1,
    height: 168,
    weight: 65,
    bmi: 23.0
  }
];

export const MOCK_LAB_TESTS: LabTest[] = [
  {
    id: 'L1',
    patientId: 'P-1001',
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    requestedDate: '2024-05-15',
    status: 'Released',
    labStaffId: 'u5',
    results: [
      { parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '13.5 - 17.5', flag: 'Normal' },
      { parameter: 'WBC Count', value: '8.4', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', flag: 'Normal' },
      { parameter: 'Platelets', value: '250', unit: 'x10^3/uL', referenceRange: '150 - 450', flag: 'Normal' },
      { parameter: 'Hematocrit', value: '42.1', unit: '%', referenceRange: '41.0 - 50.0', flag: 'Normal' },
    ],
    remarks: 'All parameters within normal clinical limits.'
  },
  {
    id: 'L2',
    patientId: 'P-1001',
    testName: 'Lipid Profile',
    category: 'Biochemistry',
    requestedDate: '2024-05-15',
    status: 'Released',
    labStaffId: 'u5',
    results: [
      { parameter: 'Total Cholesterol', value: '210', unit: 'mg/dL', referenceRange: '< 200', flag: 'High' },
      { parameter: 'HDL (Good)', value: '45', unit: 'mg/dL', referenceRange: '> 40', flag: 'Normal' },
      { parameter: 'LDL (Bad)', value: '145', unit: 'mg/dL', referenceRange: '< 100', flag: 'High' },
      { parameter: 'Triglycerides', value: '160', unit: 'mg/dL', referenceRange: '< 150', flag: 'High' },
    ],
    remarks: 'Borderline high cholesterol levels. Dietary changes advised.'
  },
  {
    id: 'L3',
    patientId: 'P-1002',
    testName: 'HbA1c (Glycated Hemoglobin)',
    category: 'Biochemistry',
    requestedDate: '2024-05-12',
    status: 'Released',
    labStaffId: 'u5',
    results: [
      { parameter: 'HbA1c', value: '7.1', unit: '%', referenceRange: '4.0 - 5.6', flag: 'High' },
    ],
    remarks: 'Diabetes management requires review.'
  },
  {
    id: 'L4',
    patientId: 'P-1001',
    testName: 'Urinalysis',
    category: 'Urinalysis',
    requestedDate: '2024-05-18',
    status: 'Pending'
  }
];

export const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: 'C1',
    patientId: 'P-1001',
    doctorId: 'u1',
    date: '2024-05-15',
    vitalsId: 'V1',
    notes: 'Patient reports mild headaches in the morning. Adhering to medication but diet needs improvement.',
    diagnosis: 'Uncontrolled Hypertension',
    treatmentPlan: 'Adjust Dosage of Amlodipine to 10mg. Low sodium diet recommended. Return in 2 weeks.',
    followUpDate: '2024-05-29'
  },
  {
    id: 'C2',
    patientId: 'P-1001',
    doctorId: 'u1',
    date: '2024-04-10',
    vitalsId: 'V2',
    notes: 'Routine checkup. Blood pressure remains elevated.',
    diagnosis: 'Hypertension Stage II',
    treatmentPlan: 'Continue current medication. Stress management discussed.',
    followUpDate: '2024-05-10'
  },
  {
    id: 'C3',
    patientId: 'P-1002',
    doctorId: 'u1',
    date: '2024-05-12',
    vitalsId: 'V3',
    notes: 'Patient monitoring glucose levels. A1C is stable but weight has increased slightly.',
    diagnosis: 'Type 2 Diabetes Mellitus',
    treatmentPlan: 'Continue Metformin. Increase physical activity to 30 mins daily.',
    followUpDate: '2024-06-12'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'A1', patientId: 'P-1001', doctorId: 'u1', date: '2024-05-20', time: '09:00', type: 'Scheduled', status: 'Pending' },
  { id: 'A2', patientId: 'P-1002', doctorId: 'u1', date: '2024-05-20', time: '10:30', type: 'Walk-in', status: 'Pending' },
  { id: 'A3', patientId: 'P-1003', doctorId: 'u1', date: '2024-05-19', time: '14:00', type: 'Scheduled', status: 'Completed' },
];

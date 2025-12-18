
export enum UserRole {
  ADMIN = 'Admin',
  DOCTOR = 'Doctor',
  NURSE = 'Nurse',
  RECEPTIONIST = 'Receptionist',
  LAB_STAFF = 'Lab Staff',
  CASHIER = 'Cashier'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export enum PatientStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  UNFIT = 'Unfit'
}

export enum FitnessStatus {
  FIT = 'Fit',
  TEMPORARILY_UNFIT = 'Temporarily Unfit',
  UNFIT = 'Unfit'
}

export interface Patient {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  birthDate: string;
  age: number;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  medicalHistory: string[];
  status: PatientStatus;
  fitnessStatus: FitnessStatus;
  isHypertensive: boolean;
  isDiabetic: boolean;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  date: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  height: number;
  weight: number;
  bmi: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Walk-in' | 'Scheduled';
  status: 'Pending' | 'Completed' | 'Cancelled';
}

export interface LabResultItem {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'Normal' | 'High' | 'Low';
}

export interface LabTest {
  id: string;
  patientId: string;
  testName: string;
  category: 'Hematology' | 'Urinalysis' | 'Imaging' | 'Biochemistry';
  requestedDate: string;
  status: 'Pending' | 'Processing' | 'Released';
  results?: LabResultItem[];
  remarks?: string;
  labStaffId?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  date: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  vitalsId: string;
  notes: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpDate?: string;
}

export interface BillRow {
  _id?: string;
  id?: number; // Local ID for UI
  sn: string;
  name: string;
  amtPaid: string;
  school: string;
  schoolType: 'primary' | 'secondary' | 'university';
  // Academic Session
  academicYear: string; // e.g., "2025/2026"
  // Primary school terms
  primary1stTerm: string;
  primary2ndTerm: string;
  primary3rdTerm: string;
  // Secondary school terms
  secondary1stTerm: string;
  secondary2ndTerm: string;
  secondary3rdTerm: string;
  // University semesters
  university1stSemester: string;
  university2ndSemester: string;
  createdAt?: Date;
  updatedAt?: Date;
  paymentDate?: string; // ISO string when payment was made
  payments?: { amount: number; date: string }[]; // history of payments
}
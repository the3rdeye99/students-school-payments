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
  // Assistance amounts per period (what client paid)
  assistPrimary1stTerm?: string;
  assistPrimary2ndTerm?: string;
  assistPrimary3rdTerm?: string;
  assistSecondary1stTerm?: string;
  assistSecondary2ndTerm?: string;
  assistSecondary3rdTerm?: string;
  assistUniversity1stSemester?: string;
  assistUniversity2ndSemester?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paymentDate?: string; // ISO string when payment was made
  payments?: { amount: number; date: string; period?: string }[]; // history of payments with optional period tag
}
'use client';

import { useState, useEffect } from 'react';
import { Calculator, ArrowLeft, Search, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BillRow } from '@/types/bill';
import { saveBills } from '@/lib/billsService';

export default function PreviousBillsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previousBills, setPreviousBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAcademicYear, setEditingAcademicYear] = useState<{ [billId: string]: string }>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [paymentsBill, setPaymentsBill] = useState<BillRow | null>(null);

  // Helper to compute current academic year based on September rule
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed, September = 8
    return month >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
  };

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch('/api/bills');
        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }
        const result = await response.json();
        const currentSession = getCurrentAcademicYear();
        // Normalize academicYear locally so UI never shows 'Unknown'
        const rawBills: BillRow[] = result.data || [];
        const normalizedBills = rawBills.map((b) => ({
          ...b,
          academicYear: b.academicYear && b.academicYear !== 'Unknown' ? b.academicYear : currentSession,
        }));
        setPreviousBills(normalizedBills);
        // Persist any that were Unknown/missing in background
        const needsUpdate = rawBills.filter(b => !b.academicYear || b.academicYear === 'Unknown');
        if (needsUpdate.length > 0) {
          try {
            await saveBills(needsUpdate.map(b => ({ ...b, academicYear: currentSession })));
          } catch (_) {
            // ignore background persistence errors for UX
          }
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
        setError('Failed to load bills');
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    fetchBills();
  }, []);

  // Automatically update 'Unknown' academic year bills
  useEffect(() => {
    const updateUnknownBills = async () => {
      if (!previousBills || previousBills.length === 0) {
        setInitializing(false);
        return;
      }
      const unknownBills = previousBills.filter(bill => bill.academicYear === 'Unknown');
      if (unknownBills.length === 0) {
        setInitializing(false);
        return;
      }
      // Determine the correct academic year
      const academicYear = getCurrentAcademicYear();
      try {
        await saveBills(unknownBills.map(bill => ({ ...bill, academicYear })));
        // Always fetch all bills after update
        const response = await fetch('/api/bills');
        const result = await response.json();
        const rawBills: BillRow[] = result.data || [];
        const normalizedBills = rawBills.map((b) => ({
          ...b,
          academicYear: b.academicYear && b.academicYear !== 'Unknown' ? b.academicYear : academicYear,
        }));
        setPreviousBills(normalizedBills);
      } catch (err) {
        // Optionally handle error
      } finally {
        setInitializing(false);
      }
    };
    updateUnknownBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousBills]);

  // Helper function to calculate previous bill total based on school type
  const calculatePreviousBillTotal = (bill: BillRow): number => {
    switch (bill.schoolType) {
      case 'primary':
        return (parseFloat(bill.primary1stTerm) || 0) + 
               (parseFloat(bill.primary2ndTerm) || 0) + 
               (parseFloat(bill.primary3rdTerm) || 0);
      case 'secondary':
        return (parseFloat(bill.secondary1stTerm) || 0) + 
               (parseFloat(bill.secondary2ndTerm) || 0) + 
               (parseFloat(bill.secondary3rdTerm) || 0);
      case 'university':
        return (parseFloat(bill.university1stSemester) || 0) + 
               (parseFloat(bill.university2ndSemester) || 0);
      default:
        return 0;
    }
  };

  // Filter bills based on search term
  const filteredBills = previousBills.filter(bill => 
    bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPreviousBills = previousBills.reduce((sum, bill) => sum + calculatePreviousBillTotal(bill), 0);

  // Group bills by academic year
  const groupedByYear: { [year: string]: BillRow[] } = previousBills.reduce((acc, bill) => {
    const year = bill.academicYear || getCurrentAcademicYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(bill);
    return acc;
  }, {} as { [year: string]: BillRow[] });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  // Handler to update academic year
  const handleAcademicYearChange = async (bill: BillRow, newYear: string) => {
    if (!newYear || newYear === bill.academicYear) return;
    setUpdating(bill._id || '');
    try {
      const updatedBill = { ...bill, academicYear: newYear };
      await saveBills([updatedBill]);
      setEditingAcademicYear((prev) => ({ ...prev, [bill._id || '']: '' }));
      // Refresh bills
      const response = await fetch('/api/bills');
      const result = await response.json();
      const rawBills: BillRow[] = result.data || [];
      const normalizedBills = rawBills.map((b) => ({
        ...b,
        academicYear: b.academicYear && b.academicYear !== 'Unknown' ? b.academicYear : getCurrentAcademicYear(),
      }));
      setPreviousBills(normalizedBills);
    } catch (err) {
      alert('Failed to update academic year');
    } finally {
      setUpdating(null);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Initializing academic years...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to Current Bills</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Previous Bills History</h1>
                <p className="text-sm text-gray-600">View archived billing records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Summary */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by student name or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Previous Bills</p>
                <p className="text-2xl font-bold text-gray-900">₦{totalPreviousBills.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grouped by Academic Year */}
        {sortedYears.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium mb-2">No Previous Bills</p>
            <p className="text-sm">Previous bills will appear here when archived</p>
          </div>
        )}
        {sortedYears.map((year) => {
          const yearBills = groupedByYear[year].filter(bill =>
            bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.school.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (yearBills.length === 0) return null;
          const isOpen = expandedYear === year;
          return (
            <div key={year} className="mb-10">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl shadow-lg mb-0 cursor-pointer select-none" onClick={() => setExpandedYear(isOpen ? null : year)}>
                <div className="px-6 py-4 flex items-center justify-between text-white rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold">Academic Year {year}</h2>
                      <p className="text-sm text-indigo-100">
                        {yearBills.length} student{yearBills.length !== 1 ? 's' : ''} •
                        {yearBills.filter(r => r.schoolType === 'primary').length} Primary •
                        {yearBills.filter(r => r.schoolType === 'secondary').length} Secondary •
                        {yearBills.filter(r => r.schoolType === 'university').length} University
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ₦{yearBills.reduce((sum, row) => sum + calculatePreviousBillTotal(row), 0).toLocaleString()}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="bg-white rounded-b-xl shadow-lg p-6">
                  {/* Primary Table */}
                  <div className="mb-6">
                    <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              Previous Bills - Primary School
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "studentName", label: "Student Name", width: "w-40" },
                    { key: "school", label: "School", width: "w-40" },
                    { key: "1stTerm", label: "1st Term", width: "w-28" },
                    { key: "2ndTerm", label: "2nd Term", width: "w-28" },
                    { key: "3rdTerm", label: "3rd Term", width: "w-28" },
                    { key: "paid", label: "Paid", width: "w-28" },
                    { key: "total", label: "Total", width: "w-28" },
                    { key: "date", label: "Date", width: "w-32" }
                  ].map((col, idx) => (
                    <th key={idx} className={`${col.width} px-3 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                          {yearBills.filter(bill => bill.schoolType === 'primary').map((bill) => {
                  const total = calculatePreviousBillTotal(bill);
                  return (
                    <tr 
                      key={bill._id} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/?billId=${bill._id}`)}
                    >
                      <td className="px-3 py-3 border-b border-gray-100 relative">
                        <span className="text-sm text-gray-900">{bill.name}</span>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">{bill.school}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.primary1stTerm || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.primary2ndTerm || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.primary3rdTerm || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.amtPaid || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-blue-600">₦{total.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                                  {bill.academicYear === 'Unknown' ? (
                                    <input
                                      type="text"
                                      className="border border-blue-300 rounded px-2 py-1 text-sm w-28"
                                      placeholder="e.g. 2025/2026"
                                      value={editingAcademicYear[bill._id || ''] ?? ''}
                                      onChange={e => setEditingAcademicYear(prev => ({ ...prev, [bill._id || '']: e.target.value }))}
                                      onBlur={e => handleAcademicYearChange(bill, editingAcademicYear[bill._id || ''])}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleAcademicYearChange(bill, editingAcademicYear[bill._id || '']);
                                      }}
                                      disabled={updating === bill._id}
                                    />
                                  ) : (
                        <>
                        <span className="text-sm text-gray-600">
                          {bill.payments && bill.payments.length > 0
                            ? new Date(bill.payments[bill.payments.length - 1].date).toLocaleDateString()
                            : bill.paymentDate
                              ? new Date(bill.paymentDate).toLocaleDateString()
                              : (bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A')}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPaymentsBill(bill); }}
                          className="ml-2 text-blue-600 hover:text-blue-700 underline text-xs"
                        >
                          View
                        </button>
                        </>
                                  )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
                    {yearBills.filter(bill => bill.schoolType === 'primary').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Previous Primary Bills</p>
              <p className="text-sm">Previous primary school bills will appear here when archived</p>
            </div>
          )}
        </div>
                  {/* Secondary Table */}
                  <div className="mb-6">
                    <div className="sticky top-0 z-20 bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              Previous Bills - Secondary School
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "studentName", label: "Student Name", width: "w-40" },
                    { key: "school", label: "School", width: "w-40" },
                    { key: "1stTerm", label: "1st Term", width: "w-28" },
                    { key: "2ndTerm", label: "2nd Term", width: "w-28" },
                    { key: "3rdTerm", label: "3rd Term", width: "w-28" },
                    { key: "paid", label: "Paid", width: "w-28" },
                    { key: "total", label: "Total", width: "w-28" },
                    { key: "date", label: "Date", width: "w-32" }
                  ].map((col, idx) => (
                    <th key={idx} className={`${col.width} px-3 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                          {yearBills.filter(bill => bill.schoolType === 'secondary').map((bill) => {
                  const total = calculatePreviousBillTotal(bill);
                  return (
                    <tr 
                      key={bill._id} 
                      className="hover:bg-green-50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/?billId=${bill._id}`)}
                    >
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">{bill.name}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">{bill.school}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.secondary1stTerm || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.secondary2ndTerm || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.secondary3rdTerm || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.amtPaid || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-green-600">₦{total.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                                  {bill.academicYear === 'Unknown' ? (
                                    <input
                                      type="text"
                                      className="border border-green-300 rounded px-2 py-1 text-sm w-28"
                                      placeholder="e.g. 2025/2026"
                                      value={editingAcademicYear[bill._id || ''] ?? ''}
                                      onChange={e => setEditingAcademicYear(prev => ({ ...prev, [bill._id || '']: e.target.value }))}
                                      onBlur={e => handleAcademicYearChange(bill, editingAcademicYear[bill._id || ''])}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleAcademicYearChange(bill, editingAcademicYear[bill._id || '']);
                                      }}
                                      disabled={updating === bill._id}
                                    />
                                  ) : (
                        <>
                        <span className="text-sm text-gray-600">
                          {bill.payments && bill.payments.length > 0
                            ? new Date(bill.payments[bill.payments.length - 1].date).toLocaleDateString()
                            : bill.paymentDate
                              ? new Date(bill.paymentDate).toLocaleDateString()
                              : (bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A')}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPaymentsBill(bill); }}
                          className="ml-2 text-green-600 hover:text-green-700 underline text-xs"
                        >
                          View
                        </button>
                        </>
                                  )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
                    {yearBills.filter(bill => bill.schoolType === 'secondary').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Previous Secondary Bills</p>
              <p className="text-sm">Previous secondary school bills will appear here when archived</p>
            </div>
          )}
        </div>
                  {/* University Table */}
                  <div>
                    <div className="sticky top-0 z-20 bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              Previous Bills - University
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "studentName", label: "Student Name", width: "w-40" },
                    { key: "school", label: "School", width: "w-40" },
                    { key: "1stSemester", label: "1st Semester", width: "w-28" },
                    { key: "2ndSemester", label: "2nd Semester", width: "w-28" },
                    { key: "paid", label: "Paid", width: "w-28" },
                    { key: "total", label: "Total", width: "w-28" },
                    { key: "date", label: "Date", width: "w-32" }
                  ].map((col, idx) => (
                    <th key={idx} className={`${col.width} px-3 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                          {yearBills.filter(bill => bill.schoolType === 'university').map((bill) => {
                  const total = calculatePreviousBillTotal(bill);
                  return (
                    <tr 
                      key={bill._id} 
                      className="hover:bg-purple-50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/?billId=${bill._id}`)}
                    >
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">{bill.name}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">{bill.school}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.university1stSemester || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.university2ndSemester || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-900">₦{parseFloat(bill.amtPaid || '0').toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-purple-600">₦{total.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                                  {bill.academicYear === 'Unknown' ? (
                                    <input
                                      type="text"
                                      className="border border-purple-300 rounded px-2 py-1 text-sm w-28"
                                      placeholder="e.g. 2025/2026"
                                      value={editingAcademicYear[bill._id || ''] ?? ''}
                                      onChange={e => setEditingAcademicYear(prev => ({ ...prev, [bill._id || '']: e.target.value }))}
                                      onBlur={e => handleAcademicYearChange(bill, editingAcademicYear[bill._id || ''])}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleAcademicYearChange(bill, editingAcademicYear[bill._id || '']);
                                      }}
                                      disabled={updating === bill._id}
                                    />
                                  ) : (
                        <>
                        <span className="text-sm text-gray-600">
                          {bill.payments && bill.payments.length > 0
                            ? new Date(bill.payments[bill.payments.length - 1].date).toLocaleDateString()
                            : bill.paymentDate
                              ? new Date(bill.paymentDate).toLocaleDateString()
                              : (bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A')}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPaymentsBill(bill); }}
                          className="ml-2 text-purple-600 hover:text-purple-700 underline text-xs"
                        >
                          View
                        </button>
                        </>
                                  )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
                    {yearBills.filter(bill => bill.schoolType === 'university').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Previous University Bills</p>
              <p className="text-sm">Previous university bills will appear here when archived</p>
            </div>
          )}
        </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Payments modal */}
      {paymentsBill && <PaymentsModal bill={paymentsBill} onClose={() => setPaymentsBill(null)} />}
    </div>
  );
}

// Payments history modal
// Render at end of file
export function PaymentsModal({ bill, onClose }: { bill: BillRow | null; onClose: () => void }) {
  if (!bill) return null;
  const payments = (bill.payments || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const firstPaymentDate = payments.length > 0
    ? new Date(payments[0].date)
    : bill.paymentDate
      ? new Date(bill.paymentDate)
      : (bill.createdAt ? new Date(bill.createdAt) : null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payment History - {bill.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Close</button>
        </div>
        <div className="p-6">
          <div className="mb-4 text-sm">
            <span className="text-gray-600">Payment date (1st term/semester): </span>
            <span className="font-medium text-gray-900">{firstPaymentDate ? firstPaymentDate.toLocaleString() : 'N/A'}</span>
          </div>
          {payments.length === 0 ? (
            <div className="text-sm text-gray-600">No payments recorded.</div>
          ) : (
            <div className="space-y-3">
              {payments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{new Date(p.date).toLocaleString()}</span>
                  <span className="font-medium text-gray-900">₦{(p.amount || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                <span className="text-gray-600">Total recorded</span>
                <span className="font-semibold text-gray-900">₦{total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mount modal from main page component
// Note: Add this JSX within PreviousBillsPage return near the end
// <>{paymentsBill && <PaymentsModal bill={paymentsBill} onClose={() => setPaymentsBill(null)} />}</>

'use client';

import { useState, useEffect } from 'react';
import { Calculator, ArrowLeft, Search, Edit } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BillRow } from '@/types/bill';

export default function PreviousBillsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previousBills, setPreviousBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch('/api/bills');
        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }
        const result = await response.json();
        setPreviousBills(result.data);
      } catch (error) {
        console.error('Error fetching bills:', error);
        setError('Failed to load bills');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

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

        {/* Previous Bills History - Primary School */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
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
                {filteredBills.filter(bill => bill.schoolType === 'primary').map((bill) => {
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
                        <span className="text-sm font-medium text-blue-600">₦{total.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredBills.filter(bill => bill.schoolType === 'primary').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Previous Primary Bills</p>
              <p className="text-sm">Previous primary school bills will appear here when archived</p>
            </div>
          )}
        </div>

        {/* Previous Bills History - Secondary School */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
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
                {filteredBills.filter(bill => bill.schoolType === 'secondary').map((bill) => {
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
                        <span className="text-sm font-medium text-green-600">₦{total.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredBills.filter(bill => bill.schoolType === 'secondary').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Previous Secondary Bills</p>
              <p className="text-sm">Previous secondary school bills will appear here when archived</p>
            </div>
          )}
        </div>

        {/* Previous Bills History - University */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
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
                {filteredBills.filter(bill => bill.schoolType === 'university').map((bill) => {
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
                        <span className="text-sm font-medium text-purple-600">₦{total.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredBills.filter(bill => bill.schoolType === 'university').length === 0 && (
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
    </div>
  );
}

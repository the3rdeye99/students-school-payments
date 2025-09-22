"use client";

import { useState, useEffect } from 'react';
import { Upload, Plus, Save, Download, Search, Filter, Calculator, Users, Trash2, History } from 'lucide-react';
import { saveBills, getBillById } from '@/lib/billsService';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface BillRow {
  id: number;
  sn: string;
  name: string;
  amtPaid: string;
  school: string;
  schoolType: 'primary' | 'secondary' | 'university';
  academicYear: string;
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
}



export default function HomePage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rows, setRows] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const defaultAcademicYear = `${currentYear}/${nextYear}`;

  useEffect(() => {
    const billId = searchParams.get('billId');
    if (billId) {
      loadBill(billId);
    }
  }, [searchParams]);

  const loadBill = async (billId: string) => {
    try {
      setLoading(true);
      const bill = await getBillById(billId);
      if (bill) {
        const billData: BillRow = {
          id: bill._id,
          sn: bill.sn,
          name: bill.name,
          amtPaid: bill.amtPaid,
          school: bill.school,
          schoolType: bill.schoolType,
          academicYear: bill.academicYear,
          primary1stTerm: bill.primary1stTerm || "",
          primary2ndTerm: bill.primary2ndTerm || "",
          primary3rdTerm: bill.primary3rdTerm || "",
          secondary1stTerm: bill.secondary1stTerm || "",
          secondary2ndTerm: bill.secondary2ndTerm || "",
          secondary3rdTerm: bill.secondary3rdTerm || "",
          university1stSemester: bill.university1stSemester || "",
          university2ndSemester: bill.university2ndSemester || "",
        };
        setRows([billData]);
      }
    } catch (error) {
      console.error('Error loading bill:', error);
      alert('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const addRow = (schoolType: 'primary' | 'secondary' | 'university' = 'primary') => {
    const newRow: BillRow = {
      id: rows.length + 1,
      sn: String(rows.length + 1).padStart(3, '0'),
      name: "",
      amtPaid: "",
      school: "",
      schoolType: schoolType,
      academicYear: defaultAcademicYear,
      primary1stTerm: "",
      primary2ndTerm: "",
      primary3rdTerm: "",
      secondary1stTerm: "",
      secondary2ndTerm: "",
      secondary3rdTerm: "",
      university1stSemester: "",
      university2ndSemester: ""
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id: number, field: keyof BillRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const deleteRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    try {
      if (rows.length === 0) {
        alert('No bills to save');
        return;
      }

      // Validate required fields
      const invalidRows = rows.filter(row => !row.name || !row.school || !row.academicYear);
      if (invalidRows.length > 0) {
        alert('Please fill in all required fields (Name, School, and Academic Year) for all rows.');
        return;
      }

      const result = await saveBills(rows);
      
      // Success case - update the rows with the returned data
      const updatedBills = result.data;
      setRows(updatedBills.map((bill: any) => ({
        id: bill._id, // Use MongoDB _id as the row id
        _id: bill._id, // Keep _id for updates
        sn: bill.sn || '',
        name: bill.name || '',
        amtPaid: bill.amtPaid || '',
        school: bill.school || '',
        schoolType: bill.schoolType || 'primary',
        academicYear: bill.academicYear || defaultAcademicYear,
        primary1stTerm: bill.primary1stTerm || "",
        primary2ndTerm: bill.primary2ndTerm || "",
        primary3rdTerm: bill.primary3rdTerm || "",
        secondary1stTerm: bill.secondary1stTerm || "",
        secondary2ndTerm: bill.secondary2ndTerm || "",
        secondary3rdTerm: bill.secondary3rdTerm || "",
        university1stSemester: bill.university1stSemester || "",
        university2ndSemester: bill.university2ndSemester || "",
      })));
      
      alert('Bills saved successfully!');
    } catch (error: any) {
      console.error('Error saving bills:', error);
      alert(error.message || 'Failed to save bills. Please try again.');
    }
  };

  // Helper function to calculate current bill based on school type
  const calculateCurrentBill = (row: BillRow): number => {
    switch (row.schoolType) {
      case 'primary':
        return (parseFloat(row.primary1stTerm) || 0) + 
               (parseFloat(row.primary2ndTerm) || 0) + 
               (parseFloat(row.primary3rdTerm) || 0);
      case 'secondary':
        return (parseFloat(row.secondary1stTerm) || 0) + 
               (parseFloat(row.secondary2ndTerm) || 0) + 
               (parseFloat(row.secondary3rdTerm) || 0);
      case 'university':
        return (parseFloat(row.university1stSemester) || 0) + 
               (parseFloat(row.university2ndSemester) || 0);
      default:
        return 0;
    }
  };

  const totalPreviousBills = 0; // This will be managed on the separate Previous Bills page
  
  // Calculate total current bill using the helper function
  const totalCurrentBill = rows.reduce((sum, row) => {
    return sum + calculateCurrentBill(row);
  }, 0);
  
  const totalPaid = rows.reduce((sum, row) => sum + (parseFloat(row.amtPaid) || 0), 0);
  const totalOutstanding = totalCurrentBill - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">School Bills</h1>
                <p className="text-sm text-gray-600">Manage student payments and billing records</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/previous-bills"
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <History className="w-4 h-4" />
                View Previous Bills
              </Link>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                <Upload className="w-4 h-4" />
                Upload CSV
              </button>
              
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-md"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Bills</p>
                <p className="text-2xl font-bold text-gray-900">₦{totalCurrentBill.toLocaleString()}</p>
              </div>
              <Calculator className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₦{totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, school, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>



        {/* Primary School Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                Primary School Students
              </h2>
              <button 
                onClick={() => addRow('primary')}
                className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Primary Student
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "sn", label: "S/N", width: "w-16" },
                    { key: "name", label: "Name", width: "w-40" },
                    { key: "school", label: "School", width: "w-40" },
                    { key: "1stTerm", label: "1st Term", width: "w-28" },
                    { key: "2ndTerm", label: "2nd Term", width: "w-28" },
                    { key: "3rdTerm", label: "3rd Term", width: "w-28" },
                    { key: "currentBill", label: "Current Bill", width: "w-28" },
                    { key: "amtPaid", label: "Paid", width: "w-28" },
                    { key: "status", label: "Status", width: "w-24" },
                    { key: "actions", label: "", width: "w-16" }
                  ].map((col, idx) => (
                    <th key={idx} className={`${col.width} px-3 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.filter(row => row.schoolType === 'primary').map((row, rowIdx) => {
                  const currentBill = calculateCurrentBill(row);
                  const outstanding = currentBill - (parseFloat(row.amtPaid) || 0);
                  const isPaid = outstanding <= 0 && row.amtPaid && currentBill > 0;
                  
                  return (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="w-14 h-8 bg-blue-100 rounded-md flex items-center justify-center text-xs font-medium text-blue-700">
                          {row.sn}
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-900"
                          placeholder="Enter student name"
                        />
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={row.school}
                          onChange={(e) => updateRow(row.id, 'school', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-900"
                          placeholder="School name"
                        />
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.primary1stTerm}
                            onChange={(e) => updateRow(row.id, 'primary1stTerm', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.primary2ndTerm}
                            onChange={(e) => updateRow(row.id, 'primary2ndTerm', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.primary3rdTerm}
                            onChange={(e) => updateRow(row.id, 'primary3rdTerm', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <div className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 flex items-center">
                            {currentBill.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.amtPaid}
                            onChange={(e) => updateRow(row.id, 'amtPaid', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : outstanding > 0 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isPaid ? 'Paid' : outstanding > 0 ? 'Pending' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors group"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.filter(row => row.schoolType === 'primary').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Primary School Students</p>
              <p className="text-sm">Click "Add Primary" to add a new primary school student</p>
            </div>
          )}
        </div>

        {/* Secondary School Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                Secondary School Students
              </h2>
              <button 
                onClick={() => addRow('secondary')}
                className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Secondary Student
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "sn", label: "S/N", width: "w-16" },
                    { key: "name", label: "Name", width: "w-40" },
                    { key: "school", label: "School", width: "w-40" },
                    { key: "1stTerm", label: "1st Term", width: "w-28" },
                    { key: "2ndTerm", label: "2nd Term", width: "w-28" },
                    { key: "3rdTerm", label: "3rd Term", width: "w-28" },
                    { key: "currentBill", label: "Current Bill", width: "w-28" },
                    { key: "amtPaid", label: "Paid", width: "w-28" },
                    { key: "status", label: "Status", width: "w-24" },
                    { key: "actions", label: "", width: "w-16" }
                  ].map((col, idx) => (
                    <th key={idx} className={`${col.width} px-3 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.filter(row => row.schoolType === 'secondary').map((row, rowIdx) => {
                  const currentBill = calculateCurrentBill(row);
                  const outstanding = currentBill - (parseFloat(row.amtPaid) || 0);
                  const isPaid = outstanding <= 0 && row.amtPaid && currentBill > 0;
                  
                  return (
                    <tr key={row.id} className="hover:bg-green-50 transition-colors group">
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="w-14 h-8 bg-green-100 rounded-md flex items-center justify-center text-xs font-medium text-green-700">
                          {row.sn}
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm text-gray-900"
                          placeholder="Enter student name"
                        />
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={row.school}
                          onChange={(e) => updateRow(row.id, 'school', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm text-gray-900"
                          placeholder="School name"
                        />
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.secondary1stTerm}
                            onChange={(e) => updateRow(row.id, 'secondary1stTerm', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.secondary2ndTerm}
                            onChange={(e) => updateRow(row.id, 'secondary2ndTerm', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.secondary3rdTerm}
                            onChange={(e) => updateRow(row.id, 'secondary3rdTerm', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <div className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 flex items-center">
                            {currentBill.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.amtPaid}
                            onChange={(e) => updateRow(row.id, 'amtPaid', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : outstanding > 0 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isPaid ? 'Paid' : outstanding > 0 ? 'Pending' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors group"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.filter(row => row.schoolType === 'secondary').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium mb-2">No Secondary School Students</p>
              <p className="text-sm">Click "Add Secondary" to add a new secondary school student</p>
            </div>
          )}
        </div>

        {/* University Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
                University Students
              </h2>
              <button 
                onClick={() => addRow('university')}
                className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                Add University Student
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "sn", label: "S/N", width: "w-16" },
                    { key: "name", label: "Name", width: "w-40" },
                    { key: "school", label: "School", width: "w-40" },
                    { key: "1stSemester", label: "1st Semester", width: "w-28" },
                    { key: "2ndSemester", label: "2nd Semester", width: "w-28" },
                    { key: "currentBill", label: "Current Bill", width: "w-28" },
                    { key: "amtPaid", label: "Paid", width: "w-28" },
                    { key: "status", label: "Status", width: "w-24" },
                    { key: "actions", label: "", width: "w-16" }
                  ].map((col, idx) => (
                    <th key={idx} className={`${col.width} px-3 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.filter(row => row.schoolType === 'university').map((row, rowIdx) => {
                  const currentBill = calculateCurrentBill(row);
                  const outstanding = currentBill - (parseFloat(row.amtPaid) || 0);
                  const isPaid = outstanding <= 0 && row.amtPaid && currentBill > 0;
                  
                  return (
                    <tr key={row.id} className="hover:bg-purple-50 transition-colors group">
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="w-14 h-8 bg-purple-100 rounded-md flex items-center justify-center text-xs font-medium text-purple-700">
                          {row.sn}
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm text-gray-900"
                          placeholder="Enter student name"
                        />
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={row.school}
                          onChange={(e) => updateRow(row.id, 'school', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm text-gray-900"
                          placeholder="School name"
                        />
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.university1stSemester}
                            onChange={(e) => updateRow(row.id, 'university1stSemester', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.university2ndSemester}
                            onChange={(e) => updateRow(row.id, 'university2ndSemester', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <div className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 flex items-center">
                            {currentBill.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                          <input
                            type="number"
                            value={row.amtPaid}
                            onChange={(e) => updateRow(row.id, 'amtPaid', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-xs text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : outstanding > 0 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isPaid ? 'Paid' : outstanding > 0 ? 'Pending' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-100">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors group"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.filter(row => row.schoolType === 'university').length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-lg font-medium mb-2">No University Students</p>
              <p className="text-sm">Click "Add University" to add a new university student</p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Previous Bills Total</p>
              <p className="text-xl font-bold text-gray-800">₦{totalPreviousBills.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Current Bills Total</p>
              <p className="text-xl font-bold text-blue-600">₦{totalCurrentBill.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Collected</p>
              <p className="text-xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Outstanding Balance</p>
              <p className="text-xl font-bold text-red-600">₦{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Collection Rate: {totalCurrentBill > 0 ? Math.round((totalPaid / totalCurrentBill) * 100) : 0}%</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
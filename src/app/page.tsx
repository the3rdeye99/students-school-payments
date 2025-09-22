"use client";

import { useState, useEffect, Suspense } from 'react';
import { Upload, Plus, Save, Download, Search, Filter, Calculator, Users, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { saveBills, getBillById, getAllBills } from '@/lib/billsService';
import { BillRow } from '@/types/bill'; // Import the correct type
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface AcademicYearGroup {
  academicYear: string;
  rows: BillRow[];
  isExpanded: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rows, setRows] = useState<BillRow[]>([]);
  const [academicYearGroups, setAcademicYearGroups] = useState<AcademicYearGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const defaultAcademicYear = `${currentYear}/${nextYear}`;

  // Debugging effect to monitor state changes
  useEffect(() => {
    console.log('Rows state changed:', rows.length, rows);
  }, [rows]);

  useEffect(() => {
    let billId: string | null = null;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      billId = sp.get('billId');
    }
    if (billId) {
      loadBill(billId);
    } else {
      // Load all existing bills on initial load
      loadAllBills();
    }
  }, []);

  // Group rows by academic year whenever rows change
  useEffect(() => {
    groupRowsByAcademicYear();
  }, [rows]);

  const loadAllBills = async () => {
    try {
      setLoading(true);
      const bills = await getAllBills();
      console.log('Loaded bills from server:', bills); // Debugging
      
      if (bills && bills.length > 0) {
        const billData: BillRow[] = bills.map((bill: any, index: number) => ({
          id: undefined, // Let the server manage IDs
          _id: bill._id,
          sn: bill.sn || String(index + 1).padStart(3, '0'),
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
          assistPrimary1stTerm: bill.assistPrimary1stTerm || "0",
          assistPrimary2ndTerm: bill.assistPrimary2ndTerm || "0",
          assistPrimary3rdTerm: bill.assistPrimary3rdTerm || "0",
          assistSecondary1stTerm: bill.assistSecondary1stTerm || "0",
          assistSecondary2ndTerm: bill.assistSecondary2ndTerm || "0",
          assistSecondary3rdTerm: bill.assistSecondary3rdTerm || "0",
          assistUniversity1stSemester: bill.assistUniversity1stSemester || "0",
          assistUniversity2ndSemester: bill.assistUniversity2ndSemester || "0",
        }));
        console.log('Processed bill data:', billData); // Debugging
        setRows(billData);
      } else {
        // If no bills exist, start with empty state
        console.log('No bills found, starting with empty state');
        setRows([]);
      }
    } catch (error) {
      console.error('Error loading bills:', error);
      // Don't clear existing data on load error
      if (rows.length === 0) {
        console.log('No existing data, starting fresh due to load error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBill = async (billId: string) => {
    try {
      setLoading(true);
      const bill = await getBillById(billId);
      if (bill) {
        const billData: BillRow = {
          id: undefined, // Let the server manage IDs
          _id: bill._id,
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
          assistPrimary1stTerm: bill.assistPrimary1stTerm || "0",
          assistPrimary2ndTerm: bill.assistPrimary2ndTerm || "0",
          assistPrimary3rdTerm: bill.assistPrimary3rdTerm || "0",
          assistSecondary1stTerm: bill.assistSecondary1stTerm || "0",
          assistSecondary2ndTerm: bill.assistSecondary2ndTerm || "0",
          assistSecondary3rdTerm: bill.assistSecondary3rdTerm || "0",
          assistUniversity1stSemester: bill.assistUniversity1stSemester || "0",
          assistUniversity2ndSemester: bill.assistUniversity2ndSemester || "0",
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

  const groupRowsByAcademicYear = () => {
    const groups = new Map<string, BillRow[]>();
    
    rows.forEach(row => {
      const year = row.academicYear || defaultAcademicYear;
      if (!groups.has(year)) {
        groups.set(year, []);
      }
      groups.get(year)!.push(row);
    });

    const sortedGroups: AcademicYearGroup[] = Array.from(groups.entries())
      .map(([academicYear, groupRows]) => ({
        academicYear,
        rows: groupRows,
        isExpanded: true // Default to expanded
      }))
      .sort((a, b) => b.academicYear.localeCompare(a.academicYear)); // Most recent first

    setAcademicYearGroups(sortedGroups);
  };

  const toggleAcademicYearExpansion = (academicYear: string) => {
    setAcademicYearGroups(groups => 
      groups.map(group => 
        group.academicYear === academicYear 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const addRow = (schoolType: 'primary' | 'secondary' | 'university' = 'primary', academicYear: string = defaultAcademicYear) => {
    // Generate a unique temporary ID for new rows
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newRow: BillRow = {
      id: undefined, // Let the server assign the ID
      _id: tempId, // Use temp ID for React key stability until saved
      sn: String(rows.length + 1).padStart(3, '0'),
      name: "",
      amtPaid: "",
      school: "",
      schoolType: schoolType,
      academicYear: academicYear,
      primary1stTerm: "",
      primary2ndTerm: "",
      primary3rdTerm: "",
      secondary1stTerm: "",
      secondary2ndTerm: "",
      secondary3rdTerm: "",
      university1stSemester: "",
      university2ndSemester: "",
      assistPrimary1stTerm: "0",
      assistPrimary2ndTerm: "0",
      assistPrimary3rdTerm: "0",
      assistSecondary1stTerm: "0",
      assistSecondary2ndTerm: "0",
      assistSecondary3rdTerm: "0",
      assistUniversity1stSemester: "0",
      assistUniversity2ndSemester: "0",
    };
    console.log('Adding new row:', newRow); // Debugging
    setRows([...rows, newRow]);
  };

  const updateRow = (index: number, field: keyof BillRow, value: string) => {
    setRows(prevRows => prevRows.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  const deleteRow = (index: number) => {
    console.log('Deleting row at index:', index); // Debugging
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      if (rows.length === 0) {
        alert('No bills to save');
        return;
      }

      // Removed strict validation to allow saving incomplete rows
      console.log('Saving rows:', rows); // Debugging
      setLoading(true);
      // Normalize empty numeric fields to '0' so zeros are saved
      const normalizedRows = rows.map((r) => ({
        ...r,
        // Compute amtPaid from assist fields per school type
        amtPaid: (() => {
          if (r.schoolType === 'primary') {
            const a1 = parseFloat(r.assistPrimary1stTerm || '0') || 0;
            const a2 = parseFloat(r.assistPrimary2ndTerm || '0') || 0;
            const a3 = parseFloat(r.assistPrimary3rdTerm || '0') || 0;
            return String(a1 + a2 + a3);
          }
          if (r.schoolType === 'secondary') {
            const a1 = parseFloat(r.assistSecondary1stTerm || '0') || 0;
            const a2 = parseFloat(r.assistSecondary2ndTerm || '0') || 0;
            const a3 = parseFloat(r.assistSecondary3rdTerm || '0') || 0;
            return String(a1 + a2 + a3);
          }
          const u1 = parseFloat(r.assistUniversity1stSemester || '0') || 0;
          const u2 = parseFloat(r.assistUniversity2ndSemester || '0') || 0;
          return String(u1 + u2);
        })(),
        primary1stTerm: r.primary1stTerm === '' ? '0' : r.primary1stTerm,
        primary2ndTerm: r.primary2ndTerm === '' ? '0' : r.primary2ndTerm,
        primary3rdTerm: r.primary3rdTerm === '' ? '0' : r.primary3rdTerm,
        secondary1stTerm: r.secondary1stTerm === '' ? '0' : r.secondary1stTerm,
        secondary2ndTerm: r.secondary2ndTerm === '' ? '0' : r.secondary2ndTerm,
        secondary3rdTerm: r.secondary3rdTerm === '' ? '0' : r.secondary3rdTerm,
        university1stSemester: r.university1stSemester === '' ? '0' : r.university1stSemester,
        university2ndSemester: r.university2ndSemester === '' ? '0' : r.university2ndSemester,
        assistPrimary1stTerm: r.assistPrimary1stTerm === '' ? '0' : r.assistPrimary1stTerm,
        assistPrimary2ndTerm: r.assistPrimary2ndTerm === '' ? '0' : r.assistPrimary2ndTerm,
        assistPrimary3rdTerm: r.assistPrimary3rdTerm === '' ? '0' : r.assistPrimary3rdTerm,
        assistSecondary1stTerm: r.assistSecondary1stTerm === '' ? '0' : r.assistSecondary1stTerm,
        assistSecondary2ndTerm: r.assistSecondary2ndTerm === '' ? '0' : r.assistSecondary2ndTerm,
        assistSecondary3rdTerm: r.assistSecondary3rdTerm === '' ? '0' : r.assistSecondary3rdTerm,
        assistUniversity1stSemester: r.assistUniversity1stSemester === '' ? '0' : r.assistUniversity1stSemester,
        assistUniversity2ndSemester: r.assistUniversity2ndSemester === '' ? '0' : r.assistUniversity2ndSemester,
      }));
      const result = await saveBills(normalizedRows);
      
      console.log('Save result from server:', result); // Debugging
      
      // Success case - update the rows with the returned data
      if (result && result.data && Array.isArray(result.data)) {
        const updatedBills = result.data;
        const newRows = updatedBills.map((bill: any, index: number) => ({
          id: undefined, // Let server manage IDs
          _id: bill._id,
          sn: bill.sn || String(index + 1).padStart(3, '0'),
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
          assistPrimary1stTerm: bill.assistPrimary1stTerm || "0",
          assistPrimary2ndTerm: bill.assistPrimary2ndTerm || "0",
          assistPrimary3rdTerm: bill.assistPrimary3rdTerm || "0",
          assistSecondary1stTerm: bill.assistSecondary1stTerm || "0",
          assistSecondary2ndTerm: bill.assistSecondary2ndTerm || "0",
          assistSecondary3rdTerm: bill.assistSecondary3rdTerm || "0",
          assistUniversity1stSemester: bill.assistUniversity1stSemester || "0",
          assistUniversity2ndSemester: bill.assistUniversity2ndSemester || "0",
        }));
        
        console.log('New rows after processing save result:', newRows); // Debugging
        setRows(newRows);
        alert('Bills saved successfully! Data remains on this page for continued editing.');
        window.location.reload();
      } else {
        console.error('Invalid response structure:', result);
        // Don't clear data, just show a warning
        alert('Bills may have been saved, but response format was unexpected. Please refresh to see current data.');
      }
    } catch (error: any) {
      console.error('Error saving bills:', error);
      alert(error.message || 'Failed to save bills. Please try again.');
      // Don't clear the data on error - keep the current state
    } finally {
      setLoading(false);
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

  // Render table for specific school type and academic year
  const renderTable = (schoolType: 'primary' | 'secondary' | 'university', academicYear: string, groupRows: BillRow[]) => {
    const filteredRows = groupRows.filter(row => row.schoolType === schoolType);
    if (filteredRows.length === 0) return null;

    const colorScheme = {
      primary: { bg: 'blue', text: 'blue' },
      secondary: { bg: 'green', text: 'green' },
      university: { bg: 'purple', text: 'purple' }
    }[schoolType];

    const sectionOutstanding = filteredRows.reduce((sum, row) => {
      const current = calculateCurrentBill(row);
      const paid = parseFloat(row.amtPaid) || 0;
      const outstanding = current - paid;
      return sum + (outstanding > 0 ? outstanding : 0);
    }, 0);

    const tableHeaders = schoolType === 'university' 
      ? [
          { key: "sn", label: "S/N", width: "w-16" },
          { key: "name", label: "Name", width: "w-40" },
          { key: "school", label: "School", width: "w-40" },
          { key: "1stSemester", label: "1st Semester", width: "w-28" },
          { key: "2ndSemester", label: "2nd Semester", width: "w-28" },
          { key: "currentBill", label: "Current Bill", width: "w-28" },
          { key: "amtPaid", label: "Paid", width: "w-28" },
          { key: "remaining", label: "Remaining", width: "w-28" },
          { key: "actions", label: "", width: "w-16" }
        ]
      : [
          { key: "sn", label: "S/N", width: "w-16" },
          { key: "name", label: "Name", width: "w-40" },
          { key: "school", label: "School", width: "w-40" },
          { key: "1stTerm", label: "1st Term", width: "w-28" },
          { key: "2ndTerm", label: "2nd Term", width: "w-28" },
          { key: "3rdTerm", label: "3rd Term", width: "w-28" },
          { key: "currentBill", label: "Current Bill", width: "w-28" },
          { key: "amtPaid", label: "Paid", width: "w-28" },
          { key: "remaining", label: "Remaining", width: "w-28" },
          { key: "actions", label: "", width: "w-16" }
        ];

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-visible mb-4">
        <div className={`sticky top-0 z-20 bg-gradient-to-r from-${colorScheme.bg}-50 to-${colorScheme.bg}-100 px-6 py-3 border-b border-gray-200` }>
          <div className="flex items-center justify-between">
            <h3 className={`text-md font-semibold text-${colorScheme.text}-800 flex items-center gap-2`}>
              <div className={`w-5 h-5 bg-${colorScheme.bg}-600 rounded-full flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{schoolType.charAt(0).toUpperCase()}</span>
              </div>
              {schoolType.charAt(0).toUpperCase() + schoolType.slice(1)} School Students
            </h3>
            <button 
              onClick={() => addRow(schoolType, academicYear)}
              className={`flex items-center gap-2 bg-${colorScheme.bg}-500 text-white px-3 py-1.5 rounded-lg hover:bg-${colorScheme.bg}-600 transition-colors shadow-md text-sm`}
            >
              <Plus className="w-3 h-3" />
              Add {schoolType.charAt(0).toUpperCase() + schoolType.slice(1)}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {tableHeaders.map((col, idx) => (
                  <th key={idx} className={`${col.width} px-3 py-2 text-left font-semibold text-gray-800 border-b border-gray-200 text-xs`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIdx) => {
                const globalIndex = rows.findIndex(r => r === row); // Find the actual index in the full array
                const currentBill = calculateCurrentBill(row);
                const assistPaid = (() => {
                  if (row.schoolType === 'primary') {
                    return (parseFloat(row.assistPrimary1stTerm || '0') || 0) +
                           (parseFloat(row.assistPrimary2ndTerm || '0') || 0) +
                           (parseFloat(row.assistPrimary3rdTerm || '0') || 0);
                  }
                  if (row.schoolType === 'secondary') {
                    return (parseFloat(row.assistSecondary1stTerm || '0') || 0) +
                           (parseFloat(row.assistSecondary2ndTerm || '0') || 0) +
                           (parseFloat(row.assistSecondary3rdTerm || '0') || 0);
                  }
                  return (parseFloat(row.assistUniversity1stSemester || '0') || 0) +
                         (parseFloat(row.assistUniversity2ndSemester || '0') || 0);
                })();
                const outstanding = currentBill - assistPaid;
                const isPaid = outstanding <= 0 && row.amtPaid && currentBill > 0;
                
                // Use a stable key - prefer _id if available, fallback to globalIndex
                const stableKey = row._id || `row-${globalIndex}`;
                
                return (
                  <tr key={stableKey} className={`hover:bg-${colorScheme.bg}-50 transition-colors group`}>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <div className={`w-14 h-6 bg-${colorScheme.bg}-100 rounded-md flex items-center justify-center text-xs font-medium text-${colorScheme.text}-700`}>
                        {row.sn}
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateRow(globalIndex, 'name', e.target.value)}
                        className={`w-full p-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-sm text-gray-900`}
                        placeholder="Enter student name"
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <input
                        type="text"
                        value={row.school}
                        onChange={(e) => updateRow(globalIndex, 'school', e.target.value)}
                        className={`w-full p-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-sm text-gray-900`}
                        placeholder="School name"
                      />
                    </td>
                    
                    {/* Render term/semester fields based on school type */}
                    {schoolType === 'university' ? (
                      <>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.university1stSemester}
                              onChange={(e) => updateRow(globalIndex, 'university1stSemester', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, 'university1stSemester', '0'); }}
                              className={`w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-xs text-gray-900`}
                              placeholder="0"
                            />
                          </div>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.assistUniversity1stSemester || '0'}
                              onChange={(e) => updateRow(globalIndex, 'assistUniversity1stSemester', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, 'assistUniversity1stSemester', '0'); }}
                              className={`w-full pl-6 pr-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-[11px] text-gray-900 bg-${colorScheme.bg}-50/30`}
                              placeholder="Assist"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.university2ndSemester}
                              onChange={(e) => updateRow(globalIndex, 'university2ndSemester', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, 'university2ndSemester', '0'); }}
                              className={`w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-xs text-gray-900`}
                              placeholder="0"
                            />
                          </div>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.assistUniversity2ndSemester || '0'}
                              onChange={(e) => updateRow(globalIndex, 'assistUniversity2ndSemester', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, 'assistUniversity2ndSemester', '0'); }}
                              className={`w-full pl-6 pr-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-[11px] text-gray-900 bg-${colorScheme.bg}-50/30`}
                              placeholder="Assist"
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={schoolType === 'primary' ? row.primary1stTerm : row.secondary1stTerm}
                              onChange={(e) => updateRow(globalIndex, schoolType === 'primary' ? 'primary1stTerm' : 'secondary1stTerm', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, schoolType === 'primary' ? 'primary1stTerm' : 'secondary1stTerm', '0'); }}
                              className={`w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-xs text-gray-900`}
                              placeholder="0"
                            />
                          </div>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={schoolType === 'primary' ? (row.assistPrimary1stTerm || '0') : (row.assistSecondary1stTerm || '0')}
                              onChange={(e) => updateRow(globalIndex, schoolType === 'primary' ? 'assistPrimary1stTerm' : 'assistSecondary1stTerm', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, schoolType === 'primary' ? 'assistPrimary1stTerm' : 'assistSecondary1stTerm', '0'); }}
                              className={`w-full pl-6 pr-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-[11px] text-gray-900 bg-${colorScheme.bg}-50/30`}
                              placeholder="Assist"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={schoolType === 'primary' ? row.primary2ndTerm : row.secondary2ndTerm}
                              onChange={(e) => updateRow(globalIndex, schoolType === 'primary' ? 'primary2ndTerm' : 'secondary2ndTerm', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, schoolType === 'primary' ? 'primary2ndTerm' : 'secondary2ndTerm', '0'); }}
                              className={`w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-xs text-gray-900`}
                              placeholder="0"
                            />
                          </div>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={schoolType === 'primary' ? (row.assistPrimary2ndTerm || '0') : (row.assistSecondary2ndTerm || '0')}
                              onChange={(e) => updateRow(globalIndex, schoolType === 'primary' ? 'assistPrimary2ndTerm' : 'assistSecondary2ndTerm', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, schoolType === 'primary' ? 'assistPrimary2ndTerm' : 'assistSecondary2ndTerm', '0'); }}
                              className={`w-full pl-6 pr-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-[11px] text-gray-900 bg-${colorScheme.bg}-50/30`}
                              placeholder="Assist"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={schoolType === 'primary' ? row.primary3rdTerm : row.secondary3rdTerm}
                              onChange={(e) => updateRow(globalIndex, schoolType === 'primary' ? 'primary3rdTerm' : 'secondary3rdTerm', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, schoolType === 'primary' ? 'primary3rdTerm' : 'secondary3rdTerm', '0'); }}
                              className={`w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-xs text-gray-900`}
                              placeholder="0"
                            />
                          </div>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={schoolType === 'primary' ? (row.assistPrimary3rdTerm || '0') : (row.assistSecondary3rdTerm || '0')}
                              onChange={(e) => updateRow(globalIndex, schoolType === 'primary' ? 'assistPrimary3rdTerm' : 'assistSecondary3rdTerm', e.target.value)}
                              onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                              onBlur={(e) => { if (e.target.value.trim() === '') updateRow(globalIndex, schoolType === 'primary' ? 'assistPrimary3rdTerm' : 'assistSecondary3rdTerm', '0'); }}
                              className={`w-full pl-6 pr-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-${colorScheme.bg}-500 focus:border-transparent transition-all text-[11px] text-gray-900 bg-${colorScheme.bg}-50/30`}
                              placeholder="Assist"
                            />
                          </div>
                        </td>
                      </>
                    )}
                    
                    <td className="px-3 py-2 border-b border-gray-100">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                        <div className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 flex items-center">
                          {currentBill.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <div className={`w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md bg-gray-50 text-xs text-gray-900 flex items-center`}>
                        {assistPaid.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₦</span>
                        <div className={`w-full pl-6 pr-2 py-1.5 border rounded-md text-xs flex items-center ${outstanding > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                          {(outstanding > 0 ? outstanding : 0).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    {/* Status column removed per requirements */}
                    <td className="px-3 py-2 border-b border-gray-100">
                      <button
                        onClick={() => deleteRow(globalIndex)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors group"
                        title="Delete row"
                      >
                        <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-end">
          <div className="text-sm font-semibold">
            <span className="text-gray-700 mr-2">Total Outstanding:</span>
            <span className="text-gray-900">₦{sectionOutstanding.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Suspense fallback={null}>
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
              
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save'}
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

        {/* Academic Year Sections */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading bills...</div>
          </div>
        ) : academicYearGroups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Bills Found</h3>
            <p className="text-sm mb-4">Start by adding students for the current academic year {defaultAcademicYear}</p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => addRow('primary')}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Primary Student
              </button>
              <button 
                onClick={() => addRow('secondary')}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Secondary Student
              </button>
              <button 
                onClick={() => addRow('university')}
                className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                Add University Student
              </button>
            </div>
          </div>
        ) : (
          academicYearGroups.map((group) => (
            <div key={group.academicYear} className="mb-8">
              {/* Academic Year Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl shadow-lg">
                <button
                  onClick={() => toggleAcademicYearExpansion(group.academicYear)}
                  className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-black hover:bg-opacity-10 transition-colors rounded-t-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold">Academic Year {group.academicYear}</h2>
                      <p className="text-sm text-indigo-100">
                        {group.rows.length} student{group.rows.length !== 1 ? 's' : ''} • 
                        {group.rows.filter(r => r.schoolType === 'primary').length} Primary • 
                        {group.rows.filter(r => r.schoolType === 'secondary').length} Secondary • 
                        {group.rows.filter(r => r.schoolType === 'university').length} University
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ₦{group.rows.reduce((sum, row) => sum + calculateCurrentBill(row), 0).toLocaleString()}
                    </span>
                    {group.isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
              </div>

              {/* Academic Year Content */}
              {group.isExpanded && (
                <div className="bg-gray-50 rounded-b-xl shadow-lg p-6">
                  {/* Quick Add Buttons for this Academic Year */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm font-medium text-gray-700">Quick Add:</span>
                    <button 
                      onClick={() => addRow('primary', group.academicYear)}
                      className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Primary
                    </button>
                    <button 
                      onClick={() => addRow('secondary', group.academicYear)}
                      className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors shadow-sm text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Secondary
                    </button>
                    <button 
                      onClick={() => addRow('university', group.academicYear)}
                      className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-colors shadow-sm text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      University
                    </button>
                  </div>

                  {/* Tables for each school type */}
                  {renderTable('primary', group.academicYear, group.rows)}
                  {renderTable('secondary', group.academicYear, group.rows)}
                  {renderTable('university', group.academicYear, group.rows)}

                  {/* Empty state for this academic year */}
                  {group.rows.length === 0 && (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-indigo-600" />
                      </div>
                      <p className="text-lg font-medium mb-2">No Students for {group.academicYear}</p>
                      <p className="text-sm">Use the quick add buttons above to add students for this academic year</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

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
    </Suspense>
  );
}
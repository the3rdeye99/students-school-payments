import { useState, useEffect } from 'react';
import { BillRow } from '@/types/bill';

export function useBills() {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all bills
  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bills');
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      setBills(data.bills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bills');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new bill
  const addBill = async (bill: Omit<BillRow, 'id' | 'sn'>) => {
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });
      if (!response.ok) throw new Error('Failed to add bill');
      const data = await response.json();
      setBills(prev => [...prev, data.bill]);
      return data.bill;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bill');
      throw err;
    }
  };

  // Update a bill
  const updateBill = async (id: string, updates: Partial<BillRow>) => {
    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update bill');
      const data = await response.json();
      setBills(prev => prev.map(bill => 
        bill._id === id ? { ...bill, ...data.bill } : bill
      ));
      return data.bill;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bill');
      throw err;
    }
  };

  // Delete a bill
  const deleteBill = async (id: string) => {
    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete bill');
      setBills(prev => prev.filter(bill => bill._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bill');
      throw err;
    }
  };

  // Load bills on component mount
  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    isLoading,
    error,
    addBill,
    updateBill,
    deleteBill,
    refreshBills: fetchBills,
  };
}
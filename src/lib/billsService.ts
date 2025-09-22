import type { BillRow } from '@/types/bill';

export async function saveBills(bills: BillRow[]) {
  try {
    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bills),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save bills');
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to save bills');
    }

    return result;
  } catch (error) {
    console.error('Error saving bills:', error);
    throw error;
  }
}

export async function getPreviousBills(academicYear?: string) {
  try {
    const queryParams = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await fetch(`/api/bills${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch bills');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw new Error('Failed to fetch bills');
  }
}

export async function getBillById(id: string) {
  try {
    const response = await fetch(`/api/bills/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch bill');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw new Error('Failed to fetch bill');
  }
}
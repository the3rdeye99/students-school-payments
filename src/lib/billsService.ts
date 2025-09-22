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

    // Parse JSON first, with error handling
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error('Invalid response from server');
    }

    // Check response status after we have the result
    if (!response.ok) {
      throw new Error(result?.error || result?.message || `HTTP error! status: ${response.status}`);
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

export async function getAllBills() {
  try {
    const response = await fetch('/api/bills', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Parse JSON with error handling
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(result?.error || result?.message || `HTTP error! status: ${response.status}`);
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch bills');
    }
    
    return result.data || [];
  } catch (error) {
    console.error('Error fetching all bills:', error);
    throw new Error('Failed to fetch bills');
  }
}

export async function getPreviousBills(academicYear?: string) {
  try {
    const queryParams = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await fetch(`/api/bills${queryParams}`);
    
    // Parse JSON with error handling
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(result?.error || result?.message || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw new Error('Failed to fetch bills');
  }
}

export async function getBillById(id: string) {
  try {
    const response = await fetch(`/api/bills/${id}`);
    
    // Parse JSON with error handling
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(result?.error || result?.message || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw new Error('Failed to fetch bill');
  }
}
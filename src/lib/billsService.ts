import type { BillRow } from '@/types/bill';

// Helper function to safely parse response
async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }
  } else {
    // Server returned HTML or plain text (likely an error page)
    const text = await response.text();
    console.error('Server returned non-JSON response:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      body: text.substring(0, 500) // First 500 chars for debugging
    });
    
    // Try to extract meaningful error from HTML
    if (text.includes('Internal Server Error')) {
      throw new Error(`Server error (${response.status}): Internal Server Error`);
    } else if (text.includes('404')) {
      throw new Error(`Server error (${response.status}): Not Found`);
    } else {
      throw new Error(`Server error (${response.status}): ${response.statusText}`);
    }
  }
}

export async function saveBills(bills: BillRow[]) {
  console.log('saveBills called with:', bills.length, 'bills');
  
  try {
    // Validate input
    if (!Array.isArray(bills) || bills.length === 0) {
      throw new Error('Bills array is required and cannot be empty');
    }

    // Log the data being sent
    console.log('Sending bills to server:', {
      count: bills.length,
      sample: bills[0],
      academicYears: [...new Set(bills.map(b => b.academicYear))]
    });

    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bills),
    });

    console.log('Server response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    const result = await parseResponse(response);

    // Check response status
    if (!response.ok) {
      const errorMessage = result?.error || result?.message || `HTTP error! status: ${response.status}`;
      console.error('Server returned error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!result.success) {
      const errorMessage = result.message || result.error || 'Failed to save bills';
      console.error('Operation failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('Bills saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in saveBills:', error);
    
    // Re-throw with more context
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    
    throw error;
  }
}

export async function getAllBills() {
  console.log('getAllBills called');
  
  try {
    const response = await fetch('/api/bills', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('GET /api/bills response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    const result = await parseResponse(response);

    if (!response.ok) {
      const errorMessage = result?.error || result?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (!result.success) {
      throw new Error(result.message || result.error || 'Failed to fetch bills');
    }
    
    console.log('Bills fetched successfully:', result.data?.length || 0, 'bills');
    return result.data || [];
  } catch (error) {
    console.error('Error in getAllBills:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    
    throw error;
  }
}

export async function getPreviousBills(academicYear?: string) {
  console.log('getPreviousBills called with academicYear:', academicYear);
  
  try {
    const queryParams = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    const url = `/api/bills${queryParams}`;
    
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);

    console.log('GET bills response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    const result = await parseResponse(response);

    if (!response.ok) {
      const errorMessage = result?.error || result?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!result.success) {
      throw new Error(result.message || result.error || 'Failed to fetch bills');
    }

    console.log('Previous bills fetched successfully:', result.data?.length || 0, 'bills');
    return result.data || [];
  } catch (error) {
    console.error('Error in getPreviousBills:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    
    throw error;
  }
}

export async function getBillById(id: string) {
  console.log('getBillById called with id:', id);
  
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid bill ID is required');
    }

    const url = `/api/bills/${encodeURIComponent(id)}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);

    console.log('GET bill by ID response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    const result = await parseResponse(response);

    if (!response.ok) {
      const errorMessage = result?.error || result?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!result.success) {
      throw new Error(result.message || result.error || 'Failed to fetch bill');
    }

    console.log('Bill fetched successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error in getBillById:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    
    throw error;
  }
}

// Additional utility function to test API connectivity
export async function testApiConnection() {
  try {
    const response = await fetch('/api/bills', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await parseResponse(response);
    
    return {
      status: response.status,
      success: response.ok && result.success,
      error: response.ok ? null : (result?.error || 'Unknown error')
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const payrollApi = {
  // Process new payroll
  processPayroll: async (payrollData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payrollData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error processing payroll:', error);
      throw error;
    }
  },

  // Get all payroll records with optional filters
  getPayrolls: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/payroll?${queryParams}`, {
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      throw error;
    }
  },

  // Get payroll by ID
  getPayrollById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/${id}`, {
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.data;
    } catch (error) {
      console.error(`Error fetching payroll ${id}:`, error);
      throw error;
    }
  },

  // Update payroll status
  updatePayrollStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating payroll status:', error);
      throw error;
    }
  },
  
  // Get payroll summary
  getPayrollSummary: async (month) => {
    try {
      const queryParams = month ? `?month=${month}` : '';
      const response = await fetch(`${API_BASE_URL}/payroll/summary${queryParams}`, {
        headers: getAuthHeaders()
      });
      const data = await handleResponse(response);
      return data.data || {};
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      throw error;
    }
  },
  
  // Generate payslip
  generatePayslip: async (payrollId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/payslip/${payrollId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate payslip');
      }
      
      // Handle the PDF blob response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payrollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error generating payslip:', error);
      throw error;
    }
  },
  
  // Get employee salary expenses breakdown
  getEmployeeSalaryExpenses: async (year = new Date().getFullYear(), month = null) => {
    try {
      const params = new URLSearchParams({ year });
      if (month) params.append('month', month);
      
      const response = await fetch(`${API_BASE_URL}/payroll/expenses/breakdown?${params}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleResponse(response);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching employee salary expenses:', error);
      throw error;
    }
  }
};

export default payrollApi;

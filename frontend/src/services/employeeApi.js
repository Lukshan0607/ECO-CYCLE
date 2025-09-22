const API_BASE_URL = 'http://localhost:5000/api';

export const employeeApi = {
  // Get all employees with optional search
  getEmployees: async (searchTerm = '') => {
    try {
      const url = searchTerm 
        ? `${API_BASE_URL}/employees?search=${encodeURIComponent(searchTerm)}`
        : `${API_BASE_URL}/employees`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`);
      if (!response.ok) {
        throw new Error('Employee not found');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching employee ${id}:`, error);
      throw error;
    }
  }
};

export default employeeApi;

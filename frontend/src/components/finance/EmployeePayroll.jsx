// src/components/finance/EmployeePayroll.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  Users, Calculator, FileText, Download, Plus, Search, Edit, Trash2,
  DollarSign, Clock, Calendar, Settings, Eye, CheckCircle, AlertCircle, Loader2, X, RefreshCw
} from "lucide-react";
import { toast } from 'react-hot-toast';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import PayrollForm from "./PayrollForm";
import payrollApi from "../../services/payrollApi";

// Sri Lankan Payroll Configuration (configurable rates)
const PAYROLL_CONFIG = {
  EMPLOYEE_EPF_RATE: 0.08,    // 8% deduction from employee
  EMPLOYER_EPF_RATE: 0.12,    // 12% employer expense
  EMPLOYER_ETF_RATE: 0.03,    // 3% employer expense
  OVERTIME_MULTIPLIER: 1.5,   // 1.5x hourly rate
  WORKING_DAYS_PER_MONTH: 26,
  WORKING_HOURS_PER_DAY: 8
};

export default function EmployeePayroll() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollConfig, setPayrollConfig] = useState(PAYROLL_CONFIG);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [employees, setEmployees] = useState({}); // Store employee data by ID

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employees data with authentication
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      if (data.success) {
        const employeesMap = {};
        data.data.forEach(emp => {
          employeesMap[emp._id] = emp.employeeId; // Map MongoDB _id to employeeId
        });
        setEmployees(employeesMap);
        return data.data; // Return the employees data for potential use
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employee data');
    }
    return [];
  };

  // Fetch payroll runs on component mount
  useEffect(() => {
    const fetchPayrolls = async () => {
      try {
        setIsLoading(true);
        // Fetch both payrolls and employees in parallel
        const [payrollsData, employeesData] = await Promise.all([
          payrollApi.getPayrolls(),
          fetchEmployees()
        ]);
        
        // Process the data to ensure no nested objects
        const processedData = payrollsData.map(payroll => {
          // Find the employee data for this payroll
          const employee = employeesData.find(emp => emp._id === payroll.employeeId);
          
          return {
            ...payroll,
            // Ensure employee data is flattened
            employeeId: payroll.employeeId || '',
            employeeName: payroll.employeeName || employee?.name || 'Unknown Employee',
            department: payroll.department || employee?.department || '',
            position: payroll.position || employee?.position || '',
            // Store the employee's _id for reference
            employeeMongoId: payroll.employeeId || employee?._id || ''
          };
        });
        
        setPayrollRuns(processedData);
      } catch (err) {
        console.error('Error fetching payrolls:', err);
        setError('Failed to load payroll data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayrolls();
  }, []);

  // Validate payroll data before saving
  const validatePayrollData = (data) => {
    const errors = {};
    
    // Required fields validation
    if (!data.employeeId) errors.employeeId = 'Employee is required';
    if (!data.month) errors.month = 'Payroll month is required';
    
    // Numeric fields validation
    const numericFields = [
      'basicSalary', 'allowances', 'overtimeHours', 
      'overtimePay', 'deductions'
    ];
    
    numericFields.forEach(field => {
      const value = parseFloat(data[field] || 0);
      if (isNaN(value) || value < 0) {
        errors[field] = `Invalid ${field.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
      }
    });
    
    // Date validation - ensure month is not in the future
    if (data.month) {
      const selectedDate = new Date(data.month);
      const currentDate = new Date();
      
      if (selectedDate > currentDate) {
        errors.month = 'Payroll date cannot be in the future';
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Fetch payroll data from the API
  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      const [payrollsData, employeesData] = await Promise.all([
        payrollApi.getPayrolls(),
        fetchEmployees()
      ]);
      
      const processedData = payrollsData.map(payroll => {
        const employee = employeesData.find(emp => emp._id === payroll.employeeId);
        return {
          ...payroll,
          employeeId: payroll.employeeId || '',
          employeeName: payroll.employeeName || employee?.name || 'Unknown Employee',
          department: payroll.department || employee?.department || '',
          position: payroll.position || employee?.position || '',
          employeeMongoId: payroll.employeeId || employee?._id || ''
        };
      });
      
      setPayrollRuns(processedData);
      return processedData;
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast.error('Failed to refresh payroll data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding/updating a payroll record

  const handleSavePayroll = async (payrollData) => {
    try {
      setIsLoading(true);
      
      // Validate the payroll data
      const validationErrors = validatePayrollData(payrollData);
      if (validationErrors) {
        throw new Error(Object.values(validationErrors).join('\n'));
      }
      
      // Format the data before sending
      const formattedData = {
        ...payrollData,
        basicSalary: parseFloat(payrollData.basicSalary) || 0,
        allowances: parseFloat(payrollData.allowances) || 0,
        overtimeHours: parseFloat(payrollData.overtimeHours) || 0,
        overtimePay: parseFloat(payrollData.overtimePay) || 0,
        deductions: parseFloat(payrollData.deductions) || 0,
        month: new Date(payrollData.month).toISOString().substring(0, 7)
      };
      
      // If we have an existing payroll ID, it's an update
      const isUpdate = !!payrollData._id;
      
      let response;
      if (isUpdate) {
        response = await fetch(`http://localhost:5000/api/payroll/${payrollData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formattedData)
        });
      } else {
        response = await fetch('http://localhost:5000/api/payroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formattedData)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save payroll');
      }

      // For new records, get the latest employee data first
      const updatedEmployees = await fetchEmployees();
      
      // If this is a new record, add it to the list with the latest employee info
      if (!isUpdate) {
        const employee = updatedEmployees.find(emp => emp._id === payrollData.employeeId);
        const newPayroll = {
          ...formattedData,
          employeeId: employee?._id || payrollData.employeeId,
          employeeName: employee?.name || payrollData.employeeName || 'Unknown Employee',
          department: employee?.department || payrollData.department || '',
          position: employee?.position || payrollData.position || '',
          employeeMongoId: employee?._id || payrollData.employeeId || ''
        };
        
        // Add the new payroll to the beginning of the list
        setPayrollRuns(prev => [newPayroll, ...prev]);
      } else {
        // For updates, refresh the entire list
        const updatedPayrolls = await payrollApi.getPayrolls();
        const processedData = updatedPayrolls.map(payroll => {
          const emp = updatedEmployees.find(e => e._id === payroll.employeeId);
          return {
            ...payroll,
            employeeId: payroll.employeeId || emp?._id || '',
            employeeName: payroll.employeeName || emp?.name || 'Unknown Employee',
            department: payroll.department || emp?.department || '',
            position: payroll.position || emp?.position || '',
            employeeMongoId: payroll.employeeId || emp?._id || ''
          };
        });
        setPayrollRuns(processedData);
      }
      
      setShowPayrollForm(false);
      setSelectedEmployee(null);
      
      toast.success(`Payroll ${isUpdate ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving payroll:', error);
      // Show multiple lines in toast if there are multiple errors
      const errorMessages = error.message.split('\n');
      if (errorMessages.length > 1) {
        errorMessages.forEach(msg => {
          if (msg.trim()) toast.error(msg.trim());
        });
      } else {
        toast.error(error.message || 'Failed to save payroll. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit payroll
  const handleEditPayroll = (payroll) => {
    setSelectedEmployee({
      _id: payroll.employeeMongoId || payroll.employeeId,
      personalInfo: { fullName: payroll.employeeName },
      employment: { position: payroll.position },
      salaryInfo: { basicSalary: payroll.basicSalary }
    });
    setShowPayrollForm({
      isOpen: true,
      payrollData: payroll,
      isEdit: true
    });
  };

  // Handle view payslip in modal
  const handleViewPayslip = async (payroll) => {
    try {
      setViewPayslip(prev => ({ ...prev, isLoading: true, isOpen: true }));
      
      const response = await fetch(`http://localhost:5000/api/payroll/${payroll._id}/payslip`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load payslip');
      }
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }
      
      setViewPayslip({
        isOpen: true,
        payslipUrl: data.data,
        isLoading: false,
        employeeName: payroll.employeeName,
        month: payroll.month
      });
      
    } catch (error) {
      console.error('Error viewing payslip:', error);
      toast.error(error.message || 'Failed to load payslip');
      setViewPayslip(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };
  
  // Clean up payslip URL when modal is closed
  const handleClosePayslip = () => {
    if (viewPayslip.payslipUrl) {
      window.URL.revokeObjectURL(viewPayslip.payslipUrl);
    }
    setViewPayslip({ isOpen: false, payslipUrl: null, isLoading: false });
  };

  // Handle download salary slip
  const handleDownloadPayslip = async (payroll) => {
    const toastId = toast.loading('Generating payslip...');
    try {
      // If we already have the payslip URL in view mode, use it directly
      if (viewPayslip.isOpen && viewPayslip.payslipUrl) {
        const a = document.createElement('a');
        a.href = viewPayslip.payslipUrl;
        a.download = `payslip-${viewPayslip.employeeName || 'employee'}-${viewPayslip.month || 'date'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Payslip downloaded successfully!', { id: toastId });
        return;
      }

      // Otherwise, fetch the payslip
      const response = await fetch(`http://localhost:5000/api/payroll/${payroll._id}/payslip`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to download payslip');
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      // Create a download link for the base64 data
      const a = document.createElement('a');
      a.href = data.data;
      a.download = data.filename || `payslip-${payroll.employeeName || 'employee'}-${payroll.month || 'date'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast.success('Payslip downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error(error.message || 'Failed to download payslip', { id: toastId });
    }
  };

  // Handle delete payroll
  const handleDeletePayroll = async (payrollId) => {
    if (!window.confirm('Are you sure you want to delete this payroll record? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/payroll/${payrollId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete payroll');
      }

      // Update the payroll list and refresh employees
      const [updatedPayrolls, updatedEmployees] = await Promise.all([
        payrollApi.getPayrolls(),
        fetchEmployees() // Refresh the employees list
      ]);
      
      // Process the data to ensure we have the latest employee information
      const processedData = updatedPayrolls.map(payroll => {
        const employee = updatedEmployees.find(emp => emp._id === payroll.employeeId);
        return {
          ...payroll,
          employeeId: payroll.employeeId || '',
          employeeName: payroll.employeeName || employee?.name || 'Unknown Employee',
          department: payroll.department || employee?.department || '',
          position: payroll.position || employee?.position || '',
          employeeMongoId: payroll.employeeId || employee?._id || ''
        };
      });
      
      setPayrollRuns(processedData);
      toast.success('Payroll record deleted successfully!');
    } catch (error) {
      console.error('Error deleting payroll:', error);
      toast.error(error.message || 'Failed to delete payroll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayroll = (payrollData) => {
    try {
      // Flatten the employee data to avoid nested objects
      const newPayroll = {
        id: `PR-${Date.now()}`,
        // Spread all the payroll data first
        ...payrollData,
        // Ensure we have all required fields with fallbacks
        status: 'pending',
        dateProcessed: new Date().toISOString(),
        // Make sure we're using the employee data directly in the root object
        employeeId: payrollData.employeeId || '',
        employeeName: payrollData.employeeName || 'Unknown Employee',
        department: payrollData.department || '',
        position: payrollData.position || ''
      };
      
      // Remove any potential nested objects
      delete newPayroll.employee;
      
      // Update the state with the new payroll run
      setPayrollRuns(prevRuns => [newPayroll, ...prevRuns]);
      setShowPayrollForm(false);
      setSelectedEmployee(null);
      toast.success('Payroll processed successfully!');
    } catch (error) {
      console.error('Error adding payroll:', error);
      toast.error(error.message || 'Failed to add payroll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "calculations", name: "Payroll Calculations", icon: <Calculator size={20} /> },
    { id: "payslips", name: "Payslips", icon: <FileText size={20} /> },
    { id: "reports", name: "Payroll Reports", icon: <BarChart size={20} /> },
    { id: "settings", name: "Configuration", icon: <Settings size={20} /> }
  ];

  // Calculate payroll for an employee
  const calculatePayroll = (employee) => {
    const { basicSalary, overtimeHours } = employee;
    const { EMPLOYEE_EPF_RATE, EMPLOYER_EPF_RATE, EMPLOYER_ETF_RATE, OVERTIME_MULTIPLIER, WORKING_DAYS_PER_MONTH, WORKING_HOURS_PER_DAY } = payrollConfig;
    
    // Calculate hourly rate
    const hourlyRate = basicSalary / (WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY);
    
    // Calculate overtime pay
    const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
    
    // Calculate gross salary
    const grossSalary = basicSalary + overtimePay;
    
    // Calculate deductions
    const employeeEPF = grossSalary * EMPLOYEE_EPF_RATE;
    
    // Calculate employer contributions
    const employerEPF = grossSalary * EMPLOYER_EPF_RATE;
    const employerETF = grossSalary * EMPLOYER_ETF_RATE;
    
    // Calculate net salary
    const netSalary = grossSalary - employeeEPF;
    
    return {
      basicSalary,
      overtimeHours,
      overtimePay,
      grossSalary,
      employeeEPF,
      employerEPF,
      employerETF,
      netSalary,
      hourlyRate
    };
  };

  // Convert employees object to array for filtering
  const filteredEmployees = Object.entries(employees).map(([id, empId]) => ({
    _id: id,
    employeeId: empId
  })).filter(emp => 
    emp.employeeId.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Employees</p>
                <p className="text-3xl font-bold text-blue-900">{employees.length}</p>
                <p className="text-sm text-blue-600">Active employees</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Monthly Payroll</p>
                <p className="text-3xl font-bold text-green-900">LKR 3.75M</p>
                <p className="text-sm text-green-600">Current month</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">EPF Contributions</p>
                <p className="text-3xl font-bold text-purple-900">LKR 750K</p>
                <p className="text-sm text-purple-600">Employee + Employer</p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Calculator className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Overtime Hours</p>
                <p className="text-3xl font-bold text-orange-900">156</p>
                <p className="text-sm text-orange-600">This month</p>
              </div>
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Runs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Payroll Management</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={fetchPayrollData}
                className="flex items-center"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => setShowPayrollForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Payroll Run
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 font-semibold">Employee</th>
                  <th className="p-3 font-semibold">Month</th>
                  <th className="p-3 font-semibold">Basic Salary</th>
                  <th className="p-3 font-semibold">Net Pay</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRuns.map((run, index) => {
                  // Generate a unique ID for each row using employeeId, month, and a random string
                  const uniqueId = `payroll-${run.employeeId || 'emp'}-${run.month || 'date'}-${index}`;
                  return (
                    <tr key={uniqueId} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{run.employeeName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {employees[run.employeeMongoId] || run.employeeId || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3">{run.month || 'N/A'}</td>
                      <td className="p-3">LKR {run.basicSalary ? parseFloat(run.basicSalary).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</td>
                      <td className="p-3 font-medium">LKR {run.netPay ? parseFloat(run.netPay).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          run.status === 'completed' ? 'bg-green-100 text-green-600' :
                          run.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {run.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2 w-full mx-auto">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Payroll"
                            onClick={() => handleEditPayroll(run)}
                            className="p-2 h-8 w-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                          <button
                            onClick={() => handleViewPayslip(run)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="View Payslip"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete Payroll"
                            onClick={() => handleDeletePayroll(run._id || run.id)}
                            disabled={isLoading}
                            className="p-2 h-8 w-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Download Payslip"
                            onClick={() => handleDownloadPayslip(run)}
                            className="p-2 h-8 w-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {payrollRuns.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-4 text-center text-gray-500">
                      No payroll records found. Click "New Payroll Run" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      {/* Search and Add Employee */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search employees..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-blue-600 text-white">
          <Plus size={16} className="mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee List */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 font-semibold">Employee #</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Position</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Basic Salary</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(employee => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{employee.employeeNumber}</td>
                    <td className="p-3">{employee.name}</td>
                    <td className="p-3">{employee.position}</td>
                    <td className="p-3">{employee.department}</td>
                    <td className="p-3">LKR {employee.basicSalary.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        {employee.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <Calculator size={16} />
                        </Button>
                        <Button variant="ghost" size="sm"><Edit size={16} /></Button>
                        <Button variant="ghost" size="sm"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCalculations = () => (
    <div className="space-y-6">
      {selectedEmployee ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Employee Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee Number:</span>
                  <span className="font-medium">{selectedEmployee.employeeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{selectedEmployee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{selectedEmployee.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{selectedEmployee.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic Salary:</span>
                  <span className="font-medium">LKR {selectedEmployee.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Hours:</span>
                  <span className="font-medium">{selectedEmployee.overtimeHours} hours</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Calculations */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payroll Calculations</h3>
              {(() => {
                const calc = calculatePayroll(selectedEmployee);
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="font-medium">LKR {calc.hourlyRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span className="font-medium">LKR {calc.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overtime Pay:</span>
                      <span className="font-medium">LKR {calc.overtimePay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-semibold">Gross Salary:</span>
                      <span className="font-bold">LKR {calc.grossSalary.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Employee EPF (8%):</span>
                      <span>-LKR {calc.employeeEPF.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-green-600 font-semibold">Net Salary:</span>
                      <span className="font-bold text-green-600">LKR {calc.netSalary.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Employer Contributions:</h4>
                      <div className="flex justify-between text-blue-600">
                        <span>Employer EPF (12%):</span>
                        <span>LKR {calc.employerEPF.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Employer ETF (3%):</span>
                        <span>LKR {calc.employerETF.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calculator className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Select an Employee</h3>
            <p className="text-gray-500">Choose an employee from the Employee Management tab to view payroll calculations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPayslips = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Generate Payslips</h3>
          <div className="flex space-x-2">
            <Button className="bg-blue-600 text-white">
              <FileText size={16} className="mr-2" />
              Generate All
            </Button>
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
        <div className="text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Payslip Generation</h3>
          <p className="text-gray-500">Generate and download payslips for employees after processing payroll.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payroll Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payrollRuns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalGrossPay" fill="#3B82F6" name="Gross Pay" />
              <Bar dataKey="totalNetPay" fill="#10B981" name="Net Pay" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6">Payroll Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee EPF Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={payrollConfig.EMPLOYEE_EPF_RATE * 100}
                onChange={(e) => setPayrollConfig({
                  ...payrollConfig,
                  EMPLOYEE_EPF_RATE: parseFloat(e.target.value) / 100
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employer EPF Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={payrollConfig.EMPLOYER_EPF_RATE * 100}
                onChange={(e) => setPayrollConfig({
                  ...payrollConfig,
                  EMPLOYER_EPF_RATE: parseFloat(e.target.value) / 100
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employer ETF Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={payrollConfig.EMPLOYER_ETF_RATE * 100}
                onChange={(e) => setPayrollConfig({
                  ...payrollConfig,
                  EMPLOYER_ETF_RATE: parseFloat(e.target.value) / 100
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={payrollConfig.OVERTIME_MULTIPLIER}
                onChange={(e) => setPayrollConfig({
                  ...payrollConfig,
                  OVERTIME_MULTIPLIER: parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button className="bg-green-600 text-white">
            <CheckCircle size={16} className="mr-2" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "calculations": return renderCalculations();
      case "payslips": return renderPayslips();
      case "reports": return renderReports();
      case "settings": return renderSettings();
      default: return renderOverview();
    }
  };

  const [viewPayslip, setViewPayslip] = useState({
    isOpen: false,
    payslipUrl: null,
    isLoading: false
  });

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white border-b rounded-lg">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div>
        {renderContent()}
      </div>

      {/* Payroll Form Modal */}
      {showPayrollForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">New Payroll Run</h3>
                <button 
                  onClick={() => setShowPayrollForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <PayrollForm 
                employee={selectedEmployee}
                onSave={handleSavePayroll}
                onClose={() => {
                  setShowPayrollForm(false);
                  setSelectedEmployee(null);
                }}
                payrollData={showPayrollForm.payrollData}
                isEdit={showPayrollForm.isEdit}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Payslip Viewer Modal */}
      {viewPayslip.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {viewPayslip.employeeName} - {viewPayslip.month} Payslip
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownloadPayslip({ _id: viewPayslip.payslipUrl.split('/').pop() })}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClosePayslip}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewPayslip.isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading payslip...</span>
                </div>
              ) : viewPayslip.payslipUrl ? (
                <div className="w-full h-[70vh]">
                  <object
                    data={viewPayslip.payslipUrl}
                    type="application/pdf"
                    className="w-full h-full border rounded"
                  >
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">Unable to display PDF. You can still <a 
                        href={viewPayslip.payslipUrl} 
                        download={`payslip-${viewPayslip.employeeName || 'employee'}-${viewPayslip.month || 'date'}.pdf`}
                        className="text-blue-600 hover:underline"
                      >download it here</a>.</p>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">Unable to load payslip</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

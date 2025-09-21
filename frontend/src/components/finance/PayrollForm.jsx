import React, { useState, useEffect } from 'react';
import { X, Plus, User, DollarSign, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { employeeApi } from '../../services/employeeApi';

const PayrollForm = ({ onSave, onClose, payrollConfig = {} }) => {
  // Default payroll configuration for Sri Lanka
  const defaultConfig = {
    EMPLOYEE_EPF_RATE: 0.08,    // 8% deduction from employee
    EMPLOYER_EPF_RATE: 0.12,    // 12% employer EPF contribution
    EMPLOYER_ETF_RATE: 0.03,    // 3% employer ETF contribution
    OVERTIME_MULTIPLIER: 1.5,   // 1.5x hourly rate for overtime
    WORKING_DAYS_PER_MONTH: 26, // Standard working days
    WORKING_HOURS_PER_DAY: 8,   // Standard working hours per day
    ...payrollConfig
  };

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    position: "",
    month: new Date().toISOString().slice(0, 7),
    basicSalary: "",
    allowances: "",
    overtimeHours: "",
    deductions: "",
    epfEmployee: 0,
    epfEmployer: 0,
    etfEmployer: 0,
    notes: ""
  });

  // Calculate payroll values when form data changes
  useEffect(() => {
    const basicSalary = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const overtimeHours = parseFloat(formData.overtimeHours) || 0;
    const otherDeductions = parseFloat(formData.deductions) || 0;
    
    // Calculate EPF (8% of basic salary, no cap mentioned)
    const epfEmployee = basicSalary * defaultConfig.EMPLOYEE_EPF_RATE;
    
    // Calculate ETF (3% of basic salary, paid by employer - not deducted from employee)
    const etfEmployer = basicSalary * defaultConfig.EMPLOYER_ETF_RATE;
    
    // Calculate overtime pay (1.5x hourly rate for overtime)
    const hourlyRate = basicSalary / (defaultConfig.WORKING_DAYS_PER_MONTH * defaultConfig.WORKING_HOURS_PER_DAY);
    const overtimePay = overtimeHours * hourlyRate * defaultConfig.OVERTIME_MULTIPLIER;
    
    // Calculate gross pay (before any deductions)
    const grossPay = basicSalary + allowances + overtimePay;
    
    // Calculate total deductions (EPF + any other deductions)
    const totalDeductions = epfEmployee + otherDeductions;
    
    // Calculate net pay (gross pay - all deductions)
    const netPay = grossPay - totalDeductions;
    
    setFormData(prev => ({
      ...prev,
      epfEmployee,
      etfEmployer,
      overtimePay,
      grossPay,
      netPay
    }));
  }, [formData.basicSalary, formData.allowances, formData.overtimeHours, formData.deductions]);

  // State for employees list, loading, and error
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await employeeApi.getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({
        ...prev,
        employeeId: "",
        employeeName: "",
        department: "",
        position: ""
      }));
      return;
    }
    
    const selectedEmployee = employees.find(emp => emp._id === selectedId);
    
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeId: selectedEmployee._id,
        employeeName: selectedEmployee.fullName,
        department: selectedEmployee.department,
        position: selectedEmployee.position,
        basicSalary: selectedEmployee.basicSalary || ""
      }));
    }
  };

  const calculateOvertimePay = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const hours = parseFloat(formData.overtimeHours) || 0;
    const hourlyRate = basic / 160; // 160 working hours in a month (20 days * 8 hours)
    return (hourlyRate * 1.5 * hours).toFixed(2);
  };

  const calculateNetPay = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const overtimePay = parseFloat(calculateOvertimePay()) || 0;
    
    return (basic + allowances + overtimePay - deductions).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPayroll = {
      ...formData,
      id: `PR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      overtimePay: calculateOvertimePay(),
      netPay: calculateNetPay(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    onSave(newPayroll);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">New Payroll Entry</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Employee Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  Employee Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Employee
                      {isLoading && <span className="ml-2 text-xs text-blue-600">Loading...</span>}
                      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
                    </label>
                    {isLoading ? (
                      <div className="flex items-center justify-center p-4 border rounded-md bg-gray-50">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Loading employees...</span>
                      </div>
                    ) : error ? (
                      <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                      </div>
                    ) : (
                      <select
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.employeeId}
                        onChange={handleEmployeeSelect}
                        required
                        disabled={isLoading || !!error}
                      >
                        <option value="">Select an employee</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.fullName} - {emp.department} ({emp.employeeId || emp._id.substring(0, 6)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md bg-gray-100"
                      value={employees.find(e => e._id === formData.employeeId)?.employeeId || formData.employeeId}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md bg-gray-100"
                      value={formData.department}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md bg-gray-100"
                      value={formData.position}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <DollarSign className="mr-2" size={20} />
                  Payroll Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <input
                      type="month"
                      name="month"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.month}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Salary (LKR)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400">LKR</span>
                      <input
                        type="number"
                        name="basicSalary"
                        className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.basicSalary}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (LKR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400">LKR</span>
                      <input
                        type="number"
                        name="allowances"
                        className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.allowances}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Hours</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="overtimeHours"
                        className="w-full p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.overtimeHours}
                        onChange={handleInputChange}
                        min="0"
                        step="0.5"
                      />
                      <span className="bg-gray-100 px-3 py-2 border-t border-r border-b rounded-r-md text-sm text-gray-500">
                        hrs
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      rows="2"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes or remarks"
                    />
                  </div>
                </div>
              </div>

              {/* EPF & ETF Details */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h3 className="text-lg font-medium text-yellow-800 mb-3 flex items-center">
                  <AlertCircle className="mr-2" size={20} />
                  EPF & ETF Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-md border">
                    <h4 className="font-medium text-gray-700 mb-2">Employee Deductions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">EPF (8% of Basic Salary):</span>
                        <span className="font-medium">LKR {formData.epfEmployee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Total Deductions:</span>
                        <span className="font-medium text-blue-700">LKR {(formData.epfEmployee + (parseFloat(formData.deductions) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-md border">
                    <h4 className="font-medium text-gray-700 mb-2">Employer Contributions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ETF (3% of Basic Salary):</span>
                        <span className="font-medium">LKR {formData.etfEmployer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Total Employer Cost:</span>
                        <span className="font-medium text-green-700">
                          LKR {(parseFloat(formData.basicSalary || 0) + formData.etfEmployer).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                  <AlertCircle className="mr-2" size={20} />
                  Salary Breakdown
                </h3>
                
                {/* Earnings */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Basic Salary:</span>
                      <span>LKR {parseFloat(formData.basicSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {formData.allowances > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Allowances:</span>
                        <span>LKR {parseFloat(formData.allowances || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {formData.overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Overtime Pay:</span>
                        <span>LKR {parseFloat(formData.overtimePay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Gross Salary:</span>
                      <span>LKR {formData.grossPay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">EPF (8% of Basic):</span>
                      <span className="text-red-600">- LKR {formData.epfEmployee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                    {formData.deductions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Other Deductions:</span>
                        <span className="text-red-600">- LKR {parseFloat(formData.deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Deductions:</span>
                      <span className="text-red-600">- LKR {(formData.epfEmployee + (parseFloat(formData.deductions) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="bg-blue-100 p-4 rounded-md border border-blue-200">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-blue-800">Net Salary (Take Home):</p>
                    <p className="text-xl font-bold text-blue-800">
                      LKR {formData.netPay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Process Payroll
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayrollForm;

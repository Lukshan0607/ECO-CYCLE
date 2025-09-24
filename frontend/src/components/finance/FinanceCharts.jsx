import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import payrollApi from '../../services/payrollApi';

const FinanceCharts = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState({
    salaryExpenses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employee salary expenses data using the payrollApi service
        const salaryData = await payrollApi.getEmployeeSalaryExpenses(new Date().getFullYear());
        console.log('Raw salary data from API:', salaryData);
        
        // Prepare chart data from the API response
        const chartData = {
          salaryExpenses: salaryData.map(item => {
            // Ensure all values are numbers and handle potential null/undefined
            const basicSalary = parseFloat(item.basicSalary) || 0;
            const epf = parseFloat(item.epf) || 0;
            const etf = parseFloat(item.etf) || 0;
            const overtime = parseFloat(item.overtime) || 0;
            
            const entry = {
              month: item.month,
              'Basic Salary': basicSalary,
              'EPF Contributions': epf,
              'ETF Contributions': etf,
              'Overtime': overtime,
              // Add a total for verification
              total: basicSalary + epf + etf + overtime
            };
            
            console.log(`Processed entry for ${item.month}:`, entry);
            return entry;
          })
        };
        
        // Log the sum of all entries for verification
        const totalSum = chartData.salaryExpenses.reduce((sum, item) => sum + item.total, 0);
        console.log('Total sum of all entries:', totalSum);
        
        setChartData(chartData);
        
        // Set overview data - removed as we're only using pie chart now
      } catch (error) {
        console.error('Error fetching payroll data:', error);
        setError('Failed to load payroll data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.token]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for pie chart
  const calculateSalaryTotals = () => {
    const totals = {
      'Basic Salary': 0,
      'EPF Contributions': 0,
      'ETF Contributions': 0,
      'Overtime': 0
    };

    chartData.salaryExpenses.forEach(month => {
      Object.keys(totals).forEach(key => {
        const value = parseFloat(month[key]) || 0;
        console.log(`Adding ${key}: ${value} for ${month.month}`);
        totals[key] += value;
      });
    });

    const result = Object.entries(totals).map(([name, value]) => {
      const roundedValue = parseFloat(value.toFixed(2));
      console.log(`${name}: ${roundedValue}`);
      return { name, value: roundedValue };
    });
    
    const totalSum = result.reduce((sum, item) => sum + item.value, 0);
    console.log('Total sum of all values:', totalSum);
    
    return result;
  };

  // Professional color scheme with better contrast and accessibility
  const COLORS = [
    '#4e73df', // Blue
    '#1cc88a', // Green
    '#f6c23e', // Yellow
    '#e74a3b', // Red
    '#36b9cc', // Cyan
    '#6f42c1'  // Purple
  ];

  // Custom label component with better styling
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text
        x={x}
        y={y}
        fill="#4a5568"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Pie Chart for Salary Distribution
  const renderSalaryPieChart = () => {
    const pieData = calculateSalaryTotals();
    
    // Custom tooltip component
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        const total = pieData.reduce((sum, item) => sum + item.value, 0);
        return (
          <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-800">{data.name}</p>
            <p className="text-sm text-gray-600">
              Rs. {data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">
              {((data.value / total) * 100).toFixed(1)}% of total
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Salary Expense Distribution</h3>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <div className="h-96 flex flex-col items-center">
          <div className="h-80 w-full max-w-md">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={index} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={1}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#colorGradient${index})`}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    paddingTop: '20px',
                    paddingBottom: '10px'
                  }}
                  formatter={(value, entry, index) => (
                    <span className="text-sm text-gray-700">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          
          <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-md">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-gray-600">
                  {item.name}: <span className="font-medium">{((item.value / pieData.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return renderSalaryPieChart();
};

export default FinanceCharts;

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent } from '../ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ExpenseBreakdown = ({ expenses = [] }) => {
  const [expenseData, setExpenseData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Process and aggregate expense data by category, filtering for 'paid' status
  const processExpenseData = (expenses) => {
    // Professional color palette with better visual distinction
    const colorPalette = [
      '#4F46E5', // Indigo
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#6366F1', // Indigo light
    ];
    
    // Helper function to format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };
    
    // Process and validate expenses
    if (!Array.isArray(expenses) || expenses.length === 0) {
      console.warn('No expense data provided or empty array received');
      return [];
    }
    
    // Filter only paid expenses
    const paidExpenses = expenses.filter(expense => 
      expense.status && expense.status.toLowerCase() === 'paid'
    );
    
    if (paidExpenses.length === 0) {
      console.warn('No paid expenses found');
      return [];
    }
    
    // Group and aggregate expenses by category
    const categorySummary = paidExpenses.reduce((acc, expense) => {
      try {
        const category = expense?.category?.trim() || 'Uncategorized';
        const amount = Math.abs(parseFloat(expense.amount) || 0);
        
        if (isNaN(amount)) {
          console.warn('Invalid amount for expense:', expense);
          return acc;
        }
        
        if (!acc[category]) {
          acc[category] = {
            name: category,
            value: 0,
            formattedValue: 'Rs. 0.00',
            count: 0,
            lastUpdated: expense.date || new Date()
          };
        }
        
        acc[category].value += amount;
        acc[category].formattedValue = formatCurrency(acc[category].value);
        acc[category].count += 1;
        
        // Update last updated timestamp if this is a newer expense
        if (expense.date && new Date(expense.date) > new Date(acc[category].lastUpdated)) {
          acc[category].lastUpdated = expense.date;
        }
        
        return acc;
      } catch (error) {
        console.error('Error processing expense:', expense, error);
        return acc;
      }
    }, {});
    
    // Convert to array and sort by value (descending)
    const result = Object.values(categorySummary)
      .map((item, index) => ({
        ...item,
        color: colorPalette[index % colorPalette.length],
        percentage: 0, // Will be calculated later
        id: `category-${index}`,
        label: item.name,
        tooltip: `${item.name}: ${item.formattedValue} (${item.count} ${item.count === 1 ? 'expense' : 'expenses'})`,
        lastUpdated: item.lastUpdated || new Date()
      }))
      .sort((a, b) => b.value - a.value);
    
    // Calculate percentages
    const total = result.reduce((sum, item) => sum + item.value, 0);
    return result.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      formattedPercentage: total > 0 ? ((item.value / total) * 100).toFixed(1) + '%' : '0.0%'
    }));
  };

  // Calculate percentages for each category
  const calculatePercentages = (data) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => {
      // Ensure percentage is always a number, not a string
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      return {
        ...item,
        percentage: Number(percentage.toFixed(2)), // Ensure it's a number with 2 decimal places
        formattedPercentage: percentage.toFixed(1) + '%' // For display purposes
      };
    });
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching expenses from API...');
        const response = await fetch('http://localhost:5000/api/expenses', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (!result || !result.success || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          throw new Error(result.message || 'Invalid data format received from server');
        }
        
        console.log('Processing expense data...');
        const processed = processExpenseData(result.data);
        console.log('Processed data:', processed);
        
        const withPercentages = calculatePercentages(processed);
        setExpenseData(withPercentages);
        setError(null);
      } catch (err) {
        console.error('Error in fetchExpenses:', err);
        setError(`Error loading expense data. Please try again later. (${err.message})`);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if no expenses were passed as props
    if (!expenses || expenses.length === 0) {
      fetchExpenses();
    } else {
      // Process the provided expenses
      try {
        const processed = processExpenseData(expenses);
        const withPercentages = calculatePercentages(processed);
        setExpenseData(withPercentages);
        setError(null);
      } catch (err) {
        console.error('Error processing expense data:', err);
        setError('Failed to process expense data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [expenses]);

  // Enhanced tooltip component with better formatting
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const percentage = data.percentage?.toFixed(1) || 0;
    const count = data.count || 0;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-100 min-w-[220px]">
        <div className="flex items-center mb-3">
          <div 
            className="w-5 h-5 rounded-full mr-3 shadow-sm" 
            style={{ backgroundColor: data.color }}
          />
          <h4 className="text-base font-semibold text-gray-900">{data.name}</h4>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Total:</span>
            <span className="text-sm font-semibold text-gray-800">
              {data.formattedValue || `Rs. ${data.value?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Percentage:</span>
            <span className="text-sm font-semibold text-gray-800">{percentage}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Transactions:</span>
            <span className="text-sm font-semibold text-gray-800">{count}</span>
          </div>
          
          {data.lastUpdated && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-right">
                Updated: {new Date(data.lastUpdated).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render customized label inside pie chart segments
  const renderCustomizedLabel = ({
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent, 
    index,
    name
  }) => {
    // Only show labels for segments larger than 5%
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-semibold pointer-events-none"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          fontSize: percent > 0.1 ? '11px' : '9px',
          opacity: 0.9
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenseData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <div className="h-[500px] flex flex-col">
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  {/* Add subtle gradient to each segment */}
                  {expenseData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={1}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                  startAngle={90}
                  endAngle={450}
                >
                  {expenseData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={`url(#gradient-${index})`}
                      stroke="#fff"
                      strokeWidth={1.5}
                      style={{
                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                        transition: 'opacity 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => {
                        // Highlight the segment on hover
                        document.documentElement.style.setProperty('--segment-opacity', '0.8');
                      }}
                      onMouseLeave={() => {
                        document.documentElement.style.removeProperty('--segment-opacity');
                      }}
                    />
                  ))}
                </Pie>
                
                {/* Center text with total amount */}
                <text 
                  x="50%" 
                  y="45%" 
                  textAnchor="middle" 
                  className="text-lg font-semibold text-gray-700"
                >
                  Total
                </text>
                <text 
                  x="50%" 
                  y="60%" 
                  textAnchor="middle" 
                  className="text-2xl font-bold text-gray-900"
                >
                  {expenseData.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-LK', {
                    style: 'currency',
                    currency: 'LKR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </text>
                
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend with better styling */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm">
                {expenseData.map((entry, index) => (
                  <div 
                    key={`legend-${index}`} 
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                    onMouseEnter={() => {
                      // Highlight corresponding segment
                      const element = document.querySelector(`.recharts-pie-sector:nth-child(${index + 1})`);
                      if (element) element.style.opacity = '0.8';
                    }}
                    onMouseLeave={() => {
                      const element = document.querySelector(`.recharts-pie-sector:nth-child(${index + 1})`);
                      if (element) element.style.opacity = '1';
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate" title={entry.name}>
                        {entry.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.formattedValue} • {entry.formattedPercentage || '0.0%'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseBreakdown;

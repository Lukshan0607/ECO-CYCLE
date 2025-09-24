import React from 'react';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';

// Format currency in LKR
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const ExpenseSummary = ({ summary }) => {
  const cards = [
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.total),
      icon: <DollarSign className="h-6 w-6 text-blue-600" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Paid',
      value: formatCurrency(summary.paid),
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Pending',
      value: formatCurrency(summary.pending),
      icon: <Clock className="h-6 w-6 text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Failed',
      value: formatCurrency(summary.failed),
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.bgColor} p-3 rounded-md`}>
                {card.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className={`text-2xl font-semibold ${card.textColor}`}>
                      ${card.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseSummary;

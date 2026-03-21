import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, pointsUsed, quantity, remainingPoints } = location.state || {};

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your order information.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderId}</span>
              </div>
              {pointsUsed && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Points Used:</span>
                  <span className="font-medium">{pointsUsed} pts</span>
                </div>
              )}
              {quantity && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
              )}
              {remainingPoints !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Points:</span>
                  <span className="font-medium">{remainingPoints} pts</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600 mb-8">You will receive a confirmation email shortly.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-white text-green-600 border border-green-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;

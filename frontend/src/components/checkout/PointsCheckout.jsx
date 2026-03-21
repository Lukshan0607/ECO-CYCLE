import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const PointsCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Get product from location state
    if (location.state?.product) {
      setProduct(location.state.product);
    } else {
      // If no product in state, redirect back to products
      navigate('/products');
    }

    // Load user's points balance
    const loadBalance = async () => {
      try {
        const uid = user?._id || user?.id;
        if (!uid) return;
        const { data } = await axios.get('http://localhost:5000/api/points/balance', { 
          params: { userId: uid } 
        });
        setPointsBalance(Number(data?.balance || 0));
      } catch (error) {
        console.error('Error loading points balance:', error);
      }
    };

    loadBalance();
  }, [isAuthenticated, navigate, location, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true);
    try {
      const orderData = {
        userId: user?._id || user?.id,
        productId: product.id || product._id,
        quantity: product.quantity || 1,
        // Include any additional shipping details if needed
        shippingDetails: {
          ...formData,
          status: 'Processing'
        }
      };

      // Call the payProduct endpoint to process the points payment
      const response = await axios.post('http://localhost:5000/api/points/pay-product', {
        userId: user?._id || user?.id,
        productId: product.id || product._id,
        quantity: product.quantity || 1
      });
      
      if (response.data.success) {
        // Redirect to order confirmation page with order details
        navigate('/order-confirmation', { 
          state: { 
            orderId: response.data.orderId,
            pointsUsed: product.totalPoints || product.points,
            quantity: product.quantity || 1,
            remainingPoints: response.data.balance
          } 
        });
      } else {
        alert(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert(error.response?.data?.message || 'An error occurred while placing your order');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Checkout with Points</h1>
          <p className="mt-2 text-gray-600">Complete your purchase using your points balance</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Order Summary
            </h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{product.name}</h4>
                  <p className="text-gray-600">Quantity: {product.quantity || 1}</p>
                  <p className="text-gray-600">Points per item: {Math.round((product.totalPoints || product.points) / (product.quantity || 1))} pts</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{product.totalPoints || product.points} pts</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Points Balance:</span>
                  <span className="font-medium">{pointsBalance} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points Required:</span>
                  <span className="font-medium">{product.totalPoints || product.points} pts</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-gray-200">
                  <span>Remaining Points:</span>
                  <span>{pointsBalance - (product.totalPoints || product.points)} pts</span>
                </div>
              </div>
            </div>

            {pointsBalance < (product.totalPoints || product.points) && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You don't have enough points for this purchase. You need {(product.totalPoints || product.points) - pointsBalance} more points.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Shipping Information
            </h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  id="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Order Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Special instructions for delivery"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={loading || pointsBalance < (product.totalPoints || product.points)}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                pointsBalance >= (product.totalPoints || product.points) 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {loading ? 'Processing...' : 'Complete Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PointsCheckout;

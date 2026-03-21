import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pointsPerRupee, setPointsPerRupee] = useState('');
  const [pointsBalance, setPointsBalance] = useState(0);
  const [payingWithPoints] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const loadPointsRate = async () => {
      try {
        const saved = localStorage.getItem('pointsPerRupee');
        if (saved !== null) setPointsPerRupee(saved);

        const response = await axios.get('http://localhost:5000/api/points/settings');
        const rate = response.data?.settings?.pointsPerRupee;
        if (rate !== undefined) {
          setPointsPerRupee(String(rate));
          localStorage.setItem('pointsPerRupee', String(rate));
        }
      } catch (e) {
        console.error('Error loading points rate:', e);
      }
    };
    loadPointsRate();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        if (!isAuthenticated()) return;
        const uid = user?._id || user?.id;
        if (!uid) return;
        const { data } = await axios.get('http://localhost:5000/api/points/balance', { params: { userId: uid } });
        setPointsBalance(Number(data?.balance || 0));
      } catch (e) {
        // silent fail
      }
    };
    loadBalance();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const price = parseFloat(product.price);
    const rate = parseFloat(pointsPerRupee || '0');
    if (!isNaN(price) && !isNaN(rate) && rate > 0) {
      setTotalPoints(Math.round(price * rate * quantity));
    }
  }, [product.price, pointsPerRupee, quantity]);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      const cartData = {
        productId: product.id.toString(),
        productName: product.name,
        price: product.price,
        quantity: quantity,
        imageUrl: product.imageUrl,
        description: product.description,
        userId: user.id || user._id
      };

      const response = await axios.post('http://localhost:5000/api/cart/add', cartData);

      if (response.status === 200 || response.status === 201) {
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`${product.name} added to cart!`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleBuyWithPoints = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    navigate('/checkout/points', {
      state: {
        product: {
          ...product,
          id: product.id || product._id,
          quantity,
          totalPoints
        },
        pointsBalance
      }
    });
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md transition-shadow duration-300 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pb-2/3 h-60 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
        />
        {product.percentRecycled && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {product.percentRecycled}% Recycled
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="text-lg font-bold text-green-700">LKR {parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <p className="mt-2 text-gray-600 text-sm h-12 overflow-hidden">{product.description}</p>

        <div className="mt-3 flex items-center">
          <span className="text-sm text-gray-700 mr-3">Quantity:</span>
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-3 py-1 bg-white">{quantity}</span>
            <button
              onClick={() => setQuantity(prev => prev + 1)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end items-center">
          <button
            onClick={handleAddToCart}
            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm transition-colors"
          >
            Add to Cart
          </button>
          {(() => {
            const price = parseFloat(product.price);
            const rate = parseFloat(pointsPerRupee || '0');
            if (Number.isNaN(price) || Number.isNaN(rate) || rate <= 0) return null;
            const required = Math.round(price * rate);
            const canBuy = required > 0 && pointsBalance >= totalPoints;
            return (
              <button
                onClick={handleBuyWithPoints}
                disabled={!canBuy || payingWithPoints}
                className={`ml-2 border rounded-md text-sm px-3 py-1 transition-colors ${canBuy && !payingWithPoints ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-gray-300 text-gray-400'}`}
                title={canBuy ? `Costs ${totalPoints} points (${quantity} × ${Math.round(required / quantity)} pts)` : `Need ${totalPoints} points, you have ${pointsBalance}`}
              >
                {payingWithPoints ? 'Processing...' : canBuy ? `Buy with ${totalPoints} pts` : 'Insufficient points'}
              </button>
            );
          })()}
        </div>

        {(() => {
          const price = parseFloat(product.price);
          const rate = parseFloat(pointsPerRupee || '0');
          if (Number.isNaN(price) || Number.isNaN(rate) || rate <= 0) return null;
          const pointsPerItem = Math.round(price * rate);
          return (
            <div className="mt-3 bg-green-50 rounded-md p-2 text-center text-sm text-green-700">
              <div className="font-medium">{quantity} × {pointsPerItem} pts = {totalPoints} pts</div>
              <div className="text-xs mt-1">You have {pointsBalance} points available</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default ProductCard;
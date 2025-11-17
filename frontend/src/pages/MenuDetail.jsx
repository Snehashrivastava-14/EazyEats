import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useState } from 'react';
import { toast } from 'sonner';

export default function MenuDetail({ item }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!item) return null;

  function handleAdd() {
    if (!item.isAvailable) {
      toast.error('This item is currently unavailable');
      return;
    }
    (async () => {
      try {
        await addToCart(item, 1)
        setAdded(true);
        toast.success('Added to cart successfully!');
        setTimeout(() => setAdded(false), 1200);
      } catch (err) {
        // addToCart already showed a toast on auth error; nothing else to do
      }
    })()
  }

  return (
    <div className="min-h-screen bg-[#111] py-12">
      <div className="max-w-4xl mx-auto bg-black rounded-xl  shadow-[0_0_20px_rgba(255,255,255,0.5)] overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-gray-900 flex items-center justify-center">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'}
            alt={item.name}
            className="w-full h-96 object-cover"
          />
        </div>
        <div className="md:w-1/2 p-8 text-white flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{item.name}</h1>
          {!item.isAvailable && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-red-500 font-semibold text-sm">⚠️ Currently Unavailable</span>
            </div>
          )}
          <div className="text-[#ffd600] font-extrabold text-2xl mb-4">₹{Number(item.price).toFixed(2)}</div>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">{item.description}</p>

          <div className="flex items-center gap-10">
            <button
              className={`bg-brand hover:bg-brand-dark text-black rounded-md py-3 px-6 font-semibold transition-opacity ${added ? 'opacity-75' : 'opacity-100'} `}
              onClick={handleAdd}
              disabled={added}
            >
              { added ? 'Added!' : 'Add to Cart'}
            </button>

            <button
              className="text-lg md:text-xl text-white/80  max-w-xl underline mb-[-10px] mr-[-50px]"
              onClick={() => navigate('/menu', { state: location.state })}
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

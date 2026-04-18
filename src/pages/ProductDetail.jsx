import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../contexts/CartContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;const SIZES = [250, 500, 750, 1000]; // grams

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [selectedSize, setSelectedSize] = useState(250);
  const [quantity, setQuantity] = useState(1);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setLoading(false);
        setActiveImageIndex(0);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setSuggestionsLoading(true);
    fetch(`${API_BASE_URL}/api/items`)
      .then((res) => res.json())
      .then((sections) => {
        const allItems = sections.flatMap((section) => section.articles);
        const filtered = allItems.filter((i) => i._id !== id);
        setSuggestions(filtered.slice(0, 6));
        setSuggestionsLoading(false);
      })
      .catch(() => setSuggestionsLoading(false));
  }, [id]);

  const unitPrice = ((item?.price || 0) * selectedSize) / 1000;
  const totalPrice = unitPrice * quantity;
  const totalWeight = selectedSize * quantity;
  const totalProtein = ((item?.proteinPer100g || 0) * totalWeight) / 100;
  const totalCarbs = ((item?.carbsPer100g || 0) * totalWeight) / 100;
  const totalCalories = ((item?.caloriesPer100g || 0) * totalWeight) / 100;

  const incrementQuantity = () => setQuantity((q) => Math.min(q + 1, 10));
  const decrementQuantity = () => setQuantity((q) => Math.max(q - 1, 1));

  const images = item?.gallery && item.gallery.length > 0 ? item.gallery : [item?.img];

  const handleAddToCart = () => {
    addItem({
      _id: item._id,
      name: item.name,
      price: unitPrice,
      selectedSize,
      quantity,
      img: item.img,
    });
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate("/cart");
    }, 1200);
  };

  if (loading) return <div className="text-center mt-20 text-xl">Loading...</div>;
  if (!item) return <div className="text-center mt-20 text-xl">Product not found.</div>;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto my-12 px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left side: Image gallery */}
          <section>
            <div className="overflow-hidden rounded-3xl shadow-lg mb-6">
              <img
                src={images[activeImageIndex]}
                alt={`${item.name} image`}
                className="w-full h-[480px] object-cover transition-transform duration-300 ease-in-out"
              />
            </div>
          </section>

          {/* Right side: Product info and purchase */}
          <section className="flex flex-col justify-between">
            <div>
              <h1 className="text-5xl font-extrabold mb-2 text-gray-900">{item.name}</h1>
              <p className="text-lg text-gray-500 mb-6">{item.category}</p>

              <div className="mb-6 flex items-center gap-6">
                <span className="text-4xl font-bold text-[#ef4444]">₹{unitPrice.toFixed(2)}</span>
                {item.oldPrice && (
                  <span className="text-xl line-through text-gray-400">
                    ₹{((item.oldPrice * selectedSize) / 1000).toFixed(2)}
                  </span>
                )}
              </div>
              <p className="mt-2 font-semibold text-lg">Total: ₹{totalPrice.toFixed(2)}</p>

              <div
                className="text-gray-700 leading-relaxed mb-8 whitespace-pre-line"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {item.longdesc}
              </div>

              {/* Size selector */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Select Size (grams)</h3>
                <div className="flex gap-3">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      className={`px-4 py-2 rounded-full font-semibold ${
                        selectedSize === size
                          ? "bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-6">
                <label htmlFor="quantity" className="font-semibold text-lg text-gray-700">
                  Quantity
                </label>
                <div className="flex items-center space-x-3 border rounded-lg px-4 py-2 w-max">
                  <button
                    onClick={decrementQuantity}
                    className="text-[#ef4444] font-bold text-2xl focus:outline-none"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    type="text"
                    className="w-12 text-center font-semibold text-xl border-none focus:ring-0 focus:outline-none"
                    value={quantity}
                    readOnly
                  />
                  <button
                    onClick={incrementQuantity}
                    className="text-[#ef4444] font-bold text-2xl focus:outline-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Nutrition info */}
              <div className="flex justify-around text-center mb-8 border rounded-xl p-4 bg-gray-50">
                <div>
                  <span className="block text-2xl mb-1">🍗</span>
                  <span className="font-semibold">{totalProtein.toFixed(1)}g</span>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
                <div>
                  <span className="block text-2xl mb-1">🌾</span>
                  <span className="font-semibold">{totalCarbs.toFixed(1)}g</span>
                  <div className="text-xs text-gray-500">Carbs</div>
                </div>
                <div>
                  <span className="block text-2xl mb-1">🔥</span>
                  <span className="font-semibold">{totalCalories.toFixed(0)}</span>
                  <div className="text-xs text-gray-500">Calories</div>
                </div>
              </div>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              className="sticky bottom-0 w-full md:w-auto bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
            >
              Add to Cart
            </button>
          </section>
        </div>

        {/* Suggestions section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold mb-6">You might also like</h2>
          {suggestionsLoading ? (
            <div>Loading suggestions...</div>
          ) : suggestions.length === 0 ? (
            <p>No suggestions available right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {suggestions.slice(0, 5).map((suggestion) => (
                <Link
                  key={suggestion._id}
                  to={`/product/${suggestion._id}`}
                  className="rounded-lg shadow-md hover:shadow-xl transition-shadow bg-white flex flex-col"
                >
                  <img
                    src={suggestion.img}
                    alt={suggestion.name}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                  <div className="p-4 flex-grow">
                    <h3 className="font-semibold text-lg text-gray-900">{suggestion.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#ef4444] text-white py-3 px-6 rounded shadow-lg animate-fadeInOut z-50">
          Item added to cart!
        </div>
      )}

      {/* Toast fade animation */}
      <style>{`
        @keyframes fadeInOut {
          0%, 100% {opacity: 0; transform: translateY(10px);}
          10%, 90% {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInOut {
          animation: fadeInOut 1.2s ease forwards;
        }
      `}</style>
    </>
  );
}

import React, { useState } from 'react';
import { Product } from '../types';
import { Edit3, Eye, Minus, Plus, ShoppingBag, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
  onEditClick?: (product: Product) => void;
  key?: string;
}

export default function ProductCard({
  product,
  isAdmin,
  onAddToCart,
  onEditClick,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const incrementQty = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1); // Reset counter
  };

  const isLowStock = product.stock > 0 && product.stock < 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div id={`product-card-${product.id}`} className="group relative flex flex-col bg-[#e5e1da]/15 border border-[#1a1a1a]/10 rounded-none overflow-hidden hover:border-[#1a1a1a]/30 transition-all duration-300">
      
      {/* Product Image Panel */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#e5e1da]">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/10 to-transparent" />
        
        {/* Category & Stock Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#1a1a1a] text-[#f5f2ed] shadow-sm">
            {product.category}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#1a1a1a]/10 text-rose-700 border border-rose-500/20 backdrop-blur-md">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/25 backdrop-blur-md animate-pulse">
              Only {product.stock} Left
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 backdrop-blur-md">
              {product.stock} in Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Content Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-sm font-bold text-[#1a1a1a] font-sans uppercase tracking-wider group-hover:underline transition-colors duration-200 line-clamp-1">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-[#1a1a1a] font-mono shrink-0">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-[#1a1a1a]/60 font-sans line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        {/* Action Controls Footer */}
        <div className="mt-auto space-y-3 pt-3 border-t border-[#1a1a1a]/10">
          {!isOutOfStock && !isAdmin && (
            <div className="flex items-center justify-between gap-3 bg-[#e5e1da]/30 border border-[#1a1a1a]/10 rounded-none p-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[#1a1a1a]/50 font-bold pl-1">Quantity</span>
              <div className="flex items-center space-x-1">
                <button
                  id={`dec-qty-${product.id}`}
                  onClick={decrementQty}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-none border border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e5e1da] disabled:opacity-30 transition-all cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-[#1a1a1a] text-xs font-mono font-bold">
                  {quantity}
                </span>
                <button
                  id={`inc-qty-${product.id}`}
                  onClick={incrementQty}
                  disabled={quantity >= product.stock}
                  className="w-7 h-7 flex items-center justify-center rounded-none border border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e5e1da] disabled:opacity-30 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              id={`details-btn-${product.id}`}
              onClick={() => setShowDetailModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-none border border-[#1a1a1a]/15 text-[#1a1a1a] hover:bg-[#e5e1da]/40 font-medium uppercase tracking-wider text-[10px] transition-all duration-200 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            {isAdmin ? (
              <button
                id={`edit-btn-${product.id}`}
                onClick={() => onEditClick && onEditClick(product)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/20 font-medium uppercase tracking-wider text-[10px] transition-all duration-200 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                id={`add-to-cart-${product.id}`}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-none bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 disabled:bg-[#1a1a1a]/10 disabled:text-[#1a1a1a]/40 text-[#f5f2ed] uppercase tracking-widest text-[10px] font-bold transition-all duration-200 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add To Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Full-Size Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="bg-[#f5f2ed] border border-[#1a1a1a]/20 rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-[#1a1a1a]">
            <button
              id="close-details-modal"
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-[#1a1a1a]/60 hover:text-[#1a1a1a] p-1.5 bg-[#e5e1da] border border-[#1a1a1a]/10 rounded-none cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="rounded-none overflow-hidden bg-[#e5e1da] border border-[#1a1a1a]/10 aspect-square">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#1a1a1a] text-[#f5f2ed]">
                      {product.category}
                    </span>
                    {isOutOfStock ? (
                      <span className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#1a1a1a]/10 text-rose-700">
                        Out of stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#1a1a1a]/5 text-emerald-800">
                        {product.stock} in stock
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-serif leading-tight text-[#1a1a1a] mb-2">
                    {product.name}
                  </h2>
                  <p className="text-xl font-bold font-mono text-[#1a1a1a]/80 mb-6">
                    ${product.price.toFixed(2)}
                  </p>

                  <h4 className="text-[10px] font-bold text-[#1a1a1a]/40 uppercase tracking-widest mb-2">
                    Design Detail
                  </h4>
                  <p className="text-sm text-[#1a1a1a]/70 leading-relaxed mb-6 font-serif italic">
                    {product.description}
                  </p>
                </div>

                {!isAdmin && (
                  <div className="space-y-4 pt-4 border-t border-[#1a1a1a]/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold text-[#1a1a1a]/50">Quantity</span>
                      <div className="flex items-center space-x-1 bg-[#e5e1da]/40 border border-[#1a1a1a]/10 rounded-none p-1">
                        <button
                          id={`modal-dec-qty-${product.id}`}
                          onClick={decrementQty}
                          disabled={quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded-none bg-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a] disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-[#1a1a1a] font-bold font-mono text-sm">
                          {quantity}
                        </span>
                        <button
                          id={`modal-inc-qty-${product.id}`}
                          onClick={incrementQty}
                          disabled={quantity >= product.stock}
                          className="w-8 h-8 flex items-center justify-center rounded-none bg-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a] disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      id={`modal-add-to-cart-${product.id}`}
                      onClick={() => {
                        handleAddToCart();
                        setShowDetailModal(false);
                      }}
                      disabled={isOutOfStock}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 disabled:bg-[#1a1a1a]/15 disabled:text-[#1a1a1a]/40 text-[#f5f2ed] uppercase tracking-widest text-[11px] font-bold transition-all duration-200 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart — ${(product.price * quantity).toFixed(2)}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

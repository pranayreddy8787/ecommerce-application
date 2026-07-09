import React, { useState } from 'react';
import { OrderItem, Product, ShippingAddress } from '../types';
import { CreditCard, MapPin, ShoppingBag, Trash2, X } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (address: ShippingAddress) => Promise<boolean>;
  user: any;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  user,
}: CartDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const estTax = subtotal * 0.08;
  const totalAmount = subtotal + estTax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.name || !address.address || !address.city || !address.postalCode || !address.country) {
      alert("Please fill in all shipping details.");
      return;
    }
    setIsSubmitting(true);
    const success = await onCheckout(address);
    setIsSubmitting(false);
    if (success) {
      setOrderSuccess(true);
      setIsCheckingOut(false);
    }
  };

  const resetDrawer = () => {
    setOrderSuccess(false);
    setIsCheckingOut(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1a1a1a]/50 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#f5f2ed] border-l border-[#1a1a1a]/15 flex flex-col shadow-2xl text-[#1a1a1a] animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#1a1a1a]/10 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] font-sans flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#1a1a1a]" />
              <span>Shopping Cart</span>
            </h2>
            <button
              id="close-cart-btn"
              onClick={resetDrawer}
              className="p-1.5 rounded-none border border-[#1a1a1a]/10 bg-[#e5e1da] text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {orderSuccess ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
                <div className="w-16 h-16 rounded-none bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif text-[#1a1a1a] tracking-tight">Order Placed Successfully!</h3>
                <p className="text-xs text-[#1a1a1a]/60 font-serif italic max-w-xs leading-relaxed">
                  Your purchase was completed successfully, and your shipping tracking is now active.
                </p>
                <button
                  id="cart-continue-shopping-btn"
                  onClick={resetDrawer}
                  className="px-6 py-3.5 bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f5f2ed] uppercase tracking-widest text-[10px] font-bold rounded-none transition-all duration-200 cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-[#1a1a1a]/50">
                <ShoppingBag className="w-10 h-10 stroke-1 text-[#1a1a1a]/30" />
                <p className="text-xs uppercase tracking-widest font-sans">Your shopping cart is currently empty.</p>
                <button
                  id="browse-btn"
                  onClick={onClose}
                  className="px-4 py-2 rounded-none border border-[#1a1a1a]/15 text-[#1a1a1a] hover:bg-[#e5e1da]/40 font-sans text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Browse Products
                </button>
              </div>
            ) : isCheckingOut ? (
              /* Checkout Shipping Details Form */
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a1a]/10 mb-4">
                  <MapPin className="w-4 h-4 text-[#1a1a1a]/60" />
                  <h3 className="text-[10px] font-bold text-[#1a1a1a]/60 font-sans uppercase tracking-widest">
                    Shipping Details
                  </h3>
                </div>

                <div className="space-y-3.5 text-left">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1.5">Recipient Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={address.name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#e5e1da]/35 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-sm focus:border-[#1a1a1a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1.5">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={address.address}
                      onChange={handleInputChange}
                      placeholder="123 tech avenue, Suite 10"
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#e5e1da]/35 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-sm focus:border-[#1a1a1a] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1.5">City</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={address.city}
                        onChange={handleInputChange}
                        placeholder="San Francisco"
                        className="w-full px-3.5 py-2.5 rounded-none bg-[#e5e1da]/35 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-sm focus:border-[#1a1a1a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={address.postalCode}
                        onChange={handleInputChange}
                        placeholder="94103"
                        className="w-full px-3.5 py-2.5 rounded-none bg-[#e5e1da]/35 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-sm focus:border-[#1a1a1a] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1.5">Country</label>
                    <input
                      type="text"
                      name="country"
                      required
                      value={address.country}
                      onChange={handleInputChange}
                      placeholder="United States"
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#e5e1da]/35 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-sm focus:border-[#1a1a1a] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subtotals & Pay Action Button */}
                <div className="pt-6 border-t border-[#1a1a1a]/10 mt-6 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-[#1a1a1a]/60 font-mono">
                    <span>Order Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#1a1a1a]/60 font-mono">
                    <span>Estimated Tax (8%)</span>
                    <span>${estTax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[#1a1a1a] pt-2 border-t border-[#1a1a1a]/10 font-mono">
                    <span>Grand Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className="flex-1 py-3 border border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e5e1da]/40 rounded-none font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f5f2ed] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-none border border-[#f5f2ed] border-t-transparent animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Place Order — ${totalAmount.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Regular Cart List Views */
              <div className="space-y-4">
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const lineTotal = item.product.price * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3.5 bg-[#e5e1da]/20 border border-[#1a1a1a]/10 p-3 rounded-none hover:border-[#1a1a1a]/20 transition-colors"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-none border border-[#1a1a1a]/10 bg-[#e5e1da]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-xs font-bold text-[#1a1a1a] font-sans truncate uppercase tracking-wider">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-[#1a1a1a]/60 font-mono mt-0.5">
                            ${item.product.price.toFixed(2)}
                          </p>
                          
                          {/* Item Quantity Incrementor */}
                          <div className="flex items-center space-x-1 mt-1.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id!, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center rounded-none bg-transparent border border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e5e1da]/50 transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs text-[#1a1a1a] font-bold font-mono w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id!, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="w-5 h-5 flex items-center justify-center rounded-none bg-transparent border border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e5e1da]/50 transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs font-bold text-[#1a1a1a] font-mono">
                            ${lineTotal.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product.id!)}
                            className="p-1 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Panel */}
                <div className="pt-6 border-t border-[#1a1a1a]/10 mt-6 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-[#1a1a1a]/60 font-mono">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#1a1a1a]/60 font-mono">
                    <span>Estimated Tax (8%)</span>
                    <span>${estTax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[#1a1a1a] pt-2 border-t border-[#1a1a1a]/10 font-mono">
                    <span>Estimated Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>

                  {user ? (
                    <button
                      id="checkout-btn"
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full py-3.5 mt-4 bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f5f2ed] font-sans font-bold text-[10px] uppercase tracking-widest rounded-none shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Proceed to Checkout</span>
                    </button>
                  ) : (
                    <div className="mt-4 p-4 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/10 text-center space-y-2">
                      <p className="text-xs text-[#1a1a1a]/60 font-serif italic">
                        Please sign in above to complete your checkout experience.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

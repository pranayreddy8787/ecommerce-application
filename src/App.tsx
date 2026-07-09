import React, { useState, useEffect } from 'react';
import { Product, Order, ShippingAddress } from './types';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import AuthModal from './components/AuthModal';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import OrderHistory from './components/OrderHistory';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Store, 
  Tag, 
  User, 
  ShieldCheck, 
  HelpCircle,
  Database,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Simulated Role: 'admin' | 'user'
  const [simulateRole, setSimulateRole] = useState<'admin' | 'user'>('user');

  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cart States
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'admin'>('products');

  // Status/Toast Alert Messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load products catalog
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to load products catalog", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load orders (conditional on authentication)
  const fetchOrders = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!user && !activeToken) return;

    setLoadingOrders(true);
    try {
      const headers: any = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
      if (simulateRole) headers['X-Simulate-Role'] = simulateRole;

      const res = await fetch('/api/orders', { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load orders history", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingAuth(true);
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        
        // Auto resolve default test role
        const isAdminEmail = currentUser.email === "24eg107f29@anurag.edu.in";
        setSimulateRole(isAdminEmail ? 'admin' : 'user');
        
        // Load user orders right away
        fetchOrders(idToken);
      } else {
        setUser(null);
        setToken(null);
        setSimulateRole('user');
        setOrders([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync orders when role simulation changes
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [simulateRole]);

  // Load Initial products catalog
  useEffect(() => {
    fetchProducts();
    
    // Load local cart from localStorage
    const savedCart = localStorage.getItem('ecommerce_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse local cart data", e);
      }
    }
  }, []);

  // Save cart changes to localStorage
  const saveCartToLocalStorage = (newCart: { product: Product; quantity: number }[]) => {
    setCartItems(newCart);
    localStorage.setItem('ecommerce_cart', JSON.stringify(newCart));
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    let updatedCart = [...cartItems];

    if (existingIndex > -1) {
      const newQty = updatedCart[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        showToast(`Cannot add more than ${product.stock} items to cart.`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
    } else {
      updatedCart.push({ product, quantity });
    }

    saveCartToLocalStorage(updatedCart);
    showToast(`Added ${quantity} x "${product.name}" to cart.`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const updatedCart = cartItems.map(item => {
      if (item.product.id === productId) {
        if (quantity > item.product.stock) {
          showToast(`Limit reached. Only ${item.product.stock} items in stock.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    });

    saveCartToLocalStorage(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.product.id !== productId);
    saveCartToLocalStorage(updatedCart);
    showToast("Removed item from cart.");
  };

  // Submit Order / Checkout callback
  const handleCheckout = async (shippingAddress: ShippingAddress): Promise<boolean> => {
    if (!token) {
      showToast("Please sign in to place your order.");
      return false;
    }

    const totalAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0) * 1.08;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Simulate-Role': simulateRole,
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
          shippingAddress,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
        })
      });

      if (res.ok) {
        saveCartToLocalStorage([]); // Clear cart
        fetchProducts(); // Refresh stock in catalog
        fetchOrders(); // Reload orders history
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Fulfillment failed.");
        return false;
      }
    } catch (e) {
      console.error(e);
      showToast("Checkout API error.");
      return false;
    }
  };

  // Cancel Pending Order
  const handleCancelOrder = async (orderId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Simulate-Role': simulateRole,
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (res.ok) {
        showToast("Order cancelled successfully.");
        fetchProducts(); // Restore inventory stock
        fetchOrders(); // Refresh status logs
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Cancellation rejected.");
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Admin Catalog operations
  const handleAddProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Simulate-Role': simulateRole,
        },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        showToast("Successfully added new product to catalog.");
        fetchProducts();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add product.");
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleUpdateProduct = async (id: string, productFields: Partial<Product>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Simulate-Role': simulateRole,
        },
        body: JSON.stringify(productFields)
      });

      if (res.ok) {
        showToast("Successfully updated product.");
        fetchProducts();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update product.");
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Simulate-Role': simulateRole,
        }
      });

      if (res.ok) {
        showToast("Product deleted from database.");
        fetchProducts();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Deletion rejected.");
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Admin order fulfillment modifier
  const handleUpdateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Simulate-Role': simulateRole,
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        showToast(`Order status updated to "${status}".`);
        fetchOrders();
        fetchProducts(); // In case stock needs correction on cancelled status
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Fulfillment status update failed.");
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Filter products list based on category & search text
  const filteredProducts = products.filter(prod => {
    const matchCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchQuery = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Derive active admin privileges
  const isActualAdmin = user?.email === "24eg107f29@anurag.edu.in";
  const hasAdminPrivileges = simulateRole === 'admin';

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] flex flex-col font-sans selection:bg-[#1a1a1a]/15 selection:text-[#1a1a1a]">
      
      {/* Visual Dynamic Header Notification Bar */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1a1a1a] text-[#f5f2ed] border border-[#f5f2ed]/10 rounded-none px-5 py-4 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs font-sans tracking-wide">{toastMessage}</p>
        </div>
      )}

      {/* Primary Top Navigation Banner */}
      <header className="sticky top-0 z-40 bg-[#f5f2ed]/90 backdrop-blur-md border-b border-[#1a1a1a]/10 px-6 sm:px-12 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('products'); setSelectedCategory('All'); }}>
            <div className="text-2xl font-serif italic tracking-tight font-bold text-[#1a1a1a]">
              Object & Form
            </div>
            <div className="hidden sm:block pl-3 border-l border-[#1a1a1a]/15">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#1a1a1a]/50 font-mono block">Active Catalog</span>
              <span className="text-[10px] text-[#1a1a1a] font-medium flex items-center gap-1 mt-0.5">
                <Database className="w-3 h-3 text-[#1a1a1a]/40" />
                <span>Cloud Firestore</span>
              </span>
            </div>
          </div>

          {/* Nav Tabs & Cart Switch */}
          <div className="flex items-center space-x-6 sm:space-x-8 flex-wrap justify-center text-[11px] uppercase tracking-[0.2em] font-semibold">
            <button
              id="nav-tab-products"
              onClick={() => setActiveTab('products')}
              className={`pb-1 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'border-b-2 border-[#1a1a1a] text-[#1a1a1a]'
                  : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a] border-b-2 border-transparent'
              }`}
            >
              Catalog
            </button>

            {user && (
              <button
                id="nav-tab-orders"
                onClick={() => setActiveTab('orders')}
                className={`pb-1 transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-[#1a1a1a] text-[#1a1a1a]'
                    : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a] border-b-2 border-transparent'
                }`}
              >
                Orders
              </button>
            )}

            {hasAdminPrivileges && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`pb-1 transition-all cursor-pointer font-bold text-amber-800 flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'border-b-2 border-amber-800'
                    : 'border-b-2 border-transparent hover:text-[#1a1a1a]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 inline" />
                <span>Cockpit</span>
              </button>
            )}

            {/* Slide Cart Toggle Button */}
            <button
              id="open-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative py-1 text-[#1a1a1a] hover:opacity-60 transition-all flex items-center gap-1.5 cursor-pointer font-medium tracking-widest text-[11px]"
            >
              <span>Cart</span>
              <span className="font-mono text-xs">({String(cartTotalItems).padStart(2, '0')})</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-8">
        
        {/* User Session & Role Simulator controls at the very top */}
        <div className="bg-[#e5e1da]/40 border border-[#1a1a1a]/10 p-5 rounded-none space-y-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-[#1a1a1a] font-mono">Access Control Simulation</h3>
            <p className="text-xs text-[#1a1a1a]/70 max-w-xl">Use Google Sign-In, then toggle simulation roles to test customer or store manager flows seamlessly.</p>
          </div>
          
          <AuthModal
            user={user}
            loading={loadingAuth}
            onLogin={(u) => setUser(u)}
            onLogout={() => { setUser(null); setToken(null); }}
            simulateRole={simulateRole}
            setSimulateRole={setSimulateRole}
          />
        </div>

        {/* --- DYNAMIC TAB WINDOW RENDERS --- */}

        {/* TAB 1: PRODUCT CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-8">

            {/* Curated Editorial Hero Header */}
            {selectedCategory === 'All' && !searchQuery && (
              <section className="grid grid-cols-1 md:grid-cols-12 gap-8 border border-[#1a1a1a]/10 bg-[#e5e1da]/20 p-8 sm:p-12">
                <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/50 mb-4">Curated Collection / 2026</p>
                    <h2 className="text-5xl sm:text-7xl font-serif leading-[0.9] tracking-tighter text-[#1a1a1a]">
                      Tactile<br/><span className="italic ml-8 sm:ml-12">Minimalism</span>
                    </h2>
                  </div>
                  <p className="text-sm leading-relaxed text-[#1a1a1a]/70 max-w-md">
                    Explore our curated selection of functional objects designed for the modern living space. Each piece is hand-selected for its material integrity, tactile pleasure, and formal clarity.
                  </p>
                </div>
                <div className="md:col-span-5 flex flex-col justify-end items-start md:items-end space-y-4">
                  <div className="w-full md:w-64 h-72 bg-[#e5e1da] relative overflow-hidden border border-[#1a1a1a]/5 flex items-center justify-center">
                    {products.length > 0 ? (
                      <img src={products[0].imageUrl} className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all duration-700" alt="Featured Curated Object" />
                    ) : (
                      <div className="text-[#1a1a1a]/30 text-xs italic">[ Curated Object ]</div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-[#f5f2ed]/90 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-widest text-[#1a1a1a] border border-[#1a1a1a]/10 font-medium">
                      01. Sculptural Focus
                    </div>
                  </div>
                </div>
              </section>
            )}
            
            {/* Catalog Filter Header Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#1a1a1a]/10 pb-6">
              
              {/* Category selector row */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1a1a1a]/50 mr-4">Filter:</span>
                {['All', 'Electronics', 'Accessories', 'Wearables', 'Apparel'].map((cat) => (
                  <button
                    key={cat}
                    id={`filter-btn-${cat.toLowerCase()}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 text-xs font-medium tracking-wider transition-all duration-150 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#1a1a1a] text-[#f5f2ed]'
                        : 'bg-transparent text-[#1a1a1a]/75 hover:text-[#1a1a1a] border border-[#1a1a1a]/15 hover:border-[#1a1a1a]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Text Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-[#1a1a1a]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, specs or category..."
                  className="w-full pl-10 pr-4 py-2 border border-[#1a1a1a]/15 bg-transparent text-[#1a1a1a] text-xs focus:border-[#1a1a1a]/55 focus:outline-none placeholder-[#1a1a1a]/40"
                />
              </div>

            </div>

            {/* Catalog Loading Spinner */}
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-8 h-8 rounded-full border border-[#1a1a1a] border-t-transparent animate-spin" />
                <span className="text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-mono">Syncing Firestore Inventory...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="border border-[#1a1a1a]/10 bg-[#e5e1da]/10 rounded-none p-16 text-center text-[#1a1a1a]/60 max-w-md mx-auto">
                <Filter className="w-10 h-10 stroke-1 mx-auto text-[#1a1a1a]/30 mb-4" />
                <p className="text-sm font-serif italic mb-6">No curated objects match your filters.</p>
                <button
                  id="reset-filter-btn"
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="px-6 py-2.5 bg-[#1a1a1a] text-[#f5f2ed] uppercase tracking-widest text-[10px] font-bold hover:bg-[#1a1a1a]/90 transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Catalog Responsive Bento Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isAdmin={hasAdminPrivileges}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: MY PURCHASES */}
        {activeTab === 'orders' && user && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-[#1a1a1a]/10 pb-4">
              <h2 className="text-2xl font-serif italic text-[#1a1a1a]">Your Order History</h2>
              <p className="text-xs text-[#1a1a1a]/60 mt-1">Track shipping statuses, review receipt details, or request cancellations.</p>
            </div>

            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 rounded-full border border-[#1a1a1a] border-t-transparent animate-spin" />
                <span className="text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-mono">Loading order logs...</span>
              </div>
            ) : (
              <OrderHistory
                orders={orders}
                onCancelOrder={handleCancelOrder}
              />
            )}
          </div>
        )}

        {/* TAB 3: STORE COCKPIT (ADMIN PANEL) */}
        {activeTab === 'admin' && hasAdminPrivileges && (
          <div className="space-y-6">
            <AdminPanel
              products={products}
              orders={orders}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              token={token}
              simulateRole={simulateRole}
            />
          </div>
        )}

      </main>

      {/* Cart Slider Drawer Component Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
        user={user}
      />

      {/* Persistent Elegant Footer */}
      <footer className="mt-auto border-t border-[#1a1a1a]/10 py-8 bg-[#f5f2ed] text-xs text-[#1a1a1a]/50 font-sans px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="tracking-tight text-[#1a1a1a]/70">© 2026 Object & Form. All rights reserved. Powered by Cloud Firestore Enterprise.</p>
          <div className="flex items-center space-x-6">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 font-bold">Secure Access Verified</span>
            </span>
            <span className="text-[10px] italic font-serif text-[#1a1a1a]/60">Full-Stack Commerce Framework v1.0.4</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

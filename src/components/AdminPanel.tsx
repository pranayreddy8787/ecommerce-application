import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Package, 
  Plus, 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  Truck 
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onUpdateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  token: string | null;
  simulateRole: string;
}

interface Stats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  lowStockAlerts: number;
}

export default function AdminPanel({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  token,
  simulateRole,
}: AdminPanelProps) {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    lowStockAlerts: 0,
  });

  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders'>('stats');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form state
  const [prodForm, setProdForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Electronics',
    imageUrl: '',
    description: '',
  });

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (simulateRole) headers['X-Simulate-Role'] = simulateRole;

      const res = await fetch('/api/admin/stats', { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [products, orders, simulateRole, token]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.price || !prodForm.stock || !prodForm.imageUrl) {
      alert("Please fill in all required product fields.");
      return;
    }

    const payload = {
      name: prodForm.name,
      price: parseFloat(prodForm.price),
      stock: parseInt(prodForm.stock),
      category: prodForm.category,
      imageUrl: prodForm.imageUrl,
      description: prodForm.description,
    };

    if (editingProduct) {
      const success = await onUpdateProduct(editingProduct.id!, payload);
      if (success) {
        setEditingProduct(null);
        setShowProductForm(false);
        resetForm();
      }
    } else {
      const success = await onAddProduct(payload);
      if (success) {
        setShowProductForm(false);
        resetForm();
      }
    }
  };

  const handleEditClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      price: prod.price.toString(),
      stock: prod.stock.toString(),
      category: prod.category,
      imageUrl: prod.imageUrl,
      description: prod.description,
    });
    setShowProductForm(true);
  };

  const resetForm = () => {
    setProdForm({
      name: '',
      price: '',
      stock: '',
      category: 'Electronics',
      imageUrl: '',
      description: '',
    });
    setEditingProduct(null);
  };

  return (
    <div className="bg-[#f5f2ed] border border-[#1a1a1a]/10 rounded-none p-6 space-y-6 text-[#1a1a1a]">
      
      {/* Admin Cockpit Headers */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a]/10 pb-5 text-left">
        <div>
          <h2 className="text-2xl font-serif text-[#1a1a1a] tracking-tight">Store Manager Portal</h2>
          <p className="text-xs text-[#1a1a1a]/60 font-sans mt-0.5">Control live product inventories, fulfill customer orders, and view sales stats.</p>
        </div>
        
        {/* Toggle Sections Tabs */}
        <div className="flex items-center space-x-1 bg-[#e5e1da]/45 border border-[#1a1a1a]/10 rounded-none p-1">
          <button
            id="admin-tab-stats"
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#1a1a1a] text-[#f5f2ed]'
                : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
            }`}
          >
            Dashboard Stats
          </button>
          <button
            id="admin-tab-products"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#1a1a1a] text-[#f5f2ed]'
                : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
            }`}
          >
            Manage Catalog ({products.length})
          </button>
          <button
            id="admin-tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#1a1a1a] text-[#f5f2ed]'
                : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]'
            }`}
          >
            Orders Fulfillment ({orders.length})
          </button>
        </div>
      </div>

      {/* 1. STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-[#e5e1da]/20 border border-[#1a1a1a]/10 rounded-none p-5 flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-none bg-[#e5e1da] border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a]">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-[#1a1a1a]/45 font-bold uppercase tracking-widest block font-sans">Total Sales Revenue</span>
                <span className="text-xl font-extrabold text-[#1a1a1a] font-mono tracking-tight">${stats.totalSales.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#e5e1da]/20 border border-[#1a1a1a]/10 rounded-none p-5 flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-none bg-[#e5e1da] border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-[#1a1a1a]/45 font-bold uppercase tracking-widest block font-sans">Total Orders Logged</span>
                <span className="text-xl font-extrabold text-[#1a1a1a] font-mono tracking-tight">{stats.totalOrders}</span>
              </div>
            </div>

            <div className="bg-[#e5e1da]/20 border border-[#1a1a1a]/10 rounded-none p-5 flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-none bg-[#e5e1da] border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-[#1a1a1a]/45 font-bold uppercase tracking-widest block font-sans">Catalog Products</span>
                <span className="text-xl font-extrabold text-[#1a1a1a] font-mono tracking-tight">{stats.totalProducts}</span>
              </div>
            </div>

            <div className="bg-[#e5e1da]/20 border border-[#1a1a1a]/10 rounded-none p-5 flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-none bg-[#e5e1da] border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-[#1a1a1a]/45 font-bold uppercase tracking-widest block font-sans">Low Stock Warnings</span>
                <span className="text-xl font-extrabold text-[#1a1a1a] font-mono tracking-tight">{stats.lowStockAlerts}</span>
              </div>
            </div>

          </div>

          {/* Quick Analytics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-[#e5e1da]/15 border border-[#1a1a1a]/10 rounded-none p-5 space-y-3">
              <h3 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <TrendingUp className="w-4 h-4 text-[#1a1a1a]/60" />
                <span>Order Delivery Pipeline</span>
              </h3>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-[#e5e1da]/30 border border-[#1a1a1a]/10 rounded-none p-3 text-center">
                  <span className="text-[10px] text-[#1a1a1a]/60 font-sans">Pending</span>
                  <span className="text-lg font-bold text-[#1a1a1a] font-mono block mt-1">{stats.pendingOrders}</span>
                </div>
                <div className="bg-[#e5e1da]/30 border border-[#1a1a1a]/10 rounded-none p-3 text-center">
                  <span className="text-[10px] text-[#1a1a1a]/60 font-sans">Processing</span>
                  <span className="text-lg font-bold text-[#1a1a1a] font-mono block mt-1">{stats.processingOrders}</span>
                </div>
                <div className="bg-[#e5e1da]/30 border border-[#1a1a1a]/10 rounded-none p-3 text-center">
                  <span className="text-[10px] text-[#1a1a1a]/60 font-sans">Shipped</span>
                  <span className="text-lg font-bold text-[#1a1a1a] font-mono block mt-1">{stats.shippedOrders}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#e5e1da]/15 border border-[#1a1a1a]/10 rounded-none p-5 flex flex-col justify-center space-y-2">
              <h3 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest font-sans">Quick Status</h3>
              <p className="text-xs text-[#1a1a1a]/60 font-serif italic leading-relaxed">
                Database synchronization with Google Firestore is live. Low-stock alerts warn of items with stock less than 5. Uncancelled orders are included in total revenue calculations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-widest font-sans">Store Catalog</h3>
            <button
              id="add-product-btn"
              onClick={() => { resetForm(); setShowProductForm(!showProductForm); }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f5f2ed] font-sans font-bold text-[10px] uppercase tracking-widest rounded-none transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showProductForm ? 'Cancel' : 'Add New Product'}</span>
            </button>
          </div>

          {/* New / Edit Product Form */}
          {showProductForm && (
            <form onSubmit={handleProductSubmit} className="bg-[#e5e1da]/15 border border-[#1a1a1a]/10 rounded-none p-5 space-y-4 text-left animate-in fade-in duration-200">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a] font-sans">
                {editingProduct ? 'Modify Product Details' : 'Introduce New Product'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="e.g., Curved Monitor"
                    className="w-full px-3.5 py-2 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1">Category *</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Home">Home</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    placeholder="99.99"
                    className="w-full px-3.5 py-2 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                    placeholder="10"
                    className="w-full px-3.5 py-2 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 font-sans mb-1">Detailed Description</label>
                  <textarea
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Highlight features, warranty, specifications..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-none bg-[#e5e1da]/40 border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowProductForm(false); }}
                  className="px-4 py-2 rounded-none border border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:text-[#1a1a1a] text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#1a1a1a]/85 text-[#f5f2ed] rounded-none text-xs font-sans font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  {editingProduct ? 'Save Modifications' : 'Create Product'}
                </button>
              </div>
            </form>
          )}

          {/* Catalog items list */}
          <div className="bg-transparent border border-[#1a1a1a]/10 rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[#1a1a1a]/80 font-sans text-xs">
                <thead>
                  <tr className="bg-[#e5e1da] border-b border-[#1a1a1a]/10 text-[#1a1a1a]/70 uppercase text-[9px] tracking-widest">
                    <th className="p-4 font-bold">Image</th>
                    <th className="p-4 font-bold">Name / Category</th>
                    <th className="p-4 font-bold text-right">Price</th>
                    <th className="p-4 font-bold text-center">Stock</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]/5">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#e5e1da]/25 transition-colors">
                      <td className="p-4">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-none border border-[#1a1a1a]/10 bg-[#e5e1da]"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="p-4 text-left">
                        <div className="font-bold text-[#1a1a1a] text-xs uppercase tracking-wider">{prod.name}</div>
                        <div className="text-[#1a1a1a]/60 text-[10px] mt-0.5">{prod.category}</div>
                      </td>
                      <td className="p-4 text-right font-bold text-[#1a1a1a] text-xs font-mono">
                        ${prod.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider ${
                          prod.stock === 0 
                            ? 'bg-rose-500/10 text-rose-800 border border-rose-500/25' 
                            : prod.stock < 5 
                            ? 'bg-amber-500/10 text-amber-800 border border-amber-500/25' 
                            : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25'
                        }`}>
                          {prod.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`admin-edit-prod-${prod.id}`}
                            onClick={() => handleEditClick(prod)}
                            className="px-2.5 py-1.5 rounded-none border border-[#1a1a1a]/15 text-[#1a1a1a]/80 hover:text-[#1a1a1a] hover:bg-[#e5e1da]/40 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            id={`admin-delete-prod-${prod.id}`}
                            onClick={() => { if (confirm("Delete this product permanently?")) onDeleteProduct(prod.id!); }}
                            className="p-1.5 rounded-none border border-rose-500/10 text-rose-800 hover:text-rose-900 hover:bg-rose-500/25 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-widest font-sans text-left">Incoming Purchase Orders</h3>

          {orders.length === 0 ? (
            <div className="bg-[#e5e1da]/15 border border-[#1a1a1a]/10 rounded-none p-8 text-center text-[#1a1a1a]/50 font-serif italic">
              No orders logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const orderDateString = new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={order.id} className="bg-[#e5e1da]/25 border border-[#1a1a1a]/10 rounded-none p-5 space-y-4 text-left">
                    
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a]/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider font-sans">Order ID: {order.id}</span>
                          <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest ${
                            order.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25'
                              : order.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-800 border border-rose-500/25'
                              : order.status === 'shipped'
                              ? 'bg-blue-500/10 text-blue-800 border border-blue-500/25'
                              : 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#1a1a1a]/60 font-sans mt-0.5">Placed on {orderDateString}</div>
                      </div>

                      {/* Status fulfillment dropdown */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#1a1a1a]/50 font-sans">Set Status:</span>
                        <select
                          id={`status-select-${order.id}`}
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id!, e.target.value)}
                          className="px-3 py-1.5 rounded-none bg-[#e5e1da] border border-[#1a1a1a]/15 text-[#1a1a1a] font-sans text-xs focus:border-[#1a1a1a] focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      
                      {/* Products and quantities list */}
                      <div className="space-y-1.5 border-r border-[#1a1a1a]/10 pr-4">
                        <span className="text-[9px] text-[#1a1a1a]/40 font-bold uppercase tracking-widest">Ordered Products</span>
                        <div className="space-y-1 mt-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[#1a1a1a]/80">
                              <span>{item.name} <span className="text-[#1a1a1a]/40 font-mono">x{item.quantity}</span></span>
                              <span className="font-bold text-[#1a1a1a]/90 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-[#1a1a1a] border-t border-[#1a1a1a]/10 pt-2 mt-2 font-mono">
                          <span>Paid Amount</span>
                          <span>${order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Shipping info */}
                      <div>
                        <span className="text-[9px] text-[#1a1a1a]/40 font-bold uppercase tracking-widest block mb-1">Shipping Destination</span>
                        <div className="space-y-0.5 text-[#1a1a1a]/80 font-serif">
                          <p className="font-bold text-[#1a1a1a]">{order.shippingAddress.name}</p>
                          <p className="italic">{order.shippingAddress.address}</p>
                          <p className="italic">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                          <p className="uppercase text-[9px] font-sans font-bold text-[#1a1a1a]/50 tracking-wider mt-1">{order.shippingAddress.country}</p>
                        </div>
                        <div className="mt-2.5 pt-1.5 border-t border-[#1a1a1a]/10 text-[#1a1a1a]/40 text-[10px] font-mono">
                          Customer: {order.userEmail}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

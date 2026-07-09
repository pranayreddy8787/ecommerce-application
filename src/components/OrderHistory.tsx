import React from 'react';
import { Order } from '../types';
import { AlertCircle, Calendar, CheckCircle2, ClipboardList, Package, Truck, XCircle } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => Promise<boolean>;
}

export default function OrderHistory({ orders, onCancelOrder }: OrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-[#e5e1da]/10 border border-[#1a1a1a]/10 rounded-none p-8 text-center space-y-4">
        <ClipboardList className="w-10 h-10 text-[#1a1a1a]/40 mx-auto stroke-1" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/70 font-sans">No Order Records</h3>
        <p className="text-xs text-[#1a1a1a]/50 font-serif italic max-w-xs mx-auto">
          Your account has not submitted any purchase orders yet. Complete a checkout to start tracking deliveries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const isPending = order.status === 'pending';

        return (
          <div
            key={order.id}
            id={`order-card-${order.id}`}
            className="bg-[#e5e1da]/15 border border-[#1a1a1a]/10 rounded-none p-5 hover:border-[#1a1a1a]/30 transition-colors space-y-4 text-[#1a1a1a]"
          >
            {/* Order Top Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a]/10 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-none bg-[#e5e1da]/45 border border-[#1a1a1a]/10 flex items-center justify-center text-[#1a1a1a]/70">
                  <Package className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider font-sans">
                    Order ID: {order.id}
                  </h4>
                  <p className="text-[10px] text-[#1a1a1a]/60 font-sans flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-[#1a1a1a]/40" />
                    <span>Placed on {orderDate}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-[9px] font-bold font-sans uppercase tracking-widest ${
                  order.status === 'delivered'
                    ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25'
                    : order.status === 'cancelled'
                    ? 'bg-rose-500/10 text-rose-800 border border-rose-500/25'
                    : order.status === 'shipped'
                    ? 'bg-blue-500/10 text-blue-800 border border-blue-500/25'
                    : 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
                }`}>
                  {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                  {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                  {order.status === 'shipped' && <Truck className="w-3 h-3" />}
                  {order.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                  <span>{order.status}</span>
                </span>
                
                {isPending && (
                  <button
                    id={`cancel-order-btn-${order.id}`}
                    onClick={() => { if(confirm("Are you sure you want to cancel this order?")) onCancelOrder(order.id!); }}
                    className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider font-sans bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 border border-rose-500/20 rounded-none transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Order Items & Shipping split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans text-left">
              
              {/* Items Panel */}
              <div className="space-y-2 border-r border-[#1a1a1a]/10 pr-4">
                <span className="text-[9px] text-[#1a1a1a]/40 font-bold uppercase tracking-widest block">Cart Contents</span>
                <div className="space-y-1.5 mt-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[#1a1a1a]/80">
                      <span>{item.name} <span className="text-[#1a1a1a]/40 font-mono">x{item.quantity}</span></span>
                      <span className="font-bold text-[#1a1a1a]/90 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-[#1a1a1a] border-t border-[#1a1a1a]/10 pt-2.5 mt-2.5 font-mono">
                  <span>Grand Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping info */}
              <div className="space-y-2">
                <span className="text-[9px] text-[#1a1a1a]/40 font-bold uppercase tracking-widest block">Delivery Destination</span>
                <div className="space-y-1 text-[#1a1a1a]/80 mt-2 font-serif">
                  <p className="font-bold text-[#1a1a1a]">{order.shippingAddress.name}</p>
                  <p className="italic">{order.shippingAddress.address}</p>
                  <p className="italic">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                  <p className="uppercase text-[9px] font-bold font-sans text-[#1a1a1a]/50 tracking-wider mt-1">{order.shippingAddress.country}</p>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

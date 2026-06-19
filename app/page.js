'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Hourglass, CheckCircle2, AlertTriangle, Eye, X } from 'lucide-react';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, pending: 0, delivered: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    
    // 1. Fetch Orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Fetch Low Stock Count
    const { data: productsData } = await supabase
      .from('products')
      .select('stock')
      .lte('stock', 3);

    if (!ordersError && ordersData) {
      setOrders(ordersData);
      
      // Calculate Stats
      const deliveredOrders = ordersData.filter(o => o.order_status === 'Delivered');
      const totalSales = deliveredOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);
      const pendingCount = ordersData.filter(o => o.order_status === 'Pending').length;

      setStats({
        totalSales,
        pending: pendingCount,
        delivered: deliveredOrders.length,
        lowStock: productsData ? productsData.length : 0
      });
    }
    setLoading(false);
  }

  // Change Order Status
  const handleStatusChange = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId);

    if (!error) {
      // Refresh local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
      fetchDashboardData(); // Recalculate stats
    } else {
      alert('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
    }
  };

  // View Order Details
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setModalLoading(true);
    
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', order.id);

    if (!error && data) {
      setOrderItems(data);
    }
    setModalLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">অ্যাডমিন ড্যাশবোর্ড</h1>
        <p className="text-xs text-gray-500">ল্যামিয়া ইলেকট্রনিক্স এন্ড আইপিএস-এর বর্তমান অবস্থা</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase">মোট বিক্রি</p>
            <h3 className="text-2xl font-bold text-brandBlue">৳{stats.totalSales.toLocaleString()}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-brandBlue"><ShoppingBag size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase">পেন্ডিং অর্ডার</p>
            <h3 className="text-2xl font-bold text-amber-600">{stats.pending} টি</h3>
          </div>
          <div className="bg-amber-50 p-3 rounded-full text-amber-600"><Hourglass size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase">ডেলিভারড অর্ডার</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.delivered} টি</h3>
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600"><CheckCircle2 size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase">লো-স্টক প্রোডাক্ট</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.lowStock} টি</h3>
          </div>
          <div className="bg-red-50 p-3 rounded-full text-red-600"><AlertTriangle size={24} /></div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">কাস্টমারদের অর্ডার তালিকা</h3>
          <span className="text-xs font-bold text-brandBlue bg-blue-50 px-3 py-1.5 rounded-full">সর্বমোট: {orders.length}</span>
        </div>

        {loading ? (
          <div className="p-10 text-center font-semibold text-gray-400">লোডিং হচ্ছে...</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-500 font-bold border-b">
                  <th className="px-6 py-3.5">অর্ডার আইডি</th>
                  <th className="px-6 py-3.5">ক্রেতার নাম ও ঠিকানা</th>
                  <th className="px-6 py-3.5">মোবাইল</th>
                  <th className="px-6 py-3.5">মোট মূল্য</th>
                  <th className="px-6 py-3.5">স্ট্যাটাস</th>
                  <th className="px-6 py-3.5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-brandBlue">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{order.customer_name}</div>
                      <div className="text-xs text-gray-400 line-clamp-1 max-w-xs">{order.shipping_address}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">{order.phone}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">৳{Number(order.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none ${
                          order.order_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          order.order_status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.order_status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          order.order_status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        <option value="Pending">পেন্ডিং (Pending)</option>
                        <option value="Processing">প্রসেসিং (Processing)</option>
                        <option value="Shipped">পাঠানো হয়েছে (Shipped)</option>
                        <option value="Delivered">ডেলিভার্ড (Delivered)</option>
                        <option value="Cancelled">বাতিল (Cancelled)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-2 text-brandBlue bg-blue-50 hover:bg-brandBlue hover:text-white rounded-lg transition-all inline-flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Eye size={14} /> বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 font-semibold">কোনো অর্ডার পাওয়া যায়নি!</div>
        )}
      </div>

      {/* Order Items Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-800">অর্ডার বিস্তারিত: #{selectedOrder.id}</h3>
                <p className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleDateString('bn-BD')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-1 bg-gray-50 p-3 rounded-lg text-sm border">
                <p><strong>নাম:</strong> {selectedOrder.customer_name}</p>
                <p><strong>মোবাইল:</strong> {selectedOrder.phone}</p>
                <p><strong>ঠিকানা:</strong> {selectedOrder.shipping_address}</p>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-600">পণ্যসমূহের তালিকা:</h4>
                {modalLoading ? (
                  <p className="text-center py-4 font-semibold text-gray-400">পণ্য লোড হচ্ছে...</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2 text-sm">
                        <div className="max-w-xs">
                          <p className="font-bold text-gray-800 line-clamp-1">{item.products?.name || 'অজানা প্রোডাক্ট'}</p>
                          <p className="text-xs text-gray-400">{item.quantity} টি x ৳{Number(item.price).toLocaleString()}</p>
                        </div>
                        <span className="font-bold text-brandBlue">৳{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="border-t pt-4 flex justify-between font-bold text-base text-gray-800">
                <span>সর্বমোট মূল্য:</span>
                <span className="text-brandBlue">৳{Number(selectedOrder.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

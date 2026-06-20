'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Hourglass, CheckCircle2, AlertTriangle, Eye, X, Calendar, DollarSign, ListTodo } from 'lucide-react';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Analytics Filter States
  const [filterType, setFilterType] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    
    // 1. Fetch All Orders
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
      setLowStockCount(productsData ? productsData.length : 0);
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
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
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

  // ========================================================
  // ANALYTICS CALCULATION LOGIC (Client-side timezone-safe)
  // ========================================================
  const getFilteredOrders = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);

      if (filterType === 'daily') {
        return orderDate >= todayStart;
      }

      if (filterType === 'weekly') {
        const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }

      if (filterType === 'monthly') {
        const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }

      if (filterType === 'custom') {
        if (!startDate || !endDate) return true; // Show all if dates not picked yet
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of selected day
        return orderDate >= start && orderDate <= end;
      }

      return true;
    });
  };

  // Calculate filtered stats
  const filteredOrders = getFilteredOrders();
  const totalOrdersCount = filteredOrders.length;
  
  // Total Revenue (Delivered Orders Only)
  const deliveredOrders = filteredOrders.filter(o => o.order_status === 'Delivered');
  const revenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Pending Count
  const pendingCount = filteredOrders.filter(o => o.order_status === 'Pending').length;

  // Average Order Value (AOV)
  const avgOrderValue = totalOrdersCount > 0 
    ? Math.round(filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0) / totalOrdersCount) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-xs text-gray-500">ল্যামিয়া ইলেকট্রনিক্স এন্ড আইপিএস-এর ব্যবসায়িক চিত্র</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-100 font-bold px-4 py-2 rounded-lg">
          <AlertTriangle size={14} />
          <span>লো-স্টক প্রোডাক্ট: {lowStockCount} টি</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SALES ANALYTICS CONTROL PANEL */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="text-brandBlue" size={20} />
            <h3 className="font-bold text-gray-800">বিক্রয় ও আয় বিশ্লেষণ (Sales Analytics)</h3>
          </div>

          {/* Filter Tabs */}
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1 w-full md:w-auto">
            {[
              { id: 'daily', name: 'আজকের (Daily)' },
              { id: 'weekly', name: 'সাপ্তাহিক (Weekly)' },
              { id: 'monthly', name: 'মাসিক (Monthly)' },
              { id: 'custom', name: 'নির্দিষ্ট তারিখ (Custom)' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  filterType === tab.id
                    ? 'bg-brandBlue text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Picker Fields */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">শুরুর তারিখ (Start Date)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-white text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">শেষের তারিখ (End Date)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-white text-gray-700"
              />
            </div>
          </div>
        )}

        {/* Dynamic Analytics Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Revenue */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100/50 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">সর্বমোট আয় (ডেলিভার্ড)</p>
              <h4 className="text-xl font-extrabold text-brandBlue">৳{revenue.toLocaleString()}</h4>
            </div>
            <div className="bg-brandBlue text-white p-2.5 rounded-full"><DollarSign size={20} /></div>
          </div>

          {/* Total Orders */}
          <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/50 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মোট অর্ডার সংখ্যা</p>
              <h4 className="text-xl font-extrabold text-indigo-700">{totalOrdersCount} টি</h4>
            </div>
            <div className="bg-indigo-600 text-white p-2.5 rounded-full"><ShoppingBag size={20} /></div>
          </div>

          {/* Average Order Value */}
          <div className="bg-green-50/50 p-5 rounded-xl border border-green-100/50 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">গড় অর্ডার মূল্য (AOV)</p>
              <h4 className="text-xl font-extrabold text-green-700">৳{avgOrderValue.toLocaleString()}</h4>
            </div>
            <div className="bg-green-600 text-white p-2.5 rounded-full"><CheckCircle2 size={20} /></div>
          </div>

          {/* Pending Count */}
          <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100/50 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">পেন্ডিং প্রসেসিং</p>
              <h4 className="text-xl font-extrabold text-amber-700">{pendingCount} টি</h4>
            </div>
            <div className="bg-amber-500 text-white p-2.5 rounded-full"><Hourglass size={20} /></div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILTERED ORDERS TABLE */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50 select-none">
          <div className="flex items-center gap-1.5">
            <ListTodo size={18} className="text-brandBlue" />
            <h3 className="font-bold text-gray-800">অর্ডার তালিকা (ফিল্টার্ড)</h3>
          </div>
          <span className="text-xs font-bold text-brandBlue bg-blue-50 px-3 py-1.5 rounded-full">
            অর্ডার সংখ্যা: {filteredOrders.length} টি
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center font-semibold text-gray-400">লোডিং হচ্ছে...</div>
        ) : filteredOrders.length > 0 ? (
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
                {filteredOrders.map((order) => (
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
          <div className="p-12 text-center text-gray-400 font-semibold">নির্বাচিত সময়ের কোনো অর্ডার পাওয়া যায়নি!</div>
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

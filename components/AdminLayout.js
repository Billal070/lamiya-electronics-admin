'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, FolderOpen, Award, Package, LogOut, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। শুধুমাত্র অনুমোদিত অ্যাডমিন লগইন করতে পারবেন।');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-gray-500 bg-gray-50">লোডিং হচ্ছে...</div>;
  }

  // If not logged in, show Admin Login page
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto bg-brandBlue p-3 rounded-full text-brandOrange w-14 h-14 flex items-center justify-center shadow-sm">
              <Zap size={28} fill="#FBB13A" />
            </div>
            <h1 className="text-2xl font-bold text-brandBlue">Lamiya Electronics</h1>
            <p className="text-[10px] uppercase font-bold text-brandOrange tracking-wider">অ্যাডমিন কন্ট্রোল সেন্টার</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 border border-red-100 text-xs p-3 rounded-lg text-center font-semibold">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">অ্যাডমিন ইমেইল</label>
              <input
                type="email"
                required
                placeholder="admin@lamiya.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-brandBlue text-white font-bold rounded-xl hover:bg-opacity-95 transition-all text-sm flex items-center justify-center gap-2 shadow"
            >
              <Lock size={16} />
              লগইন করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'ড্যাশবোর্ড ও অর্ডার', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'ক্যাটাগরি', path: '/categories', icon: <FolderOpen size={18} /> },
    { name: 'ব্র্যান্ড', path: '/brands', icon: <Award size={18} /> },
    { name: 'প্রোডাক্টস', path: '/products', icon: <Package size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-brandBlue text-white flex flex-col shrink-0 border-r border-blue-900 shadow-md">
        <div className="p-6 border-b border-blue-900 flex items-center gap-2">
          <div className="bg-brandOrange p-1.5 rounded-full text-brandBlue">
            <Zap size={18} fill="#2D4087" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-none">LAMIYA ADMIN</h2>
            <span className="text-[9px] text-brandOrange font-bold uppercase tracking-wider">Control Panel</span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                pathname === item.path
                  ? 'bg-brandOrange text-brandBlue shadow font-bold'
                  : 'hover:bg-blue-900 hover:text-white text-gray-300'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-950 hover:bg-red-900 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-all"
          >
            <LogOut size={16} />
            লগআউট
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus, Award } from 'lucide-react';

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setFetchLoading(true);
    const { data, error } = await supabase.from('brands').select('*').order('name', { ascending: true });
    if (!error && data) {
      setBrands(data);
    }
    setFetchLoading(false);
  }

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    let logoUrl = '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('lamiya-electronics')
        .upload(`brands/${fileName}`, file);

      if (error) {
        alert('লোগো আপলোড করতে সমস্যা হয়েছে: ' + error.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('lamiya-electronics')
        .getPublicUrl(`brands/${fileName}`);

      logoUrl = publicUrl;
    }

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { error: dbError } = await supabase
      .from('brands')
      .insert({ name, slug, logo_url: logoUrl });

    if (!dbError) {
      setName('');
      setFile(null);
      fetchBrands();
    } else {
      alert('ব্র্যান্ড যুক্ত করতে সমস্যা হয়েছে: ' + dbError.message);
    }
    setLoading(false);
  };

  const handleDeleteBrand = async (id, logoUrl) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই ব্র্যান্ডটি ডিলিট করতে চান?')) return;

    if (logoUrl) {
      const path = logoUrl.split('/public/lamiya-electronics/')[1];
      if (path) {
        await supabase.storage.from('lamiya-electronics').remove([path]);
      }
    }

    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (!error) {
      setBrands(prev => prev.filter(b => b.id !== id));
    } else {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ব্র্যান্ড ম্যানেজমেন্ট</h1>
        <p className="text-xs text-gray-500">আপনার ব্র্যান্ড ও লোগো সমূহের তালিকা তৈরি করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Brand Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">নতুন ব্র্যান্ড যুক্ত করুন</h3>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ব্র্যান্ডের নাম (যেমন: Luminous)</label>
              <input
                type="text"
                required
                placeholder="নাম লিখুন..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ব্র্যান্ড লোগো (ঐচ্ছিক)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full border rounded-lg px-3 py-2 text-xs bg-gray-50 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brandBlue hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brandBlue text-white font-bold rounded-lg hover:bg-opacity-95 transition-all text-xs flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {loading ? 'সংরক্ষণ হচ্ছে...' : 'ব্র্যান্ড যোগ করুন'}
            </button>
          </form>
        </div>

        {/* Brands List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">ব্র্যান্ড তালিকা</h3>
          </div>

          {fetchLoading ? (
            <div className="p-10 text-center text-gray-400 font-semibold">লোড হচ্ছে...</div>
          ) : brands.length > 0 ? (
            <div className="divide-y">
              {brands.map((brand) => (
                <div key={brand.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt="" className="w-12 h-12 rounded-lg border object-contain bg-gray-50" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Award size={18} /></div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{brand.name}</h4>
                      <p className="text-xs text-gray-400">Slug: {brand.slug}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBrand(brand.id, brand.logo_url)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 font-semibold">কোনো ব্র্যান্ড তৈরি করা হয়নি।</div>
          )}
        </div>
      </div>
    </div>
  );
}

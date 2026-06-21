'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus, Image as ImageIcon, Sparkles, X, Star } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [files, setFiles] = useState([]);
  
  // Specs: Array of Key-Value
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);

  // Fake Review States (অ্যাডমিনদের জন্য কাস্টম রিভিউ ফিচার)
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [fakeUserName, setFakeUserName] = useState('');
  const [fakeRating, setFakeRating] = useState(5);
  const [fakeComment, setFakeComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setFetchLoading(true);
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    if (catData) setCategories(catData);

    const { data: brandData } = await supabase.from('brands').select('*').order('name');
    if (brandData) setBrands(brandData);

    const { data: prodData } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    if (prodData) setProducts(prodData);
    
    setFetchLoading(false);
  }

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, val) => {
    const updated = specs.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    setSpecs(updated);
  };

  // Submit Product Form
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock) return;
    setLoading(true);

    let imageUrls = [];

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('lamiya-electronics')
          .upload(`products/${fileName}`, file);

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('lamiya-electronics')
            .getPublicUrl(`products/${fileName}`);
          imageUrls.push(publicUrl);
        }
      }
    }

    const specificationsObj = {};
    specs.forEach((s) => {
      if (s.key && s.value) {
        specificationsObj[s.key] = s.value;
      }
    });

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { error } = await supabase.from('products').insert({
      name,
      slug,
      description,
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : 0,
      stock: Number(stock),
      category_id: selectedCat ? Number(selectedCat) : null,
      brand_id: selectedBrand ? Number(selectedBrand) : null,
      images: imageUrls,
      specifications: specificationsObj
    });

    if (!error) {
      setName('');
      setDescription('');
      setPrice('');
      setDiscountPrice('');
      setStock('');
      setSelectedCat('');
      setSelectedBrand('');
      setFiles([]);
      setSpecs([{ key: '', value: '' }]);
      setShowForm(false);
      fetchData();
    } else {
      alert('প্রোডাক্ট যুক্ত করতে ত্রুটি ঘটেছে: ' + error.message);
    }
    setLoading(false);
  };

  // Submit Fake Review from Admin Panel
  const handleAddFakeReview = async (e) => {
    e.preventDefault();
    if (!selectedProductForReview || !fakeComment) return;
    setReviewSubmitting(true);

    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: selectedProductForReview.id,
        user_name: fakeUserName || 'Anonymous Customer',
        rating: Number(fakeRating),
        comment: fakeComment
      });

    if (!error) {
      setFakeUserName('');
      setFakeComment('');
      setFakeRating(5);
      setSelectedProductForReview(null);
      alert('রিভিউ সফলভাবে যুক্ত হয়েছে এবং রেটিং আপডেট হয়েছে!');
    } else {
      alert('রিভিউ যুক্ত করতে সমস্যা হয়েছে: ' + error.message);
    }
    setReviewSubmitting(false);
  };

  const handleDeleteProduct = async (id, images) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি ডিলিট করতে চান?')) return;

    if (images && images.length > 0) {
      const paths = images.map(imgUrl => imgUrl.split('/public/lamiya-electronics/')[1]).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('lamiya-electronics').remove(paths);
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="text-xs text-gray-500">ল্যামিয়া ইলেকট্রনিক্স-এর সামগ্রিক পণ্য ও কাস্টম রিভিউ ম্যানেজ করুন</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brandBlue text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition-all shadow"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'প্যানেল বন্ধ করুন' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-gray-800 border-b pb-2">নতুন পণ্যের বিবরণ দিন</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">পণ্যের নাম</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">স্টক পরিমাণ</label>
              <input
                type="number"
                required
                placeholder="যেমন: ১০"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">আসল মূল্য (৳)</label>
              <input
                type="number"
                required
                placeholder="যেমন: ১৫০০০"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ছাড় মূল্য (৳ - ঐচ্ছিক)</label>
              <input
                type="number"
                placeholder="যেমন: ১৩৯৯৯"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ক্যাটাগরি সিলেক্ট করুন</label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              >
                <option value="">সিলেক্ট করুন...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ব্র্যান্ড সিলেক্ট করুন</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              >
                <option value="">সিলেক্ট করুন...</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">পণ্যের ছবি সিলেক্ট করুন</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="w-full border rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brandBlue hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">পণ্যের বিবরণ (Description)</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
            />
          </div>

          {/* Specs Builder */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-gray-700 flex items-center gap-1.5"><Sparkles size={16} /> প্রোডাক্ট স্পেসিফিকেশন</h4>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-brandBlue font-bold text-xs rounded-lg transition-colors"
              >
                + রো যোগ করুন
              </button>
            </div>

            <div className="space-y-2">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="বৈশিষ্ট্যের নাম"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="w-1/2 border rounded-lg px-4 py-2 text-xs focus:outline-none bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="মান"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="w-1/2 border rounded-lg px-4 py-2 text-xs focus:outline-none bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecRow(idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brandBlue text-white font-extrabold rounded-lg hover:bg-opacity-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            {loading ? 'প্রোডাক্ট আপলোড হচ্ছে...' : 'প্রোডাক্ট যোগ করুন'}
          </button>
        </form>
      )}

      {/* Products Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">সমস্ত প্রোডাক্টের তালিকা</h3>
          <span className="text-xs font-bold text-brandBlue bg-blue-50 px-3 py-1.5 rounded-full">মোট প্রোডাক্ট: {products.length}</span>
        </div>

        {fetchLoading ? (
          <div className="p-10 text-center text-gray-400 font-semibold">লোড হচ্ছে...</div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-500 font-bold border-b">
                  <th className="px-6 py-3.5">ছবি ও নাম</th>
                  <th className="px-6 py-3.5">মূল্য</th>
                  <th className="px-6 py-3.5">স্টক</th>
                  <th className="px-6 py-3.5">ক্যাটাগরি</th>
                  <th className="px-6 py-3.5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg border object-contain bg-gray-50" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><ImageIcon size={18} /></div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1 max-w-xs">{p.name}</h4>
                        <p className="text-[10px] text-gray-400">ID: {p.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.discount_price && p.discount_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-brandBlue">৳{p.discount_price.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 line-through">৳{p.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-brandBlue">৳{p.price.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">{p.stock} টি</td>
                    <td className="px-6 py-4 font-semibold text-gray-500 text-xs">{p.categories?.name || 'Electronics'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* কাস্টম রিভিউ যোগ করার বাটন */}
                        <button
                          onClick={() => setSelectedProductForReview(p)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                        >
                          <Star size={13} fill="currentColor" /> রিভিউ
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.images)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400 font-semibold">কোনো প্রোডাক্ট পাওয়া যায়নি।</div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FAKE REVIEW CREATION MODAL WINDOW */}
      {/* ======================================================== */}
      {selectedProductForReview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-800">রিভিউ যোগ করুন:</h3>
                <p className="text-xs text-gray-400 line-clamp-1 max-w-[250px]">{selectedProductForReview.name}</p>
              </div>
              <button 
                onClick={() => setSelectedProductForReview(null)} 
                className="p-1.5 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFakeReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">রিভিউয়ারের নাম (বসালে সেটিই শো করবে)</label>
                <input
                  type="text"
                  placeholder="যেমন: আরিফ রহমান, সুমি আক্তার"
                  value={fakeUserName}
                  onChange={(e) => setFakeUserName(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">রেটিং সিলেক্ট করুন (Star Rating)</label>
                <select
                  value={fakeRating}
                  onChange={(e) => setFakeRating(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brandBlue bg-gray-50 text-gray-700"
                >
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4 Stars)</option>
                  <option value="3">★★★☆☆ (3 Stars)</option>
                  <option value="2">★★☆☆☆ (2 Stars)</option>
                  <option value="1">★☆☆☆☆ (1 Star)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">রিভিউ কমেন্ট / মন্তব্য</label>
                <textarea
                  rows="3"
                  required
                  placeholder="যেমন: খুবই ভালো প্রোডাক্ট, ব্যাকআপ অনেক ভালো দিচ্ছে..."
                  value={fakeComment}
                  onChange={(e) => setFakeComment(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-3 bg-brandBlue text-white font-bold rounded-xl hover:bg-opacity-95 transition-all text-xs flex items-center justify-center gap-2 shadow"
              >
                <Star size={14} fill="currentColor" />
                {reviewSubmitting ? 'সেভ হচ্ছে...' : 'রিভিউ সংরক্ষণ করুন'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

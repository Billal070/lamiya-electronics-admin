'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SlidersHorizontal, Save, Phone, Mail, MapPin, Globe } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Form states
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [addressBn, setAddressBn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descBn, setDescBn] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setFetchLoading(true);
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setPhone(data.phone);
      setEmail(data.email);
      setAddressEn(data.address_en);
      setAddressBn(data.address_bn);
      setDescEn(data.footer_desc_en);
      setDescBn(data.footer_desc_bn);
      setFacebook(data.facebook_url);
      setYoutube(data.youtube_url);
    }
    setFetchLoading(false);
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('settings')
      .update({
        phone,
        email,
        address_en: addressEn,
        address_bn: addressBn,
        footer_desc_en: descEn,
        footer_desc_bn: descBn,
        facebook_url: facebook,
        youtube_url: youtube
      })
      .eq('id', 1);

    if (!error) {
      alert('সেটিংস সফলভাবে আপডেট করা হয়েছে!');
    } else {
      alert('সেটিংস আপডেট করতে সমস্যা হয়েছে: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal className="text-brandBlue" />
          ওয়েবসাইট কন্টাক্ট ও ফুটার সেটিংস
        </h1>
        <p className="text-xs text-gray-500">ইউজার ওয়েবসাইটের ফুটার ডেসক্রিপশন এবং যোগাযোগের তথ্য এখান থেকে নিয়ন্ত্রণ করুন</p>
      </div>

      {fetchLoading ? (
        <div className="p-10 text-center text-gray-400 font-semibold">লোড হচ্ছে...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-gray-800 border-b pb-2">সেটিংস কাস্টমাইজ করুন</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <Phone size={14} /> মোবাইল নম্বর
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <Mail size={14} /> ইমেইল ঠিকানা
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <MapPin size={14} /> ঠিকানা (ENGLISH)
              </label>
              <input
                type="text"
                required
                value={addressEn}
                onChange={(e) => setAddressEn(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <MapPin size={14} /> ঠিকানা (BANGLA)
              </label>
              <input
                type="text"
                required
                value={addressBn}
                onChange={(e) => setAddressBn(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ফুটার ডেসক্রিপশন (ENGLISH)</label>
              <textarea
                rows="3"
                required
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ফুটার ডেসক্রিপশন (BANGLA)</label>
              <textarea
                rows="3"
                required
                value={descBn}
                onChange={(e) => setDescBn(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <Globe size={14} /> ফেসবুক লিঙ্ক
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <Globe size={14} /> ইউটিউব লিঙ্ক
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brandBlue bg-gray-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brandBlue text-white font-bold rounded-lg hover:bg-opacity-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}
          </button>
        </form>
      )}
    </div>
  );
}

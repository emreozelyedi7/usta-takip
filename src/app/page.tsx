"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", aciklama: "" });

  useEffect(() => {
    verileriGetir();
  }, [seciliGun, seciliAy, seciliYil]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    const { data } = await supabase.from('teklifler').select('*').eq('is_tarihi', formatliTarih).order('created_at', { ascending: false });
    if (data) setTeklifler(data);
    setYukleniyor(false);
  };

  const ayinGunleriniGetir = () => {
    const gunSayisi = new Date(seciliYil, seciliAy + 1, 0).getDate();
    return Array.from({ length: gunSayisi }, (_, i) => i + 1);
  };

  const isKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    const { error } = await supabase.from('teklifler').insert([{ ...yeniIs, is_tarihi: formatliTarih, fiyat: yeniIs.fiyat + " ₺", durum: 'beklemede', uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false } }]);
    if (!error) { verileriGetir(); setIsModalOpen(false); setYeniIs({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", aciklama: "" }); }
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen antialiased text-slate-900 overflow-x-hidden selection:bg-blue-100">
      
      {/* BAŞLIK ALANI */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100">
        <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] mb-1">USTA CAM BALKON</p>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase">Usta Takip</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white w-10 h-10 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center text-xl">+</button>
        </div>
        
        <div className="flex gap-2 mb-4">
          <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none border-none">
            {yillar.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none border-none">
            {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
        </div>

        {/* GÜN SEÇİCİ */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {ayinGunleriniGetir().map(gun => (
            <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-10 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400 active:bg-slate-200'}`}>
              <span className="text-[10px] font-black">{gun}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 px-6 flex justify-between items-center bg-slate-50">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{seciliGun} {aylar[seciliAy]} Verileri</h2>
        <span className="text-[10px] font-bold text-slate-300">{teklifler.length} Kayıt</span>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {teklifler.length === 0 && !yukleniyor && (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Kayıt Bulunmuyor</p>
            </div>
        )}
        
        {teklifler.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden transition-all active:scale-[0.98]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-lg leading-none mb-1 text-slate-800">{t.musteri}</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.is_modeli} — {t.ilce}</p>
              </div>
              <div className="text-right text-sm font-black text-slate-900">{t.fiyat}</div>
            </div>

            <div className="flex gap-2 items-center pt-4 border-t border-slate-50">
                <span className="text-[8px] font-black text-slate-300 uppercase">DURUM:</span>
                <select 
                  value={t.durum} 
                  onChange={(e) => durumGuncelle(t.id, e.target.value)}
                  className={`flex-1 text-[9px] font-black uppercase py-2.5 px-3 rounded-xl border-none outline-none appearance-none text-center ${
                    t.durum === 'onaylandi' ? 'bg-emerald-50 text-emerald-600' : 
                    t.durum === 'iptal' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <option value="beklemede">BEKLEMEDE ⏳</option>
                  <option value="onaylandi">ONAYLANDI ✅</option>
                  <option value="iptal">İPTAL ❌</option>
                </select>
            </div>
          </div>
        ))}
      </div>

      {/* YENİ KAYIT MODALI (KLAVYE DOSTU) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl mb-4 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-black text-slate-900 mb-6 text-center uppercase tracking-tighter">Yeni Teklif Ekle</h3>
            <form onSubmit={isKaydet} className="space-y-4">
              <input required className="w-full bg-slate-100 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              
              <select required className="w-full bg-slate-100 p-4 rounded-2xl text-xs font-bold outline-none border-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modeli Seçin...</option>
                <option value="Cam Balkon">Cam Balkon</option>
                <option value="Sürme Sistem">Sürme Sistem</option>
                <option value="Giyotin">Giyotin</option>
                <option value="Teras Kapama">Teras Kapama</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full bg-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 border-2 border-transparent" placeholder="Fiyat (₺)" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 border-2 border-transparent" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">KAYDI TAMAMLA</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-[10px] font-black uppercase py-2">İptal Et</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
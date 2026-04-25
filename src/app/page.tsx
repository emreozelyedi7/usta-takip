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
  const [aktifSekme, setAktifSekme] = useState('teklifler'); // Alt menü kontrolü
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  // Eksik olan 'kaynak' alanı eklendi
  const [yeniIs, setYeniIs] = useState({ 
    musteri: "", 
    isModeli: "", 
    ilce: "", 
    fiyat: "", 
    kaynak: "Instagram", 
    aciklama: "" 
  });

  useEffect(() => {
    verileriGetir();
  }, [seciliGun, seciliAy, seciliYil, aktifSekme]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    
    let query = supabase.from('teklifler').select('*');
    
    if (aktifSekme === 'teklifler') {
        query = query.eq('is_tarihi', formatliTarih);
    } else {
        query = query.eq('durum', 'onaylandi');
    }

    const { data } = await query.order('created_at', { ascending: false });
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
    
    const { error } = await supabase.from('teklifler').insert([{ 
        ...yeniIs, 
        is_tarihi: formatliTarih, 
        fiyat: yeniIs.fiyat + " ₺", 
        durum: 'beklemede', 
        uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false } 
    }]);

    if (!error) { 
        verileriGetir(); 
        setIsModalOpen(false); 
        setYeniIs({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" }); 
    }
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden pb-32">
      
      {/* ÜST PANEL */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 shadow-sm">
        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.3em] mb-1 text-center">USTA CAM BALKON</p>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase">{aktifSekme === 'teklifler' ? 'Teklifler' : 'Üretim'}</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-10 h-10 rounded-2xl font-bold shadow-lg flex items-center justify-center">+</button>
        </div>
        
        {aktifSekme === 'teklifler' && (
          <>
            <div className="flex gap-2 mb-4">
              <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-50 rounded-xl px-3 py-3 text-xs font-bold outline-none border-none">
                {yillar.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-50 rounded-xl px-3 py-3 text-xs font-bold outline-none border-none">
                {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
              </select>
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {ayinGunleriniGetir().map(gun => (
                <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-10 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                  <span className="text-[11px] font-black">{gun}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* LİSTE ALANI */}
      <div className="p-4 space-y-4">
        {teklifler.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="font-bold text-lg leading-none mb-1">{t.musteri}</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.is_modeli} — {t.ilce}</p>
                <span className="text-[8px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500 uppercase mt-2 inline-block">{t.kaynak || 'Genel'}</span>
              </div>
              <div className="text-right text-sm font-black text-slate-900">{t.fiyat}</div>
            </div>

            <div className="flex gap-2 items-center pt-4 border-t border-slate-50 mt-4">
                <select 
                  value={t.durum} 
                  onChange={(e) => durumGuncelle(t.id, e.target.value)}
                  className={`flex-1 text-[10px] font-black uppercase py-3 px-4 rounded-2xl border-none outline-none appearance-none text-center ${
                    t.durum === 'onaylandi' ? 'bg-emerald-500 text-white' : 
                    t.durum === 'iptal' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
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

      {/* ALT MENÜ (NAVIGASYON) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 py-6 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1 ${aktifSekme === 'teklifler' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Teklifler</span>
            {aktifSekme === 'teklifler' && <div className="w-1 h-1 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('uretim')} className={`flex flex-col items-center gap-1 ${aktifSekme === 'uretim' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Üretim</span>
            {aktifSekme === 'uretim' && <div className="w-1 h-1 bg-blue-600 rounded-full"></div>}
        </button>
      </div>

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center uppercase tracking-tighter">Yeni İş Ekle</h3>
            <form onSubmit={isKaydet} className="space-y-3">
              <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-2">
                <select required className="bg-slate-50 p-4 rounded-2xl text-[10px] font-bold outline-none border-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    <option value="">Model...</option>
                    <option value="Cam Balkon">Cam Balkon</option>
                    <option value="Sürme">Sürme</option>
                    <option value="Giyotin">Giyotin</option>
                </select>
                <select required className="bg-slate-50 p-4 rounded-2xl text-[10px] font-bold outline-none border-none" onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    <option value="Instagram">Instagram</option>
                    <option value="Referans">Referans</option>
                    <option value="Web">Web Sitesi</option>
                    <option value="Branda">Branda</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" placeholder="Fiyat (₺)" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-xl mt-4">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-[10px] font-black uppercase py-2">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
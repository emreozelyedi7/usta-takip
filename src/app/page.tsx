"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('teklifler');
  const [yukleniyor, setYukleniyor] = useState(true);

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", isTarihi: new Date().toISOString().split('T')[0], aciklama: "" });

  useEffect(() => {
    verileriGetir();
  }, []);

  const verileriGetir = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase
      .from('teklifler')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTeklifler(data);
    setYukleniyor(false);
  };

  const isKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('teklifler').insert([
      {
        musteri: yeniIs.musteri,
        is_modeli: yeniIs.isModeli,
        ilce: yeniIs.ilce,
        fiyat: yeniIs.fiyat + " ₺",
        kaynak: yeniIs.kaynak,
        is_tarihi: yeniIs.isTarihi,
        aciklama: yeniIs.aciklama,
        durum: 'beklemede',
        uretim: { cizim: false, camSiparisi: false, atolye: false, profil: false, camGeldi: false, teslim: false }
      }
    ]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      verileriGetir();
      setIsModalOpen(false);
      setYeniIs({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", isTarihi: new Date().toISOString().split('T')[0], aciklama: "" });
    }
  };

  const isiOnayla = async (id: number) => {
    await supabase.from('teklifler').update({ durum: 'onaylandi' }).eq('id', id);
    verileriGetir();
  };

  const uretimAsamasiGuncelle = async (teklif: any, asama: string) => {
    const guncelUretim = { ...teklif.uretim, [asama]: !teklif.uretim[asama] };
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklif.id);
    verileriGetir();
  };

  if (yukleniyor) return <div className="flex items-center justify-center h-screen text-slate-400 font-bold tracking-widest text-[10px] uppercase">Bağlantı Kuruluyor...</div>;

  return (
    <div className="pb-32 max-w-xl mx-auto bg-slate-50 min-h-screen">
      {/* ÜST BAŞLIK */}
      <div className="bg-white px-6 py-8 border-b border-slate-100 sticky top-0 z-30 mb-6 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">USTA TAKİP</h1>
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em]">İş ve Üretim Paneli</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 active:scale-90 transition-all font-bold text-xl">+</button>
      </div>

      {aktifSekme === 'teklifler' ? (
        <div className="px-4 space-y-4">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Teklif Kayıt Arşivi</h2>
          {teklifler.map((teklif) => (
            <div key={teklif.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${teklif.durum === 'onaylandi' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              <div className="flex justify-between items-start pl-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-slate-800 text-lg tracking-tight">{teklif.musteri}</h2>
                    {teklif.durum === 'onaylandi' && <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase border border-emerald-100">Siparişe Dönüştü</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{teklif.is_modeli} — {teklif.ilce}</p>
                </div>
                <div className="text-right">
                    <div className="text-slate-900 text-sm font-black tracking-tight">{teklif.fiyat}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{teklif.is_tarihi}</div>
                </div>
              </div>

              {teklif.aciklama && (
                <div className="pl-2 text-[12px] text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                   {teklif.aciklama}
                </div>
              )}

              <div className="flex gap-4 pl-2 items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">👤 {teklif.kaynak}</span>
              </div>

              {teklif.durum === 'beklemede' && (
                <button onClick={() => isiOnayla(teklif.id)} className="w-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl mt-2 active:scale-95 transition-all shadow-lg shadow-blue-100">
                  Siparişi Onayla & Üretime Al
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-6">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Sipariş Takip / Üretim</h2>
          {teklifler.filter(t => t.durum === 'onaylandi').map((teklif) => (
            <div key={teklif.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500"></div>
              <div className="pl-2 border-b pb-4 border-slate-50 flex justify-between items-end">
                <div>
                  <h2 className="font-bold text-slate-800 text-lg tracking-tight">{teklif.musteri}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{teklif.is_modeli} / {teklif.ilce}</p>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">#{teklif.id.toString().slice(-4)}</div>
              </div>
              
              {/* Butonlar Tam İsimleriyle ve Daha Geniş */}
              <div className="grid grid-cols-1 gap-3 pl-2">
                {[
                  { key: 'cizim', label: 'Çizim Yapıldı' },
                  { key: 'camSiparisi', label: 'Cam Siparişi Verildi' },
                  { key: 'profil', label: 'Profil Hazırlandı' },
                  { key: 'camGeldi', label: 'Cam Fabrikadan Geldi' },
                  { key: 'atolye', label: 'Atölye Montajı Tamam' },
                  { key: 'teslim', label: 'İş Teslim Edildi' }
                ].map((item) => (
                  <button 
                    key={item.key}
                    onClick={() => uretimAsamasiGuncelle(teklif, item.key)} 
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all ${teklif.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider">{item.label}</span>
                    {teklif.uretim?.[item.key] ? (
                       <span className="text-white text-xs font-bold">✓</span>
                    ) : (
                       <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALT NAVİGASYON */}
      <nav className="bg-white border-t border-slate-100 fixed bottom-0 w-full px-12 py-6 flex justify-between items-center z-40 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[3rem]">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'teklifler' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}>
          <span className="text-[11px] font-black uppercase tracking-widest">Teklifler</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aktifSekme === 'teklifler' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
        </button>
        <button onClick={() => setAktifSekme('santiye')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'santiye' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}>
          <span className="text-[11px] font-black uppercase tracking-widest">Sipariş Takip</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aktifSekme === 'santiye' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
        </button>
      </nav>

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter text-center">Yeni İş Kaydı</h3>
            <form onSubmit={isKaydet} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
                <input required type="date" value={yeniIs.isTarihi} className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isTarihi: e.target.value})} />
              </div>

              <select required className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-500" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modelini Seçin...</option>
                <option value="Cam Balkon">Cam Balkon</option>
                <option value="Temizlenebilir Giyotin">Temizlenebilir Giyotin</option>
                <option value="Sürme Sistem">Sürme Sistem</option>
                <option value="Teras Kapama">Teras Kapama</option>
                <option value="Kış Bahçesi">Kış Bahçesi</option>
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="Fiyat (₺)" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <select required className="w-full bg-slate-50 p-5 rounded-2xl text-[11px] font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                  <option value="">Teklif Veren...</option>
                  <option value="Pendik Şube">Pendik Şube</option>
                  <option value="Volkan Usta">Volkan Usta</option>
                  <option value="İnstagram">İnstagram</option>
                  <option value="İnternet Gsm">İnternet Gsm</option>
                  <option value="Barış Eren">Barış Eren</option>
                  <option value="Cem Arslan">Cem Arslan</option>
                </select>
              </div>

              <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="İlçe (Örn: Pendik)" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />

              <textarea className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none resize-none h-28" placeholder="Detaylı iş notları, renk tercihi vb..." onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>

              <button type="submit" className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl mt-4 active:scale-95 transition-all">Sisteme Kaydet</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 text-[10px] font-black uppercase py-2">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
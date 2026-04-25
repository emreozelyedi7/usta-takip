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
  const [selectedJob, setSelectedJob] = useState<any>(null);
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

  const ilerlemeHesapla = (uretim: any) => {
    if (!uretim) return 0;
    const asamalar = Object.values(uretim);
    const tamamlananlar = asamalar.filter(v => v === true).length;
    return Math.round((tamamlananlar / asamalar.length) * 100);
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
        uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false }
      }
    ]);

    if (!error) {
      verileriGetir();
      setIsModalOpen(false);
      setYeniIs({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", isTarihi: new Date().toISOString().split('T')[0], aciklama: "" });
    }
  };

  const isiOnayla = async (id: number) => {
    await supabase.from('teklifler').update({ durum: 'onaylandi' }).eq('id', id);
    verileriGetir();
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });

    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  if (yukleniyor) return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Sistem Hazırlanıyor...</div>;

  return (
    <div className="pb-32 max-w-xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      
      {/* ÜST BAŞLIK */}
      <div className="bg-white px-6 pt-12 pb-8 border-b border-slate-100 flex justify-between items-end mb-4 shadow-sm">
        <div>
          <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.4em] mb-1">USTA CAM BALKON</p>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">{aktifSekme === 'teklifler' ? 'Teklif Arşivi' : 'Sipariş Takip'}</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all font-bold text-xl">+</button>
      </div>

      <div className="px-4">
        {aktifSekme === 'teklifler' ? (
          <div className="space-y-4">
            {teklifler.map((teklif) => (
              <div key={teklif.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${teklif.durum === 'onaylandi' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800 leading-tight mb-1">{teklif.musteri}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{teklif.is_modeli} - {teklif.ilce}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{teklif.fiyat}</p>
                  </div>
                </div>
                {teklif.durum === 'beklemede' && (
                  <button onClick={() => isiOnayla(teklif.id)} className="w-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl mt-4 active:bg-blue-700 transition-colors">Siparişi Onayla</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {teklifler.filter(t => t.durum === 'onaylandi').map((teklif) => {
              const yuzde = ilerlemeHesapla(teklif.uretim);
              return (
                <button 
                  key={teklif.id} 
                  onClick={() => setSelectedJob(teklif)}
                  className="w-full bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 text-left active:bg-slate-50 transition-all flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{teklif.musteri}</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{teklif.is_modeli}</p>
                    </div>
                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">%{yuzde}</span>
                  </div>
                  
                  {/* İLERLEME BARI (PROGRESS BAR) */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${yuzde === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${yuzde}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAY PENCERESİ */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative">
            <button onClick={() => setSelectedJob(null)} className="absolute right-8 top-8 text-slate-300 text-xl font-bold">✕</button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">{selectedJob.musteri}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{selectedJob.is_modeli} - {selectedJob.ilce}</p>
            </div>

            {/* 2'Lİ SIRALI BUTONLAR - YAZI BOYUTLARI KÜÇÜLTÜLDÜ */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'cizim', label: 'Çizim Yapıldı' },
                { key: 'camSiparisi', label: 'Cam Siparişi' },
                { key: 'profil', label: 'Profil Hazır' },
                { key: 'camGeldi', label: 'Cam Geldi' },
                { key: 'atolye', label: 'Atölye Bitti' },
                { key: 'teslim', label: 'Teslim Edildi' }
              ].map((item) => (
                <button 
                  key={item.key}
                  onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} 
                  className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all gap-2 ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight h-8 flex items-center">
                    {item.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${selectedJob.uretim?.[item.key] ? 'border-white bg-white/20' : 'border-slate-100'}`}>
                    {selectedJob.uretim?.[item.key] ? '✓' : ''}
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] mt-8 shadow-xl">KAYDET VE KAPAT</button>
          </div>
        </div>
      )}

      {/* ALT NAVİGASYON */}
      <nav className="bg-white/80 backdrop-blur-xl border-t border-slate-100 fixed bottom-0 w-full px-12 py-6 flex justify-between items-center z-40 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'teklifler' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <span className="text-[10px] font-black uppercase tracking-widest">Teklifler</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aktifSekme === 'teklifler' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
        </button>
        <button onClick={() => setAktifSekme('santiye')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'santiye' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <span className="text-[10px] font-black uppercase tracking-widest">Üretim</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aktifSekme === 'santiye' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
        </button>
      </nav>

      {/* MODAL: YENİ KAYIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tighter text-center uppercase">Yeni İş Kaydı</h3>
            <form onSubmit={isKaydet} className="space-y-4 pb-8">
              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-500" placeholder="Müşteri" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
                <input required type="date" value={yeniIs.isTarihi} className="w-full bg-slate-50 p-4 rounded-xl text-[10px] font-bold outline-none border border-transparent" onChange={(e) => setYeniIs({...yeniIs, isTarihi: e.target.value})} />
              </div>
              <select required className="w-full bg-slate-50 p-4 rounded-xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modeli...</option>
                <option value="Cam Balkon">Cam Balkon</option>
                <option value="Giyotin">Giyotin</option>
                <option value="Sürme Sistem">Sürme</option>
                <option value="Teras Kapama">Teras</option>
                <option value="Kış Bahçesi">Kış Bahçesi</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none" placeholder="Fiyat (₺)" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <textarea className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none h-24" placeholder="Notlar..." onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100">KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 text-[10px] font-black uppercase py-2">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
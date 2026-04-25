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
  const [selectedJob, setSelectedJob] = useState<any>(null); // Detay penceresi için
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
    
    // UI'da anlık güncelleme (Hız için)
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });

    // Veritabanına gönder
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  if (yukleniyor) return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest">Yükleniyor...</div>;

  return (
    <div className="pb-32 max-w-xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
      
      {/* ÜST BAŞLIK - ARTIK SABİT DEĞİL, SAYFAYLA GİDER */}
      <div className="bg-white px-6 pt-12 pb-8 border-b border-slate-100 flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] mb-1">USTA CAM BALKON</p>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{aktifSekme === 'teklifler' ? 'Teklif Havuzu' : 'Sipariş Takip'}</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all font-bold text-xl">+</button>
      </div>

      <div className="px-4">
        {aktifSekme === 'teklifler' ? (
          <div className="space-y-4">
            {teklifler.map((teklif) => (
              <div key={teklif.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden transition-all active:scale-[0.98]">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${teklif.durum === 'onaylandi' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <h2 className="font-bold text-lg leading-tight mb-1">{teklif.musteri}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{teklif.is_modeli}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tracking-tight">{teklif.fiyat}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{teklif.is_tarihi}</p>
                  </div>
                </div>
                {teklif.durum === 'beklemede' && (
                  <button onClick={() => isiOnayla(teklif.id)} className="w-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl mt-4 shadow-lg shadow-blue-100">
                    Siparişi Onayla
                  </button>
                )}
                {teklif.durum === 'onaylandi' && (
                   <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Üretim Listesine Alındı</span>
                   </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {teklifler.filter(t => t.durum === 'onaylandi').map((teklif) => (
              <button 
                key={teklif.id} 
                onClick={() => setSelectedJob(teklif)}
                className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center text-left active:bg-slate-50 transition-all"
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{teklif.musteri}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{teklif.is_modeli} — {teklif.ilce}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                   <span className="text-lg">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ALT NAVİGASYON - BU SABİT KALMALI (Ulaşım için) */}
      <nav className="bg-white/90 backdrop-blur-xl border-t border-slate-100 fixed bottom-0 w-full px-12 py-6 flex justify-between items-center z-40 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] rounded-t-[3rem]">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'teklifler' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <span className="text-[11px] font-black uppercase tracking-widest">Teklifler</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aktifSekme === 'teklifler' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
        </button>
        <button onClick={() => setAktifSekme('santiye')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'santiye' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <span className="text-[11px] font-black uppercase tracking-widest">Üretim</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aktifSekme === 'santiye' ? 'bg-blue-600' : 'bg-transparent'}`}></div>
        </button>
      </nav>

      {/* DETAY PENCERESİ (SIPARIS TAKIP) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto overflow-y-auto p-8 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative">
            <button onClick={() => setSelectedJob(null)} className="absolute right-8 top-8 text-slate-300 font-bold text-xl">✕</button>
            
            <div className="mb-8 pr-12">
              <h2 className="text-2xl font-black tracking-tight">{selectedJob.musteri}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedJob.is_modeli} — {selectedJob.ilce}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">İş Notları:</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{selectedJob.aciklama || 'Not eklenmemiş.'}"</p>
            </div>

            {/* 2'Lİ SIRALI BUTONLAR */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'cizim', label: 'Çizim' },
                { key: 'camSiparisi', label: 'Cam Sip.' },
                { key: 'profil', label: 'Profil' },
                { key: 'camGeldi', label: 'Cam Geldi' },
                { key: 'atolye', label: 'Atölye' },
                { key: 'teslim', label: 'Teslim' }
              ].map((item) => (
                <button 
                  key={item.key}
                  onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} 
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-2 ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                  <span className={`text-[11px] font-black uppercase tracking-wider`}>{item.label}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedJob.uretim?.[item.key] ? 'border-white bg-white/20' : 'border-slate-100'}`}>
                    {selectedJob.uretim?.[item.key] ? '✓' : ''}
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-8">Kaydet ve Kapat</button>
          </div>
        </div>
      )}

      {/* YENİ KAYIT MODALI (AYNI KALDI) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter text-center">Yeni İş Kaydı</h3>
            <form onSubmit={isKaydet} className="space-y-5 pb-8">
              <div className="grid grid-cols-2 gap-4">
                <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="Müşteri" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
                <input required type="date" value={yeniIs.isTarihi} className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isTarihi: e.target.value})} />
              </div>
              <select required className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modeli...</option>
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
              <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              <textarea className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none resize-none h-28" placeholder="Notlar..." onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100">KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 text-[10px] font-black uppercase py-2">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
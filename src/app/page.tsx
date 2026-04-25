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
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [aktifSekme, setAktifSekme] = useState('teklifler'); 
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ 
    musteri: "", 
    isModeli: "Cam Balkon", 
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

  const ilerlemeHesapla = (uretim: any) => {
    if (!uretim) return 0;
    const asamalar = Object.values(uretim);
    const tamamlananlar = asamalar.filter(v => v === true).length;
    return Math.round((tamamlananlar / asamalar.length) * 100);
  };

  const isKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    const { error } = await supabase.from('teklifler').insert([{ 
        musteri: yeniIs.musteri,
        is_modeli: yeniIs.isModeli,
        ilce: yeniIs.ilce,
        fiyat: yeniIs.fiyat + " ₺",
        kaynak: yeniIs.kaynak,
        aciklama: yeniIs.aciklama,
        is_tarihi: formatliTarih, 
        durum: 'beklemede', 
        uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false } 
    }]);
    if (!error) { verileriGetir(); setIsModalOpen(false); setYeniIs({ musteri: "", isModeli: "Cam Balkon", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" }); }
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  const aciklamaGuncelle = async (id: number, yeniMetin: string) => {
    const yeniListe = teklifler.map(t => t.id === id ? { ...t, aciklama: yeniMetin } : t);
    setTeklifler(yeniListe);
    setSelectedJob(yeniListe.find(t => t.id === id));
    await supabase.from('teklifler').update({ aciklama: yeniMetin }).eq('id', id);
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-32">
      
      {/* ÜST PANEL - YIL VE AY GERİ GELDİ */}
      <div className="bg-white px-5 pt-10 pb-5 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center mb-5">
            <h1 className="text-2xl font-black tracking-tighter uppercase">{aktifSekme === 'teklifler' ? 'Teklif Arşivi' : 'Üretim Hattı'}</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-10 h-10 rounded-2xl font-bold shadow-lg flex items-center justify-center">+</button>
        </div>
        
        {aktifSekme === 'teklifler' && (
          <div className="space-y-4">
            {/* YIL VE AY SEÇİCİLERİ */}
            <div className="flex gap-2">
              <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold outline-none border-none">
                {yillar.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold outline-none border-none">
                {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
              </select>
            </div>
            {/* GÜN SEÇİCİ */}
            <div className="flex overflow-x-auto gap-2 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (
                <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-9 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                  <span className="text-[11px] font-black">{gun}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LİSTE ALANI - RENKLİ BUTONLAR VE KOMPAKT TASARIM */}
      <div className="p-3 space-y-3 flex-1">
        {teklifler.map(t => {
          const yuzde = ilerlemeHesapla(t.uretim);
          return (
            <div key={t.id} onClick={() => aktifSekme === 'uretim' && setSelectedJob(t)} className="bg-white p-4 rounded-[1.8rem] shadow-sm border border-slate-100 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 pr-2">
                        <h2 className="font-bold text-[16px] leading-tight text-slate-800">{t.musteri}</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.is_modeli} — {t.ilce}</p>
                    </div>
                    <div className="text-right text-sm font-black text-slate-900">{t.fiyat}</div>
                </div>

                {aktifSekme === 'teklifler' && t.aciklama && (
                  <div className="mt-1 mb-2 bg-slate-50 p-2 rounded-lg border-l-2 border-slate-200">
                    <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">{t.aciklama}</p>
                  </div>
                )}

                {aktifSekme === 'uretim' ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase text-blue-600">
                        <span>Üretim Durumu</span>
                        <span>%{yuzde}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${yuzde}%` }}></div>
                    </div>
                  </div>
                ) : (
                  /* RENKLİ DURUM BUTONLARI GERİ GELDİ */
                  <select 
                    value={t.durum} 
                    onChange={(e) => durumGuncelle(t.id, e.target.value)} 
                    className={`w-full mt-2 text-[10px] font-black uppercase py-2.5 px-3 rounded-xl border-none outline-none transition-all shadow-sm ${
                      t.durum === 'onaylandi' ? 'bg-emerald-500 text-white shadow-emerald-100' : 
                      t.durum === 'iptal' ? 'bg-rose-500 text-white shadow-rose-100' : 'bg-amber-400 text-white shadow-amber-100'
                    }`}
                  >
                    <option value="beklemede">BEKLEMEDE ⏳</option>
                    <option value="onaylandi">ONAYLANDI ✅</option>
                    <option value="iptal">İPTAL ❌</option>
                  </select>
                )}
            </div>
          );
        })}
      </div>

      {/* ÜRETİM DETAY PANELİ */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{selectedJob.musteri}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedJob.is_modeli}</p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-300 text-xl font-bold">✕</button>
            </div>
            <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Üretim Notu Düzenle:</span>
                <textarea value={selectedJob.aciklama || ''} onChange={(e) => aciklamaGuncelle(selectedJob.id, e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-medium h-24 border-none outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[ { key: 'cizim', label: 'Çizim' }, { key: 'camSiparisi', label: 'Cam Sip.' }, { key: 'profil', label: 'Profil' }, { key: 'camGeldi', label: 'Cam Geldi' }, { key: 'atolye', label: 'Atölye' }, { key: 'teslim', label: 'Teslim' } ].map((item) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <span className="text-[10px] font-black uppercase">{item.label}</span>
                    <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase">KAPAT</button>
          </div>
        </div>
      )}

      {/* ALT NAVİGASYON */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-12 py-5 flex justify-around items-center z-50 rounded-t-[2.2rem] shadow-2xl">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1 transition-all ${aktifSekme === 'teklifler' ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">TEKLİFLER</span>
            {aktifSekme === 'teklifler' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('uretim')} className={`flex flex-col items-center gap-1 transition-all ${aktifSekme === 'uretim' ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">ÜRETİM</span>
            {aktifSekme === 'uretim' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
      </div>

      {/* MODAL: YENİ KAYIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl my-auto">
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center uppercase tracking-tighter">YENİ İŞ EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-3">
              <input required className="w-full bg-slate-100 p-4 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-100" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-100 p-4 rounded-xl text-[10px] font-bold border-none outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    <option value="Cam Balkon">Cam Balkon</option><option value="Giyotin">Giyotin</option><option value="Sürme">Sürme</option><option value="Teras">Teras</option>
                </select>
                <select className="bg-slate-100 p-4 rounded-xl text-[10px] font-bold border-none outline-none" onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    <option value="Instagram">Instagram</option><option value="Referans">Referans</option><option value="Web">Web</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-100 p-4 rounded-xl text-sm font-bold outline-none" placeholder="Fiyat" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-100 p-4 rounded-xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <textarea className="w-full bg-slate-100 p-4 rounded-xl text-sm font-bold h-20 resize-none outline-none" placeholder="Notlar..." onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-xl mt-2">KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-[10px] font-black uppercase py-1 text-center">İPTAL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
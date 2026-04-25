"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Sipariş ve Üretim Aşamaları
const SIPARIS_ASAMALARI = ['cizim', 'camSiparisi', 'profilImalati', 'cizimAtolyeyeVerildi', 'camGeldi'];
const URETIM_ASAMALARI = ['sonImalat', 'teslim'];
const TUM_ASAMALAR = [...SIPARIS_ASAMALARI, ...URETIM_ASAMALARI];

export default function Home() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [aktifSekme, setAktifSekme] = useState('teklifler'); // 'teklifler', 'siparisler', 'uretim'
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "Cam Balkon", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" });

  const verileriGetir = useCallback(async () => {
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
  }, [seciliYil, seciliAy, seciliGun, aktifSekme]);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  // İş Durum Kontrolleri
  const isSiparisTamam = (job: any) => {
    const u = job.uretim || {};
    return SIPARIS_ASAMALARI.every(asama => u[asama] === true);
  };

  const isTamamenBitti = (job: any) => {
    const u = job.uretim || {};
    return TUM_ASAMALAR.every(asama => u[asama] === true);
  };

  const ilerlemeHesapla = (job: any) => {
    const u = job.uretim || {};
    const tamamlananlar = TUM_ASAMALAR.filter(asama => u[asama] === true).length;
    return Math.round((tamamlananlar / TUM_ASAMALAR.length) * 100);
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
        uretim: { 
          cizim: false, camSiparisi: false, profilImalati: false, cizimAtolyeyeVerildi: false, camGeldi: false, 
          sonImalat: false, teslim: false, montajTipi: 'Montajlı' 
        } 
    }]);
    if (!error) { 
        verileriGetir(); 
        setIsModalOpen(false); 
        setYeniIs({ musteri: "", isModeli: "Cam Balkon", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" }); 
    }
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    if (!job) return;
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  const montajTipiGuncelle = async (teklifId: number, yeniTip: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    if (!job) return;
    const guncelUretim = { ...job.uretim, montajTipi: yeniTip };
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  const aciklamaGuncelle = async (id: number, yeniMetin: string) => {
    const yeniListe = teklifler.map(t => t.id === id ? { ...t, aciklama: yeniMetin } : t);
    setTeklifler(yeniListe);
    const updatedJob = yeniListe.find(t => t.id === id);
    if(updatedJob) setSelectedJob(updatedJob);
    await supabase.from('teklifler').update({ aciklama: yeniMetin }).eq('id', id);
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  // Sekmelere göre filtreleme mantığı (Otomasyon burada çalışır)
  let gosterilecekTeklifler = teklifler;
  if (aktifSekme === 'siparisler') {
    gosterilecekTeklifler = teklifler.filter(t => !isSiparisTamam(t)); // İlk 5 bitmeyenler
  } else if (aktifSekme === 'uretim') {
    gosterilecekTeklifler = teklifler.filter(t => isSiparisTamam(t)); // İlk 5 bitenler
  }

  const getSekmeBaslik = () => {
    if(aktifSekme === 'teklifler') return 'Teklif Arşivi';
    if(aktifSekme === 'siparisler') return 'Siparişler';
    return 'Üretim Hattı';
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-28">
      
      {/* YANDAN AÇILIR MENÜ (SİDEBAR) */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white z-[120] shadow-[20px_0_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col justify-end pt-12">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-blue-200">U</div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Usta Takip</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hoş Geldiniz, Emre Bey</p>
            </div>
            
            <div className="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
              <button onClick={() => { setAktifSekme('teklifler'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${aktifSekme === 'teklifler' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 active:bg-slate-50'}`}>Teklif Arşivi</button>
              <button onClick={() => { setAktifSekme('siparisler'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${aktifSekme === 'siparisler' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 active:bg-slate-50'}`}>Siparişler</button>
              <button onClick={() => { setAktifSekme('uretim'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${aktifSekme === 'uretim' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 active:bg-slate-50'}`}>Üretim Hattı</button>
              
              <div className="h-px bg-slate-100 my-4 mx-2"></div>
              <button className="w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-300 cursor-not-allowed">Müşteriler (Yakında)</button>
              <button className="w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-300 cursor-not-allowed">Muhasebe (Yakında)</button>
            </div>

            <div className="p-6 border-t border-slate-100">
               <button onClick={() => setIsSidebarOpen(false)} className="w-full bg-slate-100 text-slate-500 p-4 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">Kapat</button>
            </div>
          </div>
        </>
      )}

      {/* ÜST PANEL */}
      <div className="bg-white px-4 pt-8 pb-3 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-900 active:bg-slate-100 rounded-xl transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h8" /></svg>
                </button>
                <h1 className="text-xl font-black tracking-tighter uppercase">{getSekmeBaslik()}</h1>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-8 h-8 rounded-xl font-bold shadow-md flex items-center justify-center active:scale-90 transition-all">+</button>
        </div>
        
        {aktifSekme === 'teklifler' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-lg px-2 py-2 text-base font-bold outline-none border-none">
                {yillar.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-lg px-2 py-2 text-base font-bold outline-none border-none">
                {aylar.map((a, i) => <option key={i} value={i}>{a}</option>)}
              </select>
            </div>
            <div className="flex overflow-x-auto gap-1.5 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (
                <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-8 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                  <span className="text-[11px] font-black">{gun}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LİSTE ALANI */}
      <div className="p-3 space-y-3 flex-1">
        {gosterilecekTeklifler.map(t => {
          const yuzde = ilerlemeHesapla(t);
          const bittiMi = isTamamenBitti(t);
          return (
            <div key={t.id} className={`p-3.5 rounded-2xl shadow-sm border active:scale-[0.98] transition-all ${bittiMi ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                {/* Tıklanabilir Üst Alan */}
                <div onClick={() => aktifSekme !== 'teklifler' && setSelectedJob(t)}>
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 pr-2">
                            <h2 className="font-bold text-base leading-tight text-slate-800">{t.musteri}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.is_modeli} — {t.ilce}</p>
                            </div>
                        </div>
                        <div className="text-right text-sm font-black text-slate-900">{t.fiyat}</div>
                    </div>
                </div>

                {aktifSekme === 'teklifler' && t.aciklama && (
                  <div className="mt-1.5 mb-1.5 bg-slate-50 p-2 rounded-lg border-l-4 border-slate-200">
                    <p className="text-[10px] text-slate-500 font-medium italic leading-snug line-clamp-2">{t.aciklama}</p>
                  </div>
                )}

                {aktifSekme === 'teklifler' ? (
                  <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full mt-1.5 text-base font-black uppercase py-0 px-2 rounded-lg border-none outline-none transition-all shadow-sm h-9 ${t.durum === 'onaylandi' ? 'bg-emerald-500 text-white shadow-emerald-100' : t.durum === 'iptal' ? 'bg-rose-500 text-white shadow-rose-100' : 'bg-amber-400 text-white shadow-amber-100'}`}>
                    <option value="beklemede">BEKLEMEDE ⏳</option><option value="onaylandi">ONAYLANDI ✅</option><option value="iptal">İPTAL ❌</option>
                  </select>
                ) : (
                  <>
                    {/* SİPARİŞ & ÜRETİM ORTAK ALANI: MONTAJ TİPİ VE BAR */}
                    <div className="mt-3 flex gap-2 items-center">
                        <select 
                            value={t.uretim?.montajTipi || 'Montajlı'} 
                            onChange={(e) => montajTipiGuncelle(t.id, e.target.value)}
                            className={`text-[10px] font-black uppercase py-1.5 px-2 rounded-md border-none outline-none shadow-sm ${t.uretim?.montajTipi === 'Demonte' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                            <option value="Montajlı">Montajlı</option>
                            <option value="Demonte">Demonte</option>
                        </select>
                        
                        {bittiMi ? (
                            <div className="flex-1 bg-emerald-500 text-white text-[10px] font-black uppercase text-center py-1.5 rounded-md shadow-sm tracking-widest">İŞ TESLİM EDİLDİ 🏁</div>
                        ) : (
                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative shadow-inner">
                                <div className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500" style={{ width: `${yuzde}%` }}></div>
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference">% {yuzde}</span>
                            </div>
                        )}
                    </div>
                  </>
                )}
            </div>
          );
        })}
      </div>

      {/* ALT NAVİGASYON - 3'LÜ YAPI */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 rounded-t-[1.5rem] shadow-2xl">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === 'teklifler' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">TEKLİFLER</span>
            {aktifSekme === 'teklifler' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('siparisler')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === 'siparisler' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">SİPARİŞLER</span>
            {aktifSekme === 'siparisler' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('uretim')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === 'uretim' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">ÜRETİM</span>
            {aktifSekme === 'uretim' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
      </div>

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-4 text-center uppercase tracking-tighter">YENİ İŞ EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-2.5">
              <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none border-none" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-100 p-3 rounded-xl text-base font-bold border-none outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    <option value="Cam Balkon">Cam Balkon</option><option value="Giyotin">Giyotin</option><option value="Sürme">Sürme</option><option value="Teras">Teras</option>
                </select>
                <select className="bg-slate-100 p-3 rounded-xl text-base font-bold border-none outline-none" onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    <option value="Instagram">Instagram</option><option value="Referans">Referans</option><option value="Web">Web</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none" placeholder="Fiyat" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <textarea className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold h-16 resize-none outline-none" placeholder="Notlar..." onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-black text-sm uppercase shadow-xl mt-1 active:scale-95">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-xs font-black uppercase py-2 text-center">İPTAL</button>
            </form>
          </div>
        </div>
      )}

      {/* DETAY PANELİ (SİPARİŞ & ÜRETİM ORTAK) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded-t-[2rem] shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedJob.musteri}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedJob.is_modeli}</p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-300 text-xl font-bold">✕</button>
            </div>
            
            <textarea value={selectedJob.aciklama || ''} onChange={(e) => aciklamaGuncelle(selectedJob.id, e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-base font-medium h-20 border-none outline-none" placeholder="Atölye notları..." />
            
            {/* AŞAMALAR */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* İlk 5 Aşama Her Zaman Görünür */}
              {[ 
                { key: 'cizim', label: 'Çizim' }, 
                { key: 'camSiparisi', label: 'Cam Sip.' }, 
                { key: 'profilImalati', label: 'Profil İmalatı' }, 
                { key: 'cizimAtolyeyeVerildi', label: 'Çizim Atölyeye' }, 
                { key: 'camGeldi', label: 'Cam Geldi' } 
              ].map((item) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">{item.label}</span>
                    <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                </button>
              ))}

              {/* Son 2 Aşama Sadece Üretim Sekmesinde Görünür */}
              {aktifSekme === 'uretim' && [ 
                { key: 'sonImalat', label: 'Son İmalat' }, 
                { key: 'teslim', label: 'Teslim' } 
              ].map((item) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedJob.uretim?.[item.key] ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">{item.label}</span>
                    <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-sm uppercase">KAPAT</button>
          </div>
        </div>
      )}
    </div>
  );
}
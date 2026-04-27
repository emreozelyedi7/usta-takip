"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SIPARIS_ASAMALARI = ['cizim', 'camSiparisi', 'profilImalati', 'cizimAtolyeyeVerildi', 'camGeldi'];
const URETIM_ASAMALARI = ['sonImalat', 'teslim'];
const TUM_ASAMALAR = [...SIPARIS_ASAMALARI, ...URETIM_ASAMALARI];

const ASAMA_RENKLERI = [
  'bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-emerald-500', 'bg-green-600'
];

// Senin ilettiğin hata listesi
const HATA_TURLERI = [
  'Yok', 'MALZEME UNUTMA', 'CAM KIRMA', 'PROFİL YANLIŞ KESME', 
  'SU ALMA', 'MÜŞTERİ ŞİKAYETİ', 'FOTOĞRAF ÇEKİMİ', 'ETİKET YAPIŞTIRMA'
];

export default function Home() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [aktifSekme, setAktifSekme] = useState('teklifler'); 
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "Cam Balkon", adet: "1", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" });

  const gunListesiRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null); 

  useEffect(() => {
    const preventSwipeBack = (e: TouchEvent) => {
      if (touchStartRef.current !== null && touchStartRef.current < 40) {
        e.preventDefault(); 
      }
    };
    document.addEventListener('touchmove', preventSwipeBack, { passive: false });
    return () => document.removeEventListener('touchmove', preventSwipeBack);
  }, []);

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

  useEffect(() => {
    if (gunListesiRef.current && aktifSekme === 'teklifler') {
      const selectedButton = gunListesiRef.current.querySelector(`[data-day="${seciliGun}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [seciliGun, seciliAy, aktifSekme]);

  const isSiparisTamam = (job: any) => {
    const u = job.uretim || {};
    return SIPARIS_ASAMALARI.every(asama => u[asama] === true);
  };

  const isTamamenBitti = (job: any) => {
    const u = job.uretim || {};
    return TUM_ASAMALAR.every(asama => u[asama] === true);
  };

  // EXCEL MANTIĞINA GÖRE ZAMAN/RENK HESAPLAYICI
  const getZamanDurumu = (job: any) => {
    if (!job.uretim?.cizimTarihi) return null;
    const start = new Date(job.uretim.cizimTarihi);
    const diffTime = new Date().getTime() - start.getTime();
    const gecenGun = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const kalanGun = 25 - gecenGun;

    let renkler = {
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      kart: 'bg-white border-slate-100'
    };

    if (gecenGun > 25) {
      // 25 Günü geçmiş (KIRMIZI - GECİKTİ)
      renkler.badge = 'bg-red-600 text-white animate-pulse border-red-700';
      renkler.kart = 'bg-red-50/60 border-red-200';
    } else if (gecenGun > 20) {
      // 21-25 Gün arası (TURUNCU - KRİTİK)
      renkler.badge = 'bg-orange-100 text-orange-700 border-orange-300';
      renkler.kart = 'bg-orange-50/40 border-orange-100';
    }

    return { gecenGun, kalanGun, renkler };
  };

  const formatTarihEkrani = (tarihStr: string) => {
    if(!tarihStr) return "";
    const parts = tarihStr.split('-');
    if(parts.length !== 3) return tarihStr;
    return `${parseInt(parts[2])} ${aylar[parseInt(parts[1]) - 1]}`;
  };

  const isKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    const { error } = await supabase.from('teklifler').insert([{ 
        musteri: yeniIs.musteri,
        is_modeli: yeniIs.isModeli,
        adet: Number(yeniIs.adet) || 1,
        ilce: yeniIs.ilce,
        fiyat: yeniIs.fiyat + " ₺",
        kaynak: yeniIs.kaynak,
        aciklama: yeniIs.aciklama,
        is_tarihi: formatliTarih, 
        durum: 'beklemede', 
        uretim: { cizim: false, camSiparisi: false, profilImalati: false, cizimAtolyeyeVerildi: false, camGeldi: false, sonImalat: false, teslim: false, montajTipi: 'Montajlı', hata: 'Yok' } 
    }]);
    if (!error) { 
        verileriGetir(); 
        setIsModalOpen(false); 
        setYeniIs({ musteri: "", isModeli: "Cam Balkon", adet: "1", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" }); 
    }
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    if (!job) return;
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    if (asama === 'cizim' && guncelUretim.cizim === true && !guncelUretim.cizimTarihi) {
        guncelUretim.cizimTarihi = new Date().toISOString();
    }
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  const uretimHataGuncelle = async (teklifId: number, hataTuru: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    if (!job) return;
    const guncelUretim = { ...job.uretim, hata: hataTuru };
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

  const onTouchStart = (e: React.TouchEvent) => {
    const clientX = e.targetTouches[0].clientX;
    touchStartRef.current = clientX; 
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEndX;
    touchStartRef.current = null; 
    
    if (distance < -120 && !isModalOpen && !selectedJob) {
      setIsSidebarOpen(true);
    }
  };

  let gosterilecekTeklifler = teklifler;
  if (aktifSekme === 'siparisler') {
    gosterilecekTeklifler = teklifler.filter(t => !isSiparisTamam(t)); 
  } else if (aktifSekme === 'uretim') {
    gosterilecekTeklifler = teklifler.filter(t => isSiparisTamam(t)); 
  }

  const getSekmeBaslik = () => {
    if(aktifSekme === 'teklifler') return 'Teklif Arşivi';
    if(aktifSekme === 'siparisler') return 'Siparişler';
    return 'Üretim Hattı';
  };

  return (
    <div 
      className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-28 relative selection:bg-blue-100"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <style dangerouslySetInnerHTML={{__html: `body, html { overscroll-behavior-x: none; }`}} />

      {/* SİDEBAR */}
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
            <div ref={gunListesiRef} className="flex overflow-x-auto gap-1.5 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (
                <button 
                  key={gun} 
                  data-day={gun}
                  onClick={() => setSeciliGun(gun)} 
                  className={`flex-shrink-0 w-8 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-50 text-slate-400'}`}
                >
                  <span className="text-[11px] font-black">{gun}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LİSTE ALANI - SÜPER KOMPAKT */}
      <div className="p-3 space-y-3 flex-1">
        {yukleniyor && gosterilecekTeklifler.length === 0 ? (
           <div className="text-center py-10 text-[10px] font-black uppercase text-slate-300">Yükleniyor...</div>
        ) : gosterilecekTeklifler.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 text-[10px] font-black uppercase text-slate-300">Kayıt Bulunmuyor</div>
        ) : gosterilecekTeklifler.map(t => {
          const bittiMi = isTamamenBitti(t);
          const gosterilenAsamalar = aktifSekme === 'siparisler' ? SIPARIS_ASAMALARI : TUM_ASAMALAR;
          
          const zamanDurumu = getZamanDurumu(t);
          const varHata = t.uretim?.hata && t.uretim.hata !== 'Yok';

          // Kart Arkaplan Rengini Belirleme
          let cardBg = bittiMi ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100';
          if (!bittiMi && aktifSekme !== 'teklifler' && zamanDurumu) {
             cardBg = zamanDurumu.renkler.kart;
          }

          return (
            <div key={t.id} className={`p-3 rounded-2xl shadow-sm border active:scale-[0.98] transition-all relative overflow-hidden ${cardBg}`}>
                
                {/* HATA VARSA KIRMIZI BANT GÖSTER */}
                {varHata && !bittiMi && (
                  <div className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 text-center shadow-sm animate-pulse tracking-widest mb-2 rounded-lg">
                    ⚠️ HATA BİLDİRİMİ: {t.uretim.hata}
                  </div>
                )}

                <div onClick={() => aktifSekme !== 'teklifler' && setSelectedJob(t)}>
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1 pr-2">
                            <h2 className="font-bold text-[15px] leading-tight text-slate-900 line-clamp-1">{t.musteri}</h2>
                            
                            {/* ROZETLER: TARİH + MODEL + ADET + İLÇE */}
                            <div className="flex items-center flex-wrap gap-1 mt-1.5">
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-slate-200">
                                    📅 {formatTarihEkrani(t.is_tarihi)}
                                </span>
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-blue-100">
                                    {t.is_modeli} • {t.adet || 1}
                                </span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider pl-1">{t.ilce}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            <div className="text-right text-[13px] font-black text-slate-900 mb-1">{t.fiyat}</div>
                            {/* ZAMAN ETİKETİ (SADECE SİPARİŞ & ÜRETİM) */}
                            {zamanDurumu && !bittiMi && aktifSekme !== 'teklifler' && (
                                <div className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border tracking-wider ${zamanDurumu.renkler.badge}`}>
                                  {zamanDurumu.gecenGun > 25 ? 'GECİKTİ!' : `KALAN: ${zamanDurumu.kalanGun} GÜN`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* NOTLAR (AÇIKLAMA) */}
                {t.aciklama && (
                  <div className="mt-1.5 mb-1.5 bg-white/60 p-2 rounded-lg border-l-2 border-slate-300">
                    <p className="text-[10px] text-slate-600 font-medium italic leading-snug line-clamp-2">{t.aciklama}</p>
                  </div>
                )}

                {aktifSekme === 'teklifler' ? (
                  <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full mt-1.5 text-base font-black uppercase py-0 px-2 rounded-lg border-none outline-none transition-all shadow-sm h-8 ${t.durum === 'onaylandi' ? 'bg-emerald-500 text-white' : t.durum === 'iptal' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                    <option value="beklemede">BEKLEMEDE ⏳</option><option value="onaylandi">ONAYLANDI ✅</option><option value="iptal">İPTAL ❌</option>
                  </select>
                ) : (
                  <>
                    <div className="mt-2 flex gap-2 items-center">
                        <select 
                            value={t.uretim?.montajTipi || 'Montajlı'} 
                            onChange={(e) => montajTipiGuncelle(t.id, e.target.value)}
                            className={`text-[9px] font-black uppercase py-1 px-1.5 rounded-md border-none outline-none shadow-sm h-7 ${t.uretim?.montajTipi === 'Demonte' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                            <option value="Montajlı">MONTAJLI</option>
                            <option value="Demonte">DEMONTE</option>
                        </select>
                        
                        {bittiMi ? (
                            <div className="flex-1 bg-emerald-500 text-white text-[10px] font-black uppercase text-center py-1 rounded-md shadow-sm tracking-widest h-7 flex items-center justify-center">TESLİM EDİLDİ 🏁</div>
                        ) : (
                            <div className="flex-1 flex gap-[2px] h-2">
                                {gosterilenAsamalar.map((asama, i) => {
                                    const isCompleted = t.uretim?.[asama];
                                    return (
                                        <div 
                                          key={asama} 
                                          className={`flex-1 rounded-[1px] transition-all duration-300 ${isCompleted ? ASAMA_RENKLERI[i] : 'bg-slate-200/60'}`}
                                        ></div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                  </>
                )}
            </div>
          );
        })}
      </div>

      {/* ALT NAVİGASYON */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-2.5 flex justify-between items-center z-50 rounded-t-[1.5rem] shadow-2xl">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === 'teklifler' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">TEKLİFLER</span>
            {aktifSekme === 'teklifler' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('siparisler')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === 'siparisler' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">SİPARİŞLER</span>
            {aktifSekme === 'siparisler' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('uretim')} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === 'uretim' ? 'text-blue-600' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">ÜRETİM</span>
            {aktifSekme === 'uretim' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
      </div>

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-4 text-center uppercase tracking-tighter">YENİ İŞ EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-2">
              <input required className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none border-none" placeholder="Müşteri Adı" value={yeniIs.musteri} onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              
              <div className="grid grid-cols-3 gap-2">
                <select className="col-span-2 bg-slate-100 p-2.5 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.isModeli} onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    <option value="Cam Balkon">Cam Balkon</option><option value="Giyotin">Giyotin</option><option value="Sürme">Sürme</option><option value="Teras">Teras</option>
                </select>
                <input required type="number" min="1" className="col-span-1 bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none text-center" placeholder="Adet" value={yeniIs.adet} onChange={(e) => setYeniIs({...yeniIs, adet: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none" placeholder="Fiyat" type="number" value={yeniIs.fiyat} onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <select className="bg-slate-100 p-2.5 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.kaynak} onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    <option value="Instagram">Instagram</option><option value="Referans">Referans</option><option value="Web">Web</option>
                </select>
              </div>
              <input required className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none" placeholder="İlçe" value={yeniIs.ilce} onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              <textarea className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold h-14 resize-none outline-none" placeholder="Notlar..." value={yeniIs.aciklama} onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-black text-sm uppercase shadow-xl mt-1 active:scale-95">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-xs font-black uppercase py-2 text-center">İPTAL</button>
            </form>
          </div>
        </div>
      )}

      {/* DETAY PANELİ (SİPARİŞ & ÜRETİM ORTAK) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded-t-[2rem] shadow-2xl flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black text-slate-900 leading-none">{selectedJob.musteri}</h2>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase border border-slate-200">
                            📅 {formatTarihEkrani(selectedJob.is_tarihi)}
                        </span>
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase border border-blue-100">
                            {selectedJob.is_modeli} • {selectedJob.adet || 1} ADET
                        </span>
                    </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-300 text-xl font-bold bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            </div>
            
            <textarea value={selectedJob.aciklama || ''} onChange={(e) => aciklamaGuncelle(selectedJob.id, e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-base font-medium h-16 border border-slate-100 outline-none" placeholder="İş notları..." />
            
            <div className="grid grid-cols-2 gap-2">
              {[ 
                { key: 'cizim', label: 'Çizim' }, { key: 'camSiparisi', label: 'Cam Sip.' }, 
                { key: 'profilImalati', label: 'Profil İmalatı' }, { key: 'cizimAtolyeyeVerildi', label: 'Çizim Atölyeye' }, 
                { key: 'camGeldi', label: 'Cam Geldi' } 
              ].map((item, idx) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all ${selectedJob.uretim?.[item.key] ? `${ASAMA_RENKLERI[idx]} border-transparent text-white shadow-md` : 'bg-white border-slate-100 text-slate-400'}`}>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">{item.label}</span>
                    <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                </button>
              ))}

              {aktifSekme === 'uretim' && [ 
                { key: 'sonImalat', label: 'Son İmalat' }, { key: 'teslim', label: 'Teslim' } 
              ].map((item, idx) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all ${selectedJob.uretim?.[item.key] ? `${ASAMA_RENKLERI[idx+5]} border-transparent text-white shadow-md` : 'bg-white border-slate-100 text-slate-400'}`}>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">{item.label}</span>
                    <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                </button>
              ))}
            </div>

            {/* HATA BİLDİRİM MENÜSÜ EKLENDİ */}
            <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <span className="text-[10px] font-black text-red-700 uppercase whitespace-nowrap">⚠️ HATA BİLDİR:</span>
                <select 
                    value={selectedJob.uretim?.hata || 'Yok'} 
                    onChange={(e) => uretimHataGuncelle(selectedJob.id, e.target.value)}
                    className="flex-1 bg-white text-red-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-red-200 outline-none"
                >
                    {HATA_TURLERI.map(hata => <option key={hata} value={hata}>{hata}</option>)}
                </select>
            </div>

            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-sm uppercase mt-1">KAPAT</button>
          </div>
        </div>
      )}
    </div>
  );
}
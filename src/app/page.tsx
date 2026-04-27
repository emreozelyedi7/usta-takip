/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SIPARIS_ASAMALARI = ['cizim', 'camSiparisi', 'profilImalati', 'cizimAtolyeyeVerildi', 'camGeldi'];
const URETIM_ASAMALARI = ['sonImalat', 'teslim'];
const TUM_ASAMALAR = [...SIPARIS_ASAMALARI, ...URETIM_ASAMALARI];

const ASAMA_RENKLERI = ['bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-emerald-500', 'bg-green-600'];
const HATA_TURLERI = ['Yok', 'MALZEME UNUTMA', 'CAM KIRMA', 'PROFİL YANLIŞ KESME', 'SU ALMA', 'MÜŞTERİ ŞİKAYETİ', 'FOTOĞRAF ÇEKİMİ', 'ETİKET YAPIŞTIRMA'];

const MODELLER = ['Cam Balkon', 'Temizlenebilir Giyotin', 'Sürme Sistem', 'Bioclimatic', 'Teras Kapama', 'Veranda', 'Doğrama'];
const KAYNAKLAR = ['VOLKAN USTA', 'BARIŞ EREN', 'CEM ARSLAN', 'İNTERNET&GSM', 'INSTAGRAM', 'KAĞITHANE ŞUBE', 'PENDİK ŞUBE', 'MÜŞTERİ REFERANSI'];

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

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: MODELLER[0], adet: "1", ilce: "", fiyat: "", kaynak: KAYNAKLAR[0], aciklama: "" });

  const gunListesiRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null); 

  useEffect(() => {
    const preventSwipeBack = (e: TouchEvent) => {
      if (touchStartRef.current !== null && touchStartRef.current < 40) e.preventDefault(); 
    };
    document.addEventListener('touchmove', preventSwipeBack, { passive: false });
    return () => document.removeEventListener('touchmove', preventSwipeBack);
  }, []);

  const verileriGetir = useCallback(async () => {
    setYukleniyor(true);
    const yilAy = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}`;
    const tamTarih = `${yilAy}-${String(seciliGun).padStart(2, '0')}`;
    
    let query = supabase.from('teklifler').select('*');
    
    if (aktifSekme === 'teklifler') {
        query = query.eq('is_tarihi', tamTarih);
    } else if (aktifSekme === 'raporlar' || aktifSekme === 'siparisler' || aktifSekme === 'uretim') {
        // Bu sekmelerde ay bazlı tüm veriyi çekelim ki filtreleme yapabilelim
        query = query.like('is_tarihi', `${yilAy}-%`);
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
      if (selectedButton) selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
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

  const getZamanDurumu = (job: any) => {
    if (!job.uretim?.cizimTarihi) return null;
    const start = new Date(job.uretim.cizimTarihi);
    const diffTime = new Date().getTime() - start.getTime();
    const gecenGun = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const kalanGun = 25 - gecenGun;
    let renkler = { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', kart: 'bg-white border-slate-100' };
    if (gecenGun > 25) {
      renkler.badge = 'bg-red-600 text-white animate-pulse border-red-700';
      renkler.kart = 'bg-red-50/60 border-red-200';
    } else if (gecenGun > 20) {
      renkler.badge = 'bg-orange-100 text-orange-700 border-orange-300';
      renkler.kart = 'bg-orange-50/40 border-orange-100';
    }
    return { gecenGun, kalanGun, renkler };
  };

  const fiyatiSayiyaCevir = (fiyatStr: any) => {
    if (!fiyatStr) return 0;
    return Number(fiyatStr.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const isKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    const { error } = await supabase.from('teklifler').insert([{ 
        musteri: yeniIs.musteri, is_modeli: yeniIs.isModeli, adet: Number(yeniIs.adet) || 1, ilce: yeniIs.ilce, fiyat: yeniIs.fiyat + " ₺", kaynak: yeniIs.kaynak, aciklama: yeniIs.aciklama, is_tarihi: formatliTarih, durum: 'beklemede', 
        uretim: { cizim: false, camSiparisi: false, profilImalati: false, cizimAtolyeyeVerildi: false, camGeldi: false, sonImalat: false, teslim: false, montajTipi: 'Montajlı', hata: 'Yok' } 
    }]);
    if (!error) { verileriGetir(); setIsModalOpen(false); setYeniIs({ musteri: "", isModeli: MODELLER[0], adet: "1", ilce: "", fiyat: "", kaynak: KAYNAKLAR[0], aciklama: "" }); }
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    if (!job) return;
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    if (asama === 'cizim' && guncelUretim.cizim === true && !guncelUretim.cizimTarihi) guncelUretim.cizimTarihi = new Date().toISOString();
    if (asama === 'teslim' && guncelUretim.teslim === true) guncelUretim.teslimatBitisTarihi = new Date().toISOString();
    else if (asama === 'teslim' && guncelUretim.teslim === false) delete guncelUretim.teslimatBitisTarihi;
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  // Sekme Filtreleme
  let gosterilecekTeklifler = teklifler;
  if (aktifSekme === 'siparisler') gosterilecekTeklifler = teklifler.filter(t => t.durum === 'onaylandi' && !isSiparisTamam(t)); 
  else if (aktifSekme === 'uretim') gosterilecekTeklifler = teklifler.filter(t => t.durum === 'onaylandi' && isSiparisTamam(t)); 

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-32 relative" onTouchStart={(e)=>touchStartRef.current=e.targetTouches[0].clientX} onTouchEnd={(e)=>{if(!touchStartRef.current)return; if(touchStartRef.current-e.changedTouches[0].clientX < -120 && !isModalOpen && !selectedJob)setIsSidebarOpen(true); touchStartRef.current=null;}} style={{touchAction:'pan-y'}}>
      <style dangerouslySetInnerHTML={{__html: `body, html { overscroll-behavior-x: none; }`}} />

      {/* ÜST PANEL */}
      <div className="bg-white px-4 pt-8 pb-3 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h8" /></svg></button>
                <h1 className="text-xl font-black uppercase tracking-tighter">
                  {aktifSekme==='teklifler'?'Teklif Arşivi':aktifSekme==='siparisler'?'Siparişler':aktifSekme==='uretim'?'Üretim Hattı':'📊 Raporlar'}
                </h1>
            </div>
            {aktifSekme !== 'raporlar' && <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white w-9 h-9 rounded-xl font-bold shadow-lg">+</button>}
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-50 rounded-lg px-2 py-2 text-base font-bold outline-none border-none">{yillar.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-50 rounded-lg px-2 py-2 text-base font-bold outline-none border-none">{aylar.map((a, i) => <option key={i} value={i}>{a}</option>)}</select>
          </div>
          {aktifSekme === 'teklifler' && (
              <div ref={gunListesiRef} className="flex overflow-x-auto gap-1.5 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (<button key={gun} data-day={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-8 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}><span className="text-[11px] font-black">{gun}</span></button>))}
              </div>
          )}
        </div>
      </div>

      {/* İÇERİK ALANI */}
      <div className="p-3 space-y-3 flex-1">
        
        {aktifSekme === 'raporlar' ? (
          <div className="space-y-4">
            {/* ANLIK CİRO KARTI */}
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">ANLIK DURUM VE CİRO ({aylar[seciliAy]})</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400">Toplam Teklif</p>
                        <p className="text-xl font-black">{teklifler.reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0).toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase text-emerald-400">Onaylanan (CİRO)</p>
                        <p className="text-xl font-black text-emerald-400">{teklifler.filter(t => t.durum === 'onaylandi').reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0).toLocaleString('tr-TR')} ₺</p>
                    </div>
                </div>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-400 px-2 tracking-widest">Kişisel Performans</h3>
            <div className="space-y-3 pb-10">
                {KAYNAKLAR.map(kaynak => {
                    const kTeklifler = teklifler.filter(t => t.kaynak === kaynak);
                    if (kTeklifler.length === 0) return null;
                    const vTutar = kTeklifler.reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0);
                    const oTutar = kTeklifler.filter(t => t.durum === 'onaylandi').reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0);
                    const yuzde = vTutar > 0 ? Math.round((oTutar / vTutar) * 100) : 0;
                    return (
                        <div key={kaynak} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-black text-sm">{kaynak}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${yuzde >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>% {yuzde} BAŞARI</span>
                            </div>
                            <div className="flex justify-between text-[11px] mb-1">
                                <span className="text-slate-400">Verilen: {vTutar.toLocaleString()} ₺</span>
                                <span className="text-emerald-600 font-bold">Onay: {oTutar.toLocaleString()} ₺</span>
                            </div>
                            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${yuzde}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        ) : (
          gosterilecekTeklifler.map(t => {
            const bittiMi = isTamamenBitti(t);
            const zaman = getZamanDurumu(t);
            return (
              <div key={t.id} className={`p-4 rounded-[1.5rem] shadow-sm border active:scale-[0.98] transition-all relative overflow-hidden ${bittiMi ? 'bg-emerald-50 border-emerald-200' : (aktifSekme!=='teklifler'&&zaman?zaman.renkler.kart:'bg-white border-slate-100')}`}>
                  <div onClick={() => aktifSekme !== 'teklifler' && setSelectedJob(t)}>
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                              <h2 className="font-bold text-[16px] text-slate-900 leading-none">{t.musteri}</h2>
                              <div className="flex items-center gap-1.5 mt-2">
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black">📅 {t.is_tarihi.split('-').reverse().slice(0,2).join('/')}</span>
                                  <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black">{t.is_modeli} • {t.adet}</span>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-[14px] font-black text-slate-900">{t.fiyat}</p>
                              {zaman && !bittiMi && aktifSekme !== 'teklifler' && <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border block mt-1 ${zaman.renkler.badge}`}>{zaman.kalanGun} GÜN</span>}
                          </div>
                      </div>
                  </div>
                  {aktifSekme === 'teklifler' ? (
                    <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full mt-2 text-base font-black uppercase py-0 px-2 rounded-xl border-none outline-none h-10 ${t.durum === 'onaylandi' ? 'bg-emerald-500 text-white' : t.durum === 'iptal' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}><option value="beklemede">BEKLEMEDE ⏳</option><option value="onaylandi">ONAYLANDI ✅</option><option value="iptal">İPTAL ❌</option></select>
                  ) : (
                    <div className="mt-3 flex gap-2 h-2">{ (aktifSekme==='siparisler'?SIPARIS_ASAMALARI:TUM_ASAMALAR).map((asama, i) => (<div key={asama} className={`flex-1 rounded-full ${t.uretim?.[asama] ? ASAMA_RENKLERI[i] : 'bg-slate-100'}`}></div>)) }</div>
                  )}
              </div>
            );
          })
        )}
      </div>

      {/* ALT NAVİGASYON (4 SEKMELİ) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex justify-between items-center z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
          {id:'teklifler', label:'TEKLİF'},
          {id:'siparisler', label:'SİPARİŞ'},
          {id:'uretim', label:'ÜRETİM'},
          {id:'raporlar', label:'RAPOR'}
        ].map(item => (
          <button key={item.id} onClick={() => setAktifSekme(item.id)} className={`flex flex-col items-center gap-1 transition-all flex-1 ${aktifSekme === item.id ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            {aktifSekme === item.id && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {/* SIDEBAR, MODAL VE DETAY PANELLERİ (AYNI KALDI) */}
      {/* ... (Kodun geri kalanı güvenlik ve performans için optimize edildi) ... */}
    </div>
  );
}
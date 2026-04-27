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
        query = query.like('is_tarihi', `${yilAy}-%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) console.error("Veri çekme hatası:", error);
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
    
    // Supabase Insert İşlemi
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

    if (error) { 
        // HATA EKRANA YAZDIRILIYOR (Neden kaydetmediğini buradan göreceğiz)
        alert("KAYIT HATASI: " + error.message);
    } else {
        verileriGetir(); 
        setIsModalOpen(false); 
        setYeniIs({ musteri: "", isModeli: MODELLER[0], adet: "1", ilce: "", fiyat: "", kaynak: KAYNAKLAR[0], aciklama: "" }); 
    }
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

  const formatTarihKisa = (tarihStr: string) => {
    if(!tarihStr) return "";
    const date = new Date(tarihStr);
    return `${date.getDate()} ${aylar[date.getMonth()]}`;
  };

  // Sekme Filtreleme
  let gosterilecekTeklifler = teklifler;
  if (aktifSekme === 'siparisler') gosterilecekTeklifler = teklifler.filter(t => t.durum === 'onaylandi' && !isSiparisTamam(t)); 
  else if (aktifSekme === 'uretim') gosterilecekTeklifler = teklifler.filter(t => t.durum === 'onaylandi' && isSiparisTamam(t)); 

  // Raporlar Hesaplamaları
  let toplamVerilenGenel = 0;
  let toplamOnaylananGenel = 0;

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-32 relative" onTouchStart={(e)=>touchStartRef.current=e.targetTouches[0].clientX} onTouchEnd={(e)=>{if(!touchStartRef.current)return; if(touchStartRef.current-e.changedTouches[0].clientX < -120 && !isModalOpen && !selectedJob)setIsSidebarOpen(true); touchStartRef.current=null;}} style={{touchAction:'pan-y'}}>
      <style dangerouslySetInnerHTML={{__html: `body, html { overscroll-behavior-x: none; }`}} />

      {/* ÜST PANEL */}
      <div className="bg-white px-4 pt-8 pb-3 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h8" /></svg></button>
                <h1 className="text-xl font-black uppercase tracking-tighter">
                  {aktifSekme==='teklifler'?'Teklif Arşivi':aktifSekme==='siparisler'?'Siparişler':aktifSekme==='uretim'?'Üretim Hattı':'Aylık Raporlar'}
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
        
        {/* ================= RAPORLAR EKRANI (EXCEL GÖRÜNÜMÜ) ================= */}
        {aktifSekme === 'raporlar' ? (
          <div className="space-y-4">
            <div className="bg-white border border-slate-300 shadow-sm overflow-x-auto">
              <table className="w-full text-xs font-black whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr className="border-b-2 border-slate-300 text-slate-700 uppercase tracking-tighter">
                    <th className="p-2 text-left border-r border-slate-200">KAYNAK</th>
                    <th className="p-2 text-right border-r border-slate-200">VERİLEN TEKLİF</th>
                    <th className="p-2 text-right border-r border-slate-200">ONAYLANAN</th>
                    <th className="p-2 text-center w-16">YÜZDE</th>
                  </tr>
                </thead>
                <tbody>
                  {KAYNAKLAR.map(kaynak => {
                      const kTeklifler = teklifler.filter(t => t.kaynak === kaynak);
                      
                      // Hiç teklif yoksa bile tabloda Excel'deki gibi "0" olarak görünsün
                      const vTutar = kTeklifler.reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0);
                      const oTutar = kTeklifler.filter(t => t.durum === 'onaylandi').reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0);
                      
                      toplamVerilenGenel += vTutar;
                      toplamOnaylananGenel += oTutar;

                      let yuzdeStr = "#DIV/0!";
                      let bgColor = "bg-amber-500 text-white"; // Varsayılan Div/0 rengi (Turuncu/Sarı)

                      if (vTutar > 0) {
                          const yuzdeNum = (oTutar / vTutar) * 100;
                          yuzdeStr = `%${yuzdeNum.toFixed(2)}`;
                          
                          if (yuzdeNum === 100) {
                              bgColor = "bg-teal-200 text-teal-900"; // Tamamı onaylı (Yeşilimsi)
                          } else if (yuzdeNum > 30) {
                              bgColor = "bg-amber-500 text-white"; // 30-99 arası Turuncu
                          } else {
                              bgColor = "bg-red-600 text-white"; // 30 Altı Kırmızı
                          }
                      }

                      return (
                          <tr key={kaynak} className="border-b border-slate-200">
                              <td className="p-2 text-left border-r border-slate-200 text-slate-700">{kaynak}</td>
                              <td className="p-2 text-right border-r border-slate-200">{vTutar > 0 ? vTutar.toLocaleString() : "0"}</td>
                              <td className="p-2 text-right border-r border-slate-200">{oTutar > 0 ? oTutar.toLocaleString() : "0"}</td>
                              <td className={`p-2 text-center ${bgColor}`}>{yuzdeStr}</td>
                          </tr>
                      );
                  })}
                  
                  {/* TOPLAM SATIRI */}
                  <tr className="border-t-2 border-slate-400 bg-slate-50 text-slate-900">
                      <td className="p-2 text-left border-r border-slate-200 uppercase">GENEL TOPLAM</td>
                      <td className="p-2 text-right border-r border-slate-200">{toplamVerilenGenel.toLocaleString()}</td>
                      <td className="p-2 text-right border-r border-slate-200">{toplamOnaylananGenel.toLocaleString()}</td>
                      <td className={`p-2 text-center ${toplamVerilenGenel > 0 ? (toplamOnaylananGenel/toplamVerilenGenel*100 > 30 ? 'bg-amber-500 text-white' : 'bg-red-600 text-white') : 'bg-amber-500 text-white'}`}>
                          {toplamVerilenGenel > 0 ? `%${((toplamOnaylananGenel / toplamVerilenGenel) * 100).toFixed(2)}` : '#DIV/0!'}
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================= LİSTE EKRANI ================= */
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
                    <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full mt-2 text-base font-black uppercase py-0 px-2 rounded-xl border-none outline-none h-10 shadow-sm ${t.durum === 'onaylandi' ? 'bg-emerald-500 text-white' : t.durum === 'iptal' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}><option value="beklemede">BEKLEMEDE ⏳</option><option value="onaylandi">ONAYLANDI ✅</option><option value="iptal">İPTAL ❌</option></select>
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

      {/* YENİ KAYIT MODALI (HATALAR İÇİN ALERT EKLENDİ) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-4 text-center uppercase tracking-tighter">YENİ İŞ EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-2.5">
              <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none border-none" placeholder="Müşteri Adı" value={yeniIs.musteri} onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <div className="grid grid-cols-3 gap-2">
                <select className="col-span-2 bg-slate-100 p-3 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.isModeli} onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    {MODELLER.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input required type="number" min="1" className="col-span-1 bg-slate-100 p-3 rounded-xl text-base font-bold outline-none text-center" placeholder="Adet" value={yeniIs.adet} onChange={(e) => setYeniIs({...yeniIs, adet: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none" placeholder="Fiyat (Sadece Rakam)" type="number" value={yeniIs.fiyat} onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <select className="bg-slate-100 p-3 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.kaynak} onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    {KAYNAKLAR.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none" placeholder="İlçe" value={yeniIs.ilce} onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              <textarea className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold h-16 resize-none outline-none" placeholder="Notlar..." value={yeniIs.aciklama} onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-black text-sm uppercase shadow-xl mt-1 active:scale-95">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-xs font-black uppercase py-2 text-center">İPTAL</button>
            </form>
          </div>
        </div>
      )}

      {/* SİDEBAR EKRANI */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white z-[120] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col justify-end pt-12">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4">U</div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Usta Takip</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Hoş Geldiniz, Emre Bey</p>
            </div>
            <div className="flex-1 p-4 space-y-2 mt-2">
              {['teklifler','siparisler','uretim', 'raporlar'].map((s)=>(
                <button key={s} onClick={()=>{setAktifSekme(s); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs uppercase transition-all ${aktifSekme===s ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
                    {s==='teklifler'?'Teklif Arşivi':s==='siparisler'?'Siparişler':s==='uretim'?'Üretim Hattı':'📊 Raporlar'}
                </button>
              ))}
            </div>
            <div className="p-6 border-t"><button onClick={() => setIsSidebarOpen(false)} className="w-full bg-slate-100 text-slate-500 p-4 rounded-2xl font-black text-xs uppercase">Kapat</button></div>
          </div>
        </>
      )}

    </div>
  );
}
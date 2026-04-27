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

// YENİ EKLENEN İŞ MODELLERİ VE KAYNAKLAR (USTALAR/ŞUBELER)
const MODELLER = ['Cam Balkon', 'Temizlenebilir Giyotin', 'Sürme Sistem', 'Bioclimatic', 'Teras Kapama', 'Veranda', 'Doğrama'];
const KAYNAKLAR = ['VOLKAN USTA', 'BARIŞ EREN', 'CEM ARSLAN', 'İNTERNET&GSM', 'INSTAGRAM', 'KAĞITHANE ŞUBE', 'PENDİK ŞUBE', 'MÜŞTERİ REFERANSI'];

export default function Home() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [aktifSekme, setAktifSekme] = useState('teklifler'); // teklifler, siparisler, uretim, raporlar
  
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
    } else if (aktifSekme === 'raporlar') {
        // Raporlar sekmesinde SEÇİLİ AYIN TÜM verileri çekilir
        query = query.like('is_tarihi', `${yilAy}-%`);
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

  const formatTarihKisa = (tarihStr: string) => {
    if(!tarihStr) return "";
    const date = new Date(tarihStr);
    return `${date.getDate()} ${aylar[date.getMonth()]}`;
  };

  // Fiyatı stringten sayıya çevirme fonksiyonu (Raporlama İçin)
  const fiyatiSayiyaCevir = (fiyatStr: string) => {
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

  let gosterilecekTeklifler = teklifler;
  if (aktifSekme === 'siparisler') gosterilecekTeklifler = teklifler.filter(t => !isSiparisTamam(t)); 
  else if (aktifSekme === 'uretim') gosterilecekTeklifler = teklifler.filter(t => isSiparisTamam(t)); 

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-28 relative" onTouchStart={(e)=>touchStartRef.current=e.targetTouches[0].clientX} onTouchEnd={(e)=>{if(!touchStartRef.current)return; if(touchStartRef.current-e.changedTouches[0].clientX < -120 && !isModalOpen && !selectedJob)setIsSidebarOpen(true); touchStartRef.current=null;}} style={{touchAction:'pan-y'}}>
      <style dangerouslySetInnerHTML={{__html: `body, html { overscroll-behavior-x: none; }`}} />

      {/* SİDEBAR MENÜ */}
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
                    {s==='teklifler'?'Teklif Arşivi':s==='siparisler'?'Siparişler':s==='uretim'?'Üretim Hattı':'📊 Aylık Raporlar'}
                </button>
              ))}
            </div>
            <div className="p-6 border-t"><button onClick={() => setIsSidebarOpen(false)} className="w-full bg-slate-100 text-slate-500 p-4 rounded-2xl font-black text-xs uppercase">Kapat</button></div>
          </div>
        </>
      )}

      {/* ÜST PANEL */}
      <div className="bg-white px-4 pt-8 pb-3 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h8" /></svg></button>
                <h1 className="text-xl font-black uppercase">{aktifSekme==='teklifler'?'Teklif Arşivi':aktifSekme==='siparisler'?'Siparişler':aktifSekme==='uretim'?'Üretim Hattı':'Aylık Raporlar'}</h1>
            </div>
            {aktifSekme !== 'raporlar' && <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-8 h-8 rounded-xl font-bold shadow-md">+</button>}
        </div>

        {/* RAPORLAR VEYA TEKLİFLER İÇİN TARİH SEÇİCİ */}
        {(aktifSekme === 'teklifler' || aktifSekme === 'raporlar') && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-lg px-2 py-2 text-base font-bold outline-none border-none">{yillar.map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-lg px-2 py-2 text-base font-bold outline-none border-none">{aylar.map((a, i) => <option key={i} value={i}>{a}</option>)}</select>
            </div>
            
            {/* GÜN SEÇİCİ (RAPORLARDA GİZLENİR) */}
            {aktifSekme === 'teklifler' && (
                <div ref={gunListesiRef} className="flex overflow-x-auto gap-1.5 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (<button key={gun} data-day={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-8 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-50 text-slate-400'}`}><span className="text-[11px] font-black">{gun}</span></button>))}
                </div>
            )}
          </div>
        )}
      </div>

      {/* İÇERİK ALANI */}
      <div className="p-3 space-y-3 flex-1">
        
        {/* ================= RAPORLAR EKRANI ================= */}
        {aktifSekme === 'raporlar' && (
            <div className="space-y-4">
                <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg">
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{aylar[seciliAy]} {seciliYil} ÖZETİ</h3>
                    <p className="text-sm font-medium">Aşağıdaki veriler seçili ay içinde sisteme girilen tüm teklifleri baz alır.</p>
                </div>

                <div className="space-y-3">
                    {KAYNAKLAR.map((kaynak) => {
                        const kaynakTeklifleri = teklifler.filter(t => t.kaynak === kaynak);
                        if (kaynakTeklifleri.length === 0) return null;

                        const toplamVerilen = kaynakTeklifleri.reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0);
                        const onaylananTeklifler = kaynakTeklifleri.filter(t => t.durum === 'onaylandi');
                        const toplamOnaylanan = onaylananTeklifler.reduce((acc, t) => acc + fiyatiSayiyaCevir(t.fiyat), 0);
                        
                        const yuzde = toplamVerilen > 0 ? Math.round((toplamOnaylanan / toplamVerilen) * 100) : 0;

                        // Excel mantığı renkler
                        let yuzdeRenk = 'bg-red-500 text-white'; // %30 Altı
                        if (yuzde >= 100) yuzdeRenk = 'bg-emerald-100 text-emerald-800'; // Tamamı onaylandı
                        else if (yuzde >= 30) yuzdeRenk = 'bg-amber-400 text-white'; // Ortalama başarı

                        return (
                            <div key={kaynak} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-black text-sm text-slate-800 mb-3 border-b pb-2 border-slate-50">{kaynak}</h4>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verilen Teklif</span>
                                    <span className="text-xs font-black">{toplamVerilen.toLocaleString('tr-TR')} ₺</span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Onaylanan</span>
                                    <span className="text-xs font-black text-emerald-600">{toplamOnaylanan.toLocaleString('tr-TR')} ₺</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Başarı Oranı</span>
                                    <span className={`text-[11px] font-black px-2 py-1 rounded-md shadow-sm ${yuzdeRenk}`}>
                                        % {yuzde}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ================= LİSTE EKRANI (Teklif/Sipariş/Üretim) ================= */}
        {aktifSekme !== 'raporlar' && gosterilecekTeklifler.map(t => {
          const bittiMi = isTamamenBitti(t);
          const gosterilenAsamalar = aktifSekme === 'siparisler' ? SIPARIS_ASAMALARI : TUM_ASAMALAR;
          const zaman = getZamanDurumu(t);
          const varHata = t.uretim?.hata && t.uretim.hata !== 'Yok';

          return (
            <div key={t.id} className={`p-3 rounded-2xl shadow-sm border active:scale-[0.98] transition-all relative overflow-hidden ${bittiMi ? 'bg-emerald-50 border-emerald-200' : (aktifSekme!=='teklifler'&&zaman?zaman.renkler.kart:'bg-white border-slate-100')}`}>
                {varHata && aktifSekme === 'uretim' && <div className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 text-center animate-pulse tracking-widest mb-2 rounded-lg">⚠️ HATA: {t.uretim.hata}</div>}

                <div onClick={() => aktifSekme !== 'teklifler' && setSelectedJob(t)}>
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1 pr-2">
                            <h2 className="font-bold text-[15px] text-slate-900 leading-tight">{t.musteri}</h2>
                            <div className="flex items-center flex-wrap gap-1 mt-1.5">
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black border border-slate-200">{aktifSekme==='teklifler' ? '📅 OLUŞTURMA' : '✅ ONAY'}: {formatTarihKisa(t.is_tarihi)}</span>
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black border border-blue-100">{t.is_modeli} • {t.adet || 1} ADET</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-right text-[13px] font-black text-slate-900 mb-1 whitespace-nowrap">{t.fiyat}</div>
                            {zaman && !bittiMi && aktifSekme !== 'teklifler' && (
                                <div className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border tracking-wider whitespace-nowrap ${zaman.renkler.badge}`}>
                                  {zaman.kalanGun <= 0 ? 'SÜRE DOLDU!' : `${zaman.kalanGun} GÜN KALDI`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {t.aciklama && <div className="mt-1.5 mb-1.5 bg-white/60 p-2 rounded-lg border-l-2 border-slate-300"><p className="text-[10px] text-slate-600 font-medium italic leading-snug">{t.aciklama}</p></div>}

                {aktifSekme === 'teklifler' ? (
                  <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full mt-1.5 text-base font-black uppercase py-0 px-2 rounded-lg border-none outline-none h-8 ${t.durum === 'onaylandi' ? 'bg-emerald-500 text-white' : t.durum === 'iptal' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}><option value="beklemede">BEKLEMEDE ⏳</option><option value="onaylandi">ONAYLANDI ✅</option><option value="iptal">İPTAL ❌</option></select>
                ) : (
                  <div className="mt-2 flex gap-2 items-center">
                        <select value={t.uretim?.montajTipi || 'Montajlı'} onChange={(e) => montajTipiGuncelle(t.id, e.target.value)} className={`text-[9px] font-black uppercase py-1 px-1.5 rounded-md border-none outline-none shadow-sm h-7 ${t.uretim?.montajTipi === 'Demonte' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}><option value="Montajlı">MONTAJLI</option><option value="Demonte">DEMONTE</option></select>
                        {bittiMi ? (
                            <div className="flex-1 bg-emerald-500 text-white text-[9px] font-black uppercase text-center py-1 rounded-md shadow-sm h-7 flex items-center justify-center gap-2">
                                <span>TESLİM EDİLDİ 🏁</span>
                                <span className="bg-white/20 px-1.5 rounded text-[8px]">T: {formatTarihKisa(t.uretim?.teslimatBitisTarihi)}</span>
                            </div>
                        ) : (
                            <div className="flex-1 flex gap-[2px] h-2">{gosterilenAsamalar.map((asama, i) => (<div key={asama} className={`flex-1 rounded-[1px] transition-all duration-300 ${t.uretim?.[asama] ? ASAMA_RENKLERI[i] : 'bg-slate-200/60'}`}></div>))}</div>
                        )}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-4 text-center uppercase">YENİ İŞ EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-2">
              <input required className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none border-none" placeholder="Müşteri Adı" value={yeniIs.musteri} onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <div className="grid grid-cols-3 gap-2">
                <select className="col-span-2 bg-slate-100 p-2.5 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.isModeli} onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    {MODELLER.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input required type="number" min="1" className="col-span-1 bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none text-center" placeholder="Adet" value={yeniIs.adet} onChange={(e) => setYeniIs({...yeniIs, adet: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none" placeholder="Fiyat" type="number" value={yeniIs.fiyat} onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <select className="bg-slate-100 p-2.5 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.kaynak} onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    {KAYNAKLAR.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <input required className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold outline-none" placeholder="İlçe" value={yeniIs.ilce} onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              <textarea className="w-full bg-slate-100 p-2.5 rounded-xl text-base font-bold h-14 resize-none outline-none" placeholder="Notlar..." value={yeniIs.aciklama} onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-black text-sm uppercase shadow-xl mt-1">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-xs font-black uppercase py-2">İPTAL</button>
            </form>
          </div>
        </div>
      )}

      {/* DETAY PANELİ */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded-t-[2rem] shadow-2xl flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedJob.musteri}</h2>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black border border-slate-200">ONAY: {formatTarihKisa(selectedJob.is_tarihi)}</span>
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black border border-blue-100">{selectedJob.is_modeli} • {selectedJob.adet || 1} ADET</span>
                    </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-300 text-xl font-bold bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            </div>
            <textarea value={selectedJob.aciklama || ''} onChange={(e) => aciklamaGuncelle(selectedJob.id, e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-base font-medium h-16 border border-slate-100 outline-none" placeholder="İş notları..." />
            <div className="grid grid-cols-2 gap-2">
              {SIPARIS_ASAMALARI.map((item, idx) => (<button key={item} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item)} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all ${selectedJob.uretim?.[item] ? `${ASAMA_RENKLERI[idx]} border-transparent text-white shadow-md` : 'bg-white border-slate-100 text-slate-400'}`}><span className="text-[9px] font-black uppercase text-center leading-tight">{item==='cizim'?'Çizim':item==='camSiparisi'?'Cam Sip.':item==='profilImalati'?'Profil İmalatı':item==='cizimAtolyeyeVerildi'?'Atölyeye Verildi':'Cam Geldi'}</span><div className="text-xs">{selectedJob.uretim?.[item] ? '✓' : '○'}</div></button>))}
              {aktifSekme === 'uretim' && URETIM_ASAMALARI.map((item, idx) => (<button key={item} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item)} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all ${selectedJob.uretim?.[item] ? `${ASAMA_RENKLERI[idx+5]} border-transparent text-white shadow-md` : 'bg-white border-slate-100 text-slate-400'}`}><span className="text-[9px] font-black uppercase text-center leading-tight">{item==='sonImalat'?'Son İmalat':'Teslim'}</span><div className="text-xs">{selectedJob.uretim?.[item] ? '✓' : '○'}</div></button>))}
            </div>

            {aktifSekme === 'uretim' && (
              <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <span className="text-[10px] font-black text-red-700 uppercase whitespace-nowrap">⚠️ HATA BİLDİR:</span>
                <select value={selectedJob.uretim?.hata || 'Yok'} onChange={(e) => uretimHataGuncelle(selectedJob.id, e.target.value)} className="flex-1 bg-white text-red-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-red-200 outline-none">
                    {HATA_TURLERI.map(hata => <option key={hata} value={hata}>{hata}</option>)}
                </select>
              </div>
            )}

            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-sm uppercase mt-1">KAPAT</button>
          </div>
        </div>
      )}
    </div>
  );
}
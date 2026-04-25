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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "Cam Balkon", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" });

  useEffect(() => {
    verileriGetir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seciliGun, seciliAy, seciliYil, aktifSekme]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    let query = supabase.from('teklifler').select('*');
    
    if (aktifSekme === 'teklifler') {
        query = query.eq('is_tarihi', formatliTarih);
    } else if (aktifSekme === 'siparisler') {
        query = query.eq('durum', 'onaylandi').eq('siparis_bitti', false);
    } else if (aktifSekme === 'uretim') {
        query = query.eq('durum', 'onaylandi').eq('siparis_bitti', true);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setTeklifler(data);
    setYukleniyor(false);
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
        montaj_tipi: 'Montajlı', 
        siparis_bitti: false,    
        uretim: { 
            cizim: false, camSiparisi: false, profil: false, camGeldi: false, 
            sonImalat: false, teslim: false 
        } 
    }]);
    if (!error) { 
        verileriGetir(); 
        setIsModalOpen(false); 
        setYeniIs({ musteri: "", isModeli: "Cam Balkon", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" }); 
    }
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  const aciklamaGuncelle = async (id: number, yeniMetin: string) => {
    const yeniListe = teklifler.map(t => t.id === id ? { ...t, aciklama: yeniMetin } : t);
    setTeklifler(yeniListe);
    setSelectedJob(yeniListe.find(t => t.id === id));
    await supabase.from('teklifler').update({ aciklama: yeniMetin }).eq('id', id);
  };

  const montajTipiGuncelle = async (id: number, yeniTip: string) => {
    const yeniListe = teklifler.map(t => t.id === id ? { ...t, montaj_tipi: yeniTip } : t);
    setTeklifler(yeniListe);
    await supabase.from('teklifler').update({ montaj_tipi: yeniTip }).eq('id', id);
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    
    const siparisBittiMi = guncelUretim.cizim && guncelUretim.camSiparisi && guncelUretim.profil && guncelUretim.camGeldi;

    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim, siparis_bitti: siparisBittiMi } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim, siparis_bitti: siparisBittiMi });
    
    await supabase.from('teklifler').update({ uretim: guncelUretim, siparis_bitti: siparisBittiMi }).eq('id', teklifId);
    
    if (siparisBittiMi && aktifSekme === 'siparisler') {
        setTimeout(() => verileriGetir(), 500); 
    }
  };

  const ilerlemeHesapla = (uretim: any, asamaTipi: string) => {
    if (!uretim) return 0;
    
    let incelenecekler: any[] = []; 
    
    if (asamaTipi === 'siparis') incelenecekler = [uretim.cizim, uretim.camSiparisi, uretim.profil, uretim.camGeldi];
    else if (asamaTipi === 'uretim') incelenecekler = [uretim.sonImalat, uretim.teslim];
    else incelenecekler = Object.values(uretim); 

    const tamamlananlar = incelenecekler.filter(v => v === true).length;
    return incelenecekler.length > 0 ? Math.round((tamamlananlar / incelenecekler.length) * 100) : 0;
  };

  const getSayfaBasligi = () => {
      if(aktifSekme === 'teklifler') return 'Teklif Havuzu';
      if(aktifSekme === 'siparisler') return 'Sipariş ve Hazırlık';
      return 'Üretim Hattı';
  }

  const handleKartTiklama = (t: any) => {
      if (aktifSekme === 'siparisler' || aktifSekme === 'uretim') {
          setSelectedJob(t);
      }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-6 relative">
      
      {/* SİDEBAR (YAN MENÜ) */}
      {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] transition-opacity" onClick={() => setIsSidebarOpen(false)}>
              <div className="w-[70%] max-w-[300px] bg-slate-900 h-full p-8 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 text-white/50 text-2xl font-black">✕</button>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mb-2">USTA CAM BALKON</p>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-12">MENÜ</h2>
                  
                  <div className="space-y-4">
                      <button onClick={() => {setAktifSekme('teklifler'); setIsSidebarOpen(false);}} className={`w-full text-left py-3 border-b border-white/10 ${aktifSekme === 'teklifler' ? 'text-blue-500 font-black' : 'text-white/70 font-bold'}`}>1. Teklif Havuzu</button>
                      <button onClick={() => {setAktifSekme('siparisler'); setIsSidebarOpen(false);}} className={`w-full text-left py-3 border-b border-white/10 ${aktifSekme === 'siparisler' ? 'text-blue-500 font-black' : 'text-white/70 font-bold'}`}>2. Sipariş ve Hazırlık</button>
                      <button onClick={() => {setAktifSekme('uretim'); setIsSidebarOpen(false);}} className={`w-full text-left py-3 border-b border-white/10 ${aktifSekme === 'uretim' ? 'text-blue-500 font-black' : 'text-white/70 font-bold'}`}>3. Üretim Hattı</button>
                  </div>

                  <div className="mt-auto opacity-30 text-[9px] text-white font-bold uppercase tracking-widest text-center">
                      Usta Takip v2.0
                  </div>
              </div>
          </div>
      )}

      {/* ÜST PANEL */}
      <div className="bg-white px-5 pt-8 pb-4 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col gap-1 w-6">
                    <span className="w-full h-1 bg-slate-900 rounded-full"></span>
                    <span className="w-3/4 h-1 bg-slate-900 rounded-full"></span>
                    <span className="w-full h-1 bg-slate-900 rounded-full"></span>
                </button>
                <h1 className="text-xl font-black tracking-tighter uppercase">{getSayfaBasligi()}</h1>
            </div>
            {aktifSekme === 'teklifler' && (
                <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-9 h-9 rounded-[0.8rem] font-bold shadow-lg flex items-center justify-center">+</button>
            )}
        </div>
        
        {aktifSekme === 'teklifler' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-base font-bold outline-none border-none">
                {yillar.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-base font-bold outline-none border-none">
                {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
              </select>
            </div>
            <div className="flex overflow-x-auto gap-1.5 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (
                <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-9 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                  <span className="text-[11px] font-black">{gun}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LİSTE ALANI */}
      <div className="p-3 space-y-3 flex-1">
        {yukleniyor ? (
             <div className="text-center py-10 text-[10px] font-black uppercase text-slate-300">Yükleniyor...</div>
        ) : teklifler.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 text-[10px] font-black uppercase text-slate-300 tracking-widest">Kayıt Yok</div>
        ) : (
        teklifler.map(t => {
          let ilerlemeYuzdesi = 0;
          if(aktifSekme === 'siparisler') ilerlemeYuzdesi = ilerlemeHesapla(t.uretim, 'siparis');
          if(aktifSekme === 'uretim') ilerlemeYuzdesi = ilerlemeHesapla(t.uretim, 'uretim');

          return (
            <div key={t.id} onClick={() => handleKartTiklama(t)} className="bg-white p-4 rounded-[1.2rem] shadow-sm border border-slate-100 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 pr-2">
                        <h2 className="font-bold text-base leading-tight text-slate-800">{t.musteri}</h2>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{t.is_modeli}</span>
                            <span className="text-[9px] text-slate-300">•</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{t.ilce}</span>
                            
                            {(aktifSekme === 'siparisler' || aktifSekme === 'uretim') && (
                                <select 
                                    onClick={(e) => e.stopPropagation()} 
                                    value={t.montaj_tipi || 'Montajlı'} 
                                    onChange={(e) => montajTipiGuncelle(t.id, e.target.value)}
                                    className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-black uppercase outline-none ml-1 border-none cursor-pointer"
                                >
                                    <option value="Montajlı">Montajlı</option>
                                    <option value="Demonte">Demonte</option>
                                </select>
                            )}
                        </div>
                    </div>
                    <div className="text-right text-sm font-black text-slate-900">{t.fiyat}</div>
                </div>

                {aktifSekme === 'teklifler' && t.aciklama && (
                  <div className="mt-2 mb-2 bg-slate-50 p-2 rounded-lg border-l-2 border-slate-200">
                    <p className="text-[10px] text-slate-500 font-medium italic leading-snug">{t.aciklama}</p>
                  </div>
                )}

                {aktifSekme === 'siparisler' || aktifSekme === 'uretim' ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase text-blue-600">
                        <span>{aktifSekme === 'siparisler' ? 'Sipariş İlerleme' : 'Üretim İlerleme'}</span>
                        <span>%{ilerlemeYuzdesi}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${ilerlemeYuzdesi}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <select 
                    value={t.durum} 
                    onChange={(e) => durumGuncelle(t.id, e.target.value)} 
                    className={`w-full mt-2 text-sm font-black uppercase py-2 px-3 rounded-lg border-none outline-none transition-all shadow-sm leading-tight h-10 ${
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

      {/* DETAY PANELİ (SİPARİŞ & ÜRETİM) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded-t-[2rem] shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedJob.musteri}</h2>
                    <div className="flex gap-2 items-center mt-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedJob.is_modeli}</p>
                        <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded uppercase font-black">{selectedJob.montaj_tipi || 'Montajlı'}</span>
                    </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-300 text-xl font-bold">✕</button>
            </div>
            
            <textarea value={selectedJob.aciklama || ''} onChange={(e) => aciklamaGuncelle(selectedJob.id, e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-base font-medium h-20 border-none outline-none focus:ring-1 focus:ring-blue-200" placeholder="İş notları..." />
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              {aktifSekme === 'siparisler' ? (
                  [ { key: 'cizim', label: 'Çizim' }, { key: 'camSiparisi', label: 'Cam Sip.' }, { key: 'profil', label: 'Profil' }, { key: 'camGeldi', label: 'Cam Geldi' } ].map((item) => (
                    <button type="button" key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <span className="text-[10px] font-black uppercase">{item.label}</span>
                        <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                    </button>
                  ))
              ) : (
                  [ { key: 'sonImalat', label: 'Son İmalat' }, { key: 'teslim', label: 'Teslim / Montaj' } ].map((item) => (
                    <button type="button" key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <span className="text-[10px] font-black uppercase">{item.label}</span>
                        <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                    </button>
                  ))
              )}
            </div>
            {aktifSekme === 'siparisler' && (
                <p className="text-[8px] font-bold text-amber-500 uppercase text-center">* 4 Maddeyi işaretlediğinizde iş otomatik olarak Üretim Hattına aktarılır.</p>
            )}
            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-sm uppercase mt-2">KAPAT</button>
          </div>
        </div>
      )}

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-4 text-center uppercase tracking-tighter">YENİ İŞ EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-2.5">
              <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none border-none" placeholder="Müşteri Adı" value={yeniIs.musteri} onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-100 p-3 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.isModeli} onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    <option value="Cam Balkon">Cam Balkon</option><option value="Giyotin">Giyotin</option><option value="Sürme">Sürme</option><option value="Teras">Teras</option>
                </select>
                <select className="bg-slate-100 p-3 rounded-xl text-base font-bold border-none outline-none" value={yeniIs.kaynak} onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    <option value="Instagram">Instagram</option><option value="Referans">Referans</option><option value="Web">Web</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none border-none" placeholder="Fiyat" type="number" value={yeniIs.fiyat} onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold outline-none border-none" placeholder="İlçe" value={yeniIs.ilce} onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <textarea className="w-full bg-slate-100 p-3 rounded-xl text-base font-bold h-16 resize-none outline-none border-none" placeholder="Notlar..." value={yeniIs.aciklama} onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-sm uppercase shadow-xl mt-1 active:scale-95">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-xs font-black uppercase py-2 text-center">İPTAL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
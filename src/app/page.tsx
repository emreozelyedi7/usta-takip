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

  // Tüm form alanları tanımlandı
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
        ...yeniIs, 
        is_tarihi: formatliTarih, 
        fiyat: yeniIs.fiyat + " ₺", 
        durum: 'beklemede', 
        uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false } 
    }]);
    if (!error) { 
        verileriGetir(); 
        setIsModalOpen(false); 
        setYeniIs({ musteri: "", isModeli: "Cam Balkon", ilce: "", fiyat: "", kaynak: "Instagram", aciklama: "" }); 
    }
  };

  const uretimAsamasiGuncelle = async (teklifId: number, asama: string) => {
    const job = teklifler.find(t => t.id === teklifId);
    const guncelUretim = { ...job.uretim, [asama]: !job.uretim?.[asama] };
    const yeniListe = teklifler.map(t => t.id === teklifId ? { ...t, uretim: guncelUretim } : t);
    setTeklifler(yeniListe);
    setSelectedJob({ ...job, uretim: guncelUretim });
    await supabase.from('teklifler').update({ uretim: guncelUretim }).eq('id', teklifId);
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen text-slate-900 overflow-x-hidden flex flex-col pb-32">
      
      {/* ÜST PANEL - LOGO VE TARİH GERİ GELDİ */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.3em] mb-1 text-center">USTA CAM BALKON</p>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase">{aktifSekme === 'teklifler' ? 'Teklif Arşivi' : 'Üretim Hattı'}</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white w-10 h-10 rounded-2xl font-bold shadow-lg flex items-center justify-center">+</button>
        </div>
        
        {aktifSekme === 'teklifler' && (
          <div className="space-y-4">
            {/* YIL VE AY SEÇİMİ GERİ GELDİ */}
            <div className="flex gap-2">
              <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="flex-1 bg-slate-50 rounded-xl px-3 py-3 text-xs font-bold outline-none border-none">
                {yillar.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="flex-1 bg-slate-50 rounded-xl px-3 py-3 text-xs font-bold outline-none border-none">
                {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
              </select>
            </div>
            {/* GÜN SEÇİCİ */}
            <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: new Date(seciliYil, seciliAy + 1, 0).getDate() }, (_, i) => i + 1).map(gun => (
                <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-10 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                  <span className="text-[11px] font-black">{gun}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LİSTE ALANI */}
      <div className="p-4 space-y-4 flex-1">
        {yukleniyor ? (
            <div className="text-center py-10 text-[10px] font-black uppercase text-slate-300">Yükleniyor...</div>
        ) : teklifler.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 text-[10px] font-black uppercase text-slate-300 tracking-widest">Kayıt Bulunmuyor</div>
        ) : (
            teklifler.map(t => {
                const yuzde = ilerlemeHesapla(t.uretim);
                return (
                    <div key={t.id} onClick={() => aktifSekme === 'uretim' && setSelectedJob(t)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="font-bold text-lg leading-none mb-1 text-slate-800">{t.musteri}</h2>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.is_modeli} — {t.ilce}</p>
                                <span className="text-[8px] bg-slate-50 px-2 py-1 rounded-md font-bold text-slate-400 uppercase mt-2 inline-block border border-slate-100">{t.kaynak}</span>
                            </div>
                            <div className="text-right text-sm font-black text-slate-900">{t.fiyat}</div>
                        </div>

                        {aktifSekme === 'uretim' ? (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-blue-600">
                                <span>İşlem Durumu</span>
                                <span>%{yuzde}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${yuzde}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full mt-4 text-[10px] font-black uppercase py-3 px-4 rounded-2xl border-none outline-none transition-all ${
                            t.durum === 'onaylandi' ? 'bg-emerald-500 text-white' : 
                            t.durum === 'iptal' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'
                          }`}>
                            <option value="beklemede">BEKLEMEDE ⏳</option>
                            <option value="onaylandi">ONAYLANDI ✅</option>
                            <option value="iptal">İPTAL ❌</option>
                          </select>
                        )}
                    </div>
                );
            })
        )}
      </div>

      {/* ÜRETİM DETAY PANELİ */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{selectedJob.musteri}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedJob.is_modeli}</p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-300 text-xl font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8 text-center">
              {[
                { key: 'cizim', label: 'Çizim' },
                { key: 'camSiparisi', label: 'Cam Sip.' },
                { key: 'profil', label: 'Profil' },
                { key: 'camGeldi', label: 'Cam Geldi' },
                { key: 'atolye', label: 'Atölye' },
                { key: 'teslim', label: 'Teslim' }
              ].map((item) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <span className="text-[10px] font-black uppercase">{item.label}</span>
                    <div className="text-xs">{selectedJob.uretim?.[item.key] ? '✓' : '○'}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest">Kapat</button>
          </div>
        </div>
      )}

      {/* ALT MENÜ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-12 py-6 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-2xl">
        <button onClick={() => setAktifSekme('teklifler')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'teklifler' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">TEKLİFLER</span>
            {aktifSekme === 'teklifler' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
        <button onClick={() => setAktifSekme('uretim')} className={`flex flex-col items-center gap-1.5 transition-all ${aktifSekme === 'uretim' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">ÜRETİM</span>
            {aktifSekme === 'uretim' && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
        </button>
      </div>

      {/* YENİ KAYIT MODALI - TÜM ALANLAR GERİ GELDİ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl my-auto">
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center uppercase tracking-tighter">YENİ TEKLİF EKLE</h3>
            <form onSubmit={isKaydet} className="space-y-3">
              <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-500 transition-all" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-4 rounded-2xl text-[10px] font-bold outline-none border-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                    <option value="Cam Balkon">Cam Balkon</option>
                    <option value="Giyotin">Giyotin</option>
                    <option value="Sürme">Sürme</option>
                    <option value="Teras Kapama">Teras</option>
                    <option value="Bioklimatik">Bioklimatik</option>
                </select>
                <select className="bg-slate-50 p-4 rounded-2xl text-[10px] font-bold outline-none border-none" onChange={(e) => setYeniIs({...yeniIs, kaynak: e.target.value})}>
                    <option value="Instagram">Instagram</option>
                    <option value="Referans">Referans</option>
                    <option value="Web Sitesi">Web Sitesi</option>
                    <option value="Branda">Branda</option>
                    <option value="Gelen Gsm">Gelen Gsm</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-500" placeholder="Fiyat (₺)" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-500" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>

              <textarea className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-500 h-20 resize-none" placeholder="Notlar / Açıklama..." onChange={(e) => setYeniIs({...yeniIs, aciklama: e.target.value})}></textarea>
              
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-xl mt-4 active:scale-95 transition-all">İŞİ KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-[10px] font-black uppercase py-2 text-center">İPTAL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
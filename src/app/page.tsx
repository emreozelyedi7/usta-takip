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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('teklifler'); // 'teklifler' veya 'imalat'
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth());
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", aciklama: "" });

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
    const { error } = await supabase.from('teklifler').insert([{ ...yeniIs, is_tarihi: formatliTarih, fiyat: yeniIs.fiyat + " ₺", durum: 'beklemede', uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false } }]);
    if (!error) { verileriGetir(); setIsModalOpen(false); setYeniIs({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", aciklama: "" }); }
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
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

  return (
    <div className="max-w-xl mx-auto bg-slate-50 min-h-screen antialiased text-slate-900 overflow-x-hidden relative">
      
      {/* SOL AÇILIR MENÜ (SIDEBAR) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-[110] transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out shadow-2xl`}>
        <div className="p-8">
          <h2 className="text-white font-black text-xl tracking-tighter mb-10">MENÜ</h2>
          <nav className="space-y-6">
            <button onClick={() => { setAktifSekme('teklifler'); setIsMenuOpen(false); }} className={`flex items-center gap-3 w-full text-left font-bold text-sm uppercase tracking-widest ${aktifSekme === 'teklifler' ? 'text-blue-400' : 'text-slate-400'}`}>
              <span className="text-xl">📋</span> Teklif Arşivi
            </button>
            <button onClick={() => { setAktifSekme('imalat'); setIsMenuOpen(false); }} className={`flex items-center gap-3 w-full text-left font-bold text-sm uppercase tracking-widest ${aktifSekme === 'imalat' ? 'text-blue-400' : 'text-slate-400'}`}>
              <span className="text-xl">🏗️</span> İmalat Takip
            </button>
          </nav>
        </div>
        <button onClick={() => setIsMenuOpen(false)} className="absolute bottom-10 left-8 text-slate-500 font-bold text-xs uppercase">Kapat</button>
      </div>

      {/* KARARTMA ARKA PLAN */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-[105] backdrop-blur-sm transition-opacity"></div>}

      {/* ÜST LOGO VE MENÜ BUTONU */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex justify-between items-start">
        <button onClick={() => setIsMenuOpen(true)} className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-100">☰</button>
        <div className="text-right">
          <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.3em] mb-1 leading-none">USTA CAM BALKON</p>
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Usta Takip</h1>
        </div>
      </div>

      {/* TARİH SEÇİCİ (SADECE TEKLİFLERDE GÖRÜNÜR) */}
      {aktifSekme === 'teklifler' && (
        <div className="bg-white px-6 pb-6 shadow-sm border-b border-slate-100">
          <div className="flex gap-2 mb-4">
            <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold border-none outline-none">
              {yillar.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold border-none outline-none">
              {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
            </select>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar scroll-smooth">
            {ayinGunleriniGetir().map(gun => (
              <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-10 h-12 rounded-xl flex items-center justify-center transition-all font-black text-xs ${seciliGun === gun ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                {gun}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BAŞLIK VE EKLE BUTONU */}
      <div className="p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {aktifSekme === 'teklifler' ? `${seciliGun} ${aylar[seciliAy]} Teklifleri` : 'İmalat & Üretim'}
          </h2>
        </div>
        {aktifSekme === 'teklifler' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white w-10 h-10 rounded-full font-bold shadow-lg shadow-blue-100 flex items-center justify-center text-xl">+</button>
        )}
      </div>

      {/* LİSTELEME */}
      <div className="px-6 space-y-4 pb-32">
        {teklifler.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 text-[10px] font-black uppercase tracking-widest">Kayıt Bulunmuyor</div>
        ) : (
          teklifler.map(t => {
            const yuzde = ilerlemeHesapla(t.uretim);
            return (
              <div key={t.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-bold text-lg text-slate-900">{t.musteri}</h2>
                  <span className="text-sm font-black text-slate-900">{t.fiyat}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">{t.is_modeli} — {t.ilce}</p>
                
                {aktifSekme === 'teklifler' ? (
                  <div className="flex gap-2 items-center pt-4 border-t border-slate-50">
                    <select 
                      value={t.durum} 
                      onChange={(e) => durumGuncelle(t.id, e.target.value)}
                      className={`flex-1 text-[10px] font-black uppercase py-3 px-4 rounded-2xl border-none outline-none ${
                        t.durum === 'onaylandi' ? 'bg-emerald-50 text-emerald-600' : 
                        t.durum === 'iptal' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <option value="beklemede">Beklemede ⏳</option>
                      <option value="onaylandi">Onaylandı ✅</option>
                      <option value="iptal">İptal Edildi ❌</option>
                    </select>
                  </div>
                ) : (
                  <button onClick={() => setSelectedJob(t)} className="w-full pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase">Üretim: %{yuzde}</span>
                      <span className="text-lg">→</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${yuzde}%` }}></div>
                    </div>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* İMALAT DETAY MODALI */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[150] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[3rem] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedJob(null)} className="absolute right-8 top-8 text-slate-300 text-xl font-bold">✕</button>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedJob.musteri}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">{selectedJob.is_modeli} - {selectedJob.ilce}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                { key: 'cizim', label: 'Çizim' },
                { key: 'camSiparisi', label: 'Cam Sip.' },
                { key: 'profil', label: 'Profil' },
                { key: 'camGeldi', label: 'Cam Geldi' },
                { key: 'atolye', label: 'Atölye' },
                { key: 'teslim', label: 'Teslim' }
              ].map((item) => (
                <button key={item.key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, item.key)} 
                  className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all gap-2 ${selectedJob.uretim?.[item.key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <span className="text-[10px] font-black uppercase">{item.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${selectedJob.uretim?.[item.key] ? 'border-white bg-white/20' : 'border-slate-100'}`}>
                    {selectedJob.uretim?.[item.key] ? '✓' : ''}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest">Kaydet ve Kapat</button>
          </div>
        </div>
      )}

      {/* YENİ KAYIT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[150] flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center uppercase">Yeni Teklif Ekle</h3>
            <form onSubmit={isKaydet} className="space-y-4 pb-10">
              <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-blue-500" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <select required className="w-full bg-slate-50 p-5 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modeli...</option>
                <option value="Cam Balkon">Cam Balkon</option>
                <option value="Giyotin">Giyotin</option>
                <option value="Sürme Sistem">Sürme</option>
                <option value="Teras Kapama">Teras</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="Fiyat" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 text-[10px] font-black uppercase py-4">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
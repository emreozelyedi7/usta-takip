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
  const [aktifSekme, setAktifSekme] = useState('teklifler'); 
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
      
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-[110] transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 shadow-2xl`}>
        <div className="p-8">
          <h2 className="text-white font-black text-xl mb-10 tracking-tighter">USTA TAKİP</h2>
          <nav className="space-y-4">
            <button onClick={() => { setAktifSekme('teklifler'); setIsMenuOpen(false); }} className={`w-full p-4 rounded-xl text-left font-bold text-xs uppercase tracking-widest transition-colors ${aktifSekme === 'teklifler' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>📋 Teklif Havuzu</button>
            <button onClick={() => { setAktifSekme('imalat'); setIsMenuOpen(false); }} className={`w-full p-4 rounded-xl text-left font-bold text-xs uppercase tracking-widest transition-colors ${aktifSekme === 'imalat' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>🏗️ İmalat Takip</button>
          </nav>
        </div>
      </div>
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/60 z-[105] backdrop-blur-sm"></div>}

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40">
        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-xl shadow-sm">☰</button>
        <div className="text-right">
          <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.3em] mb-0.5">USTA CAM BALKON</p>
          <h1 className="text-xl font-black uppercase tracking-tight">{aktifSekme === 'teklifler' ? 'Teklifler' : 'İmalat'}</h1>
        </div>
      </div>

      {/* TARİH VE GÜN ŞERİDİ */}
      {aktifSekme === 'teklifler' && (
        <div className="bg-white px-6 pb-6 border-b border-slate-100 shadow-sm">
          <div className="flex gap-2 mb-4">
            <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold border-none outline-none">{yillar.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold border-none outline-none">{aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}</select>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            {ayinGunleriniGetir().map(gun => (
              <button key={gun} onClick={() => setSeciliGun(gun)} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${seciliGun === gun ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>{gun}</button>
            ))}
          </div>
        </div>
      )}

      {/* LİSTE */}
      <div className="p-6 pb-32">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {aktifSekme === 'teklifler' ? `${seciliGun} ${aylar[seciliAy]} Kayıtları` : 'Onaylı İşler'}
          </h2>
          {aktifSekme === 'teklifler' && <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white w-10 h-10 rounded-full font-bold shadow-lg shadow-blue-100 flex items-center justify-center text-xl">+</button>}
        </div>

        <div className="space-y-4">
          {teklifler.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 text-[10px] font-black uppercase">Kayıt Yok</div>
          ) : (
            teklifler.map(t => {
              const yuzde = ilerlemeHesapla(t.uretim);
              return (
                <div key={t.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="font-bold text-lg text-slate-900">{t.musteri}</h2>
                    <span className="text-sm font-black">{t.fiyat}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">{t.is_modeli} — {t.ilce}</p>
                  {aktifSekme === 'teklifler' ? (
                    <select value={t.durum} onChange={(e) => durumGuncelle(t.id, e.target.value)} className={`w-full text-[10px] font-black uppercase py-3 px-4 rounded-2xl border-none outline-none ${t.durum === 'onaylandi' ? 'bg-emerald-50 text-emerald-600' : t.durum === 'iptal' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      <option value="beklemede">Beklemede ⏳</option>
                      <option value="onaylandi">Onaylandı ✅</option>
                      <option value="iptal">İptal ❌</option>
                    </select>
                  ) : (
                    <button onClick={() => setSelectedJob(t)} className="w-full pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] font-black text-blue-600 uppercase">İlerleme: %{yuzde}</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${yuzde}%` }}></div></div>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* YENİ KAYIT MODALI - KLAVYE DOSTU TASARIM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[200] flex items-start justify-center pt-10 px-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-10">
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center uppercase">Yeni Teklif</h3>
            <form onSubmit={isKaydet} className="space-y-3">
              <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-blue-500" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <select required className="w-full bg-slate-50 p-4 rounded-xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modeli Seçin...</option>
                <option value="Cam Balkon">Cam Balkon</option>
                <option value="Giyotin">Giyotin</option>
                <option value="Sürme">Sürme</option>
                <option value="Teras">Teras</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none" placeholder="Fiyat" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-4">KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 text-[10px] font-black uppercase py-2">Vazgeç</button>
            </form>
          </div>
        </div>
      )}

      {/* İMALAT MODALI */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedJob(null)} className="absolute right-8 top-8 text-slate-300 text-xl font-bold">✕</button>
            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase">{selectedJob.musteri} İMALAT</h2>
            <div className="grid grid-cols-2 gap-2">
              {['cizim', 'camSiparisi', 'profil', 'camGeldi', 'atolye', 'teslim'].map((key) => (
                <button key={key} onClick={() => uretimAsamasiGuncelle(selectedJob.id, key)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedJob.uretim?.[key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <span className="text-[9px] font-black uppercase">{key === 'cizim' ? 'Çizim' : key === 'camSiparisi' ? 'Cam Sip.' : key === 'profil' ? 'Profil' : key === 'camGeldi' ? 'Cam Geldi' : key === 'atolye' ? 'Atölye' : 'Teslim'}</span>
                  <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">{selectedJob.uretim?.[key] ? '✓' : ''}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedJob(null)} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-[10px] uppercase mt-8">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
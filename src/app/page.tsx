"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Takvim Yönetimi
  const simdi = new Date();
  const [seciliYil, setSeciliYil] = useState(simdi.getFullYear());
  const [seciliAy, setSeciliAy] = useState(simdi.getMonth()); // 0-11
  const [seciliGun, setSeciliGun] = useState(simdi.getDate());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const yillar = [2024, 2025, 2026, 2027];

  const [yeniIs, setYeniIs] = useState({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", aciklama: "" });

  useEffect(() => {
    verileriGetir();
  }, [seciliGun, seciliAy, seciliYil]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    // Seçili günü formatla: YYYY-MM-DD
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    
    const { data } = await supabase
      .from('teklifler')
      .select('*')
      .eq('is_tarihi', formatliTarih)
      .order('created_at', { ascending: false });
    
    if (data) setTeklifler(data);
    setYukleniyor(false);
  };

  const ayinGunleriniGetir = () => {
    const gunSayisi = new Date(seciliYil, seciliAy + 1, 0).getDate();
    return Array.from({ length: gunSayisi }, (_, i) => i + 1);
  };

  const isKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatliTarih = `${seciliYil}-${String(seciliAy + 1).padStart(2, '0')}-${String(seciliGun).padStart(2, '0')}`;
    
    const { error } = await supabase.from('teklifler').insert([
      {
        ...yeniIs,
        is_tarihi: formatliTarih,
        fiyat: yeniIs.fiyat + " ₺",
        durum: 'beklemede',
        uretim: { cizim: false, camSiparisi: false, profil: false, camGeldi: false, atolye: false, teslim: false }
      }
    ]);

    if (!error) {
      verileriGetir();
      setIsModalOpen(false);
      setYeniIs({ musteri: "", isModeli: "", ilce: "", fiyat: "", kaynak: "", aciklama: "" });
    }
  };

  const durumGuncelle = async (id: number, yeniDurum: string) => {
    await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    verileriGetir();
  };

  return (
    <div className="pb-32 max-w-xl mx-auto bg-slate-50 min-h-screen antialiased text-slate-900">
      
      {/* ÜST TAKVİM NAVİGASYONU */}
      <div className="bg-white px-6 pt-10 pb-4 shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex gap-2 mb-4">
          <select value={seciliYil} onChange={(e) => setSeciliYil(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none">
            {yillar.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none">
            {aylar.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
        </div>

        {/* YATAY GÜN ŞERİDİ */}
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth">
          {ayinGunleriniGetir().map(gun => (
            <button
              key={gun}
              onClick={() => setSeciliGun(gun)}
              className={`flex-shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${seciliGun === gun ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
            >
              <span className="text-[10px] font-bold uppercase opacity-60">Gün</span>
              <span className="text-lg font-black">{gun}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center px-1">
            <h1 className="text-lg font-black tracking-tighter uppercase">{seciliGun} {aylar[seciliAy]} {seciliYil}</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">+ Yeni Ekle</button>
        </div>
      </div>

      {/* TEKLİF LİSTESİ */}
      <div className="p-4 space-y-3">
        {yukleniyor ? (
          <div className="text-center py-10 text-slate-300 font-bold text-xs uppercase tracking-widest animate-pulse">Güncelleniyor...</div>
        ) : teklifler.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Bu gün için kayıt bulunamadı</p>
          </div>
        ) : (
          teklifler.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg leading-none mb-1">{t.musteri}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.is_modeli} — {t.ilce}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                  t.durum === 'onaylandi' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  t.durum === 'iptal' ? 'bg-red-50 text-red-600 border-red-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {t.durum}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-50">
                <span className="text-sm font-black tracking-tight text-slate-900">{t.fiyat}</span>
                <div className="flex gap-2">
                  {t.durum === 'beklemede' && (
                    <>
                      <button onClick={() => durumGuncelle(t.id, 'onaylandi')} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase">Onayla</button>
                      <button onClick={() => durumGuncelle(t.id, 'iptal')} className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase">İptal</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ALT NAVİGASYON - SADECE ÜRETİM SEKMESİ İÇİN */}
      <nav className="bg-white border-t border-slate-100 fixed bottom-0 w-full px-12 py-6 flex justify-around items-center z-40 left-0 right-0 shadow-2xl rounded-t-[2.5rem]">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Tarih bazlı filtreleme aktif</p>
      </nav>

      {/* MODAL: YENİ KAYIT (O Gün İçin) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-t-[3rem] shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center uppercase tracking-tighter">{seciliGun} {aylar[seciliAy]} Teklifi</h3>
            <form onSubmit={isKaydet} className="space-y-4">
              <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" placeholder="Müşteri Adı" onChange={(e) => setYeniIs({...yeniIs, musteri: e.target.value})} />
              <select required className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setYeniIs({...yeniIs, isModeli: e.target.value})}>
                <option value="">İş Modeli...</option>
                <option value="Cam Balkon">Cam Balkon</option>
                <option value="Giyotin">Giyotin</option>
                <option value="Sürme Sistem">Sürme</option>
                <option value="Teras Kapama">Teras</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" placeholder="Fiyat" type="number" onChange={(e) => setYeniIs({...yeniIs, fiyat: e.target.value})} />
                <input required className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none" placeholder="İlçe" onChange={(e) => setYeniIs({...yeniIs, ilce: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">KAYDET</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 text-[10px] font-black uppercase py-2">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
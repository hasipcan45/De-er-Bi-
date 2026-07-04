import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Eye, 
  Target, 
  TrendingUp, 
  Compass, 
  Users, 
  FileText, 
  Award, 
  Fingerprint, 
  Building2, 
  Layers, 
  Sparkles,
  Search,
  Scale,
  Map,
  ArrowRight
} from 'lucide-react';

export function About() {
  const [activeAudience, setActiveAudience] = useState<'owner' | 'investor' | 'pro' | 'corporate' | 'buyerseller'>('owner');
  const [activeValue, setActiveValue] = useState<'trust' | 'transparency' | 'innovation' | 'accessibility' | 'responsibility'>('trust');
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800" id="about-page-wrapper">
      
      {/* Sleek, Compact Hero Area with exact 212.604px height */}
      <div 
        className="relative overflow-hidden bg-[#0e3b23] text-white px-6 border-b border-white/10 flex flex-col justify-center" 
        id="about-hero"
        style={{ height: '212.604px' }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-3 w-full">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight"
          >
            HAKKIMIZDA
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/80 max-w-xl mx-auto text-xs md:text-sm font-normal leading-relaxed"
          >
            Doğru, tarafsız ve kapsamlı gayrimenkul analizleriyle kararlarınıza güvence katıyor, adımlarınızı şeffaf verilerle aydınlatıyoruz.
          </motion.p>
        </div>
      </div>

      {/* Narrative & Core Identity Grid (Eliminated major empty/overlapping space) */}
      <div className="max-w-5xl mx-auto px-6 py-10" id="about-main-grid">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Girişimimizin Öyküsü - Compact Editorial Typography */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="border-l-4 border-[#1a5c3a] pl-4 space-y-1.5">
                <span className="text-[10px] font-bold tracking-widest text-[#1a5c3a] block">ÖYKÜMÜZ</span>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-snug">
                  Biz Değer Biçelim, <span className="text-[#1a5c3a] block">Siz Değer Bilin.</span>
                </h3>
              </div>
              <p className="text-xs md:text-sm text-gray-650 leading-relaxed">
                Gayrimenkul, yalnızca bir taşınmaz değil; birikimlerin, yatırımların, gelecek planlarının ve hayallerin somut karşılığıdır. 
              </p>
              <p className="text-xs md:text-sm text-gray-650 leading-relaxed">
                Ancak doğru karar verebilmek için fiyatı bilmek yetmez. Bir taşınmazın gerçek değerini anlamak; bulunduğu çevreyi, gelişim potansiyeli ve gelecekte yaratacağı fırsatları derinlemesine değerlendirmeyi gerektirir.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold italic text-gray-900">Değer Biç, bu ihtiyaçtan doğdu.</span>
              <Building2 size={18} className="text-[#1a5c3a]/40" />
            </div>
          </div>

          {/* Değer Biç Nedir? */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-[#1a5c3a] rounded-lg shrink-0">
                  <Layers size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-950 tracking-wider">DEĞER BİÇ NEDİR?</h3>
              </div>
              <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
                <p>
                  Değer Biç; konut, arsa ve ticari gayrimenkullere yönelik analiz ve değerlendirme raporları sunan dijital bir gayrimenkul karar destek platformudur.
                </p>
                <p>
                  Platformumuz, taşınmazların yalnızca mevcut piyasa koşullarını değil; aynı zamanda bulunduğu bölgenin gelişim dinamiklerini, çevresel özelliklerini ve gelecekteki potansiyelini de değerlendirir.
                </p>
                <p>
                  Böylece kullanıcılarımız sadece anlık bir fiyat bilgisine değil, kararlarını destekleyecek kapsamlı bir analiz altyapısına kolayca erişebilir.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 text-[11px] text-[#1a5c3a] font-medium flex items-center gap-1">
              <span>Şeffaf Analiz Altyapısı</span>
              <ArrowRight size={12} />
            </div>
          </div>

          {/* Neden Kurulduk? */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-[#f0a500] rounded-lg shrink-0">
                  <Search size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-950 tracking-wider">NEDEN KURULDUK?</h3>
              </div>
              <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
                <p>
                  Gayrimenkul piyasasında alım, satım veya yatırım kararları çoğunlukla sınırlı bilgi ve güvenilmez ilan fiyatlarıyla veriliyor. Bölgesel gelişmeler ve planlama kararları yeterince değerlendirilemiyor.
                </p>
                <span className="text-[11px] font-bold text-gray-900 block">Değer Biç olarak birincil hedeflerimiz:</span>
                <ul className="space-y-1 pl-1 text-[11px] text-gray-700">
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#1a5c3a] font-bold">✓</span> Bilgiye erişimi kolaylaştırmak
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#1a5c3a] font-bold">✓</span> Süreçleri şeffaf hale getirmek
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#1a5c3a] font-bold">✓</span> Veri analizlerini bütçe-dostu sunmak
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#1a5c3a] font-bold">✓</span> Bilinçli ve kârlı kararları desteklemek
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400">
              Amacımız karar alma süreçlerine katkı sağlamaktır.
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic 8 Factors Matrix - Compact & Ultra Modern Grid */}
      <div className="bg-[#0e3b23] text-white py-12 px-6 relative overflow-hidden" id="about-factors-section">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-4 space-y-3">
              <span className="text-[#f0a500] text-xs font-bold tracking-widest block">ENTEGRE BAKIŞ AÇISI</span>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
                Gayrimenkule Farklı Bir Bakış Açısıyla Yaklaşıyoruz
              </h3>
              <p className="text-white/70 text-xs leading-relaxed">
                Bir taşınmazın değeri metrekare büyüklüğü veya bulunduğu mahalleyle sınırlı değildir. Biz analizlerimizde 8 temel parametreyi bir arada ele alıyoruz:
              </p>
              <div className="pt-2 border-l-2 border-[#f0a500] pl-3.5 text-xs text-[#f0a500] font-medium leading-relaxed italic">
                "Bugün verilen bir yatırım kararının etkileri yıllar boyunca devam eder."
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">01</span>
                <h4 className="font-bold text-xs text-white">Bölgesel Gelişim Eğilimleri</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">02</span>
                <h4 className="font-bold text-xs text-white">Ulaşım Projeleri</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">03</span>
                <h4 className="font-bold text-xs text-white">İmar ve Plan Kararları</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">04</span>
                <h4 className="font-bold text-xs text-white">Sosyal & Teknik Altyapı</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">05</span>
                <h4 className="font-bold text-xs text-white">Nüfus Hareketleri</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">06</span>
                <h4 className="font-bold text-xs text-white">Çevresel Faktörler</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">07</span>
                <h4 className="font-bold text-xs text-white">Emsal Satış & Kira Verileri</h4>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-[#f0a500] font-black text-xs block mb-0.5">08</span>
                <h4 className="font-bold text-xs text-white">Yatırım Potansiyeli</h4>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Expertise & Technology Info Banner (Compact & Integrated) */}
      <div className="max-w-5xl mx-auto px-6 pt-10" id="about-expertise-tech">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3 bg-white text-[#1a5c3a] shadow-sm rounded-lg shrink-0">
            <Layers size={22} />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-bold text-gray-900 tracking-wider">UZMANLIK VE TEKNOLOJİYİ BİR ARAYA GETİRİYORUZ</h4>
            <p className="text-[11.5px] text-gray-600 leading-relaxed">
              Değer Biç'in temelinde; <strong>şehir planlama, mimarlık, mühendislik ve veri analizi</strong> disiplinlerinin ortak vizyonu yer alır. Gelişen teknolojileri kullanarak karmaşık coğrafi verileri ve pazar verilerini anlaşılır raporlara dönüştürüyor, bilgiyi pratik ve anlamlı hale getiriyoruz.
            </p>
          </div>
        </div>
      </div>

      {/* Target Audiences: Who is it for? - Dynamic Horizontal Bento */}
      <div className="max-w-5xl mx-auto px-6 py-10" id="about-target-audience">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[#1a5c3a] text-xs font-bold tracking-widest block">KULLANICI SEGMENTASYONU</span>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight text-center">Kimlere Hizmet Veriyoruz?</h3>
            <div className="w-12 h-1 bg-[#1a5c3a] mx-auto rounded-full mt-2" />
          </div>

          {/* Desktop-only grid */}
          <div className="hidden md:grid md:grid-cols-5 gap-3.5">
            
            <div className="bg-white border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between hover:border-[#1a5c3a]/30 transition-all shadow-sm">
              <div className="space-y-2">
                <div className="p-1.5 bg-gray-50 text-[#1a5c3a] rounded-lg w-fit">
                  <Users size={14} />
                </div>
                <h4 className="text-xs font-bold text-gray-950 tracking-tight">MÜLK SAHİPLERİ</h4>
                <p className="text-[10.5px] text-gray-500 leading-relaxed">
                  Taşınmazlarının mevcut değerini ve saklı duran gelişim potansiyelini şeffafça öğrenmek isteyenler.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between hover:border-[#1a5c3a]/30 transition-all shadow-sm">
              <div className="space-y-2">
                <div className="p-1.5 bg-gray-50 text-[#1a5c3a] rounded-lg w-fit">
                  <TrendingUp size={14} />
                </div>
                <h4 className="text-xs font-bold text-gray-950 tracking-tight">YATIRIMCILAR</h4>
                <p className="text-[10.5px] text-gray-500 leading-relaxed">
                  Bölgesel gelişmeleri ve gelecekteki prim potansiyelini inceleyerek rasyonel kararlar alanlar.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between hover:border-[#1a5c3a]/30 transition-all shadow-sm">
              <div className="space-y-2">
                <div className="p-1.5 bg-gray-50 text-[#1a5c3a] rounded-lg w-fit">
                  <Award size={14} />
                </div>
                <h4 className="text-xs font-bold text-gray-950 tracking-tight">PROFESYONELLER</h4>
                <p className="text-[10.5px] text-gray-500 leading-relaxed">
                  Müşterilerine veri destekli güçlü ve ikna edici değerlendirme raporları sunan danışmanlar.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between hover:border-[#1a5c3a]/30 transition-all shadow-sm">
              <div className="space-y-2">
                <div className="p-1.5 bg-gray-50 text-[#1a5c3a] rounded-lg w-fit">
                  <Building2 size={14} />
                </div>
                <h4 className="text-xs font-bold text-gray-950 tracking-tight">KURULUŞLAR</h4>
                <p className="text-[10.5px] text-gray-500 leading-relaxed">
                  Ticari lokasyon verimliliği veya geniş arazi geliştirme fırsatlarını fizibilite eden kurumlar.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between hover:border-[#1a5c3a]/30 transition-all shadow-sm">
              <div className="space-y-2">
                <div className="p-1.5 bg-gray-50 text-[#1a5c3a] rounded-lg w-fit">
                  <FileText size={14} />
                </div>
                <h4 className="text-xs font-bold text-gray-950 tracking-tight">ALICI & SATICILAR</h4>
                <p className="text-[10.5px] text-gray-500 leading-relaxed">
                  Satış veya devir öncesinde bütçe hatası yapmamak adına bağımsız bilgi almak isteyen herkes.
                </p>
              </div>
            </div>

          </div>

          {/* Mobile Selector (Visible only on mobile) */}
          <div className="block md:hidden max-w-xs mx-auto px-2">
            <label htmlFor="mobile-about-tab" className="sr-only">Kullanıcı Segmenti Seçin</label>
            <select
              id="mobile-about-tab"
              value={activeAudience}
              onChange={(e) => setActiveAudience(e.target.value as any)}
              className="w-full bg-white border border-gray-300 text-gray-800 rounded-xl px-4 py-3 text-xs font-extrabold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/50 focus:border-[#1a5c3a] cursor-pointer appearance-none text-center"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
            >
              <option value="owner">👥 Mülk Sahipleri</option>
              <option value="investor">📈 Yatırımcılar</option>
              <option value="pro">🏆 Profesyoneller</option>
              <option value="corporate">🏢 Kuruluşlar</option>
              <option value="buyerseller">📄 Alıcı & Satıcılar</option>
            </select>
          </div>

          {/* Mobile active tab content wrapper */}
          <div className="block md:hidden mt-3">
            <AnimatePresence mode="wait">
              {activeAudience === 'owner' && (
                <motion.div
                  key="owner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#1a5c3a]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit mx-auto">
                    <Users size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">MÜLK SAHİPLERİ</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Taşınmazlarının mevcut değerini ve saklı duran gelişim potansiyelini şeffafça öğrenmek isteyenler.
                  </p>
                </motion.div>
              )}
              {activeAudience === 'investor' && (
                <motion.div
                  key="investor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#1a5c3a]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit mx-auto">
                    <TrendingUp size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">YATIRIMCILAR</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Bölgesel gelişmeleri ve gelecekteki prim potansiyelini inceleyerek rasyonel kararlar alanlar.
                  </p>
                </motion.div>
              )}
              {activeAudience === 'pro' && (
                <motion.div
                  key="pro"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#1a5c3a]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit mx-auto">
                    <Award size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">PROFESYONELLER</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Müşterilerine veri destekli güçlü ve ikna edici değerlendirme raporları sunan danışmanlar.
                  </p>
                </motion.div>
              )}
              {activeAudience === 'corporate' && (
                <motion.div
                  key="corporate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#1a5c3a]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit mx-auto">
                    <Building2 size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">KURULUŞLAR</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Ticari lokasyon verimliliği veya geniş arazi geliştirme fırsatlarını fizibilite eden kurumlar.
                  </p>
                </motion.div>
              )}
              {activeAudience === 'buyerseller' && (
                <motion.div
                  key="buyerseller"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#1a5c3a]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit mx-auto">
                    <FileText size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">ALICI & SATICILAR</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Satış veya devir öncesinde bütçe hatası yapmamak adına bağımsız bilgi almak isteyen herkes.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Strategic Plan: Vision & Mission (Crisp Side-by-Side) */}
      <div className="max-w-5xl mx-auto px-6 py-6" id="about-vision-mission">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-gradient-to-br from-emerald-50/40 to-white border border-[#0e3b23]/10 p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2 bg-[#0e3b23] text-white rounded-lg w-fit">
                <Eye size={18} />
              </div>
              <h4 className="text-base font-bold text-gray-950 tracking-tight">Vizyonumuz</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Türkiye'nin en güvenilir dijital gayrimenkul analiz ve değerlendirme platformlarından biri olmak; gayrimenkul kararlarını veriye dayalı, şeffaf ve erişilebilir hale getirerek sektörde yeni bir standart oluşturmaktır.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50/30 to-white border border-[#f0a500]/15 p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2 bg-[#f0a500] text-gray-950 rounded-lg w-fit">
                <Target size={18} />
              </div>
              <h4 className="text-base font-bold text-gray-950 tracking-tight">Misyonumuz</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Teknolojiyi, uzmanlığı ve veriyi bir araya getirerek kullanıcılarımızın gayrimenkul kararlarını desteklemek; hızlı, anlaşılır ve güvenilir değerlendirme raporları sunmak.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Core Values Section (Compact modern cards) */}
      <div className="max-w-5xl mx-auto px-6 py-10" id="about-core-values">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[#1a5c3a] text-xs font-bold tracking-widest block">DEĞERLERİMİZ</span>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight text-center">Taviz Vermediğimiz Temel Değerlerimiz</h3>
            <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full mt-2" />
          </div>

          {/* Desktop-only grid */}
          <div className="hidden md:grid md:grid-cols-5 gap-3.5">
            
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col space-y-2">
              <div className="p-1.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit">
                <ShieldCheck size={14} />
              </div>
              <h4 className="font-bold text-[11px] text-gray-950 tracking-tight">GÜVEN</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Her değerlendirmede objektif, bağımsız ve bilimsel standartlarda tutarlı bir metodoloji benimseriz.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col space-y-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg w-fit">
                <Compass size={14} />
              </div>
              <h4 className="font-bold text-[11px] text-gray-950 tracking-tight">ŞEFFAFLIK</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Kullanıcılarımızın neye dayanarak sonuç aldığını açıkça anlayabileceği şeffaf analizleri sunarız.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col space-y-2">
              <div className="p-1.5 bg-amber-50 text-[#f0a500] rounded-lg w-fit">
                <Sparkles size={14} />
              </div>
              <h4 className="font-bold text-[11px] text-gray-950 tracking-tight">YENİLİKÇİLİK</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Teknolojik yenilikleri ve şehir imar trendlerini yakından takip ederek analizlerimizi her zaman geliştiririz.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col space-y-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg w-fit">
                <Scale size={14} />
              </div>
              <h4 className="font-bold text-[11px] text-gray-950 tracking-tight">ERİŞİLEBİLİRLİK</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Karmaşık ve pahalı profesyonel değerlendirme süreçlerini herkes için bütçe dostu ve kolay hâle getiririz.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col space-y-2">
              <div className="p-1.5 bg-red-50 text-red-650 rounded-lg w-fit">
                <Fingerprint size={14} />
              </div>
              <h4 className="font-bold text-[11px] text-gray-950 tracking-tight">SORUMLULUK</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Karar süreçlerine katkı koymanın bilinciyle, sunduğumuz her bilginin doğruluğunda sorumlu davranırız.
              </p>
            </div>

          </div>

          {/* Mobile Selector (Visible only on mobile) */}
          <div className="block md:hidden max-w-xs mx-auto px-2">
            <label htmlFor="mobile-values-tab" className="sr-only">Değer Seçin</label>
            <select
              id="mobile-values-tab"
              value={activeValue}
              onChange={(e) => setActiveValue(e.target.value as any)}
              className="w-full bg-white border border-gray-300 text-gray-800 rounded-xl px-4 py-3 text-xs font-extrabold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f0a500]/50 focus:border-[#f0a500] cursor-pointer appearance-none text-center"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundSize: '1.25em 1.25em', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
            >
              <option value="trust">🛡️ Güven</option>
              <option value="transparency">🧩 Şeffaflık</option>
              <option value="innovation">✨ Yenilikçilik</option>
              <option value="accessibility">⚖️ Erişilebilirlik</option>
              <option value="responsibility">🎯 Sorumluluk</option>
            </select>
          </div>

          {/* Mobile active value content wrapper */}
          <div className="block md:hidden mt-3">
            <AnimatePresence mode="wait">
              {activeValue === 'trust' && (
                <motion.div
                  key="trust"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#f0a500]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg w-fit mx-auto">
                    <ShieldCheck size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">GÜVEN</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Her değerlendirmede objektif, bağımsız ve bilimsel standartlarda tutarlı bir metodoloji benimseriz.
                  </p>
                </motion.div>
              )}
              {activeValue === 'transparency' && (
                <motion.div
                  key="transparency"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#f0a500]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg w-fit mx-auto">
                    <Compass size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">ŞEFFAFLIK</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Kullanıcılarımızın neye dayanarak sonuç aldığını açıkça anlayabileceği şeffaf analizleri sunarız.
                  </p>
                </motion.div>
              )}
              {activeValue === 'innovation' && (
                <motion.div
                  key="innovation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#f0a500]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-amber-50 text-[#f0a500] rounded-lg w-fit mx-auto">
                    <Sparkles size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">YENİLİKÇİLİK</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Teknolojik yenilikleri ve şehir imar trendlerini yakından takip ederek analizlerimizi her zaman geliştiririz.
                  </p>
                </motion.div>
              )}
              {activeValue === 'accessibility' && (
                <motion.div
                  key="accessibility"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#f0a500]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg w-fit mx-auto">
                    <Scale size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">ERİŞİLEBİLİRLİK</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Karmaşık ve pahalı profesyonel değerlendirme süreçlerini herkes için bütçe dostu ve kolay hâle getiririz.
                  </p>
                </motion.div>
              )}
              {activeValue === 'responsibility' && (
                <motion.div
                  key="responsibility"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#f0a500]/20 p-5 rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="p-2.5 bg-red-50 text-red-650 rounded-lg w-fit mx-auto">
                    <Fingerprint size={18} />
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-950 tracking-tight">SORUMLULUK</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                    Karar süreçlerine katkı koymanın bilinciyle, sunduğumuz her bilginin doğruluğunda sorumlu davranırız.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>



    </div>
  );
}

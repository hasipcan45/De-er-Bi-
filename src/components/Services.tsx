import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Compass, 
  Users, 
  FileText, 
  Scale, 
  CornerDownRight, 
  Compass as CompassIcon,
  HelpCircle,
  HelpCircle as InfoIcon,
  Zap,
  CheckCircle2,
  Map,
  ArrowRight
} from 'lucide-react';

export function Services() {
  const [activeTab, setActiveTab] = useState<'konut' | 'arsa' | 'ticari'>('konut');

  // Report details text content matching requested exact copy
  const reportCategories = {
    konut: {
      title: 'Konut Analiz ve Fiyat Aralığı Raporu',
      subtitle: 'Konutunuzu Kentsel Çevresiyle Birlikte Analiz Edin',
      description: 'Bir konutun değeri yalnızca metrekaresi veya fiziksel özellikleriyle açıklanamaz. Mahallenin gelişim düzeyi, ulaşım olanakları, sosyal donatı kapasitesi, çevresel kalite ve bölgesel dinamikler de konutun olması gereken fiyatını ve pazar potansiyelini doğrudan etkiler. Değer Biç Konut Analiz Raporu, taşınmazınızı bulunduğu kentsel sistem içerisinde analiz ederek kapsamlı piyasa fiyat aralığı tespiti ve analizleri sunar.',
      icon: <Building2 className="w-5 h-5 text-emerald-600" />,
      colorTheme: 'from-emerald-50 to-white border-emerald-100',
      activeColor: 'bg-[#1a5c3a] text-white',
      sections: [
        {
          title: 'Mekânsal Analizler',
          iconName: 'spatial',
          items: [
            'Konumsal analiz',
            'Mekânsal erişilebilirlik analizi',
            'Toplu taşıma erişilebilirliği analizi',
            'Karayolu bağlantıları incelemesi',
            'Mahalle ve yakın çevre karakter analizi',
            'Sosyal donatı alanları yeterlilik analizi',
            'Eğitim tesisleri erişim analizi',
            'Sağlık tesisleri erişim analizi',
            'Yeşil alan ve rekreasyon alanları analizi',
            'Kentsel hizmetlere erişim analizi'
          ]
        },
        {
          title: 'Sosyo-Ekonomik Analizler',
          iconName: 'socio',
          items: [
            'Mahalle profili analizi',
            'Demografik yapı analizi',
            'Nüfus gelişim eğilimleri',
            'Bölgesel gelişmişlik göstergeleri incelemesi',
            'Sosyal yapı analizi'
          ]
        },
        {
          title: 'Piyasa Analizleri',
          iconName: 'market',
          items: [
            'Emsal satış incelemeleri',
            'Emsal kira incelemeleri',
            'Bölgesel fiyat eğilimleri analizi',
            'Gayrimenkul piyasası analizi',
            'Piyasa fiyat göstergelerinin ve olması gereken fiyat aralıklarının yorumlanması'
          ]
        },
        {
          title: 'Planlama ve Gelişim Analizleri',
          iconName: 'planning',
          items: [
            'Üst ölçek plan kararlarının incelenmesi',
            'Bölgesel gelişim eğilimleri analizi',
            'Kamu yatırımları incelemesi',
            'Yakın çevredeki önemli projelerin analizi',
            'Kentsel dönüşüm ve yenileme alanları incelemesi',
            'Genel sentez ve sonuç analizi'
          ]
        }
      ]
    },
    arsa: {
      title: 'Arsa Analiz ve Fiyat Aralığı Raporu',
      subtitle: 'Arsanızın Mekânsal Özelliklerini ve Planlama Potansiyelini İnceleyin',
      description: 'Arsalar, bulundukları bölgenin planlama kararlarından ve gelişim süreçlerinden doğrudan etkilenen taşınmazlardır. Bu nedenle analiz sürecinde yalnızca mevcut durum değil, çevresel, mekânsal ve planlama temelli faktörler de dikkate alınmalıdır. Değer Biç Arsa Analiz Raporu, arsanızın bulunduğu çevreyi çok yönlü olarak inceleyerek kapsamlı analizler ve fiyat aralığı tespiti sunar.',
      icon: <Map className="w-5 h-5 text-amber-600" />,
      colorTheme: 'from-amber-50 to-white border-amber-100',
      activeColor: 'bg-[#f0a500] text-gray-950',
      sections: [
        {
          title: 'Planlama Analizleri',
          iconName: 'planning',
          items: [
            'Çevre Düzeni Planı incelemesi',
            'Nazım İmar Planı incelemesi',
            'Uygulama İmar Planı incelemesi',
            'Plan notları analizi',
            'Arazi kullanım kararları analizi',
            'Mekânsal gelişme kararlarının incelenmesi',
            'Planlama kısıtları ve hükümlerinin analizi'
          ]
        },
        {
          title: 'Mekânsal Analizler',
          iconName: 'spatial',
          items: [
            'Konumsal analiz',
            'Ulaşım erişilebilirliği analizi',
            'Ana ulaşım akslarına yakınlık analizi',
            'Yerleşim alanlarıyla ilişkilerin incelenmesi',
            'Ticaret ve hizmet alanlarına erişim analizi',
            'Altyapı olanakları analizi',
            'Yakın çevre kullanım deseni analizi'
          ]
        },
        {
          title: 'Çevresel Analizler',
          iconName: 'environmental',
          items: [
            'Topografik yapı incelemesi',
            'Doğal eşikler analizi',
            'Çevresel risk analizi',
            'Koruma alanları incelemesi',
            'Jeolojik ve çevresel kısıtlılıkların analizi',
            'Çevresel hassasiyet analizi'
          ]
        },
        {
          title: 'Piyasa Analizleri',
          iconName: 'market',
          items: [
            'Emsal arsa incelemeleri',
            'Bölgesel piyasa göstergeleri analizi',
            'Arsa piyasası eğilimleri analizi',
            'Piyasa fiyat göstergelerinin ve olması gereken fiyat aralıklarının yorumlanması'
          ]
        },
        {
          title: 'Bölgesel Analizler',
          iconName: 'regional',
          items: [
            'Bölgesel gelişim eğilimleri incelemesi',
            'Kamu yatırımları analizi',
            'Ulaşım projelerinin incelenmesi',
            'Kentsel büyüme koridorları analizi',
            'Yakın çevredeki önemli projelerin analizi',
            'Genel sentez ve sonuç analizi'
          ]
        }
      ]
    },
    ticari: {
      title: 'Ticari Gayrimenkul Analiz ve Fiyat Aralığı Raporu',
      subtitle: 'Ticari Taşınmazınızı Bölgesel Dinamiklerle Birlikte Analiz Edin',
      description: 'Ticari gayrimenkullerin değeri; erişilebilirlik, görünürlük, ticari hareketlilik, kullanıcı yoğunluğu ve bölgesel ekonomik yapı gibi birçok faktörün birleşimiyle oluşur. Değer Biç Ticari Gayrimenkul Analiz Raporu, ticari taşınmazları yalnızca fiziksel özellikleri üzerinden değil, bulundukları ticari ekosistem içerisinde analiz ederek piyasa fiyat aralığını tespit eder.',
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      colorTheme: 'from-indigo-50 to-white border-indigo-100',
      activeColor: 'bg-indigo-900 text-white',
      sections: [
        {
          title: 'Ticari Yapı Analizleri',
          iconName: 'commerce',
          items: [
            'Ticari lokasyon analizi',
            'Ticari yoğunluk analizi',
            'Ticaret aksları incelemesi',
            'Ticari çekim merkezleri analizi',
            'Fonksiyonel kullanım yapısı analizi',
            'Bölgesel ekonomik yapı incelemesi'
          ]
        },
        {
          title: 'Erişilebilirlik Analizleri',
          iconName: 'spatial',
          items: [
            'Yaya erişilebilirliği analizi',
            'Araç erişilebilirliği analizi',
            'Toplu taşıma bağlantıları analizi',
            'Otopark olanakları incelemesi',
            'Bölgesel ulaşım ağları analizi'
          ]
        },
        {
          title: 'Mekânsal Performans Analizleri',
          iconName: 'performance',
          items: [
            'Görünürlük analizi',
            'Cephe etkinliği analizi',
            'Kullanıcı hareketliliği incelemesi',
            'Yaya akışı analizi',
            'Bölgesel çekim gücü analizi',
            'Çevresel kalite analizi'
          ]
        },
        {
          title: 'Piyasa Analizleri',
          iconName: 'market',
          items: [
            'Emsal satış incelemeleri',
            'Emsal kira incelemeleri',
            'Ticari gayrimenkul piyasası analizi',
            'Bölgesel fiyat eğilimleri analizi',
            'Piyasa fiyat göstergelerinin ve olması gereken fiyat aralıklarının yorumlanması'
          ]
        },
        {
          title: 'Bölgesel ve Planlama Analizleri',
          iconName: 'regional_planning',
          items: [
            'Bölgesel gelişim eğilimleri incelemesi',
            'Kamu yatırımları analizi',
            'Kentsel dönüşüm alanları incelemesi',
            'Mekânsal gelişim kararlarının analizi',
            'Ticaret ve hizmet sektörü dinamikleri analizi',
            'Genel sentez ve sonuç analizi'
          ]
        }
      ]
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800" id="services-page-wrapper">
      
      {/* Editorial Header Area with 212.604px Height (Matching the About Page style) */}
      <div 
        className="relative overflow-hidden bg-[#0e3b23] text-white px-6 border-b border-white/10 flex flex-col justify-center h-48 md:h-[212.604px]" 
        id="services-hero"
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
            HİZMETLERİMİZ
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/80 max-w-2xl mx-auto text-xs md:text-sm font-normal leading-relaxed"
          >
            Gayrimenkulünüzü Sadece Görünene Göre Değil, Entegre Coğrafi, Planlama ve Piyasa Verileriyle Analiz Edin ve Olması Gereken Fiyatını/Fiyat Aralığını Öğrenin.
          </motion.p>
        </div>
      </div>

      {/* Intro Context Paragraphs - Clean Layout */}
      <div className="max-w-5xl mx-auto px-6 py-10" id="services-intro-section">
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight border-b border-gray-150 pb-3">
            Veriye Dayalı Analiz & Çok Boyutlu Piyasa Fiyatı ve Fiyat Aralığı Tespiti Yaklaşımı
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm text-gray-650 leading-relaxed">
            <p>
              Bir gayrimenkulün değeri yalnızca fiziksel özelliklerinden ibaret değildir. Bulunduğu çevrenin gelişim dinamiklerini, ulaşım bağlantıları, planlama kararları, sosyal ve teknik altyapı olanakları, bölgesel piyasa koşulları ve mekânsal özellikleri değer oluşumunda en önemli rolü oynar.
            </p>
            <p>
              <strong>Değer Biç</strong>, konut, arsa ve ticari gayrimenkullere yönelik hazırladığı kapsamlı analiz ve fiyat aralığı raporları ile taşınmazları çok boyutlu olarak analiz eder. Şehir plancıları, mimarlar ve mühendislerin profesyonel bakış açısıyla hazırlanan raporlarımız; karar alma süreçlerinde ihtiyaç duyduğunuz mekânsal, teknik ve piyasa verilerini en yalın ve anlaşılır biçimde masanıza getirir.
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Interactive Catalog for The 3 Main Report Types */}
      <div className="max-w-5xl mx-auto px-6 py-4" id="services-tabs-container">
        <div className="space-y-6">
          
          <div className="text-center space-y-1">
            <span className="text-[#1a5c3a] text-xs font-bold tracking-widest block">RAPOR TÜRLERİMİZ</span>
            <h3 className="text-xl font-bold text-gray-950 tracking-tight text-center">Gayrimenkul Analiz ve Piyasa Fiyat Aralığı Çözümlerimiz</h3>
            <div className="w-12 h-1 bg-[#1a5c3a] mx-auto rounded-full mt-1.5" />
          </div>

          {/* Mobile Select Dropdown (Visible only on mobile) */}
          <div className="block md:hidden max-w-lg mx-auto px-2">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setActiveTab('konut')} className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'konut' ? 'bg-[#1a5c3a] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>🏠 Konut</button>
              <button onClick={() => setActiveTab('arsa')} className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'arsa' ? 'bg-[#f0a500] text-gray-950' : 'bg-white border border-gray-200 text-gray-600'}`}>🌳 Arsa</button>
              <button onClick={() => setActiveTab('ticari')} className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'ticari' ? 'bg-indigo-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>🏢 Ticari</button>
            </div>
          </div>

          {/* Navigation Controls (Desktop-only) */}
          <div className="hidden md:flex flex-row justify-center items-center gap-1.5 bg-gray-200/60 p-1.5 rounded-xl border border-gray-300/40 max-w-lg mx-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('konut')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'konut' ? 'bg-[#1a5c3a] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏠 Konut Raporu
            </button>
            <button
              onClick={() => setActiveTab('arsa')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'arsa' ? 'bg-[#f0a500] text-gray-950 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🌳 Arsa Raporu
            </button>
            <button
              onClick={() => setActiveTab('ticari')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ticari' ? 'bg-indigo-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏢 Ticari Raporu
            </button>
          </div>

          {/* Tab Content Display Area */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="p-6 md:p-8 space-y-6"
              >
                {/* Header of Active Report Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-gray-50 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                      {reportCategories[activeTab].icon}
                    </span>
                    <h4 className="text-lg font-black text-gray-950 tracking-tight">
                      {reportCategories[activeTab].title}
                    </h4>
                  </div>
                  <h5 className="text-[#1a5c3a] font-bold text-xs md:text-sm">
                    {reportCategories[activeTab].subtitle}
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-4 py-0.5">
                    {reportCategories[activeTab].description}
                  </p>
                </div>

                {/* Sub-Analyses Multi-Column Grid */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <span className="inline-block relative -translate-y-[10%] text-[10px] font-extrabold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full tracking-wider">
                    🔍 DETAYLI ANALİZ PARAMETRELERİMİZ
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportCategories[activeTab].sections.map((sec, idx) => (
                      <div 
                        key={idx} 
                        className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/80 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm"
                      >
                        <div className="space-y-2.5">
                          <h6 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1a5c3a]" />
                            {sec.title}
                          </h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5">
                            {sec.items.map((item, idy) => (
                              <div key={idy} className="flex items-start gap-1 pb-0.5">
                                <span className="text-[11px] text-[#1a5c3a] font-bold select-none shrink-0">📍</span>
                                <span className="text-[11px] text-gray-700 leading-snug">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* "Neden Değer Biç?" - Core Visual Cards Grid */}
      <div className="max-w-5xl mx-auto px-6 py-12" id="services-why-us">
        <div className="space-y-8">
          <div className="text-center space-y-1">
            <span className="text-[#1a5c3a] text-xs font-bold tracking-widest block">BAKIŞ AÇIMIZ</span>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight text-center">Neden Değer Biç?</h3>
            <div className="w-12 h-1 bg-[#1a5c3a] mx-auto rounded-full mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-2 hover:border-[#1a5c3a]/35 transition-all">
              <span className="inline-block p-1.5 bg-emerald-50 text-[#1a5c3a] rounded-lg">
                <Map size={14} />
              </span>
              <h4 className="font-bold text-xs text-gray-950 tracking-tight">🗺️ MEKÂNSAL PLANLAMA</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Taşınmazlar yalnızca parsel düzeyinde değil, bulunduğu kentsel çevre ve gelişim koridorlarıyla birlikte değerlendirilir.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-2 hover:border-[#1a5c3a]/35 transition-all">
              <span className="inline-block p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp size={14} />
              </span>
              <h4 className="font-bold text-xs text-gray-950 tracking-tight">📊 VERİ DESTEKLİ YAKLAŞIM</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Farklı güvenilir mekânsal veri katmanları, pazar göstergeleri ve planlama kararları bütünleşik olarak analiz edilir.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-2 hover:border-[#1a5c3a]/35 transition-all">
              <span className="inline-block p-1.5 bg-purple-50 text-purple-650 rounded-lg">
                <Users size={14} />
              </span>
              <h4 className="font-bold text-xs text-gray-950 tracking-tight">👨‍💼 UZMAN ANALİZİ</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Şehir plancıları, mimarlar ve mühendislerin mesleki bilgi, planlama birikimi ve tecrübeleri raporlara yansıtılır.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-2 hover:border-[#1a5c3a]/35 transition-all">
              <span className="inline-block p-1.5 bg-amber-50 text-[#f0a500] rounded-lg">
                <Zap size={14} />
              </span>
              <h4 className="font-bold text-xs text-gray-950 tracking-tight">⚡ HIZLI & ERİŞİLEBİLİR</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Rapor taleplerinizi dijital ortam üzerinden dakikalar içinde oluşturabilir, hızla analize başlayabilirsiniz.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-2 hover:border-[#1a5c3a]/35 transition-all">
              <span className="inline-block p-1.5 bg-indigo-50 text-indigo-650 rounded-lg">
                <CompassIcon size={14} />
              </span>
              <h4 className="font-bold text-xs text-gray-950 tracking-tight">🔍 ŞEFFAF SONUÇLAR</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Karmaşık kentsel ve mekânsal analiz verileri, kullanıcı dostu şemalar ve anlaşılır grafiksel raporlara dönüştürülür.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* "Önemli Bilgilendirme" - Legally Compliant Professional Disclaimer */}
      <div className="max-w-5xl mx-auto px-6 pb-12" id="services-disclaimer">
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start gap-4">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <InfoIcon size={16} />
          </div>
          <div className="space-y-1.5">
            <h5 className="text-xs font-bold text-amber-800 tracking-widest">ÖNEMLİ BİLGİLENDİRME</h5>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Değer Biç tarafından hazırlanan tüm raporlar, grafikler ve mekânsal analizler sadece bilgi verme, analiz yapma ve genel analiz ile piyasa fiyat aralığı tespiti amacı taşımaktadır. Platformumuz tarafından üretilen hiçbir içerik yatırım tavsiyesi, hukuki görüş, resmi SPK lisanslı gayrimenkul ekspertiz raporu veya kanuni bir değerleme belgesi niteliğinde değerlendirilemez. Alınacak nihai finansal ve ticari kararların sorumluluğu tamamen kullanıcılara aittir.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

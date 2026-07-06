import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  Home, 
  Compass, 
  Building2, 
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface PricingProps {
  onSelect: (plan: string) => void;
}

const CATEGORIES = {
  konut: { title: 'Konut', icon: Home, prices: { basit: 100, orta: 200, profesyonel: 400 } },
  arsa: { title: 'Arsa / Arazi', icon: Compass, prices: { basit: 200, orta: 300, profesyonel: 600 } },
  ticari: { title: 'Ticari', icon: Building2, prices: { basit: 300, orta: 400, profesyonel: 800 } }
};

const FEATURES = [
  { label: 'Konumsal ve Erişilebilirlik Analizi', basit: true, orta: true, profesyonel: true },
  { label: 'Piyasa Analizi', basit: true, orta: true, profesyonel: true },
  { label: 'Genel Değerlendirme ve Sonuç', basit: true, orta: true, profesyonel: true },
  { label: 'Bölgesel / Mahalle Analizi', basit: false, orta: true, profesyonel: true },
  { label: 'Sosyo-Ekonomik Analiz', basit: false, orta: true, profesyonel: true },
  { label: 'Bölgesel Piyasa Eğilimleri Analizi', basit: false, orta: true, profesyonel: true },
  { label: 'Planlama ve İmar Analizi', basit: false, orta: false, profesyonel: true },
  { label: 'Kamu Yatırımları ve Proje Etkisi Analizi', basit: false, orta: false, profesyonel: true },
  { label: 'Gelişim ve Yatırım Potansiyeli Analizi', basit: false, orta: false, profesyonel: true },
];

export function Pricing({ onSelect }: PricingProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('konut');

  const currentPrices = CATEGORIES[activeCategory].prices;

  const tiers = [
    { key: 'basit', title: 'Basit Analiz', price: currentPrices.basit, desc: 'Temel ihtiyaçlar için hızlı analiz' },
    { key: 'orta', title: 'Orta Analiz', price: currentPrices.orta, desc: 'Kapsamlı bölgesel piyasa verileri' },
    { key: 'profesyonel', title: 'Profesyonel Analiz', price: currentPrices.profesyonel, desc: 'Detaylı yatırım ve planlama analizi', recommended: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50" id="pricing-page-container">
      {/* Sleek, Compact Hero Area */}
      <div 
        className="relative overflow-hidden bg-[#0e3b23] text-white px-6 border-b border-white/10 flex flex-col justify-center h-48 md:h-[212.604px]" 
        id="pricing-hero"
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
            FİYATLANDIRMA
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/80 max-w-xl mx-auto text-xs md:text-sm font-normal leading-relaxed"
          >
            İhtiyacınıza en uygun gayrimenkul analiz paketini seçin ve taşınmazınız hakkında profesyonel görüş alın.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as keyof typeof CATEGORIES)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-sm ${activeCategory === key ? 'bg-[#1a5c3a] text-white shadow-md shadow-[#1a5c3a]/20' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'}`}
            >
              {cat.title}
            </button>
          ))}
        </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {tiers.map((tier) => (
          <motion.div
            key={tier.key}
            className={`relative bg-white rounded-2xl border ${tier.recommended ? 'border-[#1a5c3a] ring-1 ring-[#1a5c3a]/20 shadow-lg' : 'border-gray-200 shadow-sm'} p-4 sm:p-6 flex flex-col`}
          >
            {tier.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a5c3a] text-white px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Sparkles size={10} /> Önerilen
              </div>
            )}
            <h3 className="text-base sm:text-lg font-bold text-gray-950 mb-1">{tier.title}</h3>
            <p className="text-gray-500 text-[10px] sm:text-xs mb-3 h-8 sm:mb-4">{tier.desc}</p>
            <div className="text-2xl sm:text-3xl font-black text-[#1a5c3a] mb-4 sm:mb-6">{tier.price} ₺</div>
            <button
              onClick={() => onSelect(`${activeCategory}_${tier.key}`)}
              className={`w-full py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${tier.recommended ? 'bg-[#1a5c3a] text-white hover:bg-[#14482d]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
            >
              Paketi Seç
            </button>
          </motion.div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-2 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg font-black text-gray-950 mb-4 px-2">Analiz Karşılaştırma</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] sm:text-xs text-left border-collapse">
            <thead className="text-gray-500">
              <tr>
                <th className="px-2 sm:px-4 py-3 font-extrabold text-gray-950">Analiz</th>
                <th className="px-1 sm:px-4 py-3 font-extrabold text-gray-950 text-center">Basit</th>
                <th className="px-1 sm:px-4 py-3 font-extrabold text-gray-950 text-center">Orta</th>
                <th className="px-1 sm:px-4 py-3 font-extrabold text-gray-950 text-center">Profesyonel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FEATURES.map((feat) => (
                <tr key={feat.label} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-2 sm:px-4 py-3 text-gray-700 font-medium">{feat.label}</td>
                  <td className="px-1 sm:px-4 py-3 text-center">{feat.basit ? <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><Check size={12} /></div> : <X size={12} className="text-red-500 mx-auto" />}</td>
                  <td className="px-1 sm:px-4 py-3 text-center">{feat.orta ? <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><Check size={12} /></div> : <X size={12} className="text-red-500 mx-auto" />}</td>
                  <td className="px-1 sm:px-4 py-3 text-center">{feat.profesyonel ? <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><Check size={12} /></div> : <X size={12} className="text-red-500 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
  );
}

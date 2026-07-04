import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Compass, 
  Building2, 
  Sparkles, 
  UserCheck, 
  UserMinus,
  ArrowRight,
  Sparkle
} from 'lucide-react';

interface PricingProps {
  onSelect: (plan: string) => void;
}

export function Pricing({ onSelect }: PricingProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'subscription'>('single');

  // Single Report configurations
  const singleReports = [
    {
      type: 'konut',
      title: 'Konut Değerleme',
      icon: <Home className="text-[#1a5c3a]" size={20} />,
      registeredPrice: '349 ₺',
      guestPrice: '399 ₺'
    },
    {
      type: 'arsa',
      title: 'Arsa / Arazi Değerleme',
      icon: <Compass className="text-[#1a5c3a]" size={20} />,
      registeredPrice: '449 ₺',
      guestPrice: '499 ₺'
    },
    {
      type: 'ticari',
      title: 'Ticari Değerleme',
      icon: <Building2 className="text-[#1a5c3a]" size={20} />,
      registeredPrice: '549 ₺',
      guestPrice: '599 ₺'
    }
  ];

  // Subscription plan configurations
  const subscriptionPlans = [
    {
      id: 'monthly_pro',
      name: 'Aylık Profesyonel Paket',
      originalPrice: '2.494 ₺',
      price: '1.949 ₺',
      period: '/ ay',
      discountPercentage: '22',
      rights: [
        '3 Adet Konut Değerleme Raporu',
        '2 Adet Arsa / Arazi Değerleme Raporu',
        '1 Adet Ticari Gayrimenkul Değerleme Raporu'
      ],
      totalText: 'Toplam 6 Adet Değerleme Hakkı',
      featured: false
    },
    {
      id: 'yearly_pro',
      name: 'Yıllık Profesyonel Paket',
      originalPrice: '29.928 ₺',
      price: '19.449 ₺',
      period: '/ yıl',
      discountPercentage: '35',
      rights: [
        '36 Adet Konut Değerleme Raporu',
        '24 Adet Arsa / Arazi Değerleme Raporu',
        '12 Adet Ticari Gayrimenkul Değerleme Raporu'
      ],
      totalText: 'Toplam 72 Adet Değerleme Hakkı',
      tag: 'EN AVANTAJLI PAKET',
      featured: true
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12" id="pricing-page-container">
      {/* Tab Switcher & Header */}
      <div className="flex flex-col items-center justify-center mb-4" id="pricing-tab-header">
        <div className="inline-flex p-1 bg-gray-100 rounded-2xl border border-gray-200/50" id="pricing-segmented-control">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'single'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tekil Raporlar
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Abonelik Paketleri
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'single' ? (
          <motion.div
            key="single-reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="mb-16"
            id="single-report-section"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-905 tracking-tight">Tekil Rapor Seçenekleri</h2>
              <p className="text-xs text-gray-400 mt-1">Sadece tek bir mülkünüz için anında tarafsız değerleme raporu talep edin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {singleReports.map((report) => (
                <motion.div
                  key={report.type}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/50 mb-3">
                        {report.icon}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">{report.title}</h3>
                    </div>

                    {/* Pricing breakdown */}
                    <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-[#1a5c3a]" />
                          Kayıtlı Üye
                        </span>
                        <span className="text-base font-extrabold text-[#1a5c3a]">
                          {report.registeredPrice}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200/50 pt-2.5">
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                          <UserMinus size={12} className="text-gray-400" />
                          Misafir Üye
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          {report.guestPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelect(`single_${report.type}`)}
                    className="w-full py-2.5 bg-white text-[#1a5c3a] border border-[#1a5c3a]/30 hover:border-[#1a5c3a] hover:bg-[#1a5c3a]/5 transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Talebi Başlat <ArrowRight size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="subscription-plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="mb-16"
            id="subscription-plans-section"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Avantajlı Kurumsal Üyelikler</h2>
              <p className="text-xs text-gray-400 mt-1">Daha fazla değerleme raporuna ihtiyaç duyan gayrimenkul profesyonelleri için çözümler</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {subscriptionPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -3 }}
                  className={`bg-white rounded-3xl p-8 border relative flex flex-col justify-between ${
                    plan.featured 
                      ? 'border-[#1a5c3a] ring-1 ring-[#1a5c3a]/25 shadow-lg' 
                      : 'border-gray-200 shadow-sm'
                  }`}
                >
                  {plan.featured && plan.tag && (
                    <span className="absolute top-0 right-8 -translate-y-1/2 bg-[#1a5c3a] text-white text-[9px] font-bold tracking-wider px-3.5 py-1.5 rounded-full shadow-md shadow-emerald-950/20">
                      {plan.tag}
                    </span>
                  )}
                  
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">{plan.name}</h3>

                    <div className="flex flex-col mb-6">
                      {plan.originalPrice && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm line-through text-gray-400 font-medium">
                            {plan.originalPrice}
                          </span>
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-black tracking-wider">
                            %{plan.discountPercentage} İNDİRİM
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-[#1a5c3a] tracking-tight">{plan.price}</span>
                        <span className="text-gray-400 text-xs font-semibold">{plan.period}</span>
                      </div>
                    </div>

                    <div className="border border-emerald-100/60 bg-emerald-50/25 rounded-2xl p-4.5 mb-6">
                      <div className="text-[11px] font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#1a5c3a]" />
                        Paket İçeriği:
                      </div>
                      <ul className="space-y-2">
                        {plan.rights.map((right, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <Sparkle size={10} className="text-[#1a5c3a] shrink-0 fill-[#1a5c3a]/10" />
                            {right}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-3 border-t border-emerald-100/50 text-xs font-extrabold text-[#1a5c3a]">
                        {plan.totalText}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelect(plan.id)}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      plan.featured 
                        ? 'bg-[#1a5c3a] text-white hover:bg-[#2d8a58] shadow-md shadow-emerald-900/10 active:scale-[0.98]' 
                        : 'bg-white text-[#1a5c3a] border border-[#1a5c3a]/50 hover:bg-[#1a5c3a]/5'
                    }`}
                  >
                    Hemen Başvur / Satın Al
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

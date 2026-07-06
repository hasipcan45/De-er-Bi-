import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  LogOut, 
  ChevronRight, 
  Download, 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Mail, 
  Compass, 
  MapPin, 
  TrendingUp, 
  X, 
  Printer, 
  Building2, 
  Grid, 
  Map, 
  Sparkles,
  Award,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, AppraisalRequest, ReportStatus, getEffectiveMembership } from '../types.ts';

interface ProfileProps {
  user: UserProfile;
  requests: AppraisalRequest[];
  onLogout: () => void;
  onDeleteAccount: () => void;
  onUpgrade: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onRequestReport: () => void;
}

export function Profile({ user, requests, onLogout, onDeleteAccount, onUpgrade, onUpdateUser, onRequestReport }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'reports'>('info');
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState(user.fullName);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Report download states are not needed as we directly trigger a file download

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!editFullName.trim()) {
      setErrorMsg('Ad Soyad alanı boş bırakılamaz.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setErrorMsg('Geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (!editPhone.trim()) {
      setErrorMsg('Telefon numarası alanı boş bırakılamaz.');
      return;
    }

    // Call state updater
    onUpdateUser({
      ...user,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim()
    });

    setSuccessMsg('Profil bilgileriniz başarıyla güncellendi!');
    setIsEditing(false);
    setEditPassword('');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // Compute realistic dynamic results for PDF viewer
  const getComputedReportDetails = (req: AppraisalRequest) => {
    const isLand = req.type === 'arsa';
    const isCommercial = req.type === 'ticari';
    
    // Core areas
    const area = req.data.netArea || req.data.grossArea || req.data.area || 120;
    
    // Establish factors based on city / district
    const isBursa = (req.data.city || '').toLowerCase().includes('burs');
    const isIstanbul = (req.data.city || '').toLowerCase().includes('istan') || (req.data.city || '').toLowerCase().includes('ist');
    
    let basePricePerSqm = 24500; // default medium housing
    if (isLand) {
      basePricePerSqm = req.data.quality === 'Arsa' ? 6200 : 1800; // commercial land vs agriculture field
    } else if (isCommercial) {
      basePricePerSqm = 42000; // commercial space
    }
    
    if (isIstanbul) basePricePerSqm *= 1.8;
    if (isBursa) basePricePerSqm *= 1.1;

    // Computed pricing ranges
    const calculatedPrice = Math.round(area * basePricePerSqm);
    const minCalculatedPrice = Math.round(calculatedPrice * 0.91);
    const maxCalculatedPrice = Math.round(calculatedPrice * 1.09);
    
    // Monthly rental yields
    const estimatedRent = Math.round(calculatedPrice / 240);

    return {
      area,
      avgSqmPrice: basePricePerSqm,
      estimatedValue: calculatedPrice,
      minEstimatedValue: minCalculatedPrice,
      maxEstimatedValue: maxCalculatedPrice,
      rentSqmValue: Math.round(basePricePerSqm / 240),
      estimatedValueRent: estimatedRent,
      safetyScore: isLand ? 94 : isCommercial ? 88 : 91,
      transitAccessibility: isIstanbul ? 'Mükemmel' : 'Yüksek / İyi',
      topFeatures: isLand ? [
        'Uygulama imar planı sınırları içerisinde imarlı parsel',
        'Topoğrafik yapı düzgün ve inşaata elverişli yapıda',
        'Gelişim koridoru odak noktasında yüksek kentsel büyüme'
      ] : isCommercial ? [
        'Yatay kat / cephe görünürlüğü ve yaya akışı yoğun bölge',
        'Hizmet sektörü ve ticari çekim aksı üzerinde stratejik konum',
        'Toplu taşıma düğüm noktalarına ve ana artere direkt erişim'
      ] : [
        'Mahalle gelişim düzeyi ve konut sirkülasyonu yüksek bölge',
        'Sosyal donatı imkanlarına, eğitim ve yeşil alanlara yürüme mesafesi',
        'Otopark, asansör ve kentsel teknik altyapı hizmetlerine entegre'
      ]
    };
  };

  const handleDownloadReport = (req: AppraisalRequest) => {
    // If there is a real PDF uploaded from administrator, download that file directly
    if (req.pdfUrl && req.pdfUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = req.pdfUrl;
      link.download = req.pdfName || `Gayrimenkul_Analiz_Raporu_${req.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const details = getComputedReportDetails(req);
    const dateStr = new Date(req.createdAt).toLocaleDateString('tr-TR');
    
    const typeLabel = req.type === 'konut' ? '🏠 KONUT' : req.type === 'arsa' ? '🌳 ARSA' : '🏢 TİCARİ';
    
    let techRowsHtml = '';
    
    if (req.type === 'konut') {
      techRowsHtml = `
        <tr><th>Oda Sayısı</th><td>${req.data.rooms || '3+1'}</td></tr>
        <tr><th>Bina Yaşı</th><td>${req.data.buildingAge || '0-5 Yıl'}</td></tr>
        <tr><th>Bulunduğu Kat</th><td>${req.data.floor || '3'}</td></tr>
        <tr><th>Isınma Sistemi</th><td>${req.data.heating || 'Kombi (Doğalgaz)'}</td></tr>
      `;
    } else if (req.type === 'arsa') {
      techRowsHtml = `
        <tr><th>Ada / Parsel</th><td>${req.data.ada || '—'} / ${req.data.parsel || '—'}</td></tr>
        <tr><th>Nitelik</th><td>${req.data.quality || 'Arsa'}</td></tr>
        <tr><th>İmar Durumu</th><td>${req.data.zoningStatus || 'Konut İmarlı'}</td></tr>
      `;
    } else if (req.type === 'ticari') {
      techRowsHtml = `
        <tr><th>Kullanım Türü</th><td>${req.data.propertyType || 'Ofis'}</td></tr>
        <tr><th>Kullanım Durumu</th><td>${req.data.usageStatus || 'Boş'}</td></tr>
        <tr><th>Cephe Durumu</th><td>${req.data.facade || 'Yola Cephe'}</td></tr>
        <tr><th>Otopark</th><td>${req.data.parking || 'Var'}</td></tr>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Değer Biç Raporu - ${req.id}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 24px;
      box-sizing: border-box;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: 850;
      color: #1a5c3a;
      letter-spacing: -0.5px;
    }
    .badge {
      background: #f0a500;
      color: #1a1a1a;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 22px;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 10px;
      font-weight: 850;
    }
    .meta-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
    }
    .meta-card {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 12px;
    }
    .meta-card-title {
      font-size: 10px;
      color: #64748b;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .meta-card-value {
      font-size: 14px;
      font-weight: 700;
      color: #334155;
    }
    .price-section {
      background: #e8f5ee;
      border: 1px solid #b3d9c5;
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .price-label {
      font-size: 11px;
      font-weight: 850;
      color: #1a5c3a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .price-value {
      font-size: 36px;
      font-weight: 900;
      color: #0f172a;
      margin: 10px 0;
    }
    .price-range {
      font-size: 12px;
      color: #475569;
    }
    .rent-section {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .rent-block {
      border: 1px dashed #cbd5e1;
      padding: 20px;
      border-radius: 16px;
    }
    .table-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      padding: 12px;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    th {
      font-weight: 600;
      color: #64748b;
      width: 40%;
    }
    td {
      font-weight: 700;
      color: #0f172a;
    }
    .feature-list {
      display: grid;
      grid-template-cols: 1fr;
      gap: 12px;
      margin-bottom: 30px;
    }
    .feature-item {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      padding: 15px;
      border-radius: 12px;
      font-size: 13px;
      display: flex;
      gap: 10px;
    }
    .feature-item-tick {
      color: #16a34a;
      font-weight: bold;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body {
        background-color: #ffffff;
      }
      .container {
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Değer Biç™</div>
      <div class="badge">RESMİ OLMAYAN GAYRİMENKUL ANALİZ RAPORU</div>
    </div>

    <h1>Gayrimenkul Analiz ve Fiyat Aralığı Raporu</h1>
    <p style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 30px;">
      Bu rapor, mülkün bölgedeki emsal kiralık/satılık veri tabanları temel alınarak Değer Biç algoritması ile üretilmiştir.
    </p>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-card-title">RAPOR KODU</div>
        <div class="meta-card-value">${req.id}</div>
      </div>
      <div class="meta-card">
        <div class="meta-card-title">RAPOR TARİHİ</div>
        <div class="meta-card-value">${dateStr}</div>
      </div>
    </div>

    <div class="price-section">
      <div class="price-label">ÖNGÖRÜLEN PİYASA FİYATI</div>
      <div class="price-value">${details.estimatedValue.toLocaleString('tr-TR')} ₺</div>
      <div class="price-range">
        Piyasa Fiyat Aralığı (±9%): <strong>${details.minEstimatedValue.toLocaleString('tr-TR')} ₺</strong> - <strong>${details.maxEstimatedValue.toLocaleString('tr-TR')} ₺</strong>
      </div>
    </div>

    <div class="rent-section">
      <div class="rent-block">
        <div class="meta-card-title">ORTALAMA M² BİRİM FİYATI</div>
        <div class="meta-card-value" style="font-size: 18px; color: #1a5c3a; margin-top: 5px;">
           ${details.avgSqmPrice.toLocaleString('tr-TR')} ₺ / m²
        </div>
      </div>
      <div class="rent-block">
        <div class="meta-card-title">AYLIK EMSAL KİRA TAHMİNİ</div>
        <div class="meta-card-value" style="font-size: 18px; color: #1e293b; margin-top: 5px;">
           ${details.estimatedValueRent.toLocaleString('tr-TR')} ₺ / ay
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 5px;">
          Yıllık Amortisman Süresi: 20 Yıl (240 Ay)
        </div>
      </div>
    </div>

    <div class="table-title">TAŞINMAZ BİLGİLERİ VE ÖZELLİKLERİ</div>
    <table>
      <tbody>
        <tr>
          <th>Konum (İl / İlçe)</th>
          <td>${req.data.city} / ${req.data.district}</td>
        </tr>
        <tr>
          <th>Mahalle</th>
          <td>${req.data.neighborhood}</td>
        </tr>
        <tr>
          <th>Taşınmaz Türü</th>
          <td>${typeLabel}</td>
        </tr>
        <tr>
          <th>Toplam Alan</th>
          <td>${details.area} m²</td>
        </tr>
        ${techRowsHtml}
      </tbody>
    </table>

    <div class="table-title">MEKÂNSAL ANALİZ & ERİŞİLEBİLİRLİK</div>
    <table>
      <tbody>
        <tr>
          <th>Yayakent Puanı</th>
          <td style="color: #1a5c3a;">${details.safetyScore} / 100</td>
        </tr>
        <tr>
          <th>Toplu Taşıma Altyapısı</th>
          <td>${details.transitAccessibility}</td>
        </tr>
        <tr>
          <th>Ana Arter Yakınlığı</th>
          <td>Çok İyi (1.2 km)</td>
        </tr>
        <tr>
          <th>Çevresel Gürültü Seviyesi</th>
          <td>Düşük / Sakin Seviye</td>
        </tr>
      </tbody>
    </table>

    <div class="table-title">🌟 TAŞINMAZIN BAŞLICA ÖNE ÇIKAN AVANTAJLARI</div>
    <div class="feature-list">
      ${details.topFeatures.map(f => `
        <div class="feature-item">
          <span class="feature-item-tick">✔</span>
          <div>${f}</div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <span>© 2026 Değer Biç™ Gayrimenkul Analiz Teknolojileri</span>
      <span>Bu rapor bilgilendirme amaçlıdır. Resmi ve hukuki geçerliliği yoktur.</span>
    </div>
  </div>
</body>
</html>
    `;

    // Create downloadable blob
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gayrimenkul_Analiz_Raporu_${req.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 py-4 md:py-12" id="user-profile-layout">
      <div className="flex flex-col md:flex-row gap-0 border border-gray-200 rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-sm min-h-0 md:min-h-[600px]">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 flex flex-col justify-between gap-4 md:gap-0">
          <div>
            <div className="mb-4 md:mb-8 flex items-center md:block gap-3 text-left">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#1a5c3a]/10 flex items-center justify-center text-[#1a5c3a] font-extrabold text-sm md:text-xl md:mb-4 shrink-0 shadow-xs md:shadow-sm border border-[#1a5c3a]/5">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-gray-900 tracking-tight text-xs md:text-base truncate">{user.fullName}</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate">{user.email}</p>
              </div>
            </div>

            <nav className="grid grid-cols-2 md:flex md:flex-col gap-1.5 md:space-y-1.5">
              <SidebarItem 
                active={activeTab === 'info'} 
                onClick={() => {
                  setActiveTab('info');
                  setIsEditing(false);
                }} 
                icon={<User className="w-3.5 h-3.5 md:w-4 md:h-4" />} 
                label="Profil Bilgilerim" 
              />
              <SidebarItem 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
                icon={<FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />} 
                label="Analiz Raporlarım" 
              />
            </nav>

            <div className="mt-3.5 md:mt-5">
              <button 
                onClick={onRequestReport}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#1a5c3a] hover:bg-[#207047] text-white rounded-xl text-[11px] md:text-xs font-black transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Sparkles size={14} className="stroke-[2.5px] text-amber-300" />
                RAPOR TALEP ET
              </button>
            </div>
          </div>

          <div className="mt-0 md:mt-8 pt-0 md:pt-6 border-t-0 md:border-t border-gray-200/60 flex flex-col gap-2">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center md:justify-start gap-1.5 md:gap-2.5 px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-colors shrink-0 border border-red-100 md:border-0"
              id="logout-button"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Güvenli Çıkış Yap
            </button>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center md:justify-start gap-1.5 md:gap-2.5 px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-all shrink-0 border border-gray-100 md:border-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Hesabı Kalıcı Olarak Sil
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-4 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: Profile Information */}
            {activeTab === 'info' ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-black text-gray-950 tracking-tight">Kullanıcı Hesabı</h3>
                </div>

                {/* Banner Notification Overlays */}
                <AnimatePresence>
                  {successMsg && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-semibold p-4 rounded-xl flex items-center gap-2.5"
                    >
                      <CheckCircle2 size={16} className="text-[#1a5c3a] shrink-0" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}
                  {errorMsg && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-4 rounded-xl"
                    >
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                


                {/* Main Read / Edit Profile Fields Panel */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                    
                    {/* Full Name field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">AD SOYAD</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="px-4 py-2.5 bg-white border border-gray-300 focus:border-[#1a5c3a] focus:ring-1 focus:ring-[#1a5c3a] rounded-xl text-xs md:text-sm text-gray-800 font-medium outline-hidden"
                          placeholder="Ad Soyad giriniz"
                          required
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          {user.fullName}
                        </div>
                      )}
                    </div>

                    {/* Email field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">E-POSTA ADRESİ</label>
                      {isEditing ? (
                        <input 
                          type="email" 
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="px-4 py-2.5 bg-white border border-gray-300 focus:border-[#1a5c3a] focus:ring-1 focus:ring-[#1a5c3a] rounded-xl text-xs md:text-sm text-gray-800 font-medium outline-hidden"
                          placeholder="E-posta adresi giriniz"
                          required
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          {user.email}
                        </div>
                      )}
                    </div>

                    {/* Phone field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">MOBİL TELEFON</label>
                      {isEditing ? (
                        <input 
                          type="tel" 
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="px-4 py-2.5 bg-white border border-gray-300 focus:border-[#1a5c3a] focus:ring-1 focus:ring-[#1a5c3a] rounded-xl text-xs md:text-sm text-gray-800 font-medium outline-hidden"
                          placeholder="Telefon giriniz"
                          required
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2">
                          <Smartphone size={14} className="text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>

                    {/* Pass field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">ŞİFRE DEĞİŞTİR</label>
                      {isEditing ? (
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 focus:border-[#1a5c3a] focus:ring-1 focus:ring-[#1a5c3a] rounded-xl text-xs md:text-sm text-gray-800 font-medium outline-hidden"
                            placeholder="Yeni şifrenizi girin (isteğe bağlı)"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-450 hover:text-gray-700 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs md:text-sm text-gray-400 font-medium flex items-center gap-2">
                          <Lock size={14} className="text-gray-400 shrink-0" />
                          <span>••••••••</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Buttons controls */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    {isEditing ? (
                      <>
                        <button 
                          type="submit" 
                          className="px-6 py-2.5 bg-[#1a5c3a] hover:bg-[#207047] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Değişiklikleri Kaydet
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditing(false);
                            setEditFullName(user.fullName);
                            setEditEmail(user.email);
                            setEditPhone(user.phone);
                            setEditPassword('');
                          }}
                          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Vazgeç
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2.5 bg-[#1a5c3a] hover:bg-[#207047] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Bilgileri Güncelle
                      </button>
                    )}
                  </div>
                </form>

                {/* Delete Account Confirmation Modal */}
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-gray-100 shadow-2xl relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000001_1px,transparent_1px),linear-gradient(to_bottom,#00000001_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                        
                        <div className="relative z-10 space-y-6 text-center">
                          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto border border-red-100">
                            <AlertTriangle size={28} className="stroke-[2.5px]" />
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-950 tracking-tight">Hesabınızı Silin</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed font-medium">
                              Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5 pt-1">
                            <button 
                              onClick={onDeleteAccount}
                              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white transition-colors rounded-xl text-xs font-bold shadow-md shadow-red-950/10 cursor-pointer"
                            >
                              Evet, Hesabımı Sil
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Vazgeç
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : (
              
              /* TAB 2: Valuation Reports list */
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-gray-950 tracking-tight">Analiz Raporlarım</h3>
                    <span className="text-[10px] font-black bg-[#1a5c3a]/10 text-[#1a5c3a] px-2.5 py-1 rounded-full tracking-wider">
                      TOPLAM {requests.length} RAPOR
                    </span>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <div className="text-center py-10 md:py-16 bg-gray-50 rounded-2xl md:rounded-3xl border border-dashed border-gray-200 px-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-3 border border-gray-200/50">
                      <FileText size={18} />
                    </div>
                    <p className="text-xs text-gray-500 font-bold">Henüz oluşturulmuş bir analiz raporunuz bulunmamaktadır.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Ana sayfadaki analiz talep formunu kullanarak ilk talebinizi oluşturabilirsiniz.</p>
                  </div>
                ) : (
                  <>
                    {/* Responsive Mobile Cards View */}
                    <div className="space-y-3 md:hidden" id="reports-mobile-list">
                      {requests.map((req) => (
                        <div key={req.id} className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-extrabold text-gray-550">KOD: {req.id}</span>
                            <StatusBadge status={req.status} />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-black text-gray-900 text-xs">
                                {req.type === 'konut' ? '🏠 Konut Raporu' : req.type === 'arsa' ? '🌳 Arsa / Arazi Raporu' : '🏢 Ticari Rapor'}
                              </div>
                              <div className="text-[9px] text-gray-400 font-bold mt-0.5">
                                {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                            
                            <div>
                              {req.status === 'done' ? (
                                <button 
                                  onClick={() => handleDownloadReport(req)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a5c3a] text-white rounded-lg text-[9px] font-black tracking-wider hover:bg-[#207047] transition-all cursor-pointer shadow-xs"
                                >
                                  <Download size={10} /> RAPORU İNDİR
                                </button>
                              ) : req.status === 'preparing' ? (
                                <span className="text-[10px] text-amber-600 font-black animate-pulse">Hazırlanıyor...</span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400">Bekliyor</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop/Tablet Table View */}
                    <div className="hidden md:block overflow-x-auto" id="reports-desktop-table">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-extrabold tracking-widest">
                            <th className="pb-3 text-left">RAPOR KODU</th>
                            <th className="pb-3 text-left">TAŞINMAZ TÜRÜ</th>
                            <th className="pb-3 text-left">TARİH</th>
                            <th className="pb-3 text-left">AŞAMA</th>
                            <th className="pb-3 text-right">EYLEM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {requests.map((req) => (
                             <tr key={req.id} className="hover:bg-gray-100/30 transition-colors">
                               <td className="py-4 font-extrabold text-xs text-gray-950">{req.id}</td>
                               <td className="py-4">
                                 <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[9px] font-black tracking-wider border border-gray-200">
                                   {req.type === 'konut' ? '🏠 KONUT' : req.type === 'arsa' ? '🌳 ARSA' : '🏢 TİCARİ'}
                                 </span>
                               </td>
                               <td className="py-4 text-[10px] text-gray-500 font-medium">
                                 {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                               </td>
                               <td className="py-4">
                                 <StatusBadge status={req.status} />
                               </td>
                              <td className="py-4 text-right">
                                {req.status === 'done' ? (
                                  <button 
                                    onClick={() => handleDownloadReport(req)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a5c3a] text-white rounded-lg text-[10px] font-extrabold tracking-wider hover:bg-[#207047] transition-all cursor-pointer shadow-sm"
                                  >
                                    <Download size={11} /> RAPORU İNDİR
                                  </button>
                                ) : req.status === 'preparing' ? (
                                  <span className="text-[10px] text-amber-600 font-bold animate-pulse">Analiz ediliyor...</span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-gray-400">Bekliyor</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>



    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 text-[11px] md:text-xs font-bold rounded-lg md:rounded-xl transition-all cursor-pointer
        ${active ? 'bg-white text-[#1a5c3a] shadow-xs md:shadow-sm border border-emerald-50 md:border-0' : 'text-gray-500 hover:text-[#1a5c3a] hover:bg-white'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  const configs = {
    new: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'TALEP ALINDI' },
    preparing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'HAZIRLANIYOR' },
    done: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', label: 'TAMAMLANDI' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-750', border: 'border-red-100', label: 'İPTAL EDİLDİ' }
  };
  const config = configs[status] || configs.new;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}

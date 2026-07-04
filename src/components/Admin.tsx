import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Inbox, Users as UsersIcon, LogOut, Search, Filter, ChevronLeft, Upload, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppraisalRequest, UserProfile, ReportStatus } from '../types.ts';
import { StatusBadge } from './Profile.tsx';

const transactionLabels: Record<string, string> = {
  satilik: 'Satılık',
  kiralik: 'Kiralık',
  devren_satilik: 'Devren Satılık',
  devren_kiralik: 'Devren Kiralık'
};

interface AdminProps {
  requests: AppraisalRequest[];
  onLogout: () => void;
  onUpdateRequest: (updatedReq: AppraisalRequest) => void;
  onNavigate?: (page: string) => void;
  currentUser?: UserProfile | null;
  onUpdateCurrentUser?: (updatedUser: UserProfile) => void;
  users: any[];
  onUpdateUsers: (updatedUsers: any[]) => void;
}

export function Admin({ requests, onLogout, onUpdateRequest, onNavigate, currentUser, onUpdateCurrentUser, users, onUpdateUsers }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'users' | 'detail'>('dashboard');
  const [selectedRequest, setSelectedRequest] = useState<AppraisalRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('new');
  
  // Floating dynamic toast notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Active Searching and Filtering States for Gelen Talepler
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'preparing' | 'done' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'konut' | 'arsa' | 'ticari'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editMembership, setEditMembership] = useState<string>('free');
  const [editExtraQuotaKonut, setEditExtraQuotaKonut] = useState<number>(0);
  const [editExtraQuotaArsa, setEditExtraQuotaArsa] = useState<number>(0);
  const [editExtraQuotaTicari, setEditExtraQuotaTicari] = useState<number>(0);

  const pendingCount = requests.filter(r => r.status === 'new').length;
  const preparingCount = requests.filter(r => r.status === 'preparing').length;
  const doneCount = requests.filter(r => r.status === 'done').length;

  const filteredRequests = requests.filter(req => {
    // Status filter
    if (statusFilter !== 'all' && req.status !== statusFilter) {
      return false;
    }
    // Type filter
    if (typeFilter !== 'all' && req.type !== typeFilter) {
      return false;
    }
    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchId = req.id.toLowerCase().includes(term);
      const matchName = req.contact.fullName.toLowerCase().includes(term);
      const matchEmail = req.contact.email.toLowerCase().includes(term);
      const matchCity = req.data.city.toLowerCase().includes(term);
      const matchDistrict = req.data.district.toLowerCase().includes(term);
      return matchId || matchName || matchEmail || matchCity || matchDistrict;
    }
    return true;
  });

  // Auto-sync users across incoming requests data dynamically if requests has new entries
  useEffect(() => {
    const existingEmails = users.map(u => u.email.toLowerCase());
    const newUsers = [...users];
    let changed = false;

    requests.forEach(req => {
      const email = req.contact.email.toLowerCase();
      if (!existingEmails.includes(email)) {
        newUsers.push({
          id: req.userId || `user_${Math.random().toString(36).substr(2, 5)}`,
          name: req.contact.fullName,
          email: req.contact.email,
          phone: req.contact.phone,
          membership: req.userMembership || 'free',
          date: new Date(req.createdAt).toLocaleDateString('tr-TR'),
          extraQuotaKonut: 0,
          extraQuotaArsa: 0,
          extraQuotaTicari: 0
        });
        changed = true;
      }
    });

    if (changed) {
      onUpdateUsers(newUsers);
    }
  }, [requests, users, onUpdateUsers]);

  useEffect(() => {
    if (selectedRequest) {
      setSelectedStatus(selectedRequest.status);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (selectedRequest) {
      const latest = requests.find(r => r.id === selectedRequest.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedRequest)) {
        setSelectedRequest(latest);
      }
    }
  }, [requests, selectedRequest]);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    // Toast notifications have been disabled per user request
  };

  const handleViewDetail = (req: AppraisalRequest) => {
    setSelectedRequest(req);
    setActiveTab('detail');
  };

  const handleStatCardClick = (status: 'all' | 'new' | 'preparing' | 'done') => {
    setStatusFilter(status === 'all' ? 'all' : status);
    setActiveTab('requests');
    triggerToast(`Filtre uygulandı: ${status === 'all' ? 'Tüm Talepler' : status === 'new' ? 'Yeni Talepler' : status === 'preparing' ? 'Hazırlanan Talepler' : 'Tamamlanan Talepler'}`);
  };

  const handleStatusUpdate = () => {
    if (!selectedRequest) return;
    const updated: AppraisalRequest = {
      ...selectedRequest,
      status: selectedStatus
    };
    onUpdateRequest(updated);
    setSelectedRequest(updated); // Sync local detail view
    
    // Set matching badge membership if we updated user details or membership
    const matchingUser = users.find(u => u.email.toLowerCase() === selectedRequest.contact.email.toLowerCase());
    if (matchingUser && matchingUser.membership !== selectedRequest.userMembership) {
      updated.userMembership = matchingUser.membership;
      onUpdateRequest(updated);
    }

    const txt = selectedStatus === 'new' ? 'Talep Alındı' : selectedStatus === 'preparing' ? 'Hazırlanıyor' : selectedStatus === 'done' ? 'Tamamlandı' : 'İptal Edildi';
    triggerToast(`Talep durumu başarıyla "${txt}" olarak güncellendi!`);
  };

  const handleSimulatePdfUpload = () => {
    if (!selectedRequest) return;
    
    // Simulate updating with a mock PDF link using computed properties
    const updated: AppraisalRequest = {
      ...selectedRequest,
      status: 'done', // auto set status to done when PDF is uploaded
      pdfUrl: '#', // Simply triggers profile download HTML engine beautifully
      pdfName: 'Otomatik_Değerleme_Föyü.html'
    };
    setSelectedStatus('done');
    onUpdateRequest(updated);
    setSelectedRequest(updated); // Sync local detail view
    triggerToast('Değerleme raporu başarıyla onaylandı ve indirilmeye hazır hale getirildi!');
  };

  const handleRealPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRequest || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      triggerToast('Lütfen sadece PDF formatında bir değerleme raporu yükleyin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated: AppraisalRequest = {
          ...selectedRequest,
          status: 'done',
          pdfUrl: dataUrl,
          pdfName: file.name
        };
        setSelectedStatus('done');
        onUpdateRequest(updated);
        setSelectedRequest(updated);
        triggerToast(`"${file.name}" adlı PDF değerleme raporunuz başarıyla yüklendi!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearPdf = () => {
    if (!selectedRequest) return;
    const updated: AppraisalRequest = {
      ...selectedRequest,
      pdfUrl: undefined,
      pdfName: undefined
    };
    onUpdateRequest(updated);
    setSelectedRequest(updated);
    triggerToast('Yüklenmiş değerleme raporu dosyası başarıyla kaldırıldı.');
  };

  const handleSaveUserMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Update users database state locally
    const updatedUsers = users.map(u => u.id === editingUser.id ? { 
      ...u, 
      membership: editMembership,
      extraQuotaKonut: editExtraQuotaKonut,
      extraQuotaArsa: editExtraQuotaArsa,
      extraQuotaTicari: editExtraQuotaTicari
    } : u);
    onUpdateUsers(updatedUsers);

    // If the updated user is the currently logged-in user, sync their profile as well
    if (currentUser && (editingUser.email.toLowerCase() === currentUser.email.toLowerCase() || editingUser.id === currentUser.id)) {
      onUpdateCurrentUser?.({
        ...currentUser,
        membershipType: editMembership as any,
        extraQuotaKonut: editExtraQuotaKonut,
        extraQuotaArsa: editExtraQuotaArsa,
        extraQuotaTicari: editExtraQuotaTicari
      });
    }

    // Sync all appraisal requests belonging to this user
    requests.forEach(req => {
      if (req.contact.email.toLowerCase() === editingUser.email.toLowerCase() || (req.userId && req.userId === editingUser.id)) {
        onUpdateRequest({
          ...req,
          userMembership: editMembership as any
        });
      }
    });

    triggerToast(`"${editingUser.name}" kullanıcısının paket ve kota bilgileri başarıyla güncellendi!`);
    setEditingUser(null);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 bg-[#0f3d25] border-b md:border-b-0 md:border-r border-[#1a1a1a]/10 p-4 md:p-6 flex flex-col text-white gap-4 md:gap-0">
        <div className="flex items-center justify-between md:block mb-1 md:mb-12">
          <div className="flex items-center gap-2 text-lg md:text-xl font-medium">
            <img 
              src="/değerbiç.png" 
              alt="değerbiç logo" 
              className="h-6 w-auto object-contain select-none" 
              referrerPolicy="no-referrer"
            />
            <span>değer<span className="text-[#f0a500]">biç</span></span>
            <span className="text-[10px] opacity-40 px-1.5 py-0.5 border border-white/20 rounded uppercase">Admin</span>
          </div>

          <button 
            onClick={onLogout}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-xs transition-all border border-white/10 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Çıkış</span>
          </button>
        </div>

        <nav className="grid grid-cols-4 md:flex md:flex-col gap-1 md:space-y-1 flex-1">
          <AdminSidebarItem 
            active={false} 
            onClick={() => onNavigate?.('profile')} 
            icon={<FileText className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />} 
            label="Profilim" 
          />
          <div className="hidden md:block border-b border-white/10 my-3" />
          <AdminSidebarItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />} 
            label="Genel Bakış" 
          />
          <AdminSidebarItem 
            active={activeTab === 'requests' || activeTab === 'detail'} 
            onClick={() => setActiveTab('requests')} 
            icon={<Inbox className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />} 
            label="Talepler" 
          />
          <AdminSidebarItem 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<UsersIcon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />} 
            label="Kullanıcılar" 
          />
        </nav>

        <button 
          onClick={onLogout}
          className="hidden md:flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all mt-auto"
        >
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-4 gap-1.5 md:gap-4 mb-6 md:mb-8">
                <div onClick={() => handleStatCardClick('all')} className="w-full">
                  <StatCard label="Toplam Talep" mobileLabel="Toplam" val={requests.length} active={statusFilter === 'all'} />
                </div>
                <div onClick={() => handleStatCardClick('new')} className="w-full">
                  <StatCard label="Bekleyen" mobileLabel="Bekleyen" val={pendingCount} color="text-amber-600" active={statusFilter === 'new'} />
                </div>
                <div onClick={() => handleStatCardClick('preparing')} className="w-full">
                  <StatCard label="Hazırlanan" mobileLabel="Hazırlık" val={preparingCount} color="text-blue-600" active={statusFilter === 'preparing'} />
                </div>
                <div onClick={() => handleStatCardClick('done')} className="w-full">
                  <StatCard label="Tamamlanan" mobileLabel="Biten" val={doneCount} color="text-emerald-600" active={statusFilter === 'done'} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-8 shadow-sm">
                <h3 className="text-xs md:text-sm font-bold text-gray-400 tracking-widest mb-3 md:mb-4">SON TALEPLER</h3>
                <RequestTable requests={requests.slice(0, 5)} onViewDetail={handleViewDetail} />
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-medium">Gelen Talepler</h3>
                <span className="text-xs bg-[#1a5c3a]/10 text-[#1a5c3a] font-bold px-3 py-1 rounded-full tracking-wider">
                  SÜZÜLEN: {filteredRequests.length} / {requests.length} TALEP
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Search and Type Selectors Row */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-[#1a5c3a] focus:ring-1 focus:ring-[#1a5c3a] rounded-xl md:rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-850 outline-hidden" 
                        placeholder="Talep Kodu, isim, e-posta veya şehir/ilçe ile ara..." 
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')} 
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={typeFilter}
                        onChange={(e) => {
                          setTypeFilter(e.target.value as any);
                          triggerToast(`Tür filtresi: ${e.target.value === 'all' ? 'Tümü' : e.target.value === 'konut' ? 'Konut' : e.target.value === 'arsa' ? 'Arsa' : 'Ticari'}`);
                        }}
                        className="w-full md:w-auto bg-white border border-gray-200 focus:border-[#1a5c3a] focus:outline-hidden rounded-xl md:rounded-2xl px-4 py-2.5 text-xs md:text-sm text-gray-700 font-semibold cursor-pointer"
                      >
                        <option value="all">Tüm Taşınmaz Türleri</option>
                        <option value="konut">🏠 Konut</option>
                        <option value="arsa">🌳 Arsa / Arazi</option>
                        <option value="ticari">🏢 Ticari</option>
                      </select>
                    </div>
                  </div>

                  {/* Status Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-55 pt-3">
                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 tracking-widest mr-1.5 w-full md:w-auto block mb-1 md:mb-0">DURUM SÜZGECİ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: 'all', label: 'Tümü' },
                        { key: 'new', label: 'Yeni' },
                        { key: 'preparing', label: 'Hazırlanıyor' },
                        { key: 'done', label: 'Tamamlandı' },
                        { key: 'cancelled', label: 'İptal' }
                      ].map((statusBtn) => (
                        <button
                          key={statusBtn.key}
                          onClick={() => {
                            setStatusFilter(statusBtn.key as any);
                            triggerToast(`Durum filtresi: ${statusBtn.label}`);
                          }}
                          className={`px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all border cursor-pointer ${
                            statusFilter === statusBtn.key
                              ? 'bg-[#1a5c3a] text-white border-[#1a5c3a] shadow-xs'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {statusBtn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden p-2 md:p-0">
                {filteredRequests.length === 0 ? (
                  <div className="p-16 text-center text-gray-500 font-medium">
                    Aradığınız kriterlere uygun sonuç bulunamadı.
                  </div>
                ) : (
                  <RequestTable requests={filteredRequests} onViewDetail={handleViewDetail} />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'detail' && selectedRequest && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button 
                onClick={() => setActiveTab('requests')}
                className="flex items-center gap-1 text-[#1a5c3a] text-sm font-medium hover:underline mb-6 cursor-pointer"
              >
                <ChevronLeft size={16} /> Taleplere Dön
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <DetailCard title="Talep Bilgileri">
                  <DetailRow label="Talep No" value={selectedRequest.id} bold />
                  <DetailRow label="Tarih" value={`${new Date(selectedRequest.createdAt).toLocaleDateString('tr-TR')} ${new Date(selectedRequest.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`} />
                  <DetailRow label="Tür" value={<span className="capitalize">{selectedRequest.type === 'konut' ? 'Konut' : selectedRequest.type === 'arsa' ? 'Arsa / Arazi' : 'Ticari'}</span>} />
                  <DetailRow 
                    label="Üyelik Türü" 
                    value={
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider border ${
                        selectedRequest.userMembership === 'guest' || (!selectedRequest.userMembership && !selectedRequest.userId)
                          ? 'bg-amber-50 text-amber-750 border-amber-100'
                          : 'bg-[#1a5c3a]/5 text-[#1a5c3a] border-[#1a5c3a]/10'
                      }`}>
                        {selectedRequest.userMembership === 'guest' || (!selectedRequest.userMembership && !selectedRequest.userId)
                          ? 'MİSAFİR'
                          : selectedRequest.userMembership === 'free'
                            ? 'STANDART ÜYE'
                            : selectedRequest.userMembership === 'monthly'
                              ? 'AYLIK ÜYE'
                              : selectedRequest.userMembership === 'yearly'
                                ? 'YILLIK ÜYE'
                                : 'KAYITLI ÜYE'}
                      </span>
                    } 
                  />
                </DetailCard>

                <DetailCard title="Kullanıcı Bilgileri">
                  <DetailRow label="Ad Soyad" value={selectedRequest.contact.fullName} />
                  <DetailRow label="Telefon" value={selectedRequest.contact.phone} />
                  <DetailRow label="E-posta" value={selectedRequest.contact.email} />
                </DetailCard>

                <DetailCard title="Gayrimenkul Detayları">
                  <DetailRow label="Konum" value={`${selectedRequest.data.city} / ${selectedRequest.data.district}`} />
                  <DetailRow label="Mahalle" value={selectedRequest.data.neighborhood} />
                  
                  {selectedRequest.data.address && (
                    <DetailRow label="Açık Adres" value={selectedRequest.data.address} />
                  )}
                  
                  <DetailRow label="Gayrimenkul Türü" value={
                    selectedRequest.type === 'konut' ? 'Konut' :
                    selectedRequest.type === 'arsa' ? 'Arsa / Arazi' : 'Ticari'
                  } bold />

                  {selectedRequest.data.transactionType && (
                    <DetailRow label="İşlem Türü" value={transactionLabels[selectedRequest.data.transactionType] || selectedRequest.data.transactionType} />
                  )}
                  
                  {selectedRequest.data.propertySubType && (
                    <DetailRow label="Alt Türü" value={
                      selectedRequest.data.propertySubType === 'Diğer' && selectedRequest.data.propertySubTypeOther
                        ? `Diğer (${selectedRequest.data.propertySubTypeOther})`
                        : selectedRequest.data.propertySubType
                    } />
                  )}

                  {/* Fiyat Bilgisi */}
                  {(selectedRequest.data.priceType || selectedRequest.data.price || selectedRequest.data.minPrice || selectedRequest.data.maxPrice) && (
                    <DetailRow 
                      label="Beklenen Değer" 
                      value={
                        selectedRequest.data.priceType === 'tek' && selectedRequest.data.price
                          ? `${Number(selectedRequest.data.price).toLocaleString('tr-TR')} ₺`
                          : selectedRequest.data.priceType === 'aralik' && (selectedRequest.data.minPrice || selectedRequest.data.maxPrice)
                            ? `${Number(selectedRequest.data.minPrice || 0).toLocaleString('tr-TR')} ₺ - ${Number(selectedRequest.data.maxPrice || 0).toLocaleString('tr-TR')} ₺`
                            : selectedRequest.data.price
                              ? `${Number(selectedRequest.data.price).toLocaleString('tr-TR')} ₺`
                              : '-'
                      } 
                      bold 
                    />
                  )}

                  {/* Konut ve Ticari için Alan ve Metraj bilgileri */}
                  {selectedRequest.data.netArea && (
                    <DetailRow label="Net Alan" value={`${selectedRequest.data.netArea} m²`} />
                  )}
                  {selectedRequest.data.grossArea && (
                    <DetailRow label="Brüt Alan" value={`${selectedRequest.data.grossArea} m²`} />
                  )}
                  {selectedRequest.data.rooms && (
                    <DetailRow label="Oda Sayısı" value={selectedRequest.data.rooms} />
                  )}

                  {/* Arsa ve Arazi Bilgileri */}
                  {selectedRequest.data.area && (
                    <DetailRow label="Yüzölçümü (m²)" value={`${selectedRequest.data.area} m²`} />
                  )}
                  {selectedRequest.data.areaDonum && (
                    <DetailRow label="Yüzölçümü (dönüm)" value={`${selectedRequest.data.areaDonum} dönüm`} />
                  )}
                  {(selectedRequest.data.ada || selectedRequest.data.parsel) && (
                    <DetailRow label="Ada / Parsel" value={`${selectedRequest.data.ada || '-'} / ${selectedRequest.data.parsel || '-'}`} />
                  )}
                  {selectedRequest.data.quality && (
                    <DetailRow label="Nitelik" value={selectedRequest.data.quality} />
                  )}
                  {selectedRequest.data.zoningStatus && (
                    <DetailRow label="İmar Durumu" value={selectedRequest.data.zoningStatus} />
                  )}

                  {/* Genel ve Ek Sektörel Detaylar */}
                  {(selectedRequest.data.age || selectedRequest.data.buildingAge) && (
                    <DetailRow label="Bina Yaşı" value={selectedRequest.data.age || selectedRequest.data.buildingAge} />
                  )}
                  {selectedRequest.data.floor && (
                    <DetailRow label="Bulunduğu Kat" value={selectedRequest.data.floor} />
                  )}
                  {selectedRequest.data.totalFloors && (
                    <DetailRow label="Toplam Kat Sayısı" value={selectedRequest.data.totalFloors} />
                  )}
                  {selectedRequest.data.heating && (
                    <DetailRow label="Isınma Tipi" value={selectedRequest.data.heating} />
                  )}
                  {selectedRequest.data.facade && (
                    <DetailRow label="Cephe" value={selectedRequest.data.facade} />
                  )}
                  {selectedRequest.data.titleStatus && (
                    <DetailRow label="Tapu Durumu" value={selectedRequest.data.titleStatus} />
                  )}
                  {selectedRequest.data.usageStatus && (
                    <DetailRow label="Kullanım Durumu" value={selectedRequest.data.usageStatus} />
                  )}
                  {selectedRequest.data.elevator && (
                    <DetailRow label="Asansör" value={selectedRequest.data.elevator} />
                  )}
                  {selectedRequest.data.parking && (
                    <DetailRow label="Otopark" value={selectedRequest.data.parking} />
                  )}
                  {selectedRequest.data.furnished && (
                    <DetailRow label="Eşya Durumu" value={selectedRequest.data.furnished} />
                  )}

                  {/* İlan Linki */}
                  {selectedRequest.listingUrl && (
                    <DetailRow 
                      label="İlan Linki" 
                      value={
                        <a 
                          href={selectedRequest.listingUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#1a5c3a] hover:underline flex items-center gap-1 font-semibold text-xs py-0.5"
                        >
                          İlanı Aç <ExternalLink size={12} />
                        </a>
                      } 
                    />
                  )}
                </DetailCard>

                <DetailCard title="Durum Yönetimi">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 tracking-widest mb-1.5 block">DURUM GÜNCELLE</label>
                      <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#1a5c3a]"
                      >
                        <option value="new">Talep Alındı (Yeni)</option>
                        <option value="preparing">Rapor Hazırlanıyor</option>
                        <option value="done">Rapor Tamamlandı</option>
                        <option value="cancelled">İptal Edildi</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleStatusUpdate}
                      className="w-full py-2.5 bg-[#1a5c3a] text-white rounded-xl text-xs font-bold hover:bg-[#2d8a58] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/10"
                    >
                      Kabul Et ve Durumu Güncelle
                    </button>

                    <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 tracking-widest block">RAPOR YÜKLE / ATA</label>
                      
                      {selectedRequest.pdfUrl ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <FileText size={14} className="text-[#1a5c3a] shrink-0" />
                            <span className="text-[#1a5c3a] font-medium truncate max-w-[150px]" title={selectedRequest.pdfName || 'Değerleme Raporu'}>
                              {selectedRequest.pdfName || 'Değerleme_Raporu.pdf'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-800 font-extrabold text-[9px] bg-emerald-100 px-1.5 py-0.5 rounded font-black">AKTİF</span>
                            <button
                              type="button"
                              onClick={handleClearPdf}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors text-xs font-black cursor-pointer"
                              title="Raporu Kaldır"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 block italic">Atanmış bir rapor dosyası yok.</span>
                      )}

                      <div className="space-y-2">
                        {/* Real file uploading */}
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf"
                            id="pdf-file-upload-input"
                            onChange={handleRealPdfUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="pdf-file-upload-input"
                            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 text-gray-600 bg-gray-50 rounded-xl text-xs font-semibold hover:border-[#1a5c3a]/50 hover:bg-emerald-50/10 hover:text-[#1a5c3a] transition-all cursor-pointer text-center block"
                          >
                            <Upload size={14} /> Bilgisayardan PDF Raporu Yükle
                          </label>
                        </div>

                        <div className="flex items-center my-1.5">
                          <div className="grow border-t border-gray-100"></div>
                          <span className="mx-2 text-[9px] font-extrabold text-gray-300 tracking-wider">VEYA</span>
                          <div className="grow border-t border-gray-100"></div>
                        </div>

                        {/* Fast dynamic report generation */}
                        <button 
                          type="button"
                          onClick={handleSimulatePdfUpload}
                          className="w-full flex items-center justify-center gap-2 py-2 border border-[#1a5c3a]/30 text-[#1a5c3a] bg-white rounded-xl text-xs font-semibold hover:bg-emerald-50/40 active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <FileText size={13} /> Otomatik Hızlı Analiz Raporunu Ata
                        </button>
                      </div>
                    </div>
                  </div>
                </DetailCard>
              </div>

              {selectedRequest.notes && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6">
                  <h3 className="text-xs font-bold text-gray-400 tracking-widest mb-3">EK AÇIKLAMALAR</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedRequest.notes}</p>
                </div>
              )}

              {((selectedRequest.data as any).images?.length > 0 || selectedRequest.photos?.length > 0) && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6 mt-4">
                  <h3 className="text-xs font-bold text-[#1a5c3a] tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#1a5c3a] rounded-full animate-pulse"></span>
                    YÜKLENEN FOTOĞRAFLAR ({((selectedRequest.data as any).images || selectedRequest.photos || []).length} Adet)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {((selectedRequest.data as any).images || selectedRequest.photos || []).map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group hover:border-[#1a5c3a]/30 transition-all hover:shadow-sm">
                        <img 
                          src={img} 
                          alt={`Yüklenen Fotoğraf ${idx + 1}`} 
                          className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-300"
                          onClick={() => {
                            const newTab = window.open();
                            if (newTab) {
                              newTab.document.write(`<img src="${img}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                              newTab.document.title = `Değer Biç - Yüklenen Fotoğraf ${idx + 1}`;
                            }
                          }}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between pointer-events-none">
                          <span className="text-white text-[9px] font-bold">Fotoğraf {idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-medium">Kullanıcı Yönetimi</h3>
                <span className="text-xs bg-[#1a5c3a]/10 text-[#1a5c3a] font-bold px-3 py-1 rounded-full tracking-wider">
                  KAYITLI: {users.length} ÜYE
                </span>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden p-2 md:p-0">
                {/* Mobile Cards for Users */}
                <div className="block md:hidden space-y-3" id="users-mobile-list">
                  {users.map((row) => (
                    <div key={row.id} className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm">{row.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border ${
                          row.membership === 'monthly'
                            ? 'bg-blue-50 text-blue-700 border-blue-150'
                            : row.membership === 'yearly'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                              : row.membership === 'guest'
                                ? 'bg-amber-50 text-amber-700 border-amber-150'
                                : 'bg-gray-100 text-gray-600 border-gray-150'
                        }`}>
                          {row.membership === 'free' ? 'STANDART' : row.membership === 'monthly' ? 'AYLIK' : row.membership === 'yearly' ? 'YILLIK' : 'MİSAFİR'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">E-posta:</span>
                          <span className="text-gray-700 font-medium truncate max-w-[180px]">{row.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Telefon:</span>
                          <span className="text-gray-700">{row.phone || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Kayıt:</span>
                          <span className="text-gray-500">{row.date}</span>
                        </div>

                        {/* Quota Usage display */}
                        <div className="pt-2 border-t border-gray-150/60">
                          {(() => {
                            const userReqs = requests.filter(r => r.userId === row.id);
                            const konutCount = userReqs.filter(r => r.type === 'konut').length;
                            const arsaCount = userReqs.filter(r => r.type === 'arsa').length;
                            const ticariCount = userReqs.filter(r => r.type === 'ticari').length;
                            const totalCount = userReqs.length;

                            const getLimitForType = (type: string, membership: string) => {
                              if (row.activeSubscription && row.activeSubscription.quota) {
                                const qVal = row.activeSubscription.quota[type as keyof typeof row.activeSubscription.quota] || 0;
                                const extra = type === 'konut' ? (row.extraQuotaKonut || 0) : type === 'arsa' ? (row.extraQuotaArsa || 0) : (row.extraQuotaTicari || 0);
                                return qVal + extra;
                              }
                              let base = 0;
                              if (membership === 'monthly') {
                                if (type === 'konut') base = 3;
                                if (type === 'arsa') base = 2;
                                if (type === 'ticari') base = 1;
                              }
                              if (membership === 'yearly') {
                                if (type === 'konut') base = 36;
                                if (type === 'arsa') base = 24;
                                if (type === 'ticari') base = 12;
                              }
                              const extra = type === 'konut' ? (row.extraQuotaKonut || 0) : type === 'arsa' ? (row.extraQuotaArsa || 0) : (row.extraQuotaTicari || 0);
                              return base + extra;
                            };

                            const hasExtra = !!(row.extraQuotaKonut || row.extraQuotaArsa || row.extraQuotaTicari);
                            if ((row.membership === 'free' || row.membership === 'guest') && !hasExtra) {
                              return (
                                <span className="text-[10px] text-gray-400 block">Kullanım: {totalCount} Rapor (Paketsiz)</span>
                              );
                            }

                            return (
                              <div className="text-[10px] text-gray-500 space-y-0.5 mt-1 bg-white p-2 rounded border border-gray-150">
                                <span className="font-semibold block text-gray-700">Kullanılan Kotalar {hasExtra && <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100 font-normal ml-1">Ek Kota Dahil</span>}:</span>
                                <div className="flex gap-2 justify-between">
                                  <span>Konut: {konutCount}/{getLimitForType('konut', row.membership)}</span>
                                  <span>Arsa: {arsaCount}/{getLimitForType('arsa', row.membership)}</span>
                                  <span>Ticari: {ticariCount}/{getLimitForType('ticari', row.membership)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100 flex justify-end">
                        <button 
                          onClick={() => {
                            setEditingUser(row);
                            setEditMembership(row.membership);
                            setEditExtraQuotaKonut(row.extraQuotaKonut || 0);
                            setEditExtraQuotaArsa(row.extraQuotaArsa || 0);
                            setEditExtraQuotaTicari(row.extraQuotaTicari || 0);
                          }}
                          className="px-3 py-1 bg-[#1a5c3a] text-white rounded-lg text-xs font-bold hover:bg-[#207047] cursor-pointer"
                        >
                          Düzenle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto" id="users-desktop-table">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                        <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">AD SOYAD</th>
                        <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">E-POSTA</th>
                        <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">MOBİL TELEFON</th>
                        <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">ÜYELİK LİSANSI</th>
                        <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">KAYIT TARİHİ</th>
                        <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">İŞLEM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{row.name}</td>
                          <td className="px-6 py-4 text-[#1a5c3a] font-medium">{row.email}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">{row.phone || '—'}</td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${
                                row.membership === 'monthly'
                                  ? 'bg-blue-50 text-blue-700 border-blue-150'
                                  : row.membership === 'yearly'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                                    : row.membership === 'guest'
                                      ? 'bg-amber-50 text-amber-700 border-amber-150'
                                      : 'bg-gray-100 text-gray-600 border-gray-150'
                              }`}>
                                {row.membership === 'free' ? 'STANDART' : row.membership === 'monthly' ? 'AYLIK' : row.membership === 'yearly' ? 'YILLIK' : 'MİSAFİR'}
                              </span>
                              {(() => {
                                const userReqs = requests.filter(r => r.userId === row.id);
                                const konutCount = userReqs.filter(r => r.type === 'konut').length;
                                const arsaCount = userReqs.filter(r => r.type === 'arsa').length;
                                 const ticariCount = userReqs.filter(r => r.type === 'ticari').length;
                                 const totalCount = userReqs.length;
                                 const getLimitForType = (type: string, membership: string) => {
                                  if (row.activeSubscription && row.activeSubscription.quota) {
                                    const qVal = row.activeSubscription.quota[type as keyof typeof row.activeSubscription.quota] || 0;
                                    const extra = type === 'konut' ? (row.extraQuotaKonut || 0) : type === 'arsa' ? (row.extraQuotaArsa || 0) : (row.extraQuotaTicari || 0);
                                    return qVal + extra;
                                  }
                                  let base = 0;
                                  if (membership === 'monthly') {
                                    if (type === 'konut') base = 3;
                                    if (type === 'arsa') base = 2;
                                    if (type === 'ticari') base = 1;
                                  }
                                  if (membership === 'yearly') {
                                    if (type === 'konut') base = 36;
                                    if (type === 'arsa') base = 24;
                                    if (type === 'ticari') base = 12;
                                  }
                                  const extra = type === 'konut' ? (row.extraQuotaKonut || 0) : type === 'arsa' ? (row.extraQuotaArsa || 0) : (row.extraQuotaTicari || 0);
                                  return base + extra;
                                };

                                const hasExtra = !!(row.extraQuotaKonut || row.extraQuotaArsa || row.extraQuotaTicari);
                                if ((row.membership === 'free' || row.membership === 'guest') && !hasExtra) {
                                  return (
                                    <span className="text-[10px] text-gray-400 block font-medium">Toplam: {totalCount} Rapor</span>
                                  );
                                }

                                return (
                                  <div className="text-[9px] text-gray-500 whitespace-nowrap bg-gray-50 p-1.5 rounded border border-gray-100 font-medium">
                                    Konut: {konutCount}/{getLimitForType('konut', row.membership)} | Arsa: {arsaCount}/{getLimitForType('arsa', row.membership)} | Ticari: {ticariCount}/{getLimitForType('ticari', row.membership)}
                                    {hasExtra && <span className="ml-1.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">Ek Kota</span>}
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">{row.date}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                setEditingUser(row);
                                setEditMembership(row.membership);
                                setEditExtraQuotaKonut(row.extraQuotaKonut || 0);
                                setEditExtraQuotaArsa(row.extraQuotaArsa || 0);
                                setEditExtraQuotaTicari(row.extraQuotaTicari || 0);
                              }}
                              className="text-[#1a5c3a] hover:text-[#207047] font-bold hover:underline cursor-pointer"
                            >
                              Düzenle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notifications disabled */}

      {/* Edit User Modal Overlay */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative"
            >
              <h3 className="text-md font-black text-gray-950 tracking-tight mb-2">Kullanıcı Paket & Kota Düzenleme</h3>
              <p className="text-xs text-gray-500 mb-6">"<strong>{editingUser.name}</strong>" ({editingUser.email}) isimli kullanıcının paket ve ek kotalarını düzenleyin.</p>
              
              <form onSubmit={handleSaveUserMembership} className="space-y-5">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1 block mb-2">LİSANS PAKETİ</label>
                  <select
                    value={editMembership}
                    onChange={(e) => setEditMembership(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 focus:border-[#1a5c3a] focus:outline-hidden rounded-xl px-4 py-2.5 text-xs md:text-sm text-gray-800 font-semibold focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                  >
                    <option value="guest">Misafir (Talep Başına Ödeme)</option>
                    <option value="free">Standart (Ücretsiz Kayıtlı)</option>
                    <option value="monthly">Profesyonel Aylık Abonelik</option>
                    <option value="yearly">Profesyonel Yıllık Paket</option>
                  </select>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1 block mb-1">EKSTRA KOTALAR (EK RAPOR HAKKI)</label>
                  <p className="text-[10px] text-gray-400 mb-3">Paket limitlerine ek olarak verilecek (artırılacak) veya azaltılacak analiz haklarını tanımlayın.</p>
                  
                  <div className="space-y-3">
                    {/* Konut Ek Kota */}
                    <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">Konut Ek Kotası</span>
                        <span className="text-[9px] text-gray-400">Rapor Hak Sayısı</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditExtraQuotaKonut(prev => Math.max(0, prev - 1))}
                          className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-black flex items-center justify-center transition-colors text-xs cursor-pointer select-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={editExtraQuotaKonut}
                          onChange={(e) => setEditExtraQuotaKonut(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 h-7 bg-white border border-gray-300 rounded-lg text-center font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-[#1a5c3a]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditExtraQuotaKonut(prev => prev + 1)}
                          className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-black flex items-center justify-center transition-colors text-xs cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Arsa Ek Kota */}
                    <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">Arsa Ek Kotası</span>
                        <span className="text-[9px] text-gray-400">Rapor Hak Sayısı</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditExtraQuotaArsa(prev => Math.max(0, prev - 1))}
                          className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-black flex items-center justify-center transition-colors text-xs cursor-pointer select-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={editExtraQuotaArsa}
                          onChange={(e) => setEditExtraQuotaArsa(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 h-7 bg-white border border-gray-300 rounded-lg text-center font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-[#1a5c3a]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditExtraQuotaArsa(prev => prev + 1)}
                          className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-black flex items-center justify-center transition-colors text-xs cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Ticari Ek Kota */}
                    <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">Ticari Ek Kotası</span>
                        <span className="text-[9px] text-gray-400">Rapor Hak Sayısı</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditExtraQuotaTicari(prev => Math.max(0, prev - 1))}
                          className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-black flex items-center justify-center transition-colors text-xs cursor-pointer select-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={editExtraQuotaTicari}
                          onChange={(e) => setEditExtraQuotaTicari(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 h-7 bg-white border border-gray-300 rounded-lg text-center font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-[#1a5c3a]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditExtraQuotaTicari(prev => prev + 1)}
                          className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-black flex items-center justify-center transition-colors text-xs cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#1a5c3a] hover:bg-[#207047] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Değişiklikleri Uygula
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminSidebarItem({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm rounded-lg md:rounded-xl transition-all cursor-pointer
        ${active ? 'bg-white/10 text-white font-medium shadow-inner' : 'text-white/60 hover:text-white hover:bg-white/5'}
      `}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatCard({ label, val, color = 'text-gray-900', active, mobileLabel }: any) {
  const displayLabel = (mobileLabel || label)?.toLocaleUpperCase('tr-TR');
  const desktopLabel = label?.toLocaleUpperCase('tr-TR');
  return (
    <div className={`bg-white border rounded-xl md:rounded-2xl p-2.5 md:p-5 shadow-xs md:shadow-sm cursor-pointer transition-all ${active ? 'border-[#1a5c3a] bg-emerald-50/10' : 'border-gray-200 hover:border-gray-300'}`}>
      <span className="text-[8px] md:text-[10px] font-bold text-gray-400 tracking-widest block mb-0.5 md:mb-2 truncate">
        <span className="md:hidden">{displayLabel}</span>
        <span className="hidden md:inline">{desktopLabel}</span>
      </span>
      <p className={`text-lg md:text-3xl font-bold ${color}`}>{val}</p>
    </div>
  );
}

function RequestTable({ 
  requests, 
  onViewDetail 
}: { 
  requests: AppraisalRequest[]; 
  onViewDetail: (r: AppraisalRequest) => void; 
}) {
  return (
    <>
      {/* Mobile Card-based View */}
      <div className="block md:hidden space-y-3 p-1" id="request-table-mobile">
        {requests.map((req) => (
          <div key={req.id} className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-extrabold text-gray-500">NO: {req.id}</span>
              <StatusBadge status={req.status} />
            </div>
            
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-xs truncate max-w-[150px]">{req.contact.fullName}</p>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                  {new Date(req.createdAt).toLocaleDateString('tr-TR')} {new Date(req.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">
                  {req.data.city} / {req.data.district}
                </p>
              </div>
              
              <button 
                onClick={() => onViewDetail(req)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
              >
                Görüntüle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto" id="request-table-desktop">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
              <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">TALEP NO</th>
              <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">KULLANICI</th>
              <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">TARİH</th>
              <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">DURUM</th>
              <th className="px-6 py-4 font-medium text-gray-500 tracking-widest text-[10px]">İŞLEM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{req.id}</td>
                <td className="px-6 py-4">{req.contact.fullName}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{`${new Date(req.createdAt).toLocaleDateString('tr-TR')} ${new Date(req.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}</td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onViewDetail(req)}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-xs font-medium hover:bg-white shadow-sm transition-all cursor-pointer"
                  >
                    Görüntüle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DetailCard({ title, children }: any) {
  const displayTitle = title?.toLocaleUpperCase('tr-TR');
  return (
    <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
      <h3 className="text-[10px] md:text-xs font-bold text-gray-400 tracking-widest mb-3 md:mb-4">{displayTitle}</h3>
      <div className="space-y-2 md:space-y-3">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }: any) {
  return (
    <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-gray-50 last:border-0 text-xs md:text-sm gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{value}</span>
    </div>
  );
}

function UserRow({ name, email, plan, date }: any) {
  const displayPlan = plan?.toLocaleUpperCase('tr-TR');
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
      <td className="px-6 py-4 text-[#1a5c3a]">{email}</td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-0.5 rounded-full bg-[#1a5c3a]/5 text-[#1a5c3a] text-[10px] font-bold tracking-wider border border-[#1a5c3a]/10">
          {displayPlan}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-gray-500">{date}</td>
      <td className="px-6 py-4 font-medium text-[#1a5c3a] cursor-pointer hover:underline">Düzenle</td>
    </tr>
  );
}

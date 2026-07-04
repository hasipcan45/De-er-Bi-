import { useState, useEffect, FormEvent } from 'react';
import { Navbar, Hero } from './components/CoreUI.tsx';
import { PropertyForm } from './components/PropertyForm.tsx';
import { Pricing } from './components/Pricing.tsx';
import { Profile } from './components/Profile.tsx';
import { Admin } from './components/Admin.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ReportFlowModal } from './components/ReportFlowModal.tsx';
import { SubscriptionPaymentModal } from './components/SubscriptionPaymentModal.tsx';
import { About } from './components/About.tsx';
import { Services } from './components/Services.tsx';
import { UserProfile, AppraisalRequest } from './types.ts';
import { Send, Loader2, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase.ts';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy, limit, deleteDoc, getDocs, writeBatch, deleteField } from 'firebase/firestore';

// Initial empty states
const INITIAL_USERS: any[] = [];
const INITIAL_REQUESTS: AppraisalRequest[] = [];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  // Persistent/Shared Users database state (Admin only)
  const [users, setUsers] = useState<any[]>(INITIAL_USERS);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setUser({ ...profileData, id: firebaseUser.uid });
        } else {
          // Profile might not exist yet if just registered, AuthModal handles creation
          // But we can fallback to basic info
          const fallbackProfile: UserProfile = {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Kullanıcı',
            email: firebaseUser.email || '',
            phone: '',
            role: 'user',
            membershipType: 'free',
            createdAt: Date.now()
          };
          setUser(fallbackProfile);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin: Sync all users
  useEffect(() => {
    if (user?.role === 'admin') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const userList = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          name: d.data().fullName,
          membership: d.data().membershipType,
          date: new Date(d.data().createdAt).toLocaleDateString('tr-TR')
        }));
        setUsers(userList);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Sync Requests (Real-time)
  useEffect(() => {
    let q;
    if (user?.role === 'admin') {
      q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    } else if (user) {
      q = query(collection(db, 'requests'), where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    } else {
      // For guests, we could use a local list or anonymous auth, but for now we'll keep a local state for the session
      // if they just created a report.
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestList = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AppraisalRequest));
      setRequests(requestList);
    });

    return () => unsubscribe();
  }, [user]);

  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({ open: false, mode: 'login' });
  const [requests, setRequests] = useState<AppraisalRequest[]>(INITIAL_REQUESTS);
  const [reportFlowOpen, setReportFlowOpen] = useState(false);
  const [activePropertyData, setActivePropertyData] = useState<any | null>(null);
  const [upgradeSuccessPlan, setUpgradeSuccessPlan] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activePaymentPlan, setActivePaymentPlan] = useState<{ planId: string; name: string; price: string; rights: string[] } | null>(null);

  const SUBSCRIPTION_DETAILS = {
    monthly_pro: {
      name: 'Aylık Profesyonel Paket',
      price: '1.949 ₺',
      rights: [
        '3 Adet Konut Değerleme Raporu',
        '2 Adet Arsa / Arazi Değerleme Raporu',
        '1 Adet Ticari Gayrimenkul Değerleme Raporu'
      ]
    },
    yearly_pro: {
      name: 'Yıllık Profesyonel Paket',
      price: '19.449 ₺',
      rights: [
        '36 Adet Konut Değerleme Raporu',
        '24 Adet Arsa / Arazi Değerleme Raporu',
        '12 Adet Ticari Gayrimenkul Değerleme Raporu'
      ]
    }
  };

  // Subscription Base Quotas
  const QUOTAS = {
    monthly_pro: { konut: 3, arsa: 2, ticari: 1 },
    yearly_pro: { konut: 36, arsa: 24, ticari: 12 }
  };

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }

    if (planId.startsWith('single_')) {
      setCurrentPage('home');
      setTimeout(() => {
        document.getElementById('valuation-form-container')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }

    // Instead of immediately applying, open the Secure Subscription Payment Modal
    const details = SUBSCRIPTION_DETAILS[planId as keyof typeof SUBSCRIPTION_DETAILS];
    if (details) {
      setActivePaymentPlan({
        planId,
        name: details.name,
        price: details.price,
        rights: details.rights
      });
    }
  };

  const handleSubscriptionPaymentSuccess = (planId: string) => {
    if (!user) return;

    // Advanced Subscription Merging Logic
    const isYearly = planId === 'yearly_pro';
    const targetMembership = isYearly ? 'yearly' : 'monthly';
    const durationDays = isYearly ? 365 : 30;
    
    let remainingQuota = { konut: 0, arsa: 0, ticari: 0 };
    
    // Calculate remaining quota if there's an active subscription
    if (user.activeSubscription && user.activeSubscription.endsAt > Date.now()) {
      const activeSub = user.activeSubscription;
      const subReports = requests.filter(r => r.subscriptionId === activeSub.subscriptionId);
      const subQuota = activeSub.quota || { konut: 0, arsa: 0, ticari: 0 };
      
      remainingQuota = {
        konut: Math.max(0, (subQuota.konut || 0) - subReports.filter(r => r.type === 'konut').length),
        arsa: Math.max(0, (subQuota.arsa || 0) - subReports.filter(r => r.type === 'arsa').length),
        ticari: Math.max(0, (subQuota.ticari || 0) - subReports.filter(r => r.type === 'ticari').length)
      };
    }

    const baseQuota = QUOTAS[planId as keyof typeof QUOTAS];
    const newSubscriptionId = `SUB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    const newSubscription: any = {
      subscriptionId: newSubscriptionId,
      planType: targetMembership,
      startedAt: Date.now(),
      endsAt: Date.now() + (1000 * 60 * 60 * 24 * durationDays),
      quota: {
        konut: (baseQuota?.konut || 0) + remainingQuota.konut,
        arsa: (baseQuota?.arsa || 0) + remainingQuota.arsa,
        ticari: (baseQuota?.ticari || 0) + remainingQuota.ticari
      }
    };

    // Update user in Firestore
    const updatedUser: any = { 
      ...user, 
      membershipType: targetMembership,
      activeSubscription: newSubscription,
      cancelAtPeriodEnd: false,
      subscriptionExpiresAt: deleteField()
    };

    // Remove any undefined properties from the user spread to prevent Firestore errors
    Object.keys(updatedUser).forEach(key => {
      if (updatedUser[key] === undefined) {
        delete updatedUser[key];
      }
    });

    setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
    setUpgradeSuccessPlan(planId === 'monthly_pro' ? 'Aylık Profesyonel Paket' : 'Yıllık Profesyonel Paket');
  };

  // Footer Contact Form State
  const [footerName, setFooterName] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerSubject, setFooterSubject] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [footerSubmitting, setFooterSubmitting] = useState(false);
  const [footerSubmitted, setFooterSubmitted] = useState(false);

  const handleFooterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!footerName.trim() || !footerEmail.trim() || !footerSubject.trim() || !footerMessage.trim()) return;
    
    setFooterSubmitting(true);
    setTimeout(() => {
      setFooterSubmitting(false);
      setFooterSubmitted(true);
      setFooterName('');
      setFooterEmail('');
      setFooterSubject('');
      setFooterMessage('');
      
      // Clear success notification after 5 seconds
      setTimeout(() => {
        setFooterSubmitted(false);
      }, 5000);
    }, 1500);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModal({ open: true, mode });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    await signOut(auth);
    setUser(null);
    setActivePropertyData(null);
    setReportFlowOpen(false);
    setCurrentPage('home');
    setShowLogoutConfirm(false);
  };

  const handleDeleteAccount = async () => {
    if (user) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // 1. Delete user's requests
          const requestsQuery = query(collection(db, 'requests'), where('userId', '==', currentUser.uid));
          const requestsSnapshot = await getDocs(requestsQuery);
          const batch = writeBatch(db);
          requestsSnapshot.docs.forEach((d) => batch.delete(d.ref));
          
          // 2. Delete user's document
          batch.delete(doc(db, 'users', currentUser.uid));
          await batch.commit();

          // 3. Delete user from Auth
          await deleteUser(currentUser);
          
          // 4. Logout (cleanup local state)
          executeLogout();
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        // Could add error notification here
      }
    }
  };

  const handleSubmitRequest = (data: any) => {
    setActivePropertyData(data);
    setReportFlowOpen(true);
  };

  const handleFinalSubmitReport = (data: any, isRegistered: boolean, sourceOverride?: 'subscription' | 'singlePurchase') => {
    // 1. Determine Prefix based on property type (konut -> DBK, arsa -> DBA, ticari -> DBT)
    let prefix = 'DBK';
    if (data.type === 'arsa') {
      prefix = 'DBA';
    } else if (data.type === 'ticari') {
      prefix = 'DBT';
    }

    // 2. Parse User Initials
    const rawName = data.contactName || user?.fullName || 'Değer Biç';
    const parts = rawName.trim().split(/\s+/).filter(Boolean);
    let initials = 'DB';
    if (parts.length > 0) {
      if (parts.length === 1) {
        initials = (parts[0][0] || 'D').toLocaleUpperCase('tr-TR');
      } else {
        const firstLetter = parts[0][0] || 'D';
        const lastLetter = parts[parts.length - 1][0] || 'B';
        initials = (firstLetter + lastLetter).toLocaleUpperCase('tr-TR');
      }
    }

    // 3. Current year's last two digits
    const yy = new Date().getFullYear().toString().slice(-2);

    // 4. Calculate sequential 4-digit number
    const userRequestsOfType = requests.filter(r => r.type === data.type);
    const sequenceNumber = userRequestsOfType.length + 1;
    const seqStr = String(sequenceNumber).padStart(4, '0');

    const reportId = `${prefix}-${initials}${yy}-${seqStr}`;
    
    // Determine report source and subscription ID
    const reportSource = sourceOverride || (user?.activeSubscription ? 'subscription' : 'singlePurchase');
    const subId = reportSource === 'subscription' ? user?.activeSubscription?.subscriptionId : undefined;

    const newRequest: AppraisalRequest = {
      id: reportId,
      userId: user?.id || null,
      ...(subId ? { subscriptionId: subId } : {}),
      reportSource: reportSource,
      type: data.type,
      status: 'new',
      createdAt: Date.now(),
      userMembership: user ? user.membershipType : 'guest',
      data: data,
      photos: data.images || [],
      contact: { fullName: data.contactName, phone: data.contactPhone, email: data.contactEmail },
      notes: data.notes,
      listingUrl: data.listingUrl,
      paymentStatus: reportSource === 'singlePurchase' ? 'completed' : 'free',
      isPaid: reportSource === 'singlePurchase'
    };

    // Save to Firestore
    setDoc(doc(db, 'requests', reportId), newRequest);
    
    return reportId;
  };

  return (
    <div className="min-h-screen font-sans">
      <Navbar 
        onNavigate={handleNavigate} 
        onOpenAuth={handleOpenAuth} 
        user={user} 
        onLogout={handleLogout} 
      />

      <main>
        {currentPage === 'home' && (
          <>
            <Hero />
            <PropertyForm 
              isLoggedIn={!!user} 
              onSubmit={handleSubmitRequest} 
              onNavigateAuth={() => handleOpenAuth('login')} 
              user={user}
            />
          </>
        )}

        {currentPage === 'pricing' && (
          <Pricing onSelect={handleSelectPlan} />
        )}

        {currentPage === 'about' && (
          <About />
        )}

        {currentPage === 'services' && (
          <Services />
        )}

        {currentPage === 'profile' && user && (
          <Profile 
            user={user} 
            requests={requests.filter(r => r.userId === user.id)} 
            onLogout={handleLogout} 
            onDeleteAccount={handleDeleteAccount}
            onUpgrade={() => setCurrentPage('pricing')}
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true });
            }}
            onRequestReport={() => {
              setCurrentPage('home');
              setTimeout(() => {
                document.getElementById('valuation-form-container')?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
          />
        )}

        {currentPage === 'admin' && user?.role === 'admin' && (
          <Admin 
            requests={requests} 
            onLogout={handleLogout} 
            onUpdateRequest={(updatedReq) => {
              const reqToSave = { ...updatedReq };
              if (reqToSave.pdfUrl === undefined || reqToSave.pdfUrl === null) {
                reqToSave.pdfUrl = deleteField() as any;
              }
              if (reqToSave.pdfName === undefined || reqToSave.pdfName === null) {
                reqToSave.pdfName = deleteField() as any;
              }
              setDoc(doc(db, 'requests', updatedReq.id), reqToSave, { merge: true });
            }} 
            onNavigate={handleNavigate}
            currentUser={user}
            onUpdateCurrentUser={(updatedUser) => setUser(updatedUser)}
            users={users}
            onUpdateUsers={(updatedUsers) => {
              // Usually called for multiple users, but in Admin.tsx it's used for syncing
              // We'll handle individual updates in Admin.tsx or here
              updatedUsers.forEach(u => {
                const { id, name, membership, date, ...rest } = u;
                setDoc(doc(db, 'users', id), { 
                  ...rest,
                  fullName: name,
                  membershipType: membership
                }, { merge: true });
              });
            }}
          />
        )}

        {(currentPage === 'profile' || currentPage === 'admin') && !user && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <h2 className="text-2xl font-medium mb-2">Erişim Engellendi</h2>
            <p className="text-gray-500 mb-6">Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.</p>
            <button 
              onClick={() => handleOpenAuth('login')}
              className="px-8 py-3 bg-[#1a5c3a] text-white rounded-xl font-medium"
            >
              Giriş Yap
            </button>
          </div>
        )}
      </main>

      <AuthModal 
        isOpen={authModal.open} 
        onClose={() => setAuthModal({ ...authModal, open: false })} 
        initialMode={authModal.mode} 
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setAuthModal({ ...authModal, open: false });
          if (loggedInUser.role === 'admin') {
            setCurrentPage('admin');
          } else {
            setCurrentPage('profile');
          }
        }}
      />

      <ReportFlowModal 
        isOpen={reportFlowOpen}
        onClose={() => {
          setReportFlowOpen(false);
          if (user) {
            setCurrentPage('profile');
          }
        }}
        propertyData={activePropertyData}
        user={user}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
        onSubmitReport={handleFinalSubmitReport}
        requests={requests}
      />

      <SubscriptionPaymentModal 
        isOpen={!!activePaymentPlan}
        onClose={() => setActivePaymentPlan(null)}
        planId={activePaymentPlan?.planId || ''}
        planName={activePaymentPlan?.name || ''}
        price={activePaymentPlan?.price || ''}
        rights={activePaymentPlan?.rights || []}
        onPaymentSuccess={handleSubscriptionPaymentSuccess}
        user={user}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />

      {/* Membership Upgrade Success Modal */}
      <AnimatePresence>
        {upgradeSuccessPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-2xl relative overflow-hidden text-center"
            >
              {/* Decorative grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a5c3a] mx-auto border border-emerald-100">
                  <CheckCircle2 size={32} className="stroke-[2.5px]" />
                </div>

                <div className="space-y-2">
                  <span className="text-[#f0a500] text-xs font-extrabold tracking-widest block">ÖDEME BAŞARILI</span>
                  <h3 className="text-xl font-bold text-gray-950 tracking-tight">Üyeliğiniz Yükseltildi!</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Tebrikler! <strong>{upgradeSuccessPlan}</strong> üyeliğiniz başarıyla aktif hale getirildi. Artık paket kapsamındaki tüm ayrıcalıklı rapor türlerine anında erişebilirsiniz.
                  </p>
                </div>

                {/* Simulated subscription details badge */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-105 divide-y divide-gray-150 text-left text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Üyelik Modu</span>
                    <span className="font-bold text-[#1a5c3a] uppercase">PRO</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Hesap</span>
                    <span className="font-bold text-gray-900">{user?.fullName}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Durum</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">● Aktif</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setUpgradeSuccessPlan(null);
                      setCurrentPage('profile');
                    }}
                    className="w-full py-3 bg-[#1a5c3a] text-white hover:bg-[#2d8a58] transition-colors rounded-xl text-xs font-bold shadow-md shadow-emerald-950/10 cursor-pointer"
                  >
                    Profilime Git ve Başla
                  </button>
                  <button 
                    onClick={() => setUpgradeSuccessPlan(null)}
                    className="w-full py-2.5 bg-gray-105 hover:bg-gray-200 text-gray-700 transition-colors rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-gray-100 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000001_1px,transparent_1px),linear-gradient(to_bottom,#00000001_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6 text-center">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto border border-red-100">
                  <AlertTriangle size={28} className="stroke-[2.5px]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-950 tracking-tight">Oturumu Kapat</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed font-medium">
                    Oturumunuzu kapatmak istediğinize emin misiniz? Formda doldurduğunuz iletişim bilgileri temizlenecektir.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={executeLogout}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white transition-colors rounded-xl text-xs font-bold shadow-md shadow-red-950/10 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={13} />
                    Evet, Çıkış Yap
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {currentPage !== 'admin' && (
        <footer className="bg-[#0e3b23] text-white/80 py-10 px-6 mt-16 border-t border-white/10 relative overflow-hidden" id="main-app-footer">
          {/* Subtle architectural grid details for matching hero */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="max-w-5xl mx-auto relative z-1" id="footer-minimal-container">
            {/* Top Row: Brand & Contact Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
              <div className="space-y-2 max-w-lg">
                <div className="text-white text-2xl font-black tracking-tight flex items-center gap-2" id="footer-logo">
                  <img 
                    src="/değerbiç.png" 
                    alt="değerbiç logo" 
                    className="h-[34px] w-auto object-contain select-none" 
                    referrerPolicy="no-referrer"
                  />
                  <span>değer<span className="text-[#f0a500]">biç</span></span>
                </div>
                <p className="text-white/70 text-xs md:text-sm font-medium leading-relaxed">
                  Gayrimenkul kararlarınızda tarafsız, bağımsız ve uzman görüşü. Doğru bilgiyle güvenli adımlar atın.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[#f0a500] text-xs font-semibold tracking-wider bg-white/5 border border-white/15 px-3.5 py-2 rounded-xl">
                  ✉ degerbic@hotmail.com
                </span>
              </div>
            </div>

            {/* Bottom Row: Links & Copyright */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 text-[11px] text-white/40 font-semibold" id="footer-links-and-copy">
              <div>
                © 2026 Değer Biç — Tüm Hakları Saklıdır.
              </div>
              <div className="flex gap-5 md:gap-7 text-white/60">
                <button onClick={() => handleNavigate('pricing')} className="hover:text-[#f0a500] transition-colors cursor-pointer">Fiyatlandırma</button>
                <button onClick={() => handleNavigate('services')} className="hover:text-[#f0a500] transition-colors cursor-pointer">Hizmetlerimiz</button>
                <button onClick={() => handleNavigate('about')} className="hover:text-[#f0a500] transition-colors cursor-pointer">Hakkımızda</button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

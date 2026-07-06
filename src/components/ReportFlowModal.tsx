import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard, 
  User, 
  UserCheck, 
  ArrowRight, 
  Check, 
  Loader2, 
  Info, 
  Lock, 
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  LogIn,
  Coins,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PropertyType, UserProfile, getEffectiveMembership } from '../types.ts';
import { auth, db } from '../lib/firebase.ts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface ReportFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyData: any;
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onSubmitReport: (requestData: any, isRegistered: boolean, sourceOverride?: 'subscription' | 'singlePurchase', selectedPackage?: 'Basit' | 'Orta' | 'Profesyonel', packagePrice?: number, preGeneratedReportId?: string) => Promise<string>;
  requests?: any[];
}

export function ReportFlowModal({ 
  isOpen, 
  onClose, 
  propertyData, 
  user, 
  onLoginSuccess,
  onSubmitReport,
  requests = []
}: ReportFlowModalProps) {
  // Wizard steps: 'warning' | 'auth_choice' | 'pricing' | 'payment' | 'completed'
  const [currentStep, setCurrentStep] = useState<'warning' | 'auth_choice' | 'pricing' | 'payment' | 'completed'>('warning');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [showConsentText, setShowConsentText] = useState(false);
  
  // Package Selection and EFT/Havale States
  const [selectedPackage, setSelectedPackage] = useState<'Basit' | 'Orta' | 'Profesyonel'>('Basit');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Login/Register fields (for step 2 inline option)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Phone Number Formatting & Limit
  const formatPhoneNumber = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('0')) {
      numbers = numbers.slice(0, 11);
    } else {
      numbers = numbers.slice(0, 10);
    }
    if (numbers.length === 0) return '';
    let formatted = '';
    if (numbers.startsWith('0')) {
      const part1 = numbers.slice(0, 1);
      const part2 = numbers.slice(1, 4);
      const part3 = numbers.slice(4, 7);
      const part4 = numbers.slice(7, 9);
      const part5 = numbers.slice(9, 11);
      
      if (numbers.length > 7) {
        formatted = `${part1} (${part2}) ${part3} ${part4} ${part5}`;
      } else if (numbers.length > 4) {
        formatted = `${part1} (${part2}) ${part3}`;
      } else if (numbers.length > 1) {
        formatted = `${part1} (${part2}`;
      } else {
        formatted = part1;
      }
    } else {
      const part1 = numbers.slice(0, 3);
      const part2 = numbers.slice(3, 6);
      const part3 = numbers.slice(6, 8);
      const part4 = numbers.slice(8, 10);
      
      if (numbers.length > 6) {
        formatted = `0 (${part1}) ${part2} ${part3} ${part4}`;
      } else if (numbers.length > 3) {
        formatted = `0 (${part1}) ${part2}`;
      } else {
        formatted = `0 (${part1}`;
      }
    }
    return formatted.trim();
  };

  // Password Strength Evaluation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200', textClass: 'text-gray-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'Zayıf', color: 'bg-red-500', textClass: 'text-red-500' };
    if (score === 2) return { score, label: 'Zayıf', color: 'bg-orange-500', textClass: 'text-orange-500' };
    if (score === 3) return { score, label: 'Orta Derece', color: 'bg-blue-500', textClass: 'text-blue-500' };
    return { score, label: 'Güçlü Şifre', color: 'bg-emerald-500', textClass: 'text-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  // Payment states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Result info
  const [generatedReportId, setGeneratedReportId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('warning');
      setIsConfirmed(false);
      setAuthMode(null);
      setAuthError(null);
      setPaymentError(null);
      setIsPaymentLoading(false);
      setIsAuthLoading(false);
      setShowConsentText(false);
      setSelectedPackage('Basit');
      setCopiedField(null);
      setIsGeneratingCode(false);
      // Clean payment form
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCVC('');
      // Clean auth fields
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine property category
  const propType: PropertyType = propertyData?.type || 'konut';

  // Get packages for current property category
  const getPackages = () => {
    if (propType === 'arsa') {
      return [
        {
          name: 'Basit' as const,
          price: 200,
          services: [
            'Konumsal ve Ulaşım Erişilebilirliği Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç'
          ]
        },
        {
          name: 'Orta' as const,
          price: 300,
          services: [
            'Konumsal ve Ulaşım Erişilebilirliği Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç',
            'Yerleşim ve Kullanım İlişkisi Analizi',
            'Uygulama İmar Planı Analizi',
            'Bölgesel Piyasa Eğilimleri Analizi'
          ]
        },
        {
          name: 'Profesyonel' as const,
          price: 600,
          services: [
            'Konumsal ve Ulaşım Erişilebilirliği Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç',
            'Yerleşim ve Kullanım İlişkisi Analizi',
            'Uygulama İmar Planı Analizi',
            'Bölgesel Piyasa Eğilimleri Analizi',
            'Üst Ölçek Planlama Analizi',
            'Çevresel ve Jeolojik Risk Analizi',
            'Bölgesel Gelişim ve Yatırım Potansiyeli Analizi'
          ]
        }
      ];
    } else if (propType === 'ticari') {
      return [
        {
          name: 'Basit' as const,
          price: 300,
          services: [
            'Konumsal ve Ticari Erişilebilirlik Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç'
          ]
        },
        {
          name: 'Orta' as const,
          price: 400,
          services: [
            'Konumsal ve Ticari Erişilebilirlik Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç',
            'Ticari Yoğunluk ve Yaya Akışı Analizi',
            'Sosyo-Ekonomik ve Demografik Analiz',
            'Bölgesel Ticari Piyasa Eğilimleri Analizi'
          ]
        },
        {
          name: 'Profesyonel' as const,
          price: 800,
          services: [
            'Konumsal ve Ticari Erişilebilirlik Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç',
            'Ticari Yoğunluk ve Yaya Akışı Analizi',
            'Sosyo-Ekonomik ve Demografik Analiz',
            'Bölgesel Ticari Piyasa Eğilimleri Analizi',
            'Planlama ve Ticari İmar Kararları Analizi',
            'Kamu Yatırımları ve Ticari Proje Etkisi Analizi',
            'Ticari Kentsel Dönüşüm ve Yatırım Potansiyeli Analizi'
          ]
        }
      ];
    } else {
      // konut
      return [
        {
          name: 'Basit' as const,
          price: 100,
          services: [
            'Konumsal ve Erişilebilirlik Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç'
          ]
        },
        {
          name: 'Orta' as const,
          price: 200,
          services: [
            'Konumsal ve Erişilebilirlik Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç',
            'Mahalle ve Sosyal Donatı Analizi',
            'Sosyo-Ekonomik Analiz',
            'Bölgesel Piyasa Eğilimleri Analizi'
          ]
        },
        {
          name: 'Profesyonel' as const,
          price: 400,
          services: [
            'Konumsal ve Erişilebilirlik Analizi',
            'Piyasa Analizi',
            'Genel Değerlendirme ve Sonuç',
            'Mahalle ve Sosyal Donatı Analizi',
            'Sosyo-Ekonomik Analiz',
            'Bölgesel Piyasa Eğilimleri Analizi',
            'Planlama ve Üst Ölçek Karar Analizi',
            'Kamu Yatırımları ve Proje Etkisi Analizi',
            'Kentsel Dönüşüm ve Gelişim Potansiyeli Analizi'
          ]
        }
      ];
    }
  };

  // Determine pricing based on selected package and property type
  const getPackagePrice = (pkg: 'Basit' | 'Orta' | 'Profesyonel') => {
    const prices: Record<PropertyType, Record<'Basit' | 'Orta' | 'Profesyonel', number>> = {
      konut: { Basit: 100, Orta: 200, Profesyonel: 400 },
      arsa: { Basit: 200, Orta: 300, Profesyonel: 600 },
      ticari: { Basit: 300, Orta: 400, Profesyonel: 800 }
    };
    return prices[propType]?.[pkg] || 0;
  };

  const currentPrice = getPackagePrice(selectedPackage);

  // Helper function to generate unique, sequential report codes
  const generateReportCodeLocal = async () => {
    let prefix = 'DBK';
    if (propType === 'arsa') {
      prefix = 'DBA';
    } else if (propType === 'ticari') {
      prefix = 'DBT';
    }

    // Parse initials
    const rawName = propertyData?.contactName || user?.fullName || 'Değer Biç';
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

    const yy = new Date().getFullYear().toString().slice(-2);

    let sequenceNumber = 1;
    if (user) {
      // Registered user: count their own requests of this type
      const userRequestsOfType = requests.filter((r: any) => r.type === propType && r.userId === user.id);
      sequenceNumber = userRequestsOfType.length + 1;
    } else {
      // Guest: use a public Firestore counter to ensure collective/global count increment
      try {
        const counterRef = doc(db, 'counters', `${propType}_guest`);
        const counterSnap = await getDoc(counterRef);
        if (counterSnap.exists()) {
          const currentCount = counterSnap.data().count || 0;
          sequenceNumber = currentCount + 1;
        } else {
          sequenceNumber = 1;
        }
      } catch (err) {
        console.error("Error fetching guest counter:", err);
        // Fallback
        sequenceNumber = requests.filter((r: any) => r.type === propType && !r.userId).length + 1;
      }
    }

    const seqStr = String(sequenceNumber).padStart(4, '0');
    return `${prefix}-${initials}${yy}-${seqStr}`;
  };

  // Step 1: Confirm details
  const handleConfirmWarning = () => {
    if (!isConfirmed) return;
    if (!user) {
      setCurrentStep('auth_choice');
    } else {
      setCurrentStep('pricing');
    }
  };

  // Handle Inline Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const fullName = authMode === 'register' ? `${firstName.trim()} ${lastName.trim()}`.trim() : '';

    if (authMode === 'register') {
      if (!firstName || !lastName) {
        setAuthError('Ad ve Soyad alanları zorunludur.');
        return;
      }
      if (!phone) {
        setAuthError('Telefon numarası zorunludur.');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setAuthError('Lütfen geçerli bir telefon numarası girin (örn: 05XX XXX XX XX).');
        return;
      }
      if (strength.score < 3) {
        setAuthError('Lütfen şifre gücünü artırın (en az 8 karakter, harf ve rakam içermelidir).');
        return;
      }
      if (!privacyAccepted) {
        setAuthError('Devam etmek için Gizlilik Politikası ve Kullanım Koşullarını kabul etmelisiniz.');
        return;
      }
    } else {
      if (password.length < 5) {
        setAuthError('Şifre en az 5 karakter olmalıdır.');
        return;
      }
    }

    setIsAuthLoading(true);
    try {
      if (authMode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          onLoginSuccess({ ...userDoc.data(), id: firebaseUser.uid } as UserProfile);
        } else {
          // Fallback
          onLoginSuccess({
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || email.split('@')[0].toUpperCase(),
            email: email,
            phone: '0555 000 00 00',
            role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
            membershipType: 'free',
            createdAt: Date.now()
          });
        }
        setCurrentStep('pricing');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: fullName });
        
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          fullName: fullName,
          email: email,
          phone: phone || '0555 000 00 00',
          role: 'user',
          membershipType: 'free',
          createdAt: Date.now()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
        onLoginSuccess(newProfile);
        setCurrentStep('pricing');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'E-posta adresi veya şifre hatalı.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Bu e-posta adresi zaten kullanımda.';
      }
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Continue as Guest Option
  const handleContinueAsGuest = () => {
    setCurrentStep('pricing');
  };

  // Handle package selection submission and generate code
  const handlePackageSubmit = async () => {
    setIsGeneratingCode(true);
    try {
      const code = await generateReportCodeLocal();
      setGeneratedReportId(code);
      setCurrentStep('payment');
    } catch (err) {
      console.error("Error generating report code:", err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Handle final Submission & Payment (EFT/Havale)
  const handleCompleteFlow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPaymentLoading(true);
    try {
      // Simulate submission/tactility
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userRole = !!user;
      const reportSource = 'singlePurchase';
      
      // Save request to Firestore
      await onSubmitReport(
        propertyData, 
        userRole, 
        reportSource, 
        selectedPackage, 
        currentPrice, 
        generatedReportId
      );
      
      setCurrentStep('completed');
    } catch (err) {
      console.error("Error submitting request:", err);
      setPaymentError("Talep gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />

      {/* Main Dialog Panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-2"
        id="report-flow-modal-box"
      >
        {/* Header decoration match app palette */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#1a5c3a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 mt-1.5">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight" id="modal-title">
              {currentStep === 'warning' && '1. Bilgilerin Doğruluğu'}
              {currentStep === 'auth_choice' && '2. Üye Girişi / Misafir'}
              {currentStep === 'pricing' && '3. Paket Seçimi'}
              {currentStep === 'payment' && '4. Ödeme için Bilgiler'}
              {currentStep === 'completed' && 'İşlem Başarılı'}
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mt-1">
              RAPOR TALEP SİHİRBAZI
            </p>
          </div>
          {currentStep !== 'completed' && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              id="btn-close-flow-modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Stages */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <AnimatePresence mode="wait">
            
            {/* STAGE 1: WARNING AND CONFIRMATION */}
            {currentStep === 'warning' && (
              <motion.div
                key="warning-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
                id="step-warning-container"
              >
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900">Veri Giriş Kontrol Uyarısı</h4>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Uzman ekibimiz tarafından hazırlanan raporunuzun doğruluğu, girdiğiniz bilgilerin hassasiyetine doğrudan bağlıdır. <strong>Brüt/net m², ada/parsel, konum cephe ve kat</strong> gibi bilgilerin tam ve doğru girildiğinden emin olunuz.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-800 tracking-wider">FORMDA GİRİLEN TÜM BİLGİLER</span>
                    <span className="text-[10px] bg-emerald-50 text-[#1a5c3a] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                      {propType === 'konut' ? 'KONUT' : propType === 'arsa' ? 'ARSA' : 'TİCARİ'}
                    </span>
                  </div>

                  <div className="max-h-[280px] overflow-y-auto pr-1 space-y-4 text-xs scrollbar-thin">
                    {/* 1. Konum ve Tür Bilgileri */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">1. KONUM VE TÜR BİLGİLERİ</h5>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white p-3 rounded-xl border border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px]">Gayrimenkul Türü:</span>
                          <span className="text-gray-800 font-semibold">{propType === 'konut' ? 'KONUT' : propType === 'arsa' ? 'ARSA / ARAZİ' : 'TİCARİ'}</span>
                        </div>
                        {propertyData?.propertySubType && (
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">Alt Tür:</span>
                            <span className="text-gray-800 font-semibold">{propertyData.propertySubType === 'Diğer' ? propertyData.propertySubTypeOther : propertyData.propertySubType}</span>
                          </div>
                        )}
                        {propertyData?.transactionType && (
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">İşlem Türü:</span>
                            <span className="text-gray-800 font-semibold">{propertyData.transactionType === 'satilik' ? 'Satılık' : 'Kiralık'}</span>
                          </div>
                        )}
                        <div className="flex flex-col col-span-2">
                          <span className="text-gray-400 text-[10px]">Konum (İl / İlçe / Mahalle):</span>
                          <span className="text-gray-800 font-semibold">
                            {propertyData?.city} / {propertyData?.district} {propertyData?.neighborhood ? `/ ${propertyData.neighborhood}` : ''}
                          </span>
                        </div>
                        {propertyData?.address && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-gray-400 text-[10px]">Açık Adres:</span>
                            <span className="text-gray-700 font-medium leading-normal break-words">{propertyData.address}</span>
                          </div>
                        )}
                        {propertyData?.listingUrl && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-gray-400 text-[10px]">İlan Linki:</span>
                            <a href={propertyData.listingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline break-all">
                              {propertyData.listingUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Fiziksel ve Teknik Özellikler */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">2. FİZİKSEL ÖZELLİKLER</h5>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white p-3 rounded-xl border border-gray-100">
                        {propType === 'konut' && (
                          <>
                            {propertyData?.grossArea && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Brüt Alan:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.grossArea} m²</span>
                              </div>
                            )}
                            {propertyData?.netArea && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Net Alan:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.netArea} m²</span>
                              </div>
                            )}
                            {propertyData?.rooms && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Oda Sayısı:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.rooms}</span>
                              </div>
                            )}
                            {propertyData?.age && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Bina Yaşı:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.age} Yıl</span>
                              </div>
                            )}
                            {propertyData?.floor && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Bulunduğu Kat:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.floor}</span>
                              </div>
                            )}
                            {propertyData?.totalFloors && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Kat Sayısı:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.totalFloors}</span>
                              </div>
                            )}
                            {propertyData?.heating && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Isıtma Tipi:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.heating}</span>
                              </div>
                            )}
                            {propertyData?.facade && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Cephe:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.facade}</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-[10px]">Asansör:</span>
                              <span className="text-gray-800 font-semibold">{propertyData?.elevator || 'Belirtilmedi'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-[10px]">Otopark:</span>
                              <span className="text-gray-800 font-semibold">{propertyData?.parking || 'Belirtilmedi'}</span>
                            </div>
                            <div className="flex flex-col col-span-2">
                              <span className="text-gray-400 text-[10px]">Eşya Durumu:</span>
                              <span className="text-gray-800 font-semibold">{propertyData?.furnished || 'Belirtilmedi'}</span>
                            </div>
                          </>
                        )}

                        {propType === 'arsa' && (
                          <>
                            {propertyData?.area && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Alan (Yüzölçümü):</span>
                                <span className="text-gray-800 font-semibold">{propertyData.area} m²</span>
                              </div>
                            )}
                            {propertyData?.areaDonum && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Alan (Dönüm):</span>
                                <span className="text-gray-800 font-semibold">{propertyData.areaDonum} Dönüm</span>
                              </div>
                            )}
                            {propertyData?.zoningStatus && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">İmar Durumu:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.zoningStatus}</span>
                              </div>
                            )}
                            {propertyData?.quality && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Nitelik:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.quality}</span>
                              </div>
                            )}
                          </>
                        )}

                        {propType === 'ticari' && (
                          <>
                            {propertyData?.area && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Kullanım Alanı (m²):</span>
                                <span className="text-gray-800 font-semibold">{propertyData.area} m²</span>
                              </div>
                            )}
                            {propertyData?.usageStatus && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Kullanım Durumu:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.usageStatus}</span>
                              </div>
                            )}
                            {propertyData?.age && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Bina Yaşı:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.age} Yıl</span>
                              </div>
                            )}
                            {propertyData?.floor && (
                              <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px]">Bulunduğu Kat:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.floor}</span>
                              </div>
                            )}
                            {propertyData?.totalFloors && (
                              <div className="flex flex-col col-span-2">
                                <span className="text-gray-400 text-[10px]">Toplam Kat Sayısı:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.totalFloors}</span>
                              </div>
                            )}
                            {propertyData?.heating && (
                              <div className="flex flex-col col-span-2">
                                <span className="text-gray-400 text-[10px]">Isıtma Tipi:</span>
                                <span className="text-gray-800 font-semibold">{propertyData.heating}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* 3. Tapu ve İmar Bilgileri */}
                    {(propertyData?.ada || propertyData?.parsel || propertyData?.titleStatus) && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">3. TAPU & İMAR KADASTRO</h5>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white p-3 rounded-xl border border-gray-100">
                          {propertyData?.ada && (
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-[10px]">Ada:</span>
                              <span className="text-gray-800 font-semibold">{propertyData.ada}</span>
                            </div>
                          )}
                          {propertyData?.parsel && (
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-[10px]">Parsel:</span>
                              <span className="text-gray-800 font-semibold">{propertyData.parsel}</span>
                            </div>
                          )}
                          {propertyData?.titleStatus && (
                            <div className="flex flex-col col-span-2">
                              <span className="text-gray-400 text-[10px]">Tapu Durumu:</span>
                              <span className="text-gray-800 font-semibold">{propertyData.titleStatus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Beklenen Fiyat Değeri */}
                    {(propertyData?.price || propertyData?.minPrice) && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">4. FİYAT BEKLENTİNİZ</h5>
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">
                              {propertyData.priceType === 'tek' ? 'Fiyat Öngörüsü:' : 'Fiyat Aralığı Öngörüsü:'}
                            </span>
                            <span className="text-gray-800 font-bold text-sm">
                              {propertyData.priceType === 'tek' 
                                ? `${Number(propertyData.price).toLocaleString('tr-TR')} ₺` 
                                : `${Number(propertyData.minPrice).toLocaleString('tr-TR')} ₺ - ${Number(propertyData.maxPrice).toLocaleString('tr-TR')} ₺`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. İletişim Bilgileri */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">5. İLETİŞİM BİLGİLERİNİZ</h5>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white p-3 rounded-xl border border-gray-100">
                        <div className="flex flex-col col-span-2 md:col-span-1">
                          <span className="text-gray-400 text-[10px]">Ad Soyad:</span>
                          <span className="text-gray-800 font-semibold">{propertyData?.contactName || '-'}</span>
                        </div>
                        {propertyData?.contactPhone && (
                          <div className="flex flex-col col-span-2 md:col-span-1">
                            <span className="text-gray-400 text-[10px]">Telefon:</span>
                            <span className="text-gray-800 font-semibold">
                              {propertyData.contactPhone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3 $4 $5')}
                            </span>
                          </div>
                        )}
                        {propertyData?.contactEmail && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-gray-400 text-[10px]">E-posta Adresi:</span>
                            <span className="text-gray-800 font-semibold break-all">{propertyData.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6. Ek Notlar */}
                    {propertyData?.notes && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">6. RAPOR EK NOTLARI</h5>
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                          <span className="text-gray-400 text-[10px] block mb-1">Açıklama / Özel Talepler:</span>
                          <p className="text-gray-700 italic leading-relaxed whitespace-pre-line">{propertyData.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* 7. Fotoğraflar */}
                    {propertyData?.images && propertyData.images.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-[#1a5c3a]/80 tracking-widest">7. YÜKLENEN FOTOĞRAFLAR ({propertyData.images.length} Adet)</h5>
                        <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-100">
                          {propertyData.images.map((img: string, idx: number) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`Yüklenen Fotoğraf ${idx + 1}`} 
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-3 p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer transition-colors group">
                  <input 
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#1a5c3a] focus:ring-[#1a5c3a] border-gray-300 rounded cursor-pointer accent-[#1a5c3a]"
                  />
                  <span className="text-xs text-gray-700 font-bold leading-relaxed select-none group-hover:text-gray-900">
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowConsentText(!showConsentText);
                      }}
                      className="underline text-[#1a5c3a] hover:text-[#2d8a58] transition-colors cursor-pointer mr-1"
                    >
                      Aydınlatma ve Onay Metnini
                    </span>
                    okudum, anladım ve kabul ediyorum
                  </span>
                </label>

                <AnimatePresence initial={false}>
                  {showConsentText && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-[11px] leading-relaxed text-gray-600 max-h-[180px] overflow-y-auto space-y-3.5 scrollbar-thin">
                        <p>
                          <strong className="text-gray-800">Gizlilik Politikası:</strong> değerbiç'in Gizlilik Politikası'nı okudum; kişisel verilerimin (ad, soyad, telefon, e-posta ve taşınmaz bilgilerim) Politika'da belirtilen amaçlarla işlenmesini kabul ediyorum.
                        </p>
                        <p>
                          <strong className="text-gray-800">Bilgilerin Doğruluğu:</strong> Değerlendirme formunda beyan ettiğim taşınmaz bilgileri, iletişim bilgileri ve diğer tüm verilerin doğru, güncel ve eksiksiz olduğunu; yanlış veya yanıltıcı bilgi verilmesi halinde doğabilecek sonuçlardan sorumlu olduğumu kabul ederim.
                        </p>
                        <p>
                          <strong className="text-gray-800">Hizmet Talebi:</strong> Bu gayrimenkul analiz hizmetini kendi isteğim ve onayımla talep ettiğimi; ödemenin hizmet bedeli karşılığında yapıldığını ve hizmetin niteliği gereği rapor tesliminden sonra iade edilemeyeceğini bildiğimi kabul ederim.
                        </p>
                        <p>
                          <strong className="text-gray-800">Yatırım Tavsiyesi Değildir:</strong> Tarafıma sunulacak raporun resmî ekspertiz raporu, yatırım danışmanlığı veya yatırım tavsiyesi niteliği taşımadığını; uzman görüşü ve teknik değerlendirmeden ibaret olduğunu; nihai yatırım/alım/satım kararının münhasıran kendime ait olduğunu bildiğimi ve değerbiç'i bu karardan doğacak sonuçlardan sorumlu tutmayacağımı kabul ederim.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleConfirmWarning}
                  disabled={!isConfirmed}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isConfirmed 
                      ? 'bg-[#1a5c3a] text-white hover:bg-[#2d8a58] shadow-md shadow-emerald-900/10' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  id="btn-warning-continue"
                >
                  Onayla ve İlerle <ArrowRight size={15} />
                </button>
              </motion.div>
            )}

            {/* STAGE 2: AUTH CHOICE */}
            {currentStep === 'auth_choice' && (
              <motion.div
                key="auth-choice-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
                id="step-auth-container"
              >
                {!authMode ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-1 py-1">
                      <p className="text-xs text-gray-500">
                        Uzatmadan hızlıca rapor talep edebilirsiniz. Üye olursanız daha avantajlı fiyatlarla rapor oluşturup, eski raporlarınızı profilinizden takip edebilirsiniz.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Guest Button Option */}
                      <button
                        onClick={handleContinueAsGuest}
                        className="p-5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl text-left transition-all space-y-2 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="inline-block p-2.5 bg-gray-100 text-gray-600 rounded-lg mb-2">
                            <User size={18} />
                          </span>
                          <h4 className="text-xs font-bold text-gray-800">Misafir Olarak Devam Et</h4>
                        </div>
                      </button>

                      {/* Login/Sign Up Trigger Button */}
                      <button
                        onClick={() => setAuthMode('login')}
                        className="p-5 bg-white hover:bg-emerald-50/10 border-2 border-emerald-100 hover:border-emerald-300 rounded-xl text-left transition-all space-y-2 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="inline-block p-2.5 bg-emerald-50 text-[#1a5c3a] rounded-lg mb-2">
                            <UserCheck size={18} />
                          </span>
                          <h4 className="text-xs font-bold text-[#1a5c3a]">Üye Girişi Yap / Kayıt Ol</h4>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Inline login/register view
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <button 
                        onClick={() => setAuthMode(null)}
                        className="text-xs text-[#1a5c3a] font-bold hover:underline cursor-pointer"
                      >
                        ← Seçeneklere Geri Dön
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setAuthMode('login'); setAuthError(null); }}
                          className={`px-3 py-1 rounded-md text-xs font-bold ${authMode === 'login' ? 'bg-[#1a5c3a] text-white' : 'text-gray-500'}`}
                        >
                          Giriş Yap
                        </button>
                        <button 
                          onClick={() => { setAuthMode('register'); setAuthError(null); }}
                          className={`px-3 py-1 rounded-md text-xs font-bold ${authMode === 'register' ? 'bg-[#1a5c3a] text-white' : 'text-gray-500'}`}
                        >
                          Üye Ol
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                      {/* Error Banner */}
                      {authError && (
                        <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100 flex items-center gap-2">
                          <span>⚠️ {authError}</span>
                        </div>
                      )}

                      {authMode === 'register' && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] text-gray-500 font-medium">Ad *</label>
                              <input 
                                type="text" 
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ad"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#1a5c3a]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] text-gray-500 font-medium">Soyad *</label>
                              <input 
                                type="text" 
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Soyad"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#1a5c3a]"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-gray-500 font-medium">Telefon *</label>
                            <input 
                              type="tel" 
                              required
                              value={phone}
                              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                              placeholder="05XX XXX XX XX"
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#1a5c3a]"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-medium">E-posta adresi *</label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ornek@domain.com"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#1a5c3a]"
                        />
                      </div>

                      <div className="flex flex-col gap-1 relative">
                        <label className="text-[11px] text-gray-500 font-medium">Şifre *</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Şifreniz"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-10 text-xs focus:ring-1 focus:ring-[#1a5c3a]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        
                        {/* Inline Password Strength Meter */}
                        {authMode === 'register' && password && (
                          <div className="space-y-1.5 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-500 font-semibold">Şifre Gücü:</span>
                              <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                            </div>
                            <div className="flex gap-1 h-1">
                              {[1, 2, 3, 4].map((index) => (
                                <div
                                  key={index}
                                  className={`flex-1 rounded-full h-full transition-all duration-300 ${
                                    strength.score >= index ? strength.color : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 pt-1 border-t border-gray-200 text-[9px]">
                              <div className="flex items-center gap-1">
                                {password.length >= 8 ? (
                                  <Check size={10} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" />
                                )}
                                <span className={password.length >= 8 ? 'text-emerald-700 font-medium' : 'text-gray-400'}>Min. 8 Karakter</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/[a-zA-Z]/.test(password) ? (
                                  <Check size={10} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" />
                                )}
                                <span className={/[a-zA-Z]/.test(password) ? 'text-emerald-700 font-medium' : 'text-gray-400'}>En az 1 Harf</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/[0-9]/.test(password) ? (
                                  <Check size={10} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" />
                                )}
                                <span className={/[0-9]/.test(password) ? 'text-emerald-700 font-medium' : 'text-gray-400'}>En az 1 Rakam</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/[^a-zA-Z0-9]/.test(password) ? (
                                  <Check size={10} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" />
                                )}
                                <span className={/[^a-zA-Z0-9]/.test(password) ? 'text-emerald-700 font-medium' : 'text-gray-400'}>Özel Karakter</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Privacy Policy Checkbox */}
                      {authMode === 'register' && (
                        <div className="flex items-start gap-2.5 mt-2.5 px-1 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/30">
                          <input 
                            id="inline-privacy-checkbox"
                            type="checkbox"
                            checked={privacyAccepted}
                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
                            disabled={isAuthLoading}
                            required
                            className="mt-0.5 rounded text-[#1a5c3a] focus:ring-[#1a5c3a] border-gray-300 cursor-pointer w-3.5 h-3.5"
                          />
                          <label htmlFor="inline-privacy-checkbox" className="text-[10.5px] text-gray-600 leading-snug cursor-pointer select-none">
                            <button 
                              type="button" 
                              onClick={() => setShowPrivacyModal(true)}
                              className="text-[#1a5c3a] font-bold hover:underline inline text-left p-0 bg-transparent border-none outline-none"
                            >
                              Gizlilik Politikası
                            </button>{' '}
                            ve{' '}
                            <span className="font-semibold text-gray-700">Kullanım Koşullarını</span> okudum, kabul ediyorum.
                          </label>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full py-3 bg-[#1a5c3a] text-white hover:bg-[#2d8a58] font-bold text-xs rounded-xl tracking-wide transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        {isAuthLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={13} />
                            Doğrulanıyor...
                          </>
                        ) : (
                          authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve İlerle'
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* STAGE 3: PACKAGE SELECTION */}
            {currentStep === 'pricing' && (
              <motion.div
                key="pricing-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 text-left"
                id="step-pricing-container"
              >
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-500 font-medium">
                    İhtiyaçlarınıza en uygun analiz kapsamını seçerek uzman raporlama sürecini başlatın.
                  </p>
                </div>

                {/* 3 Package Cards */}
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {getPackages().map((pkg) => {
                    const isSelected = selectedPackage === pkg.name;
                    
                    // Custom branding for each package
                    let badgeText = "Temel Analiz";
                    let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                    let cardStyle = isSelected 
                      ? "border-slate-600 bg-slate-50/40 shadow-md shadow-slate-900/5 ring-1 ring-slate-600" 
                      : "border-gray-200 hover:border-gray-300";
                    let iconBg = "bg-slate-50 text-slate-500";
                    
                    if (pkg.name === 'Orta') {
                      badgeText = "⭐ En Popüler";
                      badgeStyle = "bg-amber-100 text-amber-850 border-amber-200 font-black";
                      cardStyle = isSelected
                        ? "border-[#1a5c3a] bg-emerald-50/[0.04] shadow-md shadow-emerald-950/10 ring-1 ring-[#1a5c3a]"
                        : "border-gray-200 hover:border-[#1a5c3a]/40";
                      iconBg = "bg-emerald-50 text-[#1a5c3a]";
                    } else if (pkg.name === 'Profesyonel') {
                      badgeText = "🚀 Uzman Tercihi";
                      badgeStyle = "bg-[#1a5c3a]/10 text-[#1a5c3a] border-emerald-200 font-black";
                      cardStyle = isSelected
                        ? "border-emerald-800 bg-emerald-50/[0.08] shadow-lg shadow-emerald-950/15 ring-2 ring-emerald-800"
                        : "border-gray-200 hover:border-emerald-600/40";
                      iconBg = "bg-emerald-100 text-emerald-800";
                    }

                    return (
                      <div
                        key={pkg.name}
                        onClick={() => setSelectedPackage(pkg.name)}
                        className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all relative flex flex-col justify-between group ${cardStyle}`}
                      >
                        {/* Selector indicator */}
                        <span className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[#1a5c3a] border-[#1a5c3a] text-white scale-110' 
                            : 'border-gray-300 group-hover:border-gray-400 bg-white'
                        }`}>
                          {isSelected && <Check size={11} strokeWidth={4} />}
                        </span>
                        
                        <div className="space-y-3.5">
                          {/* Header section with Badges and Title */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wider ${badgeStyle}`}>
                              {badgeText}
                            </span>
                            {pkg.name === 'Profesyonel' && (
                              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                                <Sparkles size={11} className="fill-current" />
                                En Detaylı
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-black text-gray-900 group-hover:text-[#1a5c3a] transition-colors">
                                {pkg.name} Analiz Raporu
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {pkg.services.length} Analitik Analiz Kalemi
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-black text-[#1a5c3a]">{pkg.price} ₺</span>
                              <span className="text-[9px] text-gray-400 block font-medium">Tek Seferlik</span>
                            </div>
                          </div>
                          
                          {/* Service Checklist with elegant checkmarks */}
                          <div className="border-t border-gray-100/80 pt-3">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-gray-600">
                              {pkg.services.map((srv, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${iconBg}`}>
                                    ✓
                                  </span>
                                  <span className="leading-snug text-gray-700">{srv}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (!user) {
                        setCurrentStep('auth_choice');
                      } else {
                        setCurrentStep('warning');
                      }
                    }}
                    className="w-1/3 py-3 border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 text-xs rounded-xl cursor-pointer"
                  >
                    Geri Git
                  </button>
                  
                  <button
                    onClick={handlePackageSubmit}
                    disabled={isGeneratingCode}
                    className="flex-1 py-3.5 bg-[#1a5c3a] text-white hover:bg-[#2d8a58] font-bold text-xs rounded-xl tracking-wide shadow-md shadow-emerald-950/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    id="btn-confirm-pricing"
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="animate-spin" size={13} />
                        Kod Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        Ödeme Adımına İlerle
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STAGE 4: PAYMENT SCREEN (EFT / HAVALE) */}
            {currentStep === 'payment' && (
              <motion.div
                key="payment-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 text-left"
                id="step-payment-container"
              >
                {/* Package Summary Header */}
                <div className="bg-emerald-500/[0.04] p-4.5 rounded-xl border border-[#1a5c3a]/25 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">Seçilen Hizmet Paketi:</span>
                    <span className="font-extrabold text-[#1a5c3a]">{selectedPackage} Analiz</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">Ödenecek Toplam Tutar:</span>
                    <span className="font-extrabold text-base text-[#1a5c3a]">{currentPrice} ₺</span>
                  </div>
                </div>

                {/* EFT/Havale Bank details */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4.5 space-y-4">
                  <h4 className="text-[10px] font-bold text-[#1a5c3a] tracking-widest uppercase">ÖDEME İÇİN BANKA BİLGİLERİ (EFT / HAVALE)</h4>
                  
                  <div className="space-y-3 text-xs">
                    {/* Bank Name */}
                    <div className="flex flex-col bg-white p-2.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold">BANKA</span>
                      <span className="font-bold text-gray-800">Garanti BBVA</span>
                    </div>

                    {/* Account Holder */}
                    <div className="flex flex-col bg-white p-2.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-semibold">HESAP SAHİBİ</span>
                      <span className="font-bold text-gray-800">Hasipcan GÖK</span>
                    </div>

                    {/* IBAN */}
                    <div className="flex flex-col bg-white p-2.5 rounded-lg border border-gray-100 relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-semibold">IBAN NUMARASI</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('TR03 0006 2000 6870 0006 8785 09');
                            setCopiedField('iban');
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-[#1a5c3a] font-bold hover:underline cursor-pointer bg-transparent border-none"
                        >
                          {copiedField === 'iban' ? '✓ Kopyalandı!' : 'Kopyala'}
                        </button>
                      </div>
                      <span className="font-mono font-bold text-gray-850 tracking-wider">TR03 0006 2000 6870 0006 8785 09</span>
                    </div>

                    {/* Description (Rapor Kodu) */}
                    <div className="flex flex-col bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-amber-800 font-bold">ÖDEME AÇIKLAMASI (RAPOR KODU)</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedReportId);
                            setCopiedField('code');
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-[#1a5c3a] font-bold hover:underline cursor-pointer bg-transparent border-none"
                        >
                          {copiedField === 'code' ? '✓ Kopyalandı!' : 'Kopyala'}
                        </button>
                      </div>
                      <span className="font-mono font-black text-sm text-amber-900 tracking-wider mt-1">{generatedReportId}</span>
                      <p className="text-[10px] text-amber-800/80 leading-normal mt-1.5 font-medium">
                        ⚠️ Ödemeyi gönderirken açıklama alanına <strong>sadece bu kodu</strong> yazınız.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-blue-800 leading-relaxed font-medium">
                    Belirtilen paket ücretini banka hesabımıza gönderip, açıklama kısmına rapor kodunuzu ekledikten sonra aşağıdaki butona tıklayarak işleminizi tamamlayabilirsiniz.
                  </p>
                </div>

                {paymentError && (
                  <div className="p-2.5 bg-red-50 text-red-650 text-xs font-semibold rounded-lg border border-red-100">
                    ⚠️ {paymentError}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button 
                    disabled={isPaymentLoading}
                    onClick={() => setCurrentStep('pricing')}
                    className="w-1/3 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Geri Dön
                  </button>
                  <button 
                    onClick={() => handleCompleteFlow()}
                    disabled={isPaymentLoading}
                    className="flex-1 py-3.5 bg-[#1a5c3a] hover:bg-[#2d8a58] text-white text-xs font-bold rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/15 cursor-pointer"
                    id="btn-pay-submit"
                  >
                    {isPaymentLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={13} />
                        Talep Gönderiliyor...
                      </>
                    ) : (
                      "Raporu Talep Et"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STAGE 5: COMPLETED SUCCESS */}
            {currentStep === 'completed' && (
              <motion.div
                key="completed-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 space-y-6"
                id="step-completed-container"
              >
                <div className="inline-flex p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl scale-110 mb-1">
                  <CheckCircle2 size={36} className="text-[#1a5c3a]" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-black text-gray-900 tracking-tight">Rapor Talebiniz Başarıyla Alındı!</h4>
                  <p className="text-xs text-emerald-800 font-semibold max-w-sm mx-auto leading-relaxed p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                    "Ödemeniz tarafımıza ulaşıp doğrulandıktan sonra analiz süreci başlatılacaktır. Raporunuz en geç 1 iş günü içerisinde hazırlanarak tarafınıza teslim edilecektir."
                  </p>
                </div>

                {/* Elegant Report Ticket Card */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80 max-w-sm mx-auto text-xs space-y-3.5 relative overflow-hidden text-left">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#1a5c3a]/30" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold">RAPOR NUMARASI</span>
                    <span className="font-mono text-gray-950 font-black tracking-wider text-sm p-1.5 px-3 bg-emerald-100/45 border border-emerald-200/60 rounded-lg text-[#1a5c3a]" id="ticket-report-id">
                      {generatedReportId}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3.5 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Hizmet Paketi:</span>
                      <span className="text-gray-700 font-bold">{selectedPackage} Analiz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Ödeme Tutarı:</span>
                      <span className="text-gray-700 font-bold">{currentPrice} ₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Ödeme Yöntemi:</span>
                      <span className="text-gray-700 font-bold">Banka Havalesi (EFT/Havale)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Gayrimenkul Türü:</span>
                      <span className="text-gray-700 font-bold">{propType === 'konut' ? 'KONUT' : propType === 'arsa' ? 'ARSA / ARAZİ' : 'TİCARİ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Teslimat Süresi:</span>
                      <span className="text-[#1a5c3a] font-bold">En geç 1 İş Günü</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Gönderilecek E-posta:</span>
                      <span className="text-gray-700 font-semibold truncate max-w-[180px]">{propertyData?.contactEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-[#1a5c3a] hover:bg-[#2d8a58] text-white text-xs font-bold rounded-xl tracking-wide transition-all shadow-md shadow-emerald-950/15 cursor-pointer"
                    id="btn-flow-done"
                  >
                    Kapat ve Devam Et
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacyModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-[480px] p-5 shadow-2xl relative flex flex-col max-h-[80vh] z-10 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-[#1a5c3a]" />
                  <h3 className="text-sm font-bold text-gray-900">Gizlilik Politikası & Kullanım Koşulları</h3>
                </div>
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto my-3 text-[11px] text-gray-600 space-y-3.5 leading-relaxed pr-2 text-left">
                <p className="font-bold text-gray-800 text-xs">Gizlilik Politikası — değerbiç</p>
                <p className="text-[10px] text-gray-400">Son Güncelleme: 28 Haziran 2026 | Sürüm: 1.0</p>
                
                <p className="font-semibold text-gray-700">1. Giriş ve Kapsam</p>
                <p>
                  Bu Giriş ve Kapsam metni, değerbiç platformu ("Platform", "değerbiç", "biz") tarafından sunulan gayrimenkul analizi ve imar danışmanlığı hizmetlerinin kullanımı kapsamında kullanıcılardan ("siz", "kullanıcı") toplanan kişisel verilerin işlenmesine ilişkin esasları düzenlemektedir. Bu Politika; 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Kişisel Verileri Koruma Kurulu tarafından yayımlanan ikincil düzenlemeler çerçevesinde hazırlanmıştır. Platform'u kullanarak veya hizmetlerimize başvurarak bu Politika'da belirtilen koşulları kabul etmiş sayılırsınız.
                </p>

                <p className="font-semibold text-gray-700">2. Veri Sorumlusunun Kimliği</p>
                <p>
                  KVKK'nın 3. maddesi uyarınca veri sorumlusu aşağıdaki bilgilerle ulaşılabilir:<br />
                  <strong>Platform:</strong> değerbiç<br />
                  <strong>E-posta:</strong> degerbic@hotmail.com<br />
                  Kişisel verilerinize ilişkin her türlü talep, itiraz veya başvuru yukarıdaki e-posta adresi aracılığıyla veri sorumlusuna iletilmelidir.
                </p>

                <p className="font-semibold text-gray-700">3. İşlenen Kişisel Veriler</p>
                <p><strong>3.1 Kimlik ve İletişim Verileri</strong><br />Üyelik kaydı, misafir sipariş ve hizmet başvurusu süreçlerinde aşağıdaki veriler işlenmektedir:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ad ve soyad</li>
                  <li>Telefon numarası</li>
                  <li>E-posta adresi</li>
                </ul>

                <p><strong>3.2 Hizmet Kapsamında İşlenen Taşınmaz Bilgileri</strong><br />Talep edilen analiz raporuna konu taşınmazla ilgili kullanıcının beyan ettiği bilgiler işlenmektedir. Bu veriler kişisel veri niteliği taşımamakla birlikte kişiyle ilişkilendirilebildiği ölçüde bu Politika kapsamında değerlendirilir:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Taşınmazın il, ilçe, mahalle, ada ve parsel bilgileri</li>
                  <li>Taşınmaz türü (konut, arsa, ticari vb.) ve özellikleri</li>
                  <li>Kullanıcının beyan ettiği fiyat beklentisi</li>
                  <li>Ek belgeler (kullanıcı tarafından isteğe bağlı olarak yüklenenler)</li>
                </ul>

                <p><strong>3.3 İşlem ve Hizmet Verileri</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Talep numarası ve rapor teslim tarihi</li>
                  <li>Seçilen hizmet paketi ve abonelik türü</li>
                  <li>Ödeme tamamlanma bilgisi (tutar ve tarih — kart/hesap bilgisi Platform'a iletilmez)</li>
                </ul>

                <p><strong>3.4 Teknik Veriler</strong><br />Platform altyapısının güvenliği, performansı ve hizmet kalitesinin sağlanması amacıyla aşağıdaki teknik veriler otomatik olarak işlenebilir:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>IP adresi ve coğrafi konum (ülke/şehir düzeyinde)</li>
                  <li>Tarayıcı türü ve sürümü, işletim sistemi</li>
                  <li>Platform'a erişim tarihi, saati ve ziyaret edilen sayfalar</li>
                  <li>Çerez (cookie) verileri — bkz. Madde 9</li>
                </ul>

                <p className="font-semibold text-gray-700">4. Kişisel Verilerin İşlenme Amaçları ve Hukuki Dayanakları</p>
                <p>Kişisel verileriniz aşağıdaki amaçlarla ve KVKK'nın 5. maddesi kapsamındaki hukuki dayanaklar esas alınarak işlenmektedir.</p>
                <p><strong>Sözleşmenin kurulması ve ifası (KVKK m.5/2-c):</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Hizmet talebinin alınması ve analiz raporunun hazırlanması</li>
                  <li>Ödeme süreçlerinin yönetimi (ödeme aracı kurumu üzerinden)</li>
                  <li>Rapor teslimi ve üyelik yönetimi</li>
                </ul>
                <p><strong>Meşru menfaat (KVKK m.5/2-f):</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Platform güvenliğinin ve bütünlüğünün korunması</li>
                  <li>Hizmet kalitesinin izlenmesi ve iyileştirilmesi</li>
                  <li>Teknik arıza yönetimi</li>
                </ul>
                <p><strong>Açık rıza (KVKK m.5/1) — yalnızca rıza alındığında:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Hizmet, kampanya ve güncel duyurulara ilişkin e-posta/SMS iletişimi</li>
                  <li>Platform kullanım alışkanlıklarına dayalı kişiselleştirilmiş deneyim</li>
                </ul>
                <p><strong>Hukuki yükümlülüğün yerine getirilmesi (KVKK m.5/2-ç):</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Vergi mevzuatı kapsamındaki kayıt ve belgeleme yükümlülükleri</li>
                  <li>Resmî makam talepleri doğrultusunda bilgi paylaşımı</li>
                </ul>

                <p className="font-semibold text-gray-700">5. Kişisel Verilerin Aktarımı</p>
                <p><strong>5.1 Üçüncü Taraflarla Paylaşım</strong><br />Kişisel verileriniz ticari amaçla üçüncü taraflara satılmaz, kiralanmaz veya devredilmez. Verileriniz yalnızca aşağıdaki kategorilerdeki alıcılarla ve belirtilen amaçlar doğrultusunda paylaşılır:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ödeme hizmeti sağlayıcısı (İyzico, PayTR veya benzer lisanslı kuruluş): ödeme işleminin gerçekleştirilmesi; kart/hesap bilgisi Platform'a iletilmez</li>
                  <li>Barındırma ve bulut altyapısı sağlayıcısı: Platform verilerinin güvenli depolanması</li>
                  <li>E-posta altyapı sağlayıcısı: işlem ve bildirim e-postalarının iletilmesi</li>
                  <li>Analitik hizmet sağlayıcısı (anonim/toplu veri): Platform kullanımının analizi</li>
                </ul>
                <p>Rapor hazırlama sürecinde değerlendirme görevi üstlenen şehir plancıları, mimarlar ve mühendisler; Platform bünyesinde faaliyet gösteren ve veri işleyici sıfatıyla hareket eden kişilerdir, bağımsız üçüncü taraf sayılmazlar.</p>
                <p><strong>5.2 Yurt Dışına Aktarım</strong><br />Kullandığımız altyapı hizmetlerinin bir kısmı yurt dışı sunucularda barındırılıyor olabilir. Bu durumda yurt dışına aktarım, KVKK'nın 9. maddesi kapsamında açık rızanız alınarak ya da yeterli korumayı sağlayan ülkelere sınırlı tutularak gerçekleştirilecektir.</p>
                <p><strong>5.3 Yasal Zorunluluk</strong><br />Yetkili kamu kurum ve kuruluşlarının talepleri, mahkeme kararları veya yürürlükteki mevzuat çerçevesinde kişisel verileriniz ilgili mercilere aktarılabilir.</p>

                <p className="font-semibold text-gray-700">6. Kişisel Verilerin Saklanma Süreleri</p>
                <p>Kişisel verileriniz, işlenme amacının sona ermesinin ardından KVKK'nın 7. maddesi ve Kişisel Verileri Koruma Kurulu kararları çerçevesinde silinir, yok edilir veya anonim hale getirilir.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Üyelik verileri: üyeliğin sonlandırılmasından itibaren 3 yıl</li>
                  <li>Analiz raporu ve taşınmaz bilgileri: raporun tesliminden itibaren 5 yıl</li>
                  <li>Ödeme işlem kayıtları: 213 sayılı Vergi Usul Kanunu gereği 5 yıl</li>
                  <li>Teknik ve sistem günlükleri: en fazla 2 yıl</li>
                  <li>Açık rızaya dayalı pazarlama iletişimi: rıza geri alınana kadar, azami 3 yıl</li>
                </ul>
                <p>Saklama sürelerinin sonunda veriler, periyodik imha döngüleriyle silinir veya anonim hale getirilir.</p>

                <p className="font-semibold text-gray-700">7. Kişisel Verilerin Güvenliği</p>
                <p>Kişisel verilerinizin yetkisiz erişim, ifşa, değiştirme veya imhaya karşı korunması amacıyla KVKK'nın 12. maddesi uyarınca teknik ve idari tedbirler uygulanmaktadır.</p>
                <p><strong>Teknik tedbirler:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>SSL/TLS şifrelemesiyle güvenli veri iletimi</li>
                  <li>Veritabanı erişiminin rol tabanlı yetkilendirmeyle kısıtlanması</li>
                  <li>Düzenli güvenlik denetimi ve güncelleme uygulaması</li>
                  <li>Güvenli barındırma altyapısı</li>
                </ul>
                <p><strong>İdari tedbirler:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Kişisel verilere erişimin yalnızca hizmet sunumu için zorunlu personelle sınırlandırılması</li>
                  <li>Veri işleyenlerle gizlilik ve veri işleme sözleşmelerinin imzalanması</li>
                  <li>Çalışanların ve uzmanların KVKK kapsamında farkındalık eğitimlerinden geçirilmesi</li>
                </ul>
                <p>Üçüncü taraf ödeme altyapısı aracılığıyla gerçekleştirilen ödemelerde kart bilgileri Platform'a iletilmez; PCI-DSS uyumlu ödeme sağlayıcısı tarafından işlenir.</p>

                <p className="font-semibold text-gray-700">8. İlgili Kişinin Hakları</p>
                <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                  <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
                  <li>Eksik veya yanlış işlendiği durumlarda düzeltilmesini talep etme</li>
                  <li>Kanundaki şartlar çerçevesinde silinmesini veya yok edilmesini talep etme</li>
                  <li>Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini talep etme</li>
                  <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonuç ortaya çıkmasına itiraz etme</li>
                  <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın tazminini talep etme</li>
                </ul>
                <p><strong>8.1 Başvuru Yöntemi</strong><br />Haklarınızı kullanmak için aşağıdaki e-posta adresi aracılığıyla veri sorumlusuna yazılı olarak başvurabilirsiniz:<br /><strong>E-posta:</strong> degerbic@hotmail.com (konu satırına "KVKK Başvurusu" yazılması önerilir)<br />Başvurularınız en geç 30 gün içinde yanıtlanacaktır. Yanıtın yazılı olarak gönderilmesi halinde 10 sayfaya kadar ücret alınmaz; 10 sayfayı aşan yanıtlarda Kurul tarafından belirlenen tarife esas alınır. Başvurunuzun reddedilmesi, verilen yanıtın yetersiz bulunması veya süresinde yanıt verilmemesi halinde Kişisel Verileri Koruma Kurulu'na şikâyette bulunma hakkınız saklıdır.</p>

                <p className="font-semibold text-gray-700">9. Çerezler (Cookie) Politikası</p>
                <p>Platform, hizmet işlevselliğini sağlamak, kullanım deneyimini geliştirmek ve anonim istatistikler üretmek amacıyla çerez kullanabilir.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Zorunlu çerezler:</strong> Oturum yönetimi ve güvenlik amacıyla kullanılır; rızaya gerek duyulmaksızın aktif olarak çalışır.</li>
                  <li><strong>Analitik çerezler:</strong> Platform kullanım istatistiklerinin anonim biçimde toplanmasına yarar. Tarayıcı ayarlarınızdan veya Platform'daki çerez tercih panelinden devre dışı bırakabilirsiniz.</li>
                  <li><strong>İşlevsel çerezler:</strong> Dil tercihi, oturum süresi gibi kişiselleştirilmiş deneyim ayarlarını saklar. İsteğe bağlı olup devre dışı bırakılabilir.</li>
                </ul>

                <p className="font-semibold text-gray-700">10. Açık Rıza</p>
                <p>Pazarlama iletişimi ve kişiselleştirilmiş deneyim gibi zorunlu olmayan veri işleme faaliyetleri için açık rızanız alınacaktır. Açık rızanızı aşağıdaki yollarla geri alabilirsiniz:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Hesabınızdaki iletişim tercihleri bölümünden</li>
                  <li>E-posta bildirimlerindeki abonelikten çıkma bağlantısıyla</li>
                  <li>degerbic@hotmail.com adresine talep ileterek</li>
                </ul>
                <p>Rızanın geri alınması, geri almadan önceki döneme ait veri işlemenin hukuka aykırı hale gelmesine yol açmaz.</p>

                <p className="font-semibold text-gray-700">11. Politika Değişiklikleri</p>
                <p>Bu Politika, yasal düzenlemeler, Platform'un hizmet kapsamındaki değişiklikler veya veri işleme pratiklerindeki gelişmeler doğrultusunda güncellenebilir. Önemli değişiklikler; kayıtlı kullanıcılara e-posta yoluyla veya Platform'da belirgin biçimde duyurulacaktır. Yürürlük tarihi, Politika'nın üst kısmında "Son Güncelleme" olarak belirtilir. Değişiklikten sonra Platform'u kullanmaya devam etmeniz, güncellenmiş Politika'yı kabul ettiğiniz anlamına gelir.</p>

                <p className="font-semibold text-gray-700">12. Uyuşmazlık ve Yetkili Makam</p>
                <p>Bu Politika'dan doğan uyuşmazlıklarda öncelikle Madde 8'de belirtilen başvuru yolları kullanılacaktır. Çözüme kavuşturulamayan durumlarda Kişisel Verileri Koruma Kurulu ve Türk mahkemeleri yetkilidir. Bu Politika; Türk hukuku ve KVKK hükümleri çerçevesinde yorumlanır.</p>

                <p className="font-semibold text-gray-700">13. Yatırım Tavsiyesi Değildir</p>
                <p>değerbiç tarafından hazırlanan analiz ve fiyat aralığı raporları ve Platform'da sunulan tüm içerikler; şehir plancıları, mimarlar ve mühendisler tarafından mevcut teknik veriler, emsal araştırmaları ve bölgesel plan kararları esas alınarak hazırlanan uzman görüşü niteliğindedir. Bu raporlar ve içerikler hiçbir koşulda aşağıdaki nitelikleri taşımaz:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Yatırım tavsiyesi veya yatırım danışmanlığı hizmeti</li>
                  <li>Sermaye Piyasası Kurulu (SPK) lisansı gerektiren finansal analiz veya portföy yönetimi hizmeti</li>
                  <li>Resmî ekspertiz ya da yasal bağlayıcılığı olan resmi değer tespiti veya kıymet takdiri raporu</li>
                  <li>Bankacılık veya ipotek süreçlerinde kullanılabilecek biçimsel resmi kıymet takdir belgesi</li>
                </ul>
                <p>Kullanıcı, Platform üzerinden eriştiği analiz, rapor ve bilgileri yalnızca bilgi edinme ve karar destek amacıyla kullanabileceğini; nihai yatırım, alım, satım veya finansman kararından doğan her türlü sonucun münhasıran kendisine ait olduğunu kabul eder. değerbiç; kullanıcının Platform içeriklerine dayanarak verdiği kararlar sonucunda uğrayabileceği doğrudan veya dolaylı zarar, kayıp ya da kâr yoksunluğundan sorumlu tutulamaz.</p>
                
                <p className="text-gray-400 text-[10px] pt-2 border-t border-gray-100 text-center">
                  değerbiç | Gayrimenkul Analiz Platformu | degerbic@hotmail.com
                </p>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => {
                    setPrivacyAccepted(true);
                    setShowPrivacyModal(false);
                  }}
                  className="px-4 py-2 bg-[#1a5c3a] text-white hover:bg-[#2d8a58] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Okudum, Kabul Ediyorum
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

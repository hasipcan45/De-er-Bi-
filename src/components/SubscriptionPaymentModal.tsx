import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Check, 
  Loader2, 
  Sparkles, 
  Award, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ArrowRight, 
  User, 
  UserCheck, 
  CheckCircle2, 
  Shield 
} from 'lucide-react';
import { UserProfile, getEffectiveMembership } from '../types.ts';
import { auth, db } from '../lib/firebase.ts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: string;
  rights: string[];
  onPaymentSuccess: (planId: string) => void;
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function SubscriptionPaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  price,
  rights,
  onPaymentSuccess,
  user,
  onLoginSuccess
}: SubscriptionPaymentModalProps) {
  // Steps: 'warning' | 'auth_choice' | 'pricing' | 'payment' | 'completed'
  const [currentStep, setCurrentStep] = useState<'warning' | 'auth_choice' | 'pricing' | 'payment' | 'completed'>('warning');

  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>('login');
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

  // Card details states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isPreAgreed, setIsPreAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset states when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('warning');
      setAuthMode('login');
      setAuthError(null);
      setErrorMessage('');
      setIsLoading(false);
      setIsAuthLoading(false);
      setPrivacyAccepted(false);
      
      // Clean payment form
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCVC('');
      setIsAgreed(false);
      setIsPreAgreed(false);
      
      // Clean auth fields
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen]);

  // Firestore Error Handler helper conforming to strict system guidelines
  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId
      },
      operationType,
      path
    };
    console.error('Firestore Error Details: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Format Helpers
  const formatCardNumberValue = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryValue = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length >= 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = '';
    
    if (numbers.startsWith('0')) {
      const clean = numbers.slice(1);
      const part1 = clean.slice(0, 3);
      const part2 = clean.slice(3, 6);
      const part3 = clean.slice(6, 8);
      const part4 = clean.slice(8, 10);
      
      if (clean.length > 6) {
        formatted = `0 (${part1}) ${part2} ${part3} ${part4}`;
      } else if (clean.length > 3) {
        formatted = `0 (${part1}) ${part2}`;
      } else {
        formatted = `0 (${part1}`;
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

  // Authentication Submission handler
  const handleAuthSubmit = async (e: FormEvent) => {
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
        
        let userProfileData: any = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            userProfileData = { ...userDoc.data(), id: firebaseUser.uid };
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        if (userProfileData) {
          onLoginSuccess(userProfileData as UserProfile);
        } else {
          onLoginSuccess({
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || email.split('@')[0].toUpperCase(),
            email: email,
            phone: '0555 000 00 00',
            role: 'user',
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
        
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
        
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

  // Payment Submission handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAgreed || !isPreAgreed) {
      setErrorMessage('Lütfen sözleşmeleri ve koşulları onaylayınız.');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMessage('Lütfen geçerli bir 16 haneli kart numarası giriniz.');
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMessage('Lütfen son kullanma tarihini giriniz (AA/YY).');
      return;
    }
    if (cardCVC.length < 3) {
      setErrorMessage('Lütfen 3 haneli güvenlik kodunu (CVC) giriniz.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    // Simulated standard bank transaction checkout loop
    setTimeout(() => {
      setIsLoading(false);
      onPaymentSuccess(planId);
      setCurrentStep('completed');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-xs"
            id="sub-payment-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10"
            id="sub-payment-modal-card"
          >
            {/* Header decoration matches app green palette */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#1a5c3a]" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 mt-1.5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight" id="modal-title">
                  {currentStep === 'warning' && '1. Abonelik Bilgileri ve Haklar'}
                  {currentStep === 'auth_choice' && '2. Üye Girişi / Hesap Doğrulama'}
                  {currentStep === 'pricing' && '3. Paket Ücreti ve Onay'}
                  {currentStep === 'payment' && '4. Güvenli Ödeme'}
                  {currentStep === 'completed' && 'İşlem Başarılı'}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold tracking-wider mt-1">
                  ABONELİK SATINALMA SİHİRBAZI
                </p>
              </div>
              {currentStep !== 'completed' && (
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  type="button"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Content Stages */}
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <AnimatePresence mode="wait">
                
                {/* STAGE 1: INFO AND WARNING */}
                {currentStep === 'warning' && (
                  <motion.div
                    key="warning-step"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                    id="step-warning-container"
                  >
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3.5 text-left">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-amber-900">Abonelik Hakları ve Kullanım Koşulları</h4>
                        <p className="text-[11px] text-amber-800/90 leading-relaxed">
                          Seçtiğiniz profesyonel üyelik paketi kapsamında tanımlanacak kotalar, ödemenin başarılı olmasıyla birlikte anında hesabınıza yüklenecektir. Kotaların kullanım süresi fatura kesim tarihi itibariyle 30 gündür.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs font-bold text-gray-800 tracking-wider">SEÇİLEN ABONELİK PAKETİ</span>
                        <span className="text-[10px] bg-emerald-50 text-[#1a5c3a] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                          {planId === 'yearly_pro' ? 'YILLIK PRO' : 'AYLIK PRO'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-baseline gap-1 bg-white p-4.5 rounded-xl border border-gray-100">
                          <div className="flex-1">
                            <span className="text-gray-400 text-[10px] block font-bold">PAKET TANIMI</span>
                            <span className="text-gray-800 font-extrabold text-sm">{planName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400 text-[10px] block font-bold">FİYAT</span>
                            <span className="text-[#1a5c3a] font-black text-lg">{price}</span>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2.5">
                          <span className="text-gray-400 text-[10px] block font-bold">TANIMLANACAK KOTALAR VE HAKLAR</span>
                          <ul className="space-y-2">
                            {rights.map((right, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                                <div className="w-4.5 h-4.5 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a5c3a] shrink-0">
                                  <Check size={11} className="stroke-[3px]" />
                                </div>
                                <span className="font-semibold leading-normal">{right}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          setCurrentStep('auth_choice');
                        } else {
                          setCurrentStep('pricing');
                        }
                      }}
                      className="w-full py-3.5 bg-[#1a5c3a] text-white hover:bg-[#2d8a58] font-bold text-xs rounded-xl tracking-wide shadow-md shadow-emerald-950/15 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                    >
                      Bilgileri Onayla ve İlerle
                      <ArrowRight size={14} />
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
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <button 
                          onClick={() => setCurrentStep('warning')}
                          className="text-xs text-[#1a5c3a] font-bold hover:underline cursor-pointer"
                        >
                          ← Geri Dön
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
                          
                          {/* Password Strength Meter */}
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
                                className="text-[#1a5c3a] font-bold hover:underline inline text-left p-0 bg-transparent border-none outline-none cursor-pointer"
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
                            authMode === 'login' ? 'Giriş Yap ve İlerle' : 'Kayıt Ol ve İlerle'
                          )}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* STAGE 3: PRICING CONFIRMATION */}
                {currentStep === 'pricing' && (
                  <motion.div
                    key="pricing-step"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                    id="step-pricing-container"
                  >
                    {/* Visual Premium Badge showing current user */}
                    <div className="flex items-center justify-between p-4 bg-emerald-500/[0.04] border border-[#1a5c3a]/20 rounded-xl text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1a5c3a]/10 text-[#1a5c3a] rounded-lg shrink-0">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">
                            {user ? `Giriş Yapıldı: ${user.fullName}` : 'Misafir Kullanıcı'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Abonelik işlemi bu hesap üzerinden gerçekleştirilecektir.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Main bill breakdown card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm text-left">
                      <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800">Hizmet Kalemi</span>
                        <span className="text-xs font-bold text-gray-800">Tutar</span>
                      </div>
                      
                      <div className="p-5 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-gray-700 font-bold block">
                              {planName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {planId === 'yearly_pro' ? '12 Aylık Profesyonel Paket' : '1 Aylık Profesyonel Paket'}
                            </span>
                          </div>
                          <span className="text-gray-800 font-bold">
                            {price}
                          </span>
                        </div>

                        {/* Total billing line */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200/60">
                          <span className="text-xs font-extrabold text-gray-900">ÖDENECEK TUTAR</span>
                          <span className="text-lg font-black text-[#1a5c3a]">
                            {price}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
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
                        onClick={() => setCurrentStep('payment')}
                        className="flex-1 py-3.5 bg-[#1a5c3a] text-white hover:bg-[#2d8a58] font-bold text-xs rounded-xl tracking-wide shadow-md shadow-emerald-950/15 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                        id="btn-confirm-pricing"
                      >
                        Ödeme Adımına İlerle
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STAGE 4: PAYMENT SCREEN */}
                {currentStep === 'payment' && (
                  <motion.div
                    key="payment-step"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                    id="step-payment-container"
                  >
                    {/* Interactive Card Mockup */}
                    <div className="bg-gradient-to-br from-[#1a5c3a] to-[#2d8a58] rounded-2xl p-5 text-white shadow-lg space-y-6 relative overflow-hidden h-44 flex flex-col justify-between max-w-sm mx-auto w-full">
                      {/* Card pattern lines */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-10 h-7 bg-amber-300/20 rounded-md border border-amber-300/30 flex items-center justify-center">
                          <div className="w-6 h-4 bg-amber-400/80 rounded-xs" />
                        </div>
                        <span className="text-xs font-black tracking-widest uppercase text-white/90">DEĞER BİÇ™</span>
                      </div>

                      <div className="space-y-4 relative z-10 text-left">
                        {/* Card Number display */}
                        <div className="font-mono text-base md:text-lg tracking-widest font-bold text-white/90">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        <div className="flex justify-between items-center text-[10px] tracking-wider uppercase text-white/70">
                          <div>
                            <span className="text-[7px] block text-white/50 mb-0.5">KART SAHİBİ</span>
                            <span className="font-bold font-sans truncate max-w-[150px] block">
                              {cardName || 'İSİM SOYİSİM'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[7px] block text-white/50 mb-0.5">GEÇERLİLİK</span>
                            <span className="font-bold font-mono">
                              {cardExpiry || 'AA/YY'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card input forms */}
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                      {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Kart Üzerindeki İsim</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCardName(val.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase());
                          }}
                          placeholder="KART SAHİBİ"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-[#1a5c3a] font-bold outline-hidden transition-all focus:bg-white"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Kart Numarası</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumberValue(e.target.value))}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 pl-10 text-xs focus:ring-1 focus:ring-[#1a5c3a] font-mono font-bold outline-hidden transition-all focus:bg-white"
                            disabled={isLoading}
                          />
                          <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Son Kullanma (AA/YY)</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiryValue(e.target.value))}
                            placeholder="AA/YY"
                            maxLength={5}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-[#1a5c3a] text-center font-mono font-bold outline-hidden transition-all focus:bg-white"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">CVC (Güvenlik Kodu)</label>
                          <input
                            type="password"
                            required
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            placeholder="000"
                            maxLength={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-[#1a5c3a] text-center font-mono font-bold outline-hidden transition-all focus:bg-white"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Consents Checkboxes */}
                      <div className="space-y-2 pt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-gray-600">
                          <input
                            type="checkbox"
                            checked={isPreAgreed}
                            onChange={(e) => setIsPreAgreed(e.target.checked)}
                            required
                            className="mt-0.5 rounded-sm accent-[#1a5c3a] text-xs h-3.5 w-3.5"
                            disabled={isLoading}
                          />
                          <span className="text-[10px] leading-relaxed">
                            <strong className="text-gray-800">Mesafeli Satış Sözleşmesi</strong> ve <strong className="text-gray-800">Ön Bilgilendirme Formu</strong>'nu okudum ve onaylıyorum.
                          </span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer text-gray-600">
                          <input
                            type="checkbox"
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            required
                            className="mt-0.5 rounded-sm accent-[#1a5c3a] text-xs h-3.5 w-3.5"
                            disabled={isLoading}
                          />
                          <span className="text-[10px] leading-relaxed">
                            Abonelik ödemesinin yapıldığı an itibarıyla paket haklarımın <strong className="text-gray-800">anında teslim edileceğini</strong>, cayma hakkımın dijital nitelik sebebiyle bulunmadığını kabul ederim.
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep('pricing')}
                          className="w-1/3 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          disabled={isLoading}
                        >
                          Geri Git
                        </button>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-3.5 bg-[#1a5c3a] hover:bg-[#207047] text-white text-xs font-bold rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/15 cursor-pointer uppercase text-center"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />
                              ONAY ALINIYOR...
                            </>
                          ) : (
                            `GÜVENLİ ÖDEME YAP (${price})`
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STAGE 5: COMPLETED SUCCESS */}
                {currentStep === 'completed' && (
                  <motion.div
                    key="completed-step"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 space-y-6 animate-fade-in"
                    id="step-completed-container"
                  >
                    <div className="inline-flex p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl scale-110 mb-1">
                      <CheckCircle2 size={36} className="text-[#1a5c3a]" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-gray-900 tracking-tight">Aboneliğiniz Başarıyla Aktifleştirildi!</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Ödemeniz başarıyla doğrulanmıştır. Profesyonel üyelik haklarınız ve rapor kotalarınız anında hesabınıza yüklenmiştir.
                      </p>
                    </div>

                    {/* Elegant Ticket Card */}
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80 max-w-sm mx-auto text-xs space-y-3.5 relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#1a5c3a]/30" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-semibold uppercase">ÜYELİK DURUMU</span>
                        <span className="font-mono text-gray-950 font-black tracking-wider text-[10px] p-1.5 px-3 bg-emerald-100/45 border border-emerald-200/60 rounded-lg text-[#1a5c3a]">
                          AKTİF / PROFESYONEL
                        </span>
                      </div>

                      <div className="border-t border-dashed border-gray-200 pt-3.5 space-y-2 text-left">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-medium">Paket:</span>
                          <span className="text-gray-700 font-bold">{planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-medium">Tutar:</span>
                          <span className="text-gray-700 font-bold">{price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-medium">Yöntem:</span>
                          <span className="text-gray-700 font-bold">Güvenli Kredi Kartı</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-medium">Kullanıcı E-posta:</span>
                          <span className="text-[#1a5c3a] font-bold truncate max-w-[200px]">{user?.email || email}</span>
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

          {/* Privacy & Terms Policy Inline Modal Overlay */}
          <AnimatePresence>
            {showPrivacyModal && (
              <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
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
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="overflow-y-auto my-3 text-[11px] text-gray-600 space-y-3.5 leading-relaxed pr-2 text-left">
                    <p className="font-bold text-gray-800 text-xs">Gizlilik Politikası — değerbiç</p>
                    <p className="text-[10px] text-gray-400">Son Güncelleme: 28 Haziran 2026 | Sürüm: 1.0</p>
                    
                    <p className="font-semibold text-gray-700">1. Giriş ve Kapsam</p>
                    <p>
                      Bu Gizlilik Politikası, değerbiç platformu ("Platform", "değerbiç", "biz") tarafından sunulan gayrimenkul değerleme analizi ve imar danışmanlığı hizmetlerinin kullanımı kapsamında kullanıcılardan ("siz", "kullanıcı") toplanan kişisel verilerin işlenmesine ilişkin esasları düzenlemektedir. Bu Politika; 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) çerçevesinde hazırlanmıştır.
                    </p>

                    <p className="font-semibold text-gray-700">2. Veri Sorumlusunun Kimliği</p>
                    <p>
                      <strong>Platform:</strong> değerbiç<br />
                      <strong>E-posta:</strong> degerbic@hotmail.com
                    </p>

                    <p className="font-semibold text-gray-700">3. İşlenen Kişisel Veriler</p>
                    <p>Üyelik kaydı, misafir sipariş ve hizmet başvurusu süreçlerinde aşağıdaki veriler işlenmektedir:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Ad ve soyad</li>
                      <li>Telefon numarası</li>
                      <li>E-posta adresi</li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}
    </AnimatePresence>
  );
}

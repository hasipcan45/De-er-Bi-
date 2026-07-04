import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, AlertCircle, Check, Shield } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { auth, db } from '../lib/firebase.ts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onAuthSuccess?: (user: UserProfile) => void;
}

export function AuthModal({ isOpen, onClose, initialMode, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Field States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setError(null);
      setPrivacyAccepted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email) {
      setError('E-posta alanı zorunludur.');
      return;
    }

    const fullName = mode === 'register' ? `${firstName.trim()} ${lastName.trim()}`.trim() : '';

    if (mode === 'register') {
      if (!firstName || !lastName) {
        setError('Ad ve Soyad alanları zorunludur.');
        return;
      }
      if (!phone) {
        setError('Telefon numarası zorunludur.');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Lütfen geçerli bir telefon numarası girin (örn: 05XX XXX XX XX).');
        return;
      }
      if (strength.score < 3) {
        setError('Lütfen şifre gücünü artırın (en az 8 karakter, harf ve rakam içermelidir).');
        return;
      }
      if (!privacyAccepted) {
        setError('Devam etmek için Gizlilik Politikası ve Kullanım Koşullarını kabul etmelisiniz.');
        return;
      }
    } else {
      if (!password || password.length < 5) {
        setError('Şifre en az 5 karakter olmalıdır.');
        return;
      }
    }

    setIsLoading(true);
    setLoadingText(mode === 'login' ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...');

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Fetch profile
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            if (onAuthSuccess) onAuthSuccess({ ...profileData, id: firebaseUser.uid });
          }, 1200);
        } else {
          // Fallback if doc doesn't exist
          const profile: UserProfile = {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || email.split('@')[0].toUpperCase(),
            email: email,
            phone: '0555 000 00 00',
            role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
            membershipType: 'free',
            createdAt: Date.now()
          };
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            if (onAuthSuccess) onAuthSuccess(profile);
          }, 1200);
        }
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
        
        // Save profile to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
        
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          if (onAuthSuccess) onAuthSuccess(newProfile);
        }, 1200);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'E-posta adresi veya şifre hatalı.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Bu e-posta adresi zaten kullanımda.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Şifre çok zayıf.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Geçersiz e-posta adresi.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Background overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-white rounded-3xl p-6 w-full max-w-[420px] relative shadow-2xl overflow-hidden"
      >
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1 rounded-full hover:bg-gray-100">
          <X size={18} />
        </button>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                <CheckCircle2 size={56} className="text-[#1a5c3a] mb-3" />
              </motion.div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center justify-center">Başarılı!</h3>
              <p className="text-xs text-gray-500">
                {mode === 'login' ? 'Giriş işleminiz başarıyla tamamlandı. Yönlendiriliyorsunuz...' : 'Hesabınız başarıyla oluşturuldu. Yönlendiriliyorsunuz...'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              
              {/* Animated Tab Switcher */}
              <div className="relative flex p-1 bg-gray-100 rounded-xl mb-4.5 mt-3">
                <button 
                  onClick={() => { setMode('login'); setError(null); }}
                  className="relative z-10 w-1/2 py-2 text-xs font-semibold transition-colors rounded-lg text-center cursor-pointer"
                  style={{ color: mode === 'login' ? '#1a5c3a' : '#6b7280' }}
                >
                  Giriş Yap
                  {mode === 'login' && (
                    <motion.div 
                      layoutId="activeTabBg" 
                      className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10 border border-gray-100" 
                    />
                  )}
                </button>
                <button 
                  onClick={() => { setMode('register'); setError(null); }}
                  className="relative z-10 w-1/2 py-2 text-xs font-semibold transition-colors rounded-lg text-center cursor-pointer"
                  style={{ color: mode === 'register' ? '#1a5c3a' : '#6b7280' }}
                >
                  Kayıt Ol / Üye Ol
                  {mode === 'register' && (
                    <motion.div 
                      layoutId="activeTabBg" 
                      className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10 border border-gray-100" 
                    />
                  )}
                </button>
              </div>

              {/* Title & Description */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {mode === 'login' ? 'Tekrar Hoş Geldiniz' : 'Aramıza Katılın'}
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {mode === 'login' ? 'Bağımsız gayrimenkul değerleme dünyasına adım atın' : 'Raporlarınızı ve mülklerinizi tek panelden yönetin'}
                </p>
              </div>

              {/* Error Box */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs mb-4 flex items-start gap-2 border border-red-100"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Auth Form */}
              <form className="space-y-3" onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field 
                        label="Ad" 
                        icon={<User size={14}/>} 
                        type="text" 
                        placeholder="Örn. Ahmet" 
                        value={firstName}
                        onChange={(e: any) => setFirstName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                      <Field 
                        label="Soyad" 
                        icon={<User size={14}/>} 
                        type="text" 
                        placeholder="Örn. Yılmaz" 
                        value={lastName}
                        onChange={(e: any) => setLastName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Field 
                      label="Telefon Numarası" 
                      icon={<Phone size={14}/>} 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      value={phone}
                      onChange={(e: any) => setPhone(formatPhoneNumber(e.target.value))}
                      disabled={isLoading}
                      required
                    />
                  </>
                )}
                
                <Field 
                  label="E-posta Adresi" 
                  icon={<Mail size={14}/>} 
                  type="email" 
                  placeholder="ornek@mail.com" 
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
                
                {/* Togglable Password Field */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-500 font-medium ml-1">Şifre</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={14} />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Meter */}
                  {mode === 'register' && password && (
                    <div className="space-y-1.5 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
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
                {mode === 'register' && (
                  <div className="flex items-start gap-2.5 mt-2.5 px-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30">
                    <input 
                      id="privacy-checkbox"
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      disabled={isLoading}
                      required
                      className="mt-0.5 rounded text-[#1a5c3a] focus:ring-[#1a5c3a] border-gray-300 cursor-pointer w-3.5 h-3.5"
                    />
                    <label htmlFor="privacy-checkbox" className="text-[10.5px] text-gray-600 leading-snug cursor-pointer select-none">
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
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#1a5c3a] text-white rounded-xl font-medium mt-3.5 hover:bg-[#2d8a58] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{loadingText}</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                  )}
                </button>
              </form>

              {/* Footer text switcher */}
              <div className="mt-4 text-center text-xs text-gray-500">
                {mode === 'login' ? (
                  <>
                    Henüz üye değil misiniz?{' '}
                    <button onClick={() => { setMode('register'); setError(null); }} className="text-[#1a5c3a] font-semibold hover:underline">
                      Hemen ücretsiz kaydolun
                    </button>
                  </>
                ) : (
                  <>
                    Zaten bir hesabınız var mı?{' '}
                    <button onClick={() => { setMode('login'); setError(null); }} className="text-[#1a5c3a] font-semibold hover:underline">
                      Giriş yapın
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
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
              className="bg-white rounded-2xl w-full max-w-[480px] p-5 shadow-2xl relative flex flex-col max-h-[80vh] z-10"
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
                  Bu Gizlilik Politikası, değerbiç platformu ("Platform", "değerbiç", "biz") tarafından sunulan gayrimenkul değerleme analizi ve imar danışmanlığı hizmetlerinin kullanımı kapsamında kullanıcılardan ("siz", "kullanıcı") toplanan kişisel verilerin işlenmesine ilişkin esasları düzenlemektedir. Bu Politika; 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Kişisel Verileri Koruma Kurulu tarafından yayımlanan ikincil düzenlemeler çerçevesinde hazırlanmıştır. Platform'u kullanarak veya hizmetlerimize başvurarak bu Politika'da belirtilen koşulları kabul etmiş sayılırsınız.
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

                <p><strong>3.2 Hizmet Kapsamında İşlenen Taşınmaz Bilgileri</strong><br />Talep edilen değerleme analizi raporuna konu taşınmazla ilgili kullanıcının beyan ettiği bilgiler işlenmektedir. Bu veriler kişisel veri niteliği taşımamakla birlikte kişiyle ilişkilendirilebildiği ölçüde bu Politika kapsamında değerlendirilir:</p>
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
                  <li>Hizmet talebinin alınması ve değerleme raporunun hazırlanması</li>
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
                  <li>Değerleme raporu ve taşınmaz bilgileri: raporun tesliminden itibaren 5 yıl</li>
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
                <p>değerbiç tarafından hazırlanan değerleme analizi raporları ve Platform'da sunulan tüm içerikler; şehir plancıları, mimarlar ve mühendisler tarafından mevcut teknik veriler, emsal araştırmaları ve bölgesel plan kararları esas alınarak hazırlanan uzman görüşü niteliğindedir. Bu raporlar ve içerikler hiçbir koşulda aşağıdaki nitelikleri taşımaz:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Yatırım tavsiyesi veya yatırım danışmanlığı hizmeti</li>
                  <li>Sermaye Piyasası Kurulu (SPK) lisansı gerektiren finansal analiz veya portföy yönetimi hizmeti</li>
                  <li>Resmî ekspertiz ya da yasal bağlayıcılığı olan değerleme raporu</li>
                  <li>Bankacılık veya ipotek süreçlerinde kullanılabilecek biçimsel değerleme belgesi</li>
                </ul>
                <p>Kullanıcı, Platform üzerinden eriştiği analiz, rapor ve bilgileri yalnızca bilgi edinme ve karar destek amacıyla kullanabileceğini; nihai yatırım, alım, satım veya finansman kararından doğan her türlü sonucun münhasıran kendisine ait olduğunu kabul eder. değerbiç; kullanıcının Platform içeriklerine dayanarak verdiği kararlar sonucunda uğrayabileceği doğrudan veya dolaylı zarar, kayıp ya da kâr yoksunluğundan sorumlu tutulamaz.</p>
                
                <p className="text-gray-400 text-[10px] pt-2 border-t border-gray-100 text-center">
                  değerbiç | Gayrimenkul Değerleme Analizi Platformu | degerbic@hotmail.com
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

function Field({ label, icon, ...props }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input 
          {...props}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all disabled:opacity-60" 
        />
      </div>
    </div>
  );
}

import { Home, ClipboardList, Info, LogIn, UserPlus, FileText, LayoutDashboard, Users, LogOut, ChevronLeft, Upload, Camera, Link as LinkIcon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { PropertyType, AppraisalRequest, UserProfile, ReportStatus } from '../types.ts';

// --- Navbar Component ---
interface NavbarProps {
  onNavigate: (page: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export function Navbar({ onNavigate, onOpenAuth, user, onLogout }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleHizmetlerimizClick = () => {
    onNavigate('services');
    setIsMobileMenuOpen(false);
  };

  const handleKurumsalClick = () => {
    onNavigate('about');
    setIsMobileMenuOpen(false);
  };

  const handlePricingClick = () => {
    onNavigate('pricing');
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    onNavigate('home');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="sticky top-0 z-100 shadow-md">
      <nav className="relative bg-[#0e3b23] border-b border-white/10 px-4 md:px-8 flex items-center h-14">
        {/* Architectural Grid Overlay matching hero */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        <div 
          className="relative z-1 text-white text-xl font-medium tracking-tight cursor-pointer mr-auto flex items-center gap-2" 
          onClick={handleLogoClick}
        >
          <img 
            src="/değerbiç.png" 
            alt="değerbiç logo" 
            className="h-[29px] w-auto object-contain select-none" 
            referrerPolicy="no-referrer"
          />
          <span>değer<span className="text-[#f0a500]">biç</span></span>
        </div>
        
        {/* Centered navigation menu items that NEVER shift when login state changes (Desktop-only) */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-8 justify-center min-w-[340px]">
          <button onClick={handlePricingClick} className="text-white/80 hover:text-[#f0a500] text-sm font-semibold tracking-wide transition-colors cursor-pointer select-none">
            Fiyatlandırma
          </button>
          <button onClick={handleHizmetlerimizClick} className="text-white/80 hover:text-[#f0a500] text-sm font-semibold tracking-wide transition-colors cursor-pointer select-none">
            Hizmetlerimiz
          </button>
          <button onClick={handleKurumsalClick} className="text-white/80 hover:text-[#f0a500] text-sm font-semibold tracking-wide transition-colors cursor-pointer select-none">
            Kurumsal
          </button>
        </div>
   
        <div className="relative z-1 flex gap-2 ml-auto items-center">
          {!user ? (
            <button 
              onClick={() => {
                onOpenAuth('login');
                setIsMobileMenuOpen(false);
              }}
              className="px-4 py-1.5 bg-[#f0a500] text-[#1a1a1a] rounded-md text-sm font-bold hover:bg-[#d99400] transition-colors cursor-pointer whitespace-nowrap"
            >
              Giriş Yap
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {user.role === 'admin' ? (
                <button 
                  onClick={() => {
                    onNavigate('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-white/10 text-white rounded-md text-xs sm:text-sm hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap font-semibold border border-white/5"
                >
                  <LayoutDashboard size={14} /> Admin
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onNavigate('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-white/10 text-white rounded-md text-xs sm:text-sm hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap font-semibold border border-white/5"
                >
                  <FileText size={14} /> Profilim
                </button>
              )}
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-white/80 hover:text-[#f0a500] transition-colors cursor-pointer relative z-10 ml-2"
            aria-label="Menü"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#0b301c] border-b border-white/10 overflow-hidden relative z-50 px-5 py-4 space-y-3.5 shadow-xl"
          >
            <button
              onClick={handlePricingClick}
              className="w-full text-left text-white/90 hover:text-[#f0a500] text-sm font-bold tracking-wide py-1.5 transition-colors cursor-pointer block border-b border-white/5"
            >
              Fiyatlandırma
            </button>
            <button
              onClick={handleHizmetlerimizClick}
              className="w-full text-left text-white/90 hover:text-[#f0a500] text-sm font-bold tracking-wide py-1.5 transition-colors cursor-pointer block border-b border-white/5"
            >
              Hizmetlerimiz
            </button>
            <button
              onClick={handleKurumsalClick}
              className="w-full text-left text-white/90 hover:text-[#f0a500] text-sm font-bold tracking-wide py-1.5 transition-colors cursor-pointer block"
            >
              Kurumsal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Hero Component ---
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0e3b23] via-[#11472a] to-[#0a2c1a] py-6 md:py-11 px-6 md:px-8 text-center text-white border-b border-white/5">
      {/* Architectural Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Dynamic Light Flares */}
      <motion.div 
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-12 left-1/3 w-80 h-80 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute -bottom-16 right-1/4 w-96 h-96 bg-[#f0a500]/10 rounded-full blur-[100px] pointer-events-none" 
      />

      <div className="relative z-1 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight max-w-4xl mx-auto mb-0 md:mb-3 tracking-tight text-white drop-shadow-sm"
        >
          BİZ DEĞER BİÇELİM, SİZ DEĞER <span className="bg-gradient-to-r from-[#f0a500] via-[#ffc634] to-[#f0a500] bg-clip-text text-transparent drop-shadow-sm font-black">BİLİN.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6 }}
          className="hidden md:block text-white/90 text-xs md:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed"
        >
          <span className="text-[#ffd254] font-semibold">Şehir Plancıları, Mimarlar ve Mühendisler</span> tarafından hazırlanan bağımsız analiz raporlarıyla doğru karar verin.
        </motion.p>
      </div>
    </section>
  );
}

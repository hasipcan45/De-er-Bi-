import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Map, Store, Camera, Link as LinkIcon, Info, HelpCircle, FileText, User, ChevronRight, X } from 'lucide-react';
import { PropertyType, UserProfile } from '../types.ts';
import addressDataRaw from '../data/il_ilce_mahalle.json';

// Process address data to merge center district variants (e.g. "ADIYAMAN-İL MERKEZİ" and "MERKEZ") 
// into a single "MERKEZ" district with a combined, unique, sorted list of neighborhoods.
const addressData = (() => {
  const raw = addressDataRaw as Record<string, Record<string, string[]>>;
  const processed: Record<string, Record<string, string[]>> = {};

  for (const city of Object.keys(raw)) {
    processed[city] = {};
    const districts = raw[city];
    const originalKeys = Object.keys(districts);
    
    const keysToMerge: string[] = [];
    for (const dist of originalKeys) {
      const distUpper = dist.toUpperCase();
      const isCityCenterKey = distUpper === 'MERKEZ' || 
                              distUpper.includes('İL MERKEZİ') || 
                              distUpper.includes('İL-MERKEZİ') || 
                              distUpper.includes('IL MERKEZI') || 
                              distUpper.includes('IL-MERKEZI') || 
                              distUpper.includes('İL MERKEZ') || 
                              distUpper.includes('İL-MERKEZ');
      if (isCityCenterKey) {
        keysToMerge.push(dist);
      }
    }

    if (keysToMerge.length > 0) {
      const mergedMahalles = new Set<string>();
      for (const key of keysToMerge) {
        for (const mah of districts[key]) {
          mergedMahalles.add(mah);
        }
      }
      
      // Store under "MERKEZ" as the single merged district key
      processed[city]['MERKEZ'] = Array.from(mergedMahalles).sort();
      
      // Copy other districts
      for (const dist of originalKeys) {
        if (!keysToMerge.includes(dist)) {
          processed[city][dist] = districts[dist];
        }
      }
    } else {
      // Copy normally
      for (const dist of originalKeys) {
        processed[city][dist] = districts[dist];
      }
    }
  }

  return processed;
})();

interface PropertyFormProps {
  onSubmit: (data: any) => void;
  isLoggedIn: boolean;
  onNavigateAuth: () => void;
  user?: UserProfile | null;
}

export function PropertyForm({ onSubmit, isLoggedIn, onNavigateAuth, user }: PropertyFormProps) {
  const [type, setType] = useState<PropertyType>('konut');
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    city: '',
    district: '',
    neighborhood: '',
    address: '',
    transactionType: 'satilik', 
    propertySubType: 'Daire', 
    propertySubTypeOther: '',
    priceType: 'tek' as 'tek' | 'aralik',
    price: '',
    minPrice: '',
    maxPrice: '',
    grossArea: '',
    netArea: '',
    rooms: '',
    age: '',
    floor: '',
    floorOther: '',
    totalFloors: '',
    ada: '',
    parsel: '',
    area: '',
    areaDonum: '',
    zoningStatus: '',
    usageStatus: '',
    quality: '',
    zoning: '',
    usage: '',
    heating: '',
    facade: '',
    titleStatus: '',
    titleStatusOther: '',
    elevator: '',
    parking: '',
    furnished: '',
    notes: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    listingUrl: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: prev.contactName || user.fullName || '',
        contactPhone: prev.contactPhone || user.phone || '',
        contactEmail: prev.contactEmail || user.email || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        contactName: '',
        contactPhone: '',
        contactEmail: ''
      }));
    }
  }, [user]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
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

  const formatPrice = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('tr-TR');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'contactPhone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else if (name === 'price' || name === 'minPrice' || name === 'maxPrice') {
      setFormData(prev => ({ ...prev, [name]: formatPrice(value) }));
    } else if (name === 'notes') {
      setFormData(prev => ({ ...prev, [name]: value.slice(0, 300) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeChange = (newType: PropertyType) => {
    setType(newType);
    setImages([]); // Clear images when switching types
    const defaultSub = newType === 'konut' 
      ? 'Daire' 
      : newType === 'arsa' 
        ? 'Arsa' 
        : 'İş Yeri';
    
    setFormData(prev => ({
      ...prev,
      propertySubType: defaultSub,
      propertySubTypeOther: '',
      price: '',
      minPrice: '',
      maxPrice: '',
      grossArea: '',
      netArea: '',
      area: '',
      areaDonum: '',
      zoningStatus: '',
      usageStatus: '',
      quality: '',
      zoning: '',
      usage: '',
      heating: '',
      facade: '',
      titleStatus: '',
      elevator: '',
      parking: '',
      furnished: '',
      notes: ''
    }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Export as JPEG with 0.7 quality to stay well under the 1MB Firestore document limit
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string); // fallback
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const availableSlots = 5 - images.length;
      if (availableSlots <= 0) return;
      
      const filesToProcess = filesArray.slice(0, availableSlots) as File[];
      setIsCompressing(true);
      
      try {
        const compressedImages = await Promise.all(
          filesToProcess.map(file => compressImage(file))
        );
        const validCompressed = compressedImages.filter(img => img !== '');
        setImages(prev => [...prev, ...validCompressed].slice(0, 5));
      } catch (error) {
        console.error("Görsel sıkıştırma hatası:", error);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'konut') {
      const grossNum = parseFloat(formData.grossArea);
      const netNum = parseFloat(formData.netArea);
      if (grossNum < netNum) {
        alert("Brüt alan, net alandan küçük olamaz!");
        return;
      }
    }

    // Submit with clean numeric prices and phones
    const submitData = {
      ...formData,
      price: formData.price.replace(/\D/g, ''),
      minPrice: formData.minPrice.replace(/\D/g, ''),
      maxPrice: formData.maxPrice.replace(/\D/g, ''),
      contactPhone: formData.contactPhone.replace(/\D/g, ''),
      images: images
    };

    onSubmit({ type, ...submitData });
  };

  // Subtype Options Maps
  const subTypesMap: Record<PropertyType, string[]> = {
    konut: ['Daire', 'Müstakil ev', 'Villa', 'Yazlık', 'Residence', 'Diğer'],
    arsa: ['Arsa', 'Tarla', 'Bahçe', 'Orman', 'Zeytinlik', 'Diğer'],
    ticari: [
      'İş Yeri',
      'Akaryakıt İstasyonu',
      'Apartman Dairesi',
      'Atölye',
      'Çiftlik',
      'Depo & Antrepo',
      'Düğün Salonu',
      'Dükkan & Mağaza',
      'Fabrika & Üretim Tesisi',
      'Garaj & Park Yeri',
      'Hamam, Sauna & Spa',
      'İmalathane',
      'İş Hanı Katı & Ofisi',
      'Kafe & Bar',
      'Komple Bina',
      'Maden Ocağı',
      'Ofis & Büro',
      'Okul',
      'Otopark',
      'Oto Yıkama & Kuaför',
      'Pazar Yeri',
      'Piknik & Kahvaltı Bahçesi',
      'Plaza',
      'Plaza Katı & Ofisi',
      'Rezidans Katı & Ofisi',
      'Spor Tesisi',
      'Toplantı & Etkinlik Salonu',
      'Villa',
      'Diğer'
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="valuation-form-container">
      {/* Category Selection Tabs */}
      <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 mb-6 md:mb-10" id="type-tabs-container">
        {(['konut', 'arsa', 'ticari'] as PropertyType[]).map((t) => (
          <button
            key={t}
            id={`tab-btn-${t}`}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`
              flex items-center justify-center gap-1.5 md:gap-3 px-3 md:px-8 py-2 md:py-4 rounded-lg md:rounded-xl border-2 transition-all cursor-pointer font-bold text-xs md:text-base grow md:grow-0 min-w-[90px] md:min-w-[140px]
              ${type === t 
                ? 'bg-[#1a5c3a] text-white border-[#1a5c3a] shadow-lg shadow-[#1a5c3a]/15 scale-[1.02]' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#2d8a58] hover:text-[#1a5c3a]'}
            `}
          >
            {t === 'konut' && <Building className="w-4 h-4 md:w-5 md:h-5" id="icon-konut" />}
            {t === 'arsa' && <Map className="w-4 h-4 md:w-5 md:h-5" id="icon-arsa" />}
            {t === 'ticari' && <Store className="w-4 h-4 md:w-5 md:h-5" id="icon-ticari" />}
            <span>{t === 'konut' ? 'Konut' : t === 'arsa' ? 'Arsa / Arazi' : 'Ticari'}</span>
          </button>
        ))}
      </div>

      <motion.div 
        layout
        className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm"
        id="main-form-card"
      >
        <form onSubmit={handleSubmit} className="space-y-6" id="calculator-form">
          
          {/* SECTION 1: TEMEL BİLGİLER */}
          <div id="section-basic-info">
            <div className="text-xs font-bold text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-100">
              GENEL BİLGİLER
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* İlan Türü Select */}
              <div className="flex flex-col gap-1" id="field-transaction-type">
                <label className="text-xs text-gray-500 font-medium ml-1">İlan Türü <span className="text-red-500">*</span></label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  required
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all cursor-pointer"
                >
                  <option value="satilik">Satılık</option>
                  <option value="kiralik">Kiralık</option>
                  <option value="devren_satilik">Devren Satılık</option>
                  <option value="devren_kiralik">Devren Kiralık</option>
                </select>
              </div>

              {/* Alt Gayrimenkul Türü */}
              <div className="flex flex-col gap-1" id="field-sub-property-type">
                <label className="text-xs text-gray-500 font-medium ml-1">
                  {type === 'konut' ? 'Konut Türü' : type === 'arsa' ? 'Arsa/Arazi Türü' : 'Ticari Türü'} <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertySubType"
                  value={formData.propertySubType}
                  required
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all cursor-pointer"
                >
                  {subTypesMap[type].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                {formData.propertySubType?.trim() === 'Diğer' && (
                  <div className="mt-2" id="property-sub-type-other-container">
                    <Field 
                      id="input-property-sub-type-other"
                      as="textarea"
                      label="Gayrimenkul Türü Açıklaması *" 
                      name="propertySubTypeOther" 
                      placeholder="Gayrimenkul türünü belirtin (örn. Atölye, Depo)..." 
                      value={formData.propertySubTypeOther} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                )}
              </div>

              {/* Fiyat Tipi */}
              <div className="flex flex-col gap-1" id="field-price-type">
                <label className="text-xs text-gray-500 font-medium ml-1">Fiyat Tipi <span className="text-red-500">*</span></label>
                <select
                  name="priceType"
                  value={formData.priceType}
                  required
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all cursor-pointer"
                >
                  <option value="tek">Tek Fiyat</option>
                  <option value="aralik">Fiyat Aralığı</option>
                </select>
              </div>
            </div>

            {/* Fiyat Girişleri */}
            <div className="mt-4" id="price-inputs-container">
              {formData.priceType === 'tek' ? (
                <div className="max-w-md">
                  <Field 
                    id="input-price"
                    label="Fiyat Beklentisi (₺)" 
                    name="price" 
                    type="text" 
                    placeholder="2.500.000" 
                    value={formData.price} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
                  <Field 
                    id="input-min-price"
                    label="Minimum Fiyat Beklentisi (₺)" 
                    name="minPrice" 
                    type="text" 
                    placeholder="2.000.000" 
                    value={formData.minPrice} 
                    onChange={handleChange} 
                    required 
                  />
                  <Field 
                    id="input-max-price"
                    label="Maksimum Fiyat Beklentisi (₺)" 
                    name="maxPrice" 
                    type="text" 
                    placeholder="3.000.000" 
                    value={formData.maxPrice} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              id="dynamic-form-fields"
            >
              
              {/* SECTION 2: KONUM */}
              <div id="section-location">
                <div className="text-xs font-bold text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-100">
                  KONUM BİLGİLERİ
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* İl Select */}
                  <div className="flex flex-col gap-1" id="field-city">
                    <label className="text-xs text-gray-500 font-medium ml-1">İl <span className="text-red-500">*</span></label>
                    <select
                      name="city"
                      value={formData.city}
                      required
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          city: e.target.value,
                          district: '',
                          neighborhood: ''
                        });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all cursor-pointer"
                    >
                      <option value="">İl Seçiniz</option>
                      {Object.keys(addressData).sort((a, b) => a.localeCompare(b, 'tr')).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* İlçe Select */}
                  <div className="flex flex-col gap-1" id="field-district">
                    <label className="text-xs text-gray-500 font-medium ml-1">İlçe <span className="text-red-500">*</span></label>
                    <select
                      name="district"
                      value={formData.district}
                      required
                      disabled={!formData.city}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          district: e.target.value,
                          neighborhood: ''
                        });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">İlçe Seçiniz</option>
                      {formData.city && Object.keys(addressData[formData.city] || {}).sort((a, b) => a.localeCompare(b, 'tr')).map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mahalle Select */}
                  <div className="flex flex-col gap-1" id="field-neighborhood">
                    <label className="text-xs text-gray-500 font-medium ml-1">Mahalle <span className="text-red-500">*</span></label>
                    <select
                      name="neighborhood"
                      value={formData.neighborhood}
                      required
                      disabled={!formData.district}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          neighborhood: e.target.value
                        });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Mahalle Seçiniz</option>
                      {formData.city && formData.district && (addressData[formData.city]?.[formData.district] || [])
                        .map((name) => name.replace(/\s+Mah\.?$/i, ''))
                        .sort((a, b) => a.localeCompare(b, 'tr'))
                        .map((neighborhood, index) => (
                          <option key={`${neighborhood}-${index}`} value={neighborhood}>{neighborhood}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Field 
                    id="input-ada"
                    label={<>Ada <span className="text-gray-400 text-[10px] font-normal">(İsteğe bağlı)</span></>} 
                    name="ada" 
                    placeholder="Ada no" 
                    value={formData.ada} 
                    onChange={handleChange} 
                  />
                  <Field 
                    id="input-parsel"
                    label={<>Parsel <span className="text-gray-400 text-[10px] font-normal">(İsteğe bağlı)</span></>} 
                    name="parsel" 
                    placeholder="Parsel no" 
                    value={formData.parsel} 
                    onChange={handleChange} 
                  />
                  <div className="flex flex-col gap-1" id="field-address">
                    <label className="text-xs text-gray-500 font-medium ml-1">Açık Adres <span className="text-gray-400 text-[10px] font-normal">(İsteğe bağlı)</span></label>
                    <input 
                      type="text"
                      name="address"
                      placeholder="Sokak, kapı no..."
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: TAŞINMAZ GİRİŞLERİ */}
              <div id="section-property-info">
                <div className="text-xs font-bold text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-100">
                  TAŞINMAZ BİLGİLERİ
                </div>
                
                {type === 'konut' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Field id="input-gross-area" label="Brüt Alan (m²)" name="grossArea" type="number" placeholder="120" value={formData.grossArea} onChange={handleChange} required />
                      </div>
                      <div>
                        <Field id="input-net-area" label="Net Alan (m²)" name="netArea" type="number" placeholder="100" value={formData.netArea} onChange={handleChange} required />
                      </div>
                      {formData.grossArea && formData.netArea && parseFloat(formData.grossArea) < parseFloat(formData.netArea) && (
                        <div className="text-red-500 font-medium text-xs col-span-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl" id="area-validation-warning">
                          ⚠️ Brüt m² ({formData.grossArea} m²), Net m² ({formData.netArea} m²) değerinden az olamaz. Lütfen kontrol ediniz.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Oda Sayısı */}
                      <div className="flex flex-col gap-1" id="field-rooms">
                        <label className="text-xs text-gray-500 font-medium ml-1">Oda Sayısı</label>
                        <select 
                          name="rooms" 
                          value={formData.rooms} 
                          onChange={handleChange}
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                        >
                          <option value="">Seçin</option>
                          {['Stüdyo', '1+0', '1+1', '2+1', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2 ve üzeri'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bina Yaşı */}
                      <div className="flex flex-col gap-1" id="field-age">
                        <label className="text-xs text-gray-500 font-medium ml-1">Bina Yaşı</label>
                        <select 
                          name="age" 
                          value={formData.age} 
                          onChange={handleChange}
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                        >
                          <option value="">Seçin</option>
                          {['0 (Sıfır)', '1–5 yıl', '6–10 yıl', '11–15 yıl', '16–20 yıl', '21–30 yıl', '31+ yıl'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bulunduğu Kat */}
                      <div className="flex flex-col gap-1" id="field-floor">
                        <label className="text-xs text-gray-500 font-medium ml-1">Kat</label>
                        <select 
                          name="floor" 
                          value={formData.floor} 
                          onChange={handleChange}
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                        >
                          <option value="">Seçin</option>
                          {[...['Bodrum kat', 'Zemin kat', 'Bahçe katı', '1. kat', '2. kat', '3. kat', '4. kat', '5. kat', '6. kat', '7. kat ve üzeri', 'Çatı katı / Penthouse'], 'Diğer'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <AnimatePresence>
                          {formData.floor === 'Diğer' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2"
                            >
                              <Field 
                                id="input-floor-other"
                                label="Kat Detayı *"
                                name="floorOther"
                                placeholder="Kat bilgisini belirtin..."
                                value={formData.floorOther}
                                onChange={handleChange}
                                required
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}

                {type === 'arsa' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field id="input-area" label="Yüzölçümü (m²)" name="area" type="number" placeholder="1200" value={formData.area} onChange={handleChange} required />
                    <Field id="input-area-donum" label={<>Yüzölçümü (dönüm) <span className="text-gray-400 text-[10px] font-normal">(İsteğe bağlı)</span></>} name="areaDonum" type="number" step="any" placeholder="1.2" value={formData.areaDonum} onChange={handleChange} />
                  </div>
                )}

                {type === 'ticari' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field id="input-com-area" label="Alan (m²)" name="area" type="number" placeholder="250" value={formData.area} onChange={handleChange} required />
                    <div className="flex flex-col gap-1" id="field-floor-com">
                      <label className="text-xs text-gray-500 font-medium ml-1">Kat</label>
                      <select 
                        name="floor" 
                        value={formData.floor} 
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Bodrum kat', 'Zemin kat / Düz Giriş', 'Bahçe katı', 'Giriş katı', 'Yüksek giriş', '1. kat', '2. kat', '3. kat', '4. kat', '5. kat', '6. kat', '7. kat ve üzeri', 'Çatı katı', 'Komple Bina', 'Diğer'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <AnimatePresence>
                        {formData.floor === 'Diğer' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <Field 
                              id="input-floor-other"
                              label="Kat Detayı *"
                              name="floorOther"
                              placeholder="Kat bilgisini belirtin..."
                              value={formData.floorOther}
                              onChange={handleChange}
                              required
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: ÖZELLİKLER (Perfect Grid Symmetry with dropdowns) */}
              <div id="section-features">
                <div className="text-xs font-bold text-gray-400 tracking-widest mb-4 pb-2 border-b border-gray-100">
                  ÖZELLİKLER
                </div>

                {type === 'konut' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="features-konut-grid">
                    {/* Isıtma */}
                    <div className="flex flex-col gap-1" id="field-heating">
                      <label className="text-xs text-gray-500 font-medium ml-1">Isıtma</label>
                      <select 
                        name="heating" 
                        value={formData.heating} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Doğalgaz (kombi)', 'Merkezi sistem', 'Merkezi (pay ölçer)', 'Yerden ısıtma', 'Klima', 'Soba', 'Isıtma yok'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Cephe */}
                    <div className="flex flex-col gap-1" id="field-facade">
                      <label className="text-xs text-gray-500 font-medium ml-1">Cephe</label>
                      <select 
                        name="facade" 
                        value={formData.facade} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Kuzey', 'Güney', 'Doğu', 'Batı', 'Kuzey-Güney', 'Doğu-Batı', 'Dört Cephe'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tapu Durumu */}
                    <div className="flex flex-col gap-1" id="field-title-status">
                      <label className="text-xs text-gray-500 font-medium ml-1">Tapu Durumu</label>
                      <select 
                        name="titleStatus" 
                        value={formData.titleStatus} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Kat mülkiyeti', 'Kat irtifakı', 'Hisseli tapu', 'Arsa tapulu', 'Müstakil tapu'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Kullanım Durumu (Housing) */}
                    <div className="flex flex-col gap-1" id="field-usage-housing">
                      <label className="text-xs text-gray-500 font-medium ml-1">Kullanım Durumu</label>
                      <select 
                        name="usage" 
                        value={formData.usage} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Boş', 'Kiracılı', 'Sahibi oturuyor'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Asansör (Dropdown) */}
                    <div className="flex flex-col gap-1" id="field-elevator">
                      <label className="text-xs text-gray-500 font-medium ml-1">Asansör</label>
                      <select 
                        name="elevator" 
                        value={formData.elevator} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        <option value="Var">Var</option>
                        <option value="Yok">Yok</option>
                      </select>
                    </div>

                    {/* Otopark (Dropdown) */}
                    <div className="flex flex-col gap-1" id="field-parking">
                      <label className="text-xs text-gray-500 font-medium ml-1">Otopark</label>
                      <select 
                        name="parking" 
                        value={formData.parking} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        <option value="Yok">Yok</option>
                        <option value="Var – Açık">Var – Açık</option>
                        <option value="Var – Kapalı">Var – Kapalı</option>
                      </select>
                    </div>

                    {/* Eşya Durumu (Dropdown) */}
                    <div className="flex flex-col gap-1" id="field-furnished">
                      <label className="text-xs text-gray-500 font-medium ml-1">Eşya Durumu</label>
                      <select 
                        name="furnished" 
                        value={formData.furnished} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        <option value="Eşyasız">Eşyasız</option>
                        <option value="Eşyalı">Eşyalı</option>
                        <option value="Kısmen eşyalı">Kısmen Eşyalı</option>
                      </select>
                    </div>
                  </div>
                ) : type === 'arsa' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="features-arsa-grid">
                      {/* İmar Durumu */}
                      <div className="flex flex-col gap-1" id="field-zoning-status">
                        <label className="text-xs text-gray-500 font-medium ml-1">İmar Durumu</label>
                        <select 
                          name="zoningStatus" 
                          value={formData.zoningStatus} 
                          onChange={(e) => {
                            handleChange(e);
                            if (e.target.value !== 'Var') {
                              setFormData(prev => ({ ...prev, zoning: '' }));
                            }
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                          required
                        >
                          <option value="">Seçin</option>
                          {['Var', 'Yok', 'Bilmiyorum'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        <AnimatePresence initial={false}>
                          {formData.zoningStatus === 'Var' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2"
                              key="zoning-detail"
                            >
                              <div className="bg-emerald-50/40 p-3 border border-emerald-100/60 rounded-xl">
                                <Field 
                                  id="input-zoning-detail"
                                  as="textarea"
                                  label="İmar Detayı / Açıklaması *"
                                  name="zoning"
                                  placeholder="İmar özelliğini kısaca belirtin (örn. Konut, 2 Kat, Emsal: 1.20)..."
                                  value={formData.zoning}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Tapu Durumu */}
                      <div className="flex flex-col gap-1" id="field-title-status-arsa">
                        <label className="text-xs text-gray-500 font-medium ml-1">Tapu Durumu</label>
                        <select 
                          name="titleStatus" 
                          value={formData.titleStatus} 
                          onChange={handleChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                          required
                        >
                          <option value="">Seçin</option>
                          {['Müstakil tapu', 'Hisseli tapu', 'Tahsisli', 'Bilinmiyor'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Kullanım Durumu */}
                      <div className="flex flex-col gap-1" id="field-usage-status-arsa">
                        <label className="text-xs text-gray-500 font-medium ml-1">Kullanım Durumu</label>
                        <select 
                          name="usageStatus" 
                          value={formData.usageStatus} 
                          onChange={(e) => {
                            handleChange(e);
                            if (e.target.value !== 'Ekili / Dikili' && e.target.value !== 'Üzerinde yapı var') {
                              setFormData(prev => ({ ...prev, usage: '' }));
                            }
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                          required
                        >
                          <option value="">Seçin</option>
                          {['Boş', 'Ekili / Dikili', 'Üzerinde yapı var'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        <AnimatePresence initial={false}>
                          {(formData.usageStatus === 'Ekili / Dikili' || formData.usageStatus === 'Üzerinde yapı var') && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2"
                              key="usage-detail"
                            >
                              <div className="bg-emerald-50/40 p-3 border border-emerald-100/60 rounded-xl">
                                <Field 
                                  id="input-usage-detail"
                                  as="textarea"
                                  label={`${formData.usageStatus} Detayı / Açıklaması *`}
                                  name="usage"
                                  placeholder={
                                    formData.usageStatus === 'Ekili / Dikili'
                                      ? "Ürün veya ağaç sayısı vb. belirtin..."
                                      : "Yapı cinsi, ruhsat durumu, kat sayısı vb. belirtin..."
                                  }
                                  value={formData.usage}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="features-ticari-grid">
                    {/* Tapu Durumu */}
                    <div className="flex flex-col gap-1" id="field-title-status-ticari">
                      <label className="text-xs text-gray-500 font-medium ml-1">Tapu Durumu</label>
                      <select 
                        name="titleStatus" 
                        value={formData.titleStatus} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Kat mülkiyeti', 'Kat irtifakı', 'Müstakil tapu', 'Hisseli tapu', 'Bilinmiyor', 'Diğer'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <AnimatePresence>
                        {formData.titleStatus === 'Diğer' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <Field 
                              id="input-title-status-other"
                              label="Tapu Durumu Detayı *"
                              name="titleStatusOther"
                              placeholder="Tapu durumunu belirtin..."
                              value={formData.titleStatusOther}
                              onChange={handleChange}
                              required
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bina Yaşı */}
                    <div className="flex flex-col gap-1" id="field-age-ticari">
                      <label className="text-xs text-gray-500 font-medium ml-1">Bina Yaşı</label>
                      <select 
                        name="age" 
                        value={formData.age} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['0 (Sıfır)', '1–5 yıl', '6–10 yıl', '11–15 yıl', '16–20 yıl', '21–30 yıl', '31+ yıl'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Kullanım Durumu */}
                    <div className="flex flex-col gap-1" id="field-usage-status-ticari">
                      <label className="text-xs text-gray-500 font-medium ml-1">Kullanım Durumu</label>
                      <select 
                        name="usageStatus" 
                        value={formData.usageStatus} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        {['Boş', 'Kiracılı', 'Sahibi kullanıyor'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Asansör */}
                    <div className="flex flex-col gap-1" id="field-elevator-ticari">
                      <label className="text-xs text-gray-500 font-medium ml-1">Asansör</label>
                      <select 
                        name="elevator" 
                        value={formData.elevator} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        <option value="Yok">Yok</option>
                        <option value="Var">Var</option>
                      </select>
                    </div>

                    {/* Otopark */}
                    <div className="flex flex-col gap-1" id="field-parking-ticari">
                      <label className="text-xs text-gray-500 font-medium ml-1">Otopark</label>
                      <select 
                        name="parking" 
                        value={formData.parking} 
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] cursor-pointer"
                      >
                        <option value="">Seçin</option>
                        <option value="Yok">Yok</option>
                        <option value="Var – Açık">Var – Açık</option>
                        <option value="Var – Kapalı">Var – Kapalı</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* SECTION 5: EK BİLGİLER */}
          <div className="pt-4 border-t border-gray-100" id="section-additional-info">
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest mb-4">EK BİLGİLER</h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-medium ml-1">Fotoğraflar (Opsiyonel)</label>
                <div 
                  onClick={isCompressing ? undefined : handleUploadClick}
                  className={`p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center transition-all group ${isCompressing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[#2d8a58] hover:bg-emerald-50/10'}`} 
                  id="photo-upload-zone"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isCompressing}
                  />
                  {isCompressing ? (
                    <div className="flex flex-col items-center justify-center py-2" id="compressing-loader">
                      <div className="w-8 h-8 border-4 border-[#1a5c3a] border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-[#1a5c3a] font-semibold">Görselleriniz akıllıca sıkıştırılıyor...</p>
                      <p className="text-[11px] text-gray-400 mt-1">Lütfen bekleyin, kalite optimize ediliyor.</p>
                    </div>
                  ) : (
                    <>
                      <Camera size={32} className="mx-auto text-gray-400 group-hover:text-[#1a5c3a] mb-2 transition-transform group-hover:scale-105" id="icon-camera" />
                      <p className="text-sm text-gray-600 font-medium group-hover:text-[#1a5c3a] transition-colors">Fotoğraf eklemek için tıklayın</p>
                      <p className="text-[11px] text-gray-400 mt-1">Maksimum 5 adet görsel seçebilirsiniz</p>
                    </>
                  )}
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 animate-fadeIn" id="selected-images-grid">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-105 shadow-sm">
                        <img src={img} alt="Taşınmaz" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-all cursor-pointer hover:scale-110 shadow-sm"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1" id="field-listing-url">
                <label className="text-xs text-gray-500 font-medium ml-1 flex items-center gap-1">
                  <LinkIcon size={12} id="icon-link" /> İlan Linki (Opsiyonel)
                </label>
                <input 
                  type="url" 
                  name="listingUrl"
                  placeholder="https://www.sahibinden.com/ilan/..." 
                  value={formData.listingUrl}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a]" 
                />
              </div>

              <div className="flex flex-col gap-1" id="field-notes">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs text-gray-500 font-medium">Ek Açıklamalar</label>
                  <span className={`text-[10px] font-semibold ${formData.notes.length >= 300 ? 'text-red-500 font-bold animate-pulse' : 'text-gray-400'}`}>
                    {formData.notes.length}/300
                  </span>
                </div>
                <textarea 
                  name="notes"
                  maxLength={300}
                  placeholder="Analizde dikkat edilmesini istediğiniz hususlar (Maksimum 300 karakter)..." 
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#1a5c3a]"
                />
                <span className="text-[10px] text-gray-400 ml-1">Maksimum 300 karakter ile sınırlandırılmıştır.</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: İLETİŞİM */}
          <div className="pt-4 border-t border-gray-100" id="section-contact-info">
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest mb-4">İLETİŞİM</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field id="input-contact-name" label="Ad Soyad" name="contactName" placeholder="Ad Soyad" value={formData.contactName} onChange={handleChange} required />
              <Field id="input-contact-phone" label="Telefon" name="contactPhone" type="tel" placeholder="0555 000 00 00" value={formData.contactPhone} onChange={handleChange} required />
              <Field id="input-contact-email" label="E-posta" name="contactEmail" type="email" placeholder="ornek@mail.com" value={formData.contactEmail} onChange={handleChange} required />
            </div>
          </div>

          <button 
            id="btn-submit-appraisal"
            type="submit"
            className="w-full py-4 bg-[#1a5c3a] text-white rounded-xl font-semibold text-base hover:bg-[#2d8a58] transition-all transform active:scale-[0.98] shadow-lg shadow-[#1a5c3a]/20 cursor-pointer"
          >
            {type === 'konut' 
              ? 'Konut Raporu Talep Et' 
              : type === 'arsa' 
                ? 'Arsa / Arazi Raporu Talep Et' 
                : 'Ticari Raporu Talep Et'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, id, as, ...props }: any) {
  const Component = as === 'textarea' ? 'textarea' : 'input';
  return (
    <div className="flex flex-col gap-1" id={`field-wrap-${props.name}`}>
      <label className="text-xs text-gray-500 font-medium ml-1">{label}</label>
      <Component 
        id={id}
        {...props}
        className={`w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5c3a] transition-all ${as === 'textarea' ? 'min-h-[72px] py-2 resize-y' : ''}`} 
      />
    </div>
  );
}

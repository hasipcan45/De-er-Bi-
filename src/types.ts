export type PropertyType = 'konut' | 'arsa' | 'ticari';

export type ReportStatus = 'new' | 'preparing' | 'done' | 'cancelled';

export interface UserSubscription {
  subscriptionId: string;
  planType: 'monthly' | 'yearly';
  startedAt: number;
  endsAt: number;
  quota: {
    konut: number;
    arsa: number;
    ticari: number;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  membershipType: 'free' | 'monthly' | 'yearly';
  createdAt: number;
  activeSubscription?: UserSubscription;
  // Deprecated fields kept for migration safety
  cancelAtPeriodEnd?: boolean;
  subscriptionExpiresAt?: number;
  extraQuotaKonut?: number;
  extraQuotaArsa?: number;
  extraQuotaTicari?: number;
}

export function getEffectiveMembership(user: UserProfile | null): 'free' | 'monthly' | 'yearly' {
  if (!user) return 'free';
  if (user.cancelAtPeriodEnd && user.subscriptionExpiresAt && Date.now() > user.subscriptionExpiresAt) {
    return 'free';
  }
  const type = user.membershipType as string;
  if (type === 'monthly_pro' || type === 'monthly') return 'monthly';
  if (type === 'yearly_pro' || type === 'yearly') return 'yearly';
  return 'free';
}

export interface AppraisalRequest {
  id: string;
  userId: string | null;
  subscriptionId?: string; // Links report to a specific subscription period
  reportSource?: 'subscription' | 'singlePurchase'; 
  type: PropertyType;
  status: ReportStatus;
  createdAt: number;
  userMembership?: 'guest' | 'free' | 'monthly' | 'yearly';
  data: {
    city: string;
    district: string;
    neighborhood: string;
    address?: string;
    transactionType?: string;
    propertySubType?: string;
    priceType?: 'tek' | 'aralik';
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    heating?: string;
    facade?: string;
    titleStatus?: string;
    elevator?: string;
    parking?: string;
    furnished?: string;
    // For Housing
    grossArea?: number;
    netArea?: number;
    rooms?: string;
    buildingAge?: number;
    age?: string;
    floor?: string | number;
    totalFloors?: number;
    propertySubTypeOther?: string;
    // For Land
    ada?: string;
    parsel?: string;
    area?: number;
    areaDonum?: number;
    quality?: string;
    zoningStatus?: string;
    // For Commercial
    propertyType?: string;
    usageStatus?: string;
  };
  photos?: string[];
  listingUrl?: string;
  notes?: string;
  contact: {
    fullName: string;
    phone: string;
    email: string;
  };
  pdfUrl?: string;
  pdfName?: string;
  paymentStatus?: 'completed' | 'pending' | 'free';
  isPaid?: boolean;
}

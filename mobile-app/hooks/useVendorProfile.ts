import { useState, useEffect } from 'react';
import { ProfileService } from '@/services/profiles';

export interface VendorProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
  phone: string | null;
  business_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_image: string | null;
  bio: string | null;
  date_of_birth: string | null;
  farm_name: string | null;
  farm_location: string | null;
  farm_description: string | null;
  verified: boolean;
  business_hours: BusinessHours | null;
  delivery_zones: string[];
  rating: number;
  total_orders: number;
  total_sales: number;
  favorite_count: number;
  notification_preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  is_active: boolean;
  last_login: string | null;
  social_media: Record<string, string>;
}

export interface BusinessHours {
  monday?: { open: string; close: string; closed: boolean };
  tuesday?: { open: string; close: string; closed: boolean };
  wednesday?: { open: string; close: string; closed: boolean };
  thursday?: { open: string; close: string; closed: boolean };
  friday?: { open: string; close: string; closed: boolean };
  saturday?: { open: string; close: string; closed: boolean };
  sunday?: { open: string; close: string; closed: boolean };
}

export const useVendorProfile = (vendorId: string) => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorId) {
      fetchVendorProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('useVendorProfile: Fetching profile for vendorId:', vendorId);
      
      const data = await ProfileService.getVendorProfile(vendorId);

      if (!data) {
        console.log('useVendorProfile: No vendor profile found for:', vendorId);
        setError('Vendor profile not found');
        setProfile(null);
        return;
      }

      console.log('useVendorProfile: Profile fetched successfully for:', data.full_name);
      setProfile(data as VendorProfile);
    } catch (err: any) {
      console.error('useVendorProfile: Error fetching vendor profile:', err);
      console.error('useVendorProfile: Error details:', {
        message: err.message,
        stack: err.stack,
        vendorId
      });
      setError(err.message || 'Failed to load vendor information');
    } finally {
      setLoading(false);
    }
  };

  const formatBusinessHours = (hours: BusinessHours | null): string => {
    if (!hours) return 'Not specified';

    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ] as const;

    const openDays = days.filter(
      (day) => hours[day] && !hours[day]?.closed
    );

    if (openDays.length === 0) return 'Closed';

    const firstDay = hours[openDays[0]];
    if (!firstDay || !firstDay.open || !firstDay.close) {
      return 'Not specified';
    }

    return `${firstDay.open} - ${firstDay.close}`;
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchVendorProfile,
    formatBusinessHours,
  };
};

export default useVendorProfile;

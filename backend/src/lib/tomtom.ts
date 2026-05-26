import axios from 'axios';
import { TOMTOM_API_KEY } from '../config';

export interface GeocodedAddress {
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  confidence?: number;
}

export const geocodeAddress = async (address: string): Promise<GeocodedAddress | null> => {
  if (!TOMTOM_API_KEY || !address?.trim()) return null;

  try {
    const response = await axios.get(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          limit: 1,
          countrySet: 'IN'
        },
        timeout: 8000
      }
    );

    const result = response.data?.results?.[0];
    if (!result?.position) return null;

    return {
      formattedAddress: result.address?.freeformAddress || result.address?.municipality || address,
      lat: result.position.lat,
      lng: result.position.lon,
      confidence: result.score
    };
  } catch (error: any) {
    console.error('TomTom geocode error:', error?.response?.data || error.message);
    return null;
  }
};

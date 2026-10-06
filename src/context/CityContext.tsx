'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { City } from '@/types/api';
import { api } from '@/lib/api-client';
import { getNeighborhoodsForCity as getNeighborhoodsHelper } from '@/lib/utils';

interface CityContextType {
  currentCity: string;
  setCurrentCity: (city: string) => void;
  cities: City[];
  isLoadingCities: boolean;
  activeCityObj?: City;
  getNeighborhoodsForCity: (cityName?: string) => string[];
}

const DEFAULT_CITIES: City[] = [
  {
    id: '1', name: 'Abeokuta', state: 'Ogun', isActive: true, listingCount: 18,
    neighborhoods: ['Ibara', 'Kuto', 'Oke-Mosan', 'Adigbe', 'Panseke', 'Onikolobo']
  },
  {
    id: '2', name: 'Lagos', state: 'Lagos', isActive: true, listingCount: 8,
    neighborhoods: ['Ikeja', 'Lekki Phase 1', 'Victoria Island', 'Ikoyi', 'Yaba', 'Surulere']
  },
  { id: '3', name: 'Ibadan', state: 'Oyo', isActive: false },
  { id: '4', name: 'Abuja', state: 'FCT', isActive: false },
];

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [currentCity, setCurrentCityState] = useState<string>('Abeokuta');
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('city_discovery_selected_city');
    if (saved) {
      setCurrentCityState(saved);
    }

    async function fetchCities() {
      try {
        const data = await api.getCities();
        if (data && data.length > 0) {
          setCities(data);
        }
      } catch (err) {
        console.warn('Using fallback city list:', err);
      } finally {
        setIsLoadingCities(false);
      }
    }

    fetchCities();
  }, []);

  const setCurrentCity = (city: string) => {
    setCurrentCityState(city);
    localStorage.setItem('city_discovery_selected_city', city);
  };

  const activeCityObj = cities.find((c) => c.name.toLowerCase() === currentCity.toLowerCase());

  const getNeighborhoodsForCity = (cityName?: string) => {
    const targetCity = cityName || currentCity;
    return getNeighborhoodsHelper(targetCity, cities);
  };

  return (
    <CityContext.Provider
      value={{
        currentCity,
        setCurrentCity,
        cities,
        isLoadingCities,
        activeCityObj, getNeighborhoodsForCity,

      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
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

const CITY_STORAGE_KEY = 'city_discovery_selected_city';
const DEFAULT_CITY = 'Abeokuta';
const CITY_CHANGE_EVENT = 'city-discovery:city-change';

/*
 * The saved city lives in localStorage, which the server can't read. Reading it
 * through useSyncExternalStore lets the server and the first browser render both
 * use the default city, then switches to the saved one right after hydration,
 * so React no longer reports a mismatch.
 */
/** Fallback when localStorage is blocked (private mode, disabled storage). */
let memoryCity: string | null = null;

function readSavedCity(): string {
  try {
    return localStorage.getItem(CITY_STORAGE_KEY) || memoryCity || DEFAULT_CITY;
  } catch {
    return memoryCity || DEFAULT_CITY;
  }
}

function subscribeToCity(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CITY_STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage); // other tabs
  window.addEventListener(CITY_CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CITY_CHANGE_EVENT, onChange);
  };
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const currentCity = useSyncExternalStore(subscribeToCity, readSavedCity, () => DEFAULT_CITY);
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(true);

  useEffect(() => {
    async function fetchCities() {
      try {
        const data = await api.getCities();
        if (data && data.length > 0) {
          setCities(data);
        }
      } catch {
        // Backend API unreachable or offline - seamlessly using default local cities list
      } finally {
        setIsLoadingCities(false);
      }
    }

    fetchCities();
  }, []);

  const setCurrentCity = (city: string) => {
    memoryCity = city;
    try {
      localStorage.setItem(CITY_STORAGE_KEY, city);
    } catch {
      // ignore storage access errors
    }
    window.dispatchEvent(new Event(CITY_CHANGE_EVENT));
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
        activeCityObj,
        getNeighborhoodsForCity,
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

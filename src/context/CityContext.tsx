'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { City } from '@/types/api';
import { api } from '@/lib/api-client';
import { getNeighborhoodsForCity as getNeighborhoodsHelper } from '@/lib/utils';
import { CITY_STORAGE_KEY, DEFAULT_CITY, writeCityCookie } from '@/lib/city';

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

const CITY_CHANGE_EVENT = 'city-discovery:city-change';

/*
 * The saved city lives in localStorage and is mirrored into a cookie. The root
 * layout reads the cookie and passes it in as `initialCity`, which
 * useSyncExternalStore uses for the server render and hydration; afterwards
 * the browser's own copy takes over. Server and browser therefore agree, and
 * the server can render that city's data.
 */
/** Fallback when localStorage is blocked (private mode, disabled storage). */
let memoryCity: string | null = null;

function readSavedCity(fallback: string): string {
  try {
    return localStorage.getItem(CITY_STORAGE_KEY) || memoryCity || fallback;
  } catch {
    return memoryCity || fallback;
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

export function CityProvider({
  children,
  initialCity = DEFAULT_CITY,
}: {
  children: React.ReactNode;
  /** The city from the request cookie, so the server render matches the browser. */
  initialCity?: string;
}) {
  const currentCity = useSyncExternalStore(
    subscribeToCity,
    () => readSavedCity(initialCity),
    () => initialCity
  );

  // Visitors who chose a city before the cookie existed: copy it over once.
  useEffect(() => {
    if (currentCity !== initialCity) writeCityCookie(currentCity);
  }, [currentCity, initialCity]);
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
    writeCityCookie(city);
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

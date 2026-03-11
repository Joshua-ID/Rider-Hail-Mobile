import { create } from 'zustand';
import { Ride, Location, RideEstimate } from '../types';

interface RideState {
  currentRide: Ride | null;
  pickup: Location | null;
  destination: Location | null;
  estimate: RideEstimate | null;
  driverLocation: { latitude: number; longitude: number } | null;
  setPickup: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  setEstimate: (estimate: RideEstimate | null) => void;
  setCurrentRide: (ride: Ride | null) => void;
  updateRideStatus: (status: string) => void;
  setDriverLocation: (location: { latitude: number; longitude: number }) => void;
  clearRide: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  pickup: null,
  destination: null,
  estimate: null,
  driverLocation: null,

  setPickup: (pickup) => set({ pickup }),
  setDestination: (destination) => set({ destination }),
  setEstimate: (estimate) => set({ estimate }),
  setCurrentRide: (ride) => set({ currentRide: ride }),
  updateRideStatus: (status) =>
    set((state) => ({
      currentRide: state.currentRide ? { ...state.currentRide, status: status as any } : null,
    })),
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  clearRide: () => set({ currentRide: null, pickup: null, destination: null, estimate: null, driverLocation: null }),
}));

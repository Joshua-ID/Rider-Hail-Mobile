export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN';
export type RideStatus = 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type PaymentMethod = 'CARD' | 'CASH' | 'WALLET';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  driver?: Driver;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate: string;
  vehicleColor?: string;
  licenseNumber: string;
  status: DriverStatus;
  isOnline: boolean;
  locationLat?: number;
  locationLng?: number;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'avatar'>;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  distance?: number;
  duration?: number;
  fare?: number;
  status: RideStatus;
  requestedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  rider?: Pick<User, 'id' | 'name' | 'phone' | 'avatar'>;
  driver?: Driver;
  payment?: Payment;
  rating?: Rating;
}

export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  rideId: string;
  rating: number;
  comment?: string;
}

export interface RideEstimate {
  distance: number;
  duration: number;
  fare: number;
  currency: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location extends Coordinates {
  address?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  RiderHome: undefined;
  DriverHome: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RiderStackParamList = {
  Home: undefined;
  SearchDestination: undefined;
  RideEstimate: { pickup: Location; destination: Location };
  TrackRide: { rideId: string };
  RideHistory: undefined;
  RideDetail: { rideId: string };
  Payment: { rideId: string };
  Profile: undefined;
};

export type DriverStackParamList = {
  Home: undefined;
  RideRequest: { ride: Ride };
  Navigation: { rideId: string };
  RideSummary: { rideId: string };
  Earnings: undefined;
  RideHistory: undefined;
  Profile: undefined;
};

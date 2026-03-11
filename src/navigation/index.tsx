import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RiderHomeScreen from '../screens/rider/HomeScreen';
import SearchDestinationScreen from '../screens/rider/SearchDestinationScreen';
import RideEstimateScreen from '../screens/rider/RideEstimateScreen';
import TrackRideScreen from '../screens/rider/TrackRideScreen';
import RiderRideHistoryScreen from '../screens/rider/RideHistoryScreen';
import PaymentScreen from '../screens/rider/PaymentScreen';
import DriverHomeScreen from '../screens/driver/HomeScreen';
import DriverNavigationScreen from '../screens/driver/NavigationScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';
import DriverRideHistoryScreen from '../screens/driver/RideHistoryScreen';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const RiderStack = createNativeStackNavigator();
const DriverStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function RiderNavigator() {
  return (
    <RiderStack.Navigator screenOptions={{ headerShown: false }}>
      <RiderStack.Screen name="Home" component={RiderHomeScreen} />
      <RiderStack.Screen name="SearchDestination" component={SearchDestinationScreen} />
      <RiderStack.Screen name="RideEstimate" component={RideEstimateScreen} />
      <RiderStack.Screen name="TrackRide" component={TrackRideScreen} />
      <RiderStack.Screen name="Payment" component={PaymentScreen} />
      <RiderStack.Screen name="RideHistory" component={RiderRideHistoryScreen} options={{ headerShown: true, title: 'Ride History' }} />
    </RiderStack.Navigator>
  );
}

function DriverNavigator() {
  return (
    <DriverStack.Navigator screenOptions={{ headerShown: false }}>
      <DriverStack.Screen name="Home" component={DriverHomeScreen} />
      <DriverStack.Screen name="Navigation" component={DriverNavigationScreen} />
      <DriverStack.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: true, title: 'Earnings' }} />
      <DriverStack.Screen name="RideHistory" component={DriverRideHistoryScreen} options={{ headerShown: true, title: 'Ride History' }} />
    </DriverStack.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A1A2E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'DRIVER' ? (
          <Stack.Screen name="DriverHome" component={DriverNavigator} />
        ) : (
          <Stack.Screen name="RiderHome" component={RiderNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

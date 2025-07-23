import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface GeofenceRegion {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

class LocationServiceClass {
  private isTracking = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private currentLocation: LocationCoordinates | null = null;
  
  // The Healing Temple coordinates (from CLAUDE.md)
  private readonly TEMPLE_LOCATION: GeofenceRegion = {
    latitude: 37.7749, // From environment config
    longitude: -122.4194, // From environment config  
    radius: 100, // 100 meter radius
  };

  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      // Request background permissions for geofencing (if needed)
      if (Platform.OS === 'ios') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.log('Background location permission denied');
          // Continue without background permissions
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      this.currentLocation = coordinates;
      return coordinates;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startLocationTracking(): Promise<boolean> {
    try {
      if (this.isTracking) return true;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update if moved 10 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };
          
          // Check if user is near The Healing Temple
          this.checkGeofence(this.currentLocation);
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
  }

  private checkGeofence(location: LocationCoordinates): void {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      this.TEMPLE_LOCATION.latitude,
      this.TEMPLE_LOCATION.longitude
    );

    if (distance <= this.TEMPLE_LOCATION.radius) {
      // User is within The Healing Temple geofence
      this.onEnterGeofence();
    }
  }

  private onEnterGeofence(): void {
    console.log('User entered The Healing Temple geofence');
    // TODO: Trigger automatic check-in or notification
    // This could dispatch a Redux action or call the CheckinService
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  isNearTemple(threshold: number = 100): boolean {
    if (!this.currentLocation) return false;
    
    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      this.TEMPLE_LOCATION.latitude,
      this.TEMPLE_LOCATION.longitude
    );

    return distance <= threshold;
  }

  getCurrentLocationSync(): LocationCoordinates | null {
    return this.currentLocation;
  }

  getTempleLocation(): GeofenceRegion {
    return this.TEMPLE_LOCATION;
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }
}

export const LocationService = new LocationServiceClass();
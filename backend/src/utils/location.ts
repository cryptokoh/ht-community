export interface Location {
  latitude: number;
  longitude: number;
}

export const STORE_LOCATION: Location = {
  latitude: parseFloat(process.env.TEMPLE_LATITUDE || '37.7749'),
  longitude: parseFloat(process.env.TEMPLE_LONGITUDE || '-122.4194'),
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param point1 First location
 * @param point2 Second location
 * @returns Distance in meters
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is within a geofence radius
 * @param userLocation User's current location
 * @param centerLocation Center of the geofence
 * @param radiusMeters Radius in meters
 * @returns True if within geofence
 */
export function isWithinGeofence(
  userLocation: Location,
  centerLocation: Location,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLocation, centerLocation);
  return distance <= radiusMeters;
}

/**
 * Validate location coordinates
 * @param location Location to validate
 * @returns True if coordinates are valid
 */
export function isValidLocation(location: Location): boolean {
  return (
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

/**
 * Get geofence zones for The Healing Temple
 */
export const GEOFENCE_ZONES = {
  STORE_INTERIOR: {
    center: STORE_LOCATION,
    radius: 25, // 25 meters - inside store
    name: 'Store Interior',
  },
  STORE_AREA: {
    center: STORE_LOCATION,
    radius: 50, // 50 meters - immediate store area
    name: 'Store Area',
  },
  PARKING_AREA: {
    center: STORE_LOCATION,
    radius: 100, // 100 meters - parking and approach
    name: 'Parking Area',
  },
  NOTIFICATION_ZONE: {
    center: STORE_LOCATION,
    radius: 150, // 150 meters - notification trigger zone
    name: 'Notification Zone',
  },
} as const;

/**
 * Determine which geofence zone a user is in
 * @param userLocation User's location
 * @returns Zone name or null if outside all zones
 */
export function getUserZone(userLocation: Location): string | null {
  for (const [zoneKey, zone] of Object.entries(GEOFENCE_ZONES)) {
    if (isWithinGeofence(userLocation, zone.center, zone.radius)) {
      // Return the most specific zone (smallest radius first)
      return zone.name;
    }
  }
  return null;
}

/**
 * Check if user should receive arrival notification
 * @param userLocation User's location
 * @returns True if should show notification
 */
export function shouldShowArrivalNotification(userLocation: Location): boolean {
  return isWithinGeofence(
    userLocation,
    GEOFENCE_ZONES.NOTIFICATION_ZONE.center,
    GEOFENCE_ZONES.NOTIFICATION_ZONE.radius
  );
}

/**
 * Check if user is eligible for automatic check-in
 * @param userLocation User's location
 * @returns True if can auto check-in
 */
export function canAutoCheckIn(userLocation: Location): boolean {
  return isWithinGeofence(
    userLocation,
    GEOFENCE_ZONES.STORE_AREA.center,
    GEOFENCE_ZONES.STORE_AREA.radius
  );
}
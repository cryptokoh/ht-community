# Authentication & Check-in System

## User Authentication Flow

### Registration
- Email/phone verification
- Profile setup (name, photo, preferences)
- Member tier assignment (basic, premium, VIP)
- QR code generation for check-ins

### Login Methods
- Email/password
- Social login (Google, Apple)
- Biometric authentication (fingerprint, face ID)

## Check-in System

### Location-Based Check-in
- Geofence radius around The Healing Temple
- GPS coordinates verification
- Bluetooth beacon detection (optional)

### QR Code System
- Unique QR codes per member
- Dynamic codes that refresh every 24 hours
- Staff scanning capability for verification

### Check-in Process
1. App detects location or user scans QR
2. Verification against member status
3. Check-in recorded with timestamp
4. Welcome message and daily updates shown
5. Store credit balance displayed

### Check-in Analytics
- Visit frequency tracking
- Time spent in location
- Popular visit times
- Member engagement metrics

## Security Features
- JWT token authentication
- Role-based access control (member, staff, admin)
- Session management with auto-logout
- Secure API endpoints with rate limiting
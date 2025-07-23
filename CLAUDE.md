# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Healing Temple Community App is a React Native Expo app with a Node.js/TypeScript backend. It features member check-ins via QR codes/geofencing, AI-powered store credit submissions, and real-time community features with messaging.

## Development Commands

### Frontend (React Native/Expo)
```bash
# Development
npm start                    # Start Expo dev server with QR code
npm run android              # Launch Android emulator
npm run ios                  # Launch iOS simulator
npm run web                  # Launch web version

# Quality Control
npm test                     # Run Jest tests
npm run test:watch           # Run tests in watch mode
npm run lint                 # Run ESLint
npm run lint:fix             # Auto-fix linting issues
npm run format               # Format with Prettier
npm run type-check           # TypeScript type checking
```

### Backend API
```bash
# Development (from backend/ directory)
npm run dev                  # Start with nodemon hot-reload
npm run build                # Compile TypeScript to dist/
npm start                    # Run compiled JavaScript

# Database Operations
npm run db:generate          # Generate Prisma client
npm run db:migrate           # Apply database migrations  
npm run db:deploy            # Deploy migrations (production)
npm run db:seed              # Seed database with test data
npm run db:studio            # Open Prisma Studio GUI

# Testing & Quality
npm test                     # Run Jest tests
npm run test:watch           # Watch mode testing
npm run test:coverage        # Generate coverage report
npm run lint                 # ESLint TypeScript files
npm run lint:fix             # Auto-fix TypeScript linting
npm run format               # Format TypeScript with Prettier
npm run type-check           # TypeScript compilation check
```

### Full Stack Development
```bash
# Install all dependencies
npm install                  # Installs both root and backend deps

# Database setup
docker-compose up postgres redis -d  # Start database services
cd backend && npm run db:migrate && npm run db:generate && cd ..

# Concurrent development
npm run backend:dev &        # Start backend API
npm start                    # Start mobile app (separate terminal)
```

### Docker Development
```bash
docker-compose up postgres redis -d     # Development databases only
docker-compose --profile production up -d  # Full production stack
```

## Architecture Overview

### Mobile App Structure (React Native + Expo)
- **Redux Store**: Centralized state management with slices for auth, user data
- **Navigation**: React Navigation with Stack + Bottom Tab navigators  
- **Services Layer**: API communication, location tracking, notifications, socket connections
- **Screens**: Organized by feature (auth/, checkin/, credits/, community/, profile/)
- **Core Features**: QR code scanning, geofencing, voice credit submissions, real-time messaging

### Backend API Structure (Node.js + TypeScript)
- **Express Server**: RESTful API with Socket.io for real-time features
- **Prisma ORM**: PostgreSQL database with comprehensive schema for users, posts, messages, credits
- **Authentication**: JWT-based with refresh tokens and role-based access
- **AI Integration**: OpenAI GPT-4 for natural language credit claim processing
- **External Services**: Redis caching, AWS S3 storage, Twilio SMS, email notifications

### Database Schema (PostgreSQL)
Key entities and relationships:
- **Users**: Authentication, profiles, member tiers (BASIC/PREMIUM/VIP), roles (MEMBER/STAFF/ADMIN)
- **Check-ins**: Location-based with multiple methods (QR_CODE, GEOFENCE, MANUAL)
- **Community**: Posts with approval workflow, reactions, threaded comments
- **Messaging**: Direct and group conversations with read status tracking
- **Store Credits**: AI-processed submissions with confidence scoring and approval workflow
- **Activity Logging**: Comprehensive audit trail for all user actions

## AI-Powered Features

### Store Credit System Architecture
The app's core innovation is AI-powered store credit claim processing:

1. **Natural Language Input**: Users describe their sales assistance ("helped sell yoga mat to Sarah")
2. **AI Processing**: Backend uses OpenAI GPT-4 to parse claims and ask follow-up questions  
3. **Smart Verification**: System matches timestamps, confidence scoring, and validation rules
4. **Automated Approval**: High-confidence submissions auto-approved, others flagged for review

Key files:
- `backend/src/services/aiService.ts` - OpenAI integration and prompt engineering
- `src/services/ClaudeCreditService.ts` - Mobile client for credit submissions
- `backend/src/routes/credits.ts` - Credit submission and review API endpoints

### Voice Integration
Multiple voice services for accessibility and user experience:
- Voice credit submissions with speech-to-text processing
- Claude-powered voice interactions for enhanced user experience
- Optimal voice processing services for different use cases

## Environment & Configuration

### Required Environment Variables
Backend requires these environment variables:
```
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
TEMPLE_LATITUDE=37.7749
TEMPLE_LONGITUDE=-122.4194
```

### Development Setup Requirements
- Node.js 18+ and npm
- PostgreSQL 15+ and Redis 7+ (via Docker recommended)
- OpenAI API key for AI features
- Expo CLI for mobile development
- iOS Simulator (macOS) or Android Emulator

## Testing Strategy

### Mobile App Testing
- Jest unit tests for components and services
- Detox E2E tests for user workflows
- React Native Testing Library for component testing

### Backend API Testing
- Jest unit tests for services and utilities
- Supertest integration tests for API endpoints
- Prisma test database for isolated testing

### Key Testing Commands
```bash
# Mobile tests
npm test                     # Run all Jest tests
npm run test:e2e            # Run Detox E2E tests (if configured)

# Backend tests  
cd backend && npm test       # Unit tests
npm run test:coverage       # Coverage report
```

## Deployment & Production

### Production Architecture
- **Mobile**: Expo Application Services (EAS) for app builds and distribution
- **Backend**: AWS ECS with Fargate, RDS PostgreSQL, ElastiCache Redis
- **Load Balancing**: Application Load Balancer with SSL termination
- **Storage**: AWS S3 for media files and static assets
- **Monitoring**: Structured logging with Winston, health check endpoints

### Docker Production Setup
```bash
docker-compose --profile production up -d
```

This includes nginx reverse proxy, SSL support, and production optimizations.

## Key Patterns & Conventions

### Authentication Flow
- JWT access tokens (15 min expiry) + refresh tokens for seamless UX
- Secure token storage using Expo SecureStore
- Automatic token refresh in API service layer
- Role-based access control throughout application

### Real-time Features  
- Socket.io for instant messaging and notifications
- Redux integration for real-time state updates
- Connection management with automatic reconnection
- User presence tracking and typing indicators

### Location Services
- Geofencing for automatic check-ins when entering store area
- Permission handling for iOS/Android location access
- Background location tracking for enhanced user experience
- Privacy-conscious location data handling with user consent

### State Management
- Redux Toolkit for predictable state updates
- Sliced reducers for feature-specific state (auth, user, etc.)
- TypeScript interfaces for type-safe state management
- Async thunks for API operations with loading states

## Performance Considerations

### Mobile Optimizations
- Image optimization and lazy loading for media content
- Efficient list rendering with FlatList for large datasets  
- Memory management for camera/media picker operations
- Background task handling for location and notifications

### Backend Optimizations
- Redis caching for frequently accessed data
- Database query optimization with Prisma query analysis
- Compression middleware for API responses
- Rate limiting to prevent API abuse
- Connection pooling for database efficiency

### Development Performance
- Hot reloading enabled for both React Native and Node.js backend
- TypeScript for compile-time error detection
- ESLint and Prettier for code quality automation
- Prisma Studio for visual database management during development
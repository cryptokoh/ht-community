# The Healing Temple Community App

A comprehensive iOS and Android mobile application for The Healing Temple community, featuring member check-ins, community interaction, and AI-powered store credit tracking.

## 🌟 Features

### Core Functionality
- **Multi-method Check-ins**: QR codes, geofencing, and WiFi detection
- **Community Hub**: Real-time messaging and public feed
- **AI-Powered Credits**: GPT-assisted sales contribution tracking
- **Member Profiles**: Tiered membership system with personalized experiences

### Check-in System
- **Show QR Code**: Members display personal QR code to staff
- **Scan Store QR**: Self-service check-in via store QR codes
- **Geofence Detection**: Automatic check-in when entering store area
- **WiFi Integration**: Smart notifications when connecting to store WiFi

### Store Credit System
- **Natural Language Input**: "I helped sell a yoga mat to Sarah"
- **AI Processing**: GPT-4 analyzes input and asks follow-up questions
- **Smart Verification**: Timestamp matching and confidence scoring
- **Automated Approval**: High-confidence submissions auto-approved

### Community Features
- **Real-time Messaging**: Direct messages and group chats
- **Public Feed**: Community posts with photos and engagement
- **Event Announcements**: Staff can share updates and events
- **Member Recognition**: Highlight community contributions

## 🏗️ Architecture

### Mobile App (React Native)
```
src/
├── screens/           # Screen components
├── components/        # Reusable UI components
├── services/          # API and external service integrations
├── store/            # Redux state management
├── hooks/            # Custom React hooks
└── utils/            # Helper functions
```

### Backend API (Node.js + TypeScript)
```
backend/src/
├── routes/           # API route handlers
├── middleware/       # Authentication, validation, error handling
├── services/         # Business logic and external integrations
├── config/          # Database and service configurations
└── utils/           # Utility functions
```

### Database Schema (PostgreSQL)
- **Users & Authentication**: JWT-based auth with refresh tokens
- **Check-ins**: Location and method tracking
- **Community**: Posts, messages, reactions
- **Store Credits**: AI-processed submissions and approvals

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- OpenAI API key
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) for development builds

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd communityapp
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development environment**
```bash
# Start database and Redis
docker-compose up postgres redis -d

# Install dependencies
npm install
cd backend && npm install && cd ..

# Set up database
cd backend
npx prisma migrate dev
npx prisma generate
npm run db:seed
cd ..

# Start backend
cd backend && npm run dev &

# Start mobile app
npm start
```

### Production Deployment

1. **Using Docker Compose**
```bash
docker-compose --profile production up -d
```

2. **AWS ECS Deployment**
```bash
# Build and push to ECR
docker build -t healing-temple-backend ./backend
docker tag healing-temple-backend:latest <ecr-uri>:latest
docker push <ecr-uri>:latest

# Deploy using ECS
aws ecs update-service --cluster healing-temple --service backend --force-new-deployment
```

## 📱 Mobile App Development

### Running on Device/Simulator

```bash
# Development server (for Expo Go or dev builds)
npm start

# iOS Simulator (requires development build)
npx expo run:ios

# Android Emulator (requires development build)
npx expo run:android

# Physical device with Expo Go
npm start
# Scan QR code with Expo Go app
# Note: Touch events may not work properly with SDK 54 in Expo Go

# Recommended: Use development build
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Building for Production

```bash
# Build APK for Android
expo build:android --type apk

# Build for iOS
expo build:ios --type archive

# Or use EAS Build (recommended)
eas build --platform all
```

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/me` - Get current user

### Check-in Endpoints
- `POST /api/v1/checkins/checkin` - Member check-in
- `GET /api/v1/checkins/history` - Check-in history
- `GET /api/v1/checkins/analytics` - Visit analytics

### Credit System Endpoints
- `POST /api/v1/credits/submit` - Submit credit claim
- `GET /api/v1/credits/balance` - Get credit balance
- `GET /api/v1/credits/submissions` - Credit submission history

### Community Endpoints
- `GET /api/v1/posts` - Get community posts
- `POST /api/v1/posts` - Create new post
- `GET /api/v1/messages` - Get messages
- `POST /api/v1/messages` - Send message

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                  # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Mobile App Tests
```bash
npm test                 # Jest tests
npm run test:e2e        # Detox E2E tests
```

### API Testing
```bash
# Using the provided Postman collection
postman collection run healing-temple-api.postman_collection.json
```

## 🔐 Security

### Authentication
- JWT tokens with short expiration (15 minutes)
- Refresh tokens for seamless experience
- Role-based access control (Member, Staff, Admin)

### Data Protection
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- Rate limiting on all endpoints
- HTTPS enforcement in production

### Privacy
- Encrypted storage for sensitive data
- GDPR-compliant data handling
- User consent for location tracking
- Message encryption for privacy

## 🌍 Deployment Options

### Development
- Local Docker Compose setup
- Hot reloading for both backend and mobile
- PostgreSQL and Redis containers

### Staging
- AWS ECS with Fargate
- RDS PostgreSQL Multi-AZ
- ElastiCache Redis
- S3 for media storage

### Production
- Auto-scaling ECS cluster
- Application Load Balancer with SSL
- CloudFront CDN
- Multi-region deployment options

## 📊 Monitoring & Analytics

### Application Monitoring
- Health check endpoints
- Structured logging with Winston
- Error tracking with Sentry
- Performance monitoring

### Business Analytics
- User engagement metrics
- Check-in patterns and trends
- Credit earning/redemption analysis
- Community activity insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commits for clear history

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Mobile App Guide](docs/mobile-app.md)
- [Deployment Guide](docs/deployment.md)

### Getting Help
- Create an issue for bugs or feature requests
- Contact: [support@healingtemple.com](mailto:support@healingtemple.com)
- Community Discord: [discord.gg/healingtemple](https://discord.gg/healingtemple)

---

Built with ❤️ for The Healing Temple community
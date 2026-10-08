# Architecture Overview

## Project Structure

```
NewTaltour/
├── packages/
│   ├── frontend/          # Next.js 14 application
│   │   ├── src/
│   │   │   ├── app/       # Next.js app directory
│   │   │   ├── components/# React components
│   │   │   ├── pages/     # Page components
│   │   │   ├── lib/       # Utilities and helpers
│   │   │   └── styles/    # Global styles
│   │   └── package.json
│   │
│   ├── backend/           # Express API server
│   │   ├── src/
│   │   │   ├── index.ts   # Entry point
│   │   │   ├── routes/    # API routes
│   │   │   ├── controllers/# Route handlers
│   │   │   ├── services/  # Business logic
│   │   │   ├── models/    # Database models
│   │   │   ├── middleware/# Express middleware
│   │   │   └── utils/     # Helper functions
│   │   └── package.json
│   │
│   ├── database/          # Database schemas
│   │   ├── schema.sql     # Initial schema
│   │   └── migrations/    # Migration files
│   │
│   └── shared/            # Shared types and utilities
│       └── src/
│           ├── types/     # TypeScript types
│           └── utils/     # Shared utilities
│
├── docs/                  # Documentation
├── legal/                 # Legal documents
├── docker-compose.yml     # Local development setup
└── package.json           # Root workspace config
```

## Technology Stack

### Frontend
- **Next.js 14**: React framework with built-in SSR, API routes, and optimization
- **React 18**: Component library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **SWR**: Data fetching with caching

### Backend
- **Node.js**: JavaScript runtime
- **Express 4.x**: Web framework
- **TypeScript**: Type safety
- **PostgreSQL**: Relational database
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing

### Infrastructure
- **Docker**: Containerization for local development
- **Vercel**: Frontend deployment
- **Railway/Render**: Backend deployment
- **Supabase**: Managed PostgreSQL hosting
- **GitHub**: Version control and CI/CD

## Data Flow

```
User Browser
    ↓
Frontend (Next.js)
    ↓ (API calls via axios/SWR)
Backend API (Express)
    ↓ (Prepared statements)
PostgreSQL Database
```

## Security Architecture

### Authentication Flow
1. User logs in with email/password
2. Backend validates credentials against bcrypt hash
3. Backend generates JWT token (expires in 24 hours)
4. Frontend stores JWT in memory (not localStorage for XSS protection)
5. Frontend sends JWT in Authorization header for API calls
6. Backend validates JWT signature on each request

### Authorization
- Role-based access control (RBAC)
- Admin role for management functions
- User role for self-service
- Token validation on every protected endpoint

### Data Protection
- All queries use prepared statements (prevents SQL injection)
- Input validation on frontend and backend
- HTTPS enforced
- CORS properly configured
- Security headers (CSP, X-Frame-Options, etc.)

## Database Schema

### Core Tables
- `contacts`: User accounts
- `vehicules`: Car inventory
- `commandes`: Reservations
- `payment_logs`: Payment history
- `admins`: Administrator accounts
- `audit_log`: Admin activity tracking

### Relationships
```
User (contacts)
  ↓ (has many)
Reservations (commandes)
  ↓ (references)
Vehicles (vehicules)

User (contacts)
  ↓ (has many)
Payments (payment_logs)

Admin (admins)
  ↓ (logs actions to)
Audit Log (audit_log)
```

## Deployment Pipeline

### Development
```
git push → GitHub → (local dev with docker-compose)
```

### Staging
```
git push feat/staging → CI/CD → Deploy to staging environment
```

### Production
```
git push main → CI/CD → Build → Deploy Vercel (frontend) + Railway (backend)
```

## API Architecture

### REST Endpoints
- `GET /api/auth/me` - Current user info
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/vehicles` - List available vehicles
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/:id` - Get reservation details
- `PUT /api/reservations/:id` - Update reservation
- `POST /api/payments` - Process payment
- `GET /api/admin/dashboard` - Admin dashboard data

### Error Handling
- Consistent error response format
- Meaningful error messages
- Proper HTTP status codes
- Error logging on backend

## Performance Considerations

### Frontend
- Image optimization via Next.js
- Code splitting and lazy loading
- Static generation where possible
- Caching with SWR

### Backend
- Database connection pooling
- Query optimization with indexes
- Response caching for public data
- Rate limiting on API endpoints

### Database
- Proper indexes on frequently queried columns
- View for complex queries
- Connection pooling

## Monitoring & Logging

### Frontend
- Error tracking (Sentry recommended)
- Performance monitoring
- User analytics

### Backend
- Application logs
- Database query logs
- Audit trail for admin actions
- Error tracking

## Future Enhancements

1. **Microservices**: Split backend into separate services
2. **Caching Layer**: Redis for performance
3. **Message Queue**: For async operations (email, notifications)
4. **WebSockets**: Real-time availability updates
5. **Mobile App**: React Native for iOS/Android
6. **GraphQL**: Alternative API layer

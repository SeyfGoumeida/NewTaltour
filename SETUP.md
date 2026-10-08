# NewTaltour - Setup & Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Step 1: Clone & Install

```bash
git clone https://github.com/SeyfGoumeida/NewTaltour.git
cd NewTaltour
npm install
```

### Step 2: Environment Setup

Create `.env` files:

**packages/backend/.env**
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit with your settings
```

**packages/frontend/.env.local**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 3: Start Database

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Verify database is ready:
```bash
docker-compose logs postgres
```

### Step 4: Run Development Servers

**Terminal 1 - Frontend:**
```bash
cd packages/frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd packages/backend
npm run dev
# Runs on http://localhost:3001
# API docs: http://localhost:3001/api/health
```

### Step 5: Test the Application

1. Visit http://localhost:3000
2. Try the booking search
3. Register a new account
4. Create a test reservation

---

## 📊 Database

### Initialize Database

The schema loads automatically when PostgreSQL starts (via `docker-entrypoint-initdb.d/`).

To manually run migrations:
```bash
npm run db:migrate
```

### Connect to Database

```bash
psql -h localhost -U taltour_user -d newtaltour_dev
```

Password: `taltour_password_dev`

### View Database Schema

```sql
\dt              -- List tables
\d contacts      -- Describe table
SELECT * FROM contacts;  -- Query data
```

---

## 🔑 API Endpoints

### Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "nom": "Doe",
    "prenom": "John"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'

# Get current user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/me
```

### Vehicles

```bash
# List vehicles
curl http://localhost:3001/api/vehicles

# Search available vehicles
curl "http://localhost:3001/api/vehicles/search?dateDebut=2026-10-15&dateFin=2026-10-20"

# Get vehicle details
curl http://localhost:3001/api/vehicles/1
```

### Reservations

```bash
# Create reservation
curl -X POST http://localhost:3001/api/reservations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicule_id": 1,
    "date_debut": "2026-10-15",
    "date_fin": "2026-10-20",
    "lieu_pickup": "Nice",
    "lieu_return": "Nice",
    "assurance": "gold"
  }'

# Get user reservations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/reservations

# Cancel reservation
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/reservations/1/cancel
```

---

## 🛠️ Development Commands

### Frontend

```bash
cd packages/frontend

npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production build
npm run lint         # Run linter
npm run type-check   # TypeScript check
```

### Backend

```bash
cd packages/backend

npm run dev          # Start with auto-reload
npm run build        # Build TypeScript
npm run start        # Run production build
npm run lint         # Run linter
npm run type-check   # TypeScript check
```

### Database

```bash
npm run db:migrate   # Run migrations
docker-compose up    # Start services
docker-compose down  # Stop services
docker-compose logs  # View logs
```

---

## 🔒 Security Checklist

- ✅ Prepared statements (SQL injection prevention)
- ✅ Password hashing with bcrypt (cost 12)
- ✅ JWT authentication (24h expiration)
- ✅ Input validation (express-validator)
- ✅ CORS configured
- ✅ HTTPS ready (configure in production)
- ✅ Rate limiting (to implement)
- ✅ Audit logging (implemented)

---

## 📝 Project Structure

```
NewTaltour/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/           # Next.js app
│   │   │   ├── components/    # React components
│   │   │   ├── lib/          # Utilities & API client
│   │   │   ├── types/        # TypeScript types
│   │   │   └── styles/       # CSS
│   │   └── package.json
│   │
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts              # Main server
│   │   │   ├── middleware/auth.ts    # JWT handling
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── vehicles.ts
│   │   │   │   └── reservations.ts
│   │   │   └── services/
│   │   │       ├── authService.ts
│   │   │       ├── vehicleService.ts
│   │   │       └── reservationService.ts
│   │   └── package.json
│   │
│   ├── database/
│   │   └── schema.sql         # Database schema
│   │
│   └── shared/               # Shared types
│
├── docs/                      # Documentation
├── legal/                     # Legal pages
├── docker-compose.yml         # Local dev setup
└── README.md
```

---

## 🧪 Testing

### Test User Accounts

Register through the application, or use these after seeding:
- Email: test@example.com
- Password: TestPass123!

### Sample Data

To add sample vehicles:

```sql
INSERT INTO vehicules (marque, modele, annee, carburant, transmission, places, prix_jour, prix_caution, prix_assurance, disponible)
VALUES 
  ('Peugeot', '308', 2023, 'Essence', 'Automatique', 5, 49.99, 300.00, 15.99, true),
  ('Renault', 'Clio', 2022, 'Essence', 'Manuelle', 5, 39.99, 250.00, 12.99, true),
  ('Toyota', 'Corolla', 2023, 'Hybride', 'Automatique', 5, 59.99, 350.00, 18.99, true),
  ('BMW', '3 Series', 2023, 'Diesel', 'Automatique', 5, 79.99, 500.00, 24.99, true);
```

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://api.newtaltour.com

# Deploy with git push
git push origin main
# Automatically deploys to Vercel
```

### Backend (Railway)

```bash
# Create Railway project
# Connect GitHub repo
# Set environment variables
# Deploy
```

### Database (Supabase)

```bash
# Create Supabase project
# Run schema.sql in SQL editor
# Update connection strings
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if Docker is running
docker-compose ps

# Restart containers
docker-compose restart

# View logs
docker-compose logs postgres
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in package.json
```

### TypeScript Errors
```bash
npm run type-check    # Check for errors
npm run build         # Rebuild
```

### Clear Cache
```bash
# Frontend
rm -rf .next node_modules
npm install
npm run dev

# Backend
rm -rf dist node_modules
npm install
npm run dev
```

---

## 📚 Additional Resources

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Security Guidelines](./docs/SECURITY.md)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -am "feat: your feature"`
3. Push to branch: `git push origin feat/your-feature`
4. Create Pull Request

---

**Need help?** Open an issue on GitHub or contact: info@newtaltour.com

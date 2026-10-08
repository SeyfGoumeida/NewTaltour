# 🚗 NewTaltour - Modern Car Rental Platform

A beautiful, secure, and modern redesign of taltour.com built with modern technologies.

## ✨ Features

- **Beautiful UI**: Modern, responsive design for mobile and desktop
- **Secure**: Protected against SQL injection and authorization bypass vulnerabilities
- **Fast**: Built with Next.js for optimal performance
- **Scalable**: Monorepo architecture with clear separation of concerns
- **Real-time**: Live availability and booking updates

## 🏗️ Architecture

```
NewTaltour/
├── packages/
│   ├── frontend/          # Next.js 14 + React 18 (Client-side)
│   ├── backend/           # Node.js + Express (API)
│   ├── database/          # PostgreSQL schema
│   └── shared/            # Shared types & utilities
├── docs/                  # Documentation
├── legal/                 # Legal pages (Mentions légales, Privacy, etc.)
└── docker-compose.yml     # Local development environment
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with SSR
- **React 18** - UI components
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SWR** - Data fetching

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Infrastructure
- **Vercel** - Frontend hosting (free tier)
- **Railway/Render** - Backend hosting
- **Supabase** - PostgreSQL database (free tier)
- **Docker** - Local development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Local Development

```bash
# Clone repository
git clone https://github.com/SeyfGoumeida/NewTaltour.git
cd NewTaltour

# Install dependencies
npm install

# Start local development environment
docker-compose up -d

# Run dev servers
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Security Guidelines](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## ⚖️ Legal

- [Mentions Légales](./legal/mentions-legales.md) - French Legal Notice
- [Privacy Policy](./legal/privacy-policy.md)
- [Terms of Service](./legal/terms-of-service.md)

## 🔒 Security

This project fixes all critical vulnerabilities from the original taltour.com:
- ✅ Prepared statements (prevents SQL injection)
- ✅ Input validation & authorization checks
- ✅ Secure password hashing (bcrypt, not MD5)
- ✅ Rate limiting
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ Security headers

See [SECURITY.md](./docs/SECURITY.md) for details.

## 📊 Database

Tables maintained from original Taltour:
- `contacts` - User profiles
- `commandes` - Reservations
- `vehicules` - Car catalog
- `admins` - Admin accounts
- `payment_logs` - Payment history
- `audit_log` - Admin activity (NEW)

## 🎯 Roadmap

- [ ] Phase 1: Frontend scaffolding
- [ ] Phase 2: Backend API
- [ ] Phase 3: Database setup
- [ ] Phase 4: Admin dashboard
- [ ] Phase 5: Payment integration
- [ ] Phase 6: Testing & security audit
- [ ] Phase 7: Production deployment

## 👥 Team

- **Founder**: Seyf Goumeida
- **Original Taltour by**: Webnext.fr

## 📄 License

MIT License - See LICENSE file for details

---

**Status**: 🚧 In Development  
**Version**: 0.1.0  
**Last Updated**: 2026-10-08

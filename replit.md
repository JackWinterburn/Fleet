# TyreCommand - Fleet Tyre Management Platform

## Overview
TyreCommand is a progressive web application for fleet tyre management. Users can create fleets, add vehicles, track tyres, manage stock, view forecasts/analytics, and receive alerts. Fleets support collaborative access via member invitations with role-based permissions.

## Tech Stack
- Frontend: React + TypeScript, Tailwind CSS, shadcn/ui components, Recharts, wouter routing
- Backend: Express.js, PostgreSQL with Drizzle ORM
- Auth: Replit OIDC authentication (OpenID Connect)
- Styling: IBM Carbon Design System (IBM Plex Sans/Mono fonts), blue-60 primary color

## Architecture
- `shared/schema.ts` - All Drizzle ORM models and Zod schemas
- `shared/models/auth.ts` - Auth-related models (users, sessions)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database storage layer (DatabaseStorage class)
- `server/db.ts` - Database connection pool
- `server/replit_integrations/auth/` - Replit Auth integration
- `client/src/App.tsx` - Main app with routing and sidebar layout
- `client/src/pages/` - All page components
- `client/src/components/` - Shared components (sidebar, theme provider)
- `client/src/hooks/use-auth.ts` - Auth hook

## Data Model
- **Users** (from Replit Auth): id, email, firstName, lastName, profileImageUrl
- **Fleets**: id, name, description, ownerId
- **FleetMembers**: id, fleetId, userId, role (owner/admin/member)
- **Vehicles**: id, fleetId, registration, make, model, year, type, currentMileage, axleCount
- **Tyres**: id, fleetId, vehicleId, brand, model, size, serialNumber, status, position, treadDepth, pressure, mileage, cost
- **StockItems**: id, fleetId, brand, model, size, quantity, minQuantity, unitCost, location
- **Alerts**: id, fleetId, vehicleId, tyreId, type, severity, title, message, isRead

## API Routes (all require auth)
- `GET/POST /api/fleets` - List/create fleets
- `GET/POST/DELETE /api/fleets/:fleetId/vehicles` - Vehicle CRUD
- `GET/POST/DELETE /api/fleets/:fleetId/tyres` - Tyre CRUD
- `GET/POST/DELETE /api/fleets/:fleetId/stock` - Stock CRUD
- `GET/PATCH /api/fleets/:fleetId/alerts` - Alerts management
- `GET/POST/DELETE /api/fleets/:fleetId/members` - Member management
- `GET /api/stats` - Dashboard statistics

## User Preferences
- IBM Carbon Design System styling
- Dark mode toggle available
- Professional, information-dense UI

## Recent Changes
- 2026-02-15: Initial build - complete MVP with all pages, auth, and database

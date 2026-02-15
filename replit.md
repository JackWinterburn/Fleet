# TyreCommand - Fleet Tyre Management Platform

## Overview
TyreCommand is a progressive web application for fleet tyre management. Users can create fleets, add vehicles, track tyres, manage stock, view forecasts/analytics, and receive alerts. Fleets support collaborative access via member invitations with role-based permissions.

## Tech Stack
- Frontend: React + TypeScript, @carbon/react (IBM Carbon Design System), @carbon/icons-react, Recharts, wouter routing
- Backend: Express.js, PostgreSQL with Drizzle ORM
- Auth: Replit OIDC authentication (OpenID Connect)
- Styling: IBM Carbon Design System with GlobalTheme/Theme for dark/light mode, IBM Plex Sans/Mono fonts
- Forms: react-hook-form with zod validation
- Data fetching: @tanstack/react-query v5

## Architecture
- `shared/schema.ts` - All Drizzle ORM models and Zod schemas
- `shared/models/auth.ts` - Auth-related models (users, sessions)
- `server/routes.ts` - All API endpoints with Zod validation
- `server/storage.ts` - Database storage layer (DatabaseStorage class)
- `server/db.ts` - Database connection pool
- `server/replit_integrations/auth/` - Replit Auth integration
- `client/src/App.tsx` - Main app with Carbon theming, custom sidebar, routing
- `client/src/carbon.scss` - Carbon SCSS entry point (@use '@carbon/react')
- `client/src/index.css` - Utility CSS classes for layout (tc-* classes)
- `client/src/pages/` - All page components (landing, dashboard, vehicles, tyres, stock, forecasts, alerts, members, not-found)
- `client/src/hooks/use-auth.ts` - Auth hook
- `client/src/lib/queryClient.ts` - React Query client with default fetcher

## Carbon Components Used
- Layout: Theme, GlobalTheme (for dark/light mode switching)
- Data: DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell
- Forms: TextInput, NumberInput, TextArea, Select, SelectItem, Modal
- Display: Tile, ClickableTile, Tag, InlineNotification, SkeletonText, Loading
- Actions: Button (kind: primary/secondary/ghost)
- Icons: @carbon/icons-react (Dashboard, Van, CircleFilled, Package, ChartBar, Alarm, UserMultiple, Add, TrashCan, etc.)

## Theme System
- Uses Carbon's GlobalTheme/Theme components
- Toggles between "white" (light) and "g100" (dark) themes
- Theme preference saved in localStorage as "tc-theme"
- ThemeContext exported from App.tsx via useThemeMode() hook

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
- `GET /api/fleets/:fleetId/vehicles/:vehicleId` - Single vehicle with tyres
- `GET/POST/PATCH/DELETE /api/fleets/:fleetId/tyres` - Tyre CRUD (PATCH updates individual tyre)
- `GET/POST/DELETE /api/fleets/:fleetId/stock` - Stock CRUD
- `GET/PATCH /api/fleets/:fleetId/alerts` - Alerts management
- `PATCH /api/fleets/:fleetId/alerts/mark-all-read` - Mark all alerts read (must be before :alertId route)
- `GET/POST/DELETE /api/fleets/:fleetId/members` - Member management
- `GET /api/stats` - Dashboard statistics

## User Preferences
- IBM Carbon Design System official React components
- Dark mode toggle available (Carbon Theme g100/white)
- Professional, information-dense UI
- IBM Plex Sans font family

## Shared Utilities
- `client/src/lib/tyre-positions.ts` - Position options generation based on vehicle type/axle count, shared between tyres page and vehicle detail

## Recent Changes
- 2026-02-15: Added tyre editing (PATCH), dynamic position selector based on vehicle type/axle count, edit modal on tyres page
- 2026-02-15: Added interactive vehicle detail page with SVG top-down visualization, security hardening on tyre/vehicle endpoints
- 2026-02-15: Complete Carbon Design System migration - replaced all shadcn/ui with @carbon/react components
- 2026-02-15: Initial build - complete MVP with all pages, auth, and database

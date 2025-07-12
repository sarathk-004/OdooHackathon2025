# ReWear - Sustainable Fashion Exchange Platform

## Overview

ReWear is a modern full-stack web application that enables sustainable fashion through community-driven clothing exchanges. The platform allows users to list clothing items, discover pieces from others, and arrange swaps using a points-based system. Built with React and Express, it emphasizes user experience and environmental sustainability.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

✓ Fixed rating system to show "No Ratings Yet" instead of defaulting to 5 stars
✓ Enhanced swap/redeem validation with proper eligibility checks for points and item availability
✓ Ensured points activity is user-specific by validating authentication and user ID filtering
✓ Created comprehensive "How It Works" page explaining platform mission, swapping process, and point system
✓ Improved query client to handle both object and array parameter formats for better API compatibility
✓ Fixed Select component errors and navbar nested anchor warnings
✓ Implemented complete redeem functionality with confirmation dialog and point deduction
✓ Added delete/refund functionality for redemptions with full point restoration
✓ Fixed transaction display to show negative points in red for spent points
✓ Enhanced successful swaps count to include both completed and accepted redemptions
✓ Filtered browse items to exclude user's own listings, showing only items from other users
✓ Fixed user-specific data filtering: dashboard shows only current user's transactions, items, and swap requests
✓ Fixed browse catalog to properly exclude current user's own items using excludeUserId parameter
✓ Fixed TabsContent React error by properly nesting components within Tabs wrapper
✓ Enhanced swap requests endpoint to default to current user's requests when no userId specified

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Authentication System
- Custom authentication using Passport.js local strategy
- Secure password hashing with Node.js crypto scrypt
- Session-based authentication with PostgreSQL session store
- Protected routes with role-based access (admin functionality)

### Database Schema
The application uses a comprehensive schema with the following main entities:
- **Users**: User accounts with points balance, ratings, and admin flags
- **Categories**: Item categorization system
- **Items**: Clothing items with images, conditions, point values, and approval status
- **Swap Requests**: Requests for item exchanges (direct swaps or point redemptions)
- **Transactions**: Records of completed exchanges and point transfers

### UI Component System
- Consistent design system using Shadcn/ui components
- Custom purple-based color scheme for brand identity
- Responsive design with mobile-first approach
- Accessible components built on Radix UI primitives

### Points-Based Economy
- Users start with 100 points
- Items have assigned point values based on condition and category
- Supports both direct item swaps and point-based purchases
- Transaction history tracking for accountability

## Data Flow

### User Registration/Authentication
1. User registers with username, email, and password
2. Password is hashed using scrypt with salt
3. Session created and stored in PostgreSQL
4. User receives initial 100 points balance

### Item Listing Process
1. User uploads item with images, description, and metadata
2. Item requires admin approval before going live
3. Approved items appear in browse interface
4. View counts tracked for popularity metrics

### Swap Request Flow
1. User initiates swap request (item-for-item or points-for-item)
2. Request includes optional message and offered item/points
3. Item owner can accept, reject, or negotiate
4. Completed swaps update point balances and item ownership
5. Transaction records created for history

### Admin Workflow
- Admin users can approve/reject item listings
- Platform statistics and user management capabilities
- Content moderation tools for maintaining quality

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React Query, React Hook Form, Wouter)
- Express.js with middleware (session, passport, CORS)
- Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)

### UI and Styling
- Radix UI components for accessibility
- Tailwind CSS for styling
- Lucide React for consistent iconography
- Class variance authority for component variants

### Development Tools
- Vite for build tooling and development server
- TypeScript for type safety
- ESBuild for server bundling
- Replit-specific plugins for development environment

### Database and Storage
- Neon PostgreSQL for serverless database hosting
- Connect-pg-simple for PostgreSQL session storage
- Drizzle Kit for database migrations

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Replit integration with cartographer and runtime error overlay

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Single deployment artifact with both frontend and backend

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secret via `SESSION_SECRET` for secure sessions
- Replit-specific environment detection for development features

### Session and Security
- Secure session configuration with trust proxy enabled
- HTTPS enforcement in production
- CSRF protection through session configuration
- Secure password handling with timing-safe comparison
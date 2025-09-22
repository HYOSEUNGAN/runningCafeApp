# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start development server (http://localhost:3000)
- `npm test` - Run tests in interactive watch mode
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (one-way operation)

### Linting and Formatting
- Project uses Prettier with configuration in `.prettierrc`
- ESLint configured via `eslintConfig` in package.json (react-app preset)
- Use Prettier for code formatting: single quotes, semicolons, 2-space tabs

## Project Architecture

### Technology Stack
- **Framework**: React 19.1.1 with Create React App
- **State Management**: Zustand for global state
- **Styling**: Tailwind CSS 4.1.13 with custom design system
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with persistent sessions
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM 7.9.1
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library

### Key Architecture Patterns

**State Management Structure:**
- `/src/stores/` - Zustand stores for global state
  - `useAuthStore.js` - Authentication state with Supabase integration
  - `useAppStore.js` - General application state
- Stores include both state and actions, following Zustand patterns

**Service Layer:**
- `/src/services/` - External API integrations
  - `supabase.js` - Configured Supabase client with auth settings
  - `authService.js` - Authentication service methods
- Services handle all external data operations

**Component Structure:**
- `/src/components/ui/` - Reusable UI components (Button, Card, Input)
- `/src/components/common/` - Common app components (LoadingSpinner, Modal, Toast)
- Follows atomic design principles with composed components

**Design System:**
- Custom Tailwind config with Korean-optimized color palette
- Primary colors (purple gradient), secondary colors (orange/mint/pink)
- Typography scale with Pretendard/Noto Sans KR fonts
- Custom spacing, shadows, and border radius tokens

### Environment Configuration
- Uses `.env` for environment variables
- Supabase configuration requires:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`

### Application Constants
- `/src/constants/app.js` - Centralized app configuration
  - Route definitions, API endpoints, storage keys
  - Supports Korean language interface for "Running Cafe" platform

### Cursor AI Rules
- Comprehensive development guidelines in `.cursorrules` (Korean)
- Emphasizes DRY principles, functional components, and React best practices
- Includes specific naming conventions and project structure guidelines
- Focuses on performance optimization, accessibility, and security

## Running Cafe Domain
This is a Korean platform connecting running and cafes. Key features include:
- User authentication and profiles
- Running course management
- Cafe discovery and reviews
- Running record tracking
- Integration between fitness and cafe experiences
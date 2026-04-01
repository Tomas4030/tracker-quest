# Architecture - EstágioTrack

## Overview

The project uses Next.js App Router with a clean separation between routes, reusable UI components, domain screens, services, state, and utility helpers.

## Structure

- `app/`: Next.js routes and root layout
- `src/screens/`: screen-level components used by routes
- `src/components/`: reusable UI and layout components
- `src/services/`: auth, activities, and Supabase access
- `src/store/`: Zustand application state
- `src/types/`: shared TypeScript types
- `src/utils/`: helpers and formatting functions

## Data Flow

1. Route renders a screen component.
2. Screen component reads from the Zustand store.
3. Store calls services for auth or activity CRUD.
4. Services persist to Supabase or localStorage fallback.
5. UI updates through React state and store subscriptions.

## Notes

- Demo mode works without Supabase credentials.
- `NEXT_PUBLIC_*` env vars are used for client-safe configuration.
- The project intentionally keeps page logic in `src/screens` and route wiring in `app/`.

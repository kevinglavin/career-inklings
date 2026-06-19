# Inklings (formerly Career Swipe) - Project Handover

## 1. Project Overview
**Name:** Inklings
**Purpose:** A Tinder-style career discovery tool based on the RIASEC (Holland Code) model. Users swipe left/right on occupations to determine their career personality type.
**Target Audience:** Students, career seekers, or anyone interested in career discovery.
**Core Features:**
- Gamified Interface (Stack swiping with spring physics).
- RIASEC Scoring Algorithm.
- Offline-first capabilities (PWA-ready structure).
- Admin Interface to customize deck content (images, titles).
- PDF Report Generation.
- Responsive Design (Mobile-first, but desktop compatible).

## 2. Tech Stack used
- **Framework:** React 19 (via Vite) based on `package.json`.
- **Language:** TypeScript.
- **Styling:** Tailwind CSS (extensive usage for layout, typography, and effects).
- **Animations:** Framer Motion (critical for the swipe physics and transitions).
- **Icons:** Lucide React.
- **Data Persistence:**
    - `IndexedDB` (via raw API): For storing large custom image data for occupations.
    - `localStorage`: For saving user session progress (current card, scores).
- **PDF Generation:** `jspdf` text/vector API only (a designed cover + results report). `html2canvas` and the jsPDF `.html()` path are NOT used and are stubbed out in `vite.config.ts`. Internationalized (EN/ES).
- **Charts:** `recharts` (used in Results view).

## 3. Architecture & Data Structures

### Data Models (`types.ts`)
- **RiasecType:** Enum for the 6 types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional).
- **Occupation:**
    ```typescript
    interface Occupation {
        id: string;
        title: string;
        category: RiasecType;
        description: string;
        imageUrl: string; // Base64 or URL
        onetCode: string; // Links to O*NET
        tasks: string[];
        workActivities: string[];
    }
    ```
- **Scores:** `Record<RiasecType, number>` mapping each category to a cumulative score.
- **AppStage:** Enum for `LOGIN` -> `INSTRUCTIONS` -> `SWIPE` -> `RESULTS` / `SETTINGS`.

### State Management (`App.tsx`)
- **Central State:** The `App` component holds the "god state":
  - `deck`: Array of `Occupation` (shuffled).
  - `currentIndex`: Pointer to the visible card.
  - `scores`: Running tally of "Likes" (Right Swipes).
  - `swipeHistory`: Stack of actions to allow "Undo".
  - `stage`: Controls the active view.
- **Persistence:**
  - **Auto-save:** `useEffect` hooks write to `localStorage` on every swipe/score change.
  - **Hydration:** On mount, checks `localStorage` to restore session.

## 4. Key Components

### 1. `SwipeCard.tsx` (The Core Interaction)
- **Physics:** Uses `framer-motion`'s `useMotionValue` and `useTransform` to map x-drag to rotation and opacity.
- **3D Flip:** Contains a "Flip" state. Front shows Image + Title. Back shows `tasks`, `education`, and O*NET link.
- **Gestures:**
  - Drag Right (>100px): Triggers `onSwipe('right')`.
  - Drag Left (<-100px): Triggers `onSwipe('left')`.
  - Click: Flips the card.

### 2. `ResultsView.tsx` (The Output)
- **Scoring Logic:** Sorts categories by score. Top 3 form the **Holland Code**.
- **Visualization:**
  - Interactive "Top Interests" cards (3D flip to show details).
  - Bar chart using simple CSS widths (or Recharts if preferred, current code uses CSS bars for custom styling).
- **PDF Export:** `generatePdfBlob()` builds a 2+ page report directly with the jsPDF text/vector API (cover + results page with a hand-drawn radar, top-3 cards, liked-career chips, and "what these mean"), localized via i18n. No HTML/canvas capture.

### 3. `SettingsView.tsx` (The Admin Panel)
- **Purpose:** Allows customizing the deck without coding.
- **Functionality:**
  - Edit Job Titles / Descriptions (persisted to IndexedDB).
  - **Art Pack selector:** switch which image pack the deck renders (no per-card image upload in the current build).
  - **Reset:** Clears IDB and restores default data from `constants.ts`.

### 4. `db.ts` (Database Layer)
- Wraps `IndexedDB` in Promises.
- `saveOccupations`: Saves the full array (including base64 images) to the `settings` store.
- `getOccupations`: Retrieves the custom deck.

## 5. Styling System
- **Colors:** Defined in `constants.ts` (`BRAND_COLORS`, `RIASEC_COLORS`). These map standard RIASEC types to the project's specific palette.
- **Global CSS (`index.css`):**
  - `@import` Google Fonts (Inter).
  - Utility classes for 3D transforms (`perspective-1000`, `rotate-y-180`, `backface-hidden`) which are essential for the card flip effects.
  - `overscroll-behavior: none` on body to prevent "pull-to-refresh" on mobile swiping.

## 6. Handover Checklist for Reconstruction
To recreate this app from scratch:

1.  **Setup:** `npm create vite@latest` with React/TypeScript.
2.  **Dependencies:** Install `framer-motion`, `lucide-react`, `tailwindcss`, `html2canvas`, `jspdf`.
3.  **Assets:** Gather 60+ images for occupations (currently in `/public/images/occupations/`).
4.  **Copy Constants:** The `OCCUPATIONS` array in `constants.ts` is massive and contains the core dataset. **Do not lose this.**
5.  **Implement Physics:** precise tuning of `SwipeCard` drag constraints is vital for the "feel".
6.  **Implement DB:** Ensure `db.ts` handles the `Blob`/`Base64` storage correctly, or users will lose custom images on refresh.
7.  **Mobile Optimization:** Ensure `touch-action: none` and `preventDefault` are handled in swipe handlers to avoid scrolling the page while dragging cards.

## 7. Known gotchas / "Secret Sauce"
- **Image Preloading:** The `App.tsx` contains a `useEffect` that looks ahead `currentIndex + 1` and `+ 2` to create `new Image()` objects. This prevents white flashes.
- **Keyboard Nav:** Desktop users can use Arrow Keys. This is handled by a global event listener in `App.tsx`.
- **Haptics:** `navigator.vibrate(50)` is called on swipe for mobile tactile feedback.
- **Component Keying:** The `AnimatePresence` in `App.tsx` relies on `key={deck[currentIndex].id}` to correctly animate card exits.

---
*Generated by Antigravity*

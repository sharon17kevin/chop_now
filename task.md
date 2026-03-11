# Sell Page Redesign Task

**File:** `mobile-app/app/(tabs)/(sell)/index.tsx`

## Current Problem

The sell page has the wrong workflow. It's structured as a single long scrolling form for creating new products, but vendors need a **quick, streamlined product listing experience** with better organization.

## Desired Functionality

**Primary Purpose:** Quick product listing with a simple, intuitive form

**UX Pattern:** Single page with collapsible/expandable sections that:

- Show only essential fields by default
- Allow expanding sections for optional details
- Provide smart defaults to minimize data entry
- Give immediate visual feedback

## Required Sections (in priority order)

### 1. Product Basics (always visible)

- Product name
- Category (quick select chips)
- Price & unit
- Stock quantity

### 2. Photos (expandable)

- Camera/gallery upload
- Drag to reorder
- First image = primary

### 3. Details (expandable)

- Description (optional)
- Organic toggle
- Customer ordering rules (min qty, increments)

### 4. Location (collapsible, auto-filled from vendor profile if available)

- Use current location
- Or select from saved locations

### 5. Quick Actions Bar (sticky bottom)

- Save as Draft (quick save without validation)
- Publish Now (full validation)

## Key UX Improvements Needed

- **Auto-save drafts** every 30 seconds to prevent data loss
- **Smart defaults**: Pull unit, location, category from last product
- **Inline validation**: Show errors as user types, not just on submit
- **Progress indicator**: Show completion % to encourage finishing
- **Template support**: "Copy from existing product" option
- **Image optimization**: Auto-compress and resize on upload

## Header Improvements

Keep Analytics, Orders, Stock buttons but:

- Make them icon-only with labels on long-press
- Add "Drafts" quick access (if vendor has incomplete listings)
- Show pending approval count badge

## Success State

After publish, show:

- Confirmation with product preview card
- Quick actions: "Add Another" or "View My Products"
- Tips for improving listing (if missing optional fields)

## Technical Requirements

- Maintain all existing database fields and validation
- Use react-hook-form for better performance
- Implement section collapse with smooth animations
- Store draft state in Zustand store
- Auto-save to database every 30s (separate drafts table)

## What NOT to Change

- Keep existing image upload, location capture, and database integration
- Don't remove any fields - just reorganize them
- Maintain the same styling/theme system

## Implementation Priority

1. Core collapsible sections with essential fields
2. Inline validation and smart defaults
3. Auto-save draft functionality
4. Template/copy from existing
5. Progress indicator and UX polish

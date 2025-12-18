# Chop Now
A full-stack food delivery marketplace platform with real-time order tracking, vendor management, and integrated payment processing.

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Roadmap](#roadmap)

---

## Overview

**Chop Now** is a comprehensive mobile food delivery platform that connects customers, vendors, and delivery drivers in a seamless marketplace ecosystem. Built with modern technologies, it provides real-time order tracking, secure payment processing via Paystack, and an intuitive user experience across all user roles.

### Key Highlights

- **Multi-Role Platform**: Separate dashboards for customers, vendors, drivers, and administrators
- **Real-Time Operations**: Live order tracking and status updates
- **Secure Payments**: Integrated Paystack payment gateway with webhook verification
- **Scalable Architecture**: Built on Supabase with PostgreSQL database
- **Cross-Platform**: React Native with Expo for iOS and Android

---

##  Features

### Current Features

#### For Customers
-  User authentication (email/password with OTP verification)
-  Browse products and vendors
-  Advanced search with filters
-  Shopping cart management
-  Wishlist functionality
-  Multiple delivery addresses
-  Order history and tracking
-  Product reviews and ratings
-  Hot deals and promotions
-  Profile management

#### For Vendors
-  Vendor registration and approval workflow
-  Product catalog management
-  Inventory tracking
-  Order notifications
-  Vendor profile with ratings
-  Sales analytics dashboard
-  Product review management

#### For Administrators
-  Vendor application review and approval
-  Product moderation
-  Analytics and reporting
-  User management
  
###  Curr ent Development

#### Driver Dashboard & Logistics Workflow
-  Driver registration and verification
-  Real-time delivery task assignment
-  Proof of delivery (photo + OTP)
-  Earnings tracking and payout management
-  Delivery history

#### Enhanced Vendor Features
-  Advanced order management (accept/reject/prepare)
-  Kitchen display system
-  Ready-for-pickup notifications(email)
-  Vendor-driver handoff workflow
-  Revenue analytics
-  Menu scheduling (availability times)

#### Payment Integration
-  Paystack payment gateway integration
-  Card payment processing
-  Wallet system
-  Payment verification webhooks
-  Refund management
-  Transaction history

#### Real-Time Features
-  Live order status updates
-  Push notifications (Expo)


### Later improvements
- security and real backend work
- google maps integertion to the navigation directory in the drivers tab and other parts of the code
---

##  Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
│              (React Native + Expo Router)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────────┐
        │            │            │                │
   ┌────▼────┐  ┌────▼────┐  ┌───▼─────┐    ┌────▼─────┐
   │Customer │  │ Vendor  │  │ Driver  │    │  Admin   │
   │  Layer  │  │  Layer  │  │  Layer  │    │  Layer   │
   └────┬────┘  └────┬────┘  └───┬─────┘    └────┬─────┘
        │            │            │               │
        └────────────┴────────────┴───────────────┘
                     │
        ┌────────────▼────────────────────────────┐
        │         State Management                 │
        │  (Zustand Stores + React Query)         │
        └────────────┬────────────────────────────┘
                     │
        ┌────────────▼────────────────────────────┐
        │        Service Layer                     │
        │  (API Services, Auth, Uploads)          │
        └────────────┬────────────────────────────┘
                     │
        ┌────────────▼────────────────────────────┐
        │         Supabase Backend                 │
        │  • PostgreSQL Database                   │
        │  • Authentication                        │
        │  • Storage (Product Images)              │
        │  • Real-time Subscriptions               │
        │  • Edge Functions (OTP)                  │
        └────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼─────┐            ┌─────▼──────┐
   │ Paystack │            │   Expo     │
   │ Payments │            │ Push APIs  │
   └──────────┘            └────────────┘
```

### Database Schema (Supabase/PostgreSQL)

**Core Tables:**
- `profiles` - User profiles (extends Supabase auth.users)
- `vendors` - Vendor information and status
- `vendor_applications` - Vendor registration requests
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items
- `cart_items` - Shopping cart data
- `reviews` - Product and vendor reviews
- `addresses` - Customer delivery addresses
- `email_otps` - OTP verification records
- `notifications` - User notifications

**Key Relationships:**
- Users → Profiles (1:1)
- Vendors → Products (1:N)
- Orders → Order Items (1:N)
- Users → Cart Items (1:N)
- Products → Reviews (1:N)


**State Management:**
- **Zustand**: Global state stores (user, cart, wishlist, search)
- **React Query**: Server state and caching
- **Context API**: Theme and authentication context

**Data Flow:**
1. User action triggers component event
2. Component calls service layer function
3. Service interacts with Supabase client
4. Response updates Zustand store and React Query cache
5. UI automatically re-renders with new data

---

##  Technology Stack

### Frontend/Mobile

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.76.5 | Mobile framework |
| **Expo** | 52.0.11 | Development platform |
| **Expo Router** | 4.0.14 | File-based routing |
| **TypeScript** | 5.3.3 | Type safety |
| **Zustand** | 5.0.2 | State management |
| **React Query** | 5.62.7 | Server state |
| **Expo Secure Store** | 13.0.2 | Secure storage |
| **Expo Location** | 18.0.4 | GPS/Location |
| **Axios** | 1.7.9 | HTTP client |

### Backend/Infrastructure

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Database |
| **Supabase Auth** | Authentication |
| **Supabase Storage** | File storage |
| **Supabase Edge Functions** | Serverless functions |

### External Services

| Service | Purpose |
|---------|---------|
| **Paystack** | Payment processing (planned) |
| **Expo Push Notifications** | Mobile notifications |
| **Google Maps API** | Mapping and navigation (planned) |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **EAS Build** | Native builds |
| **EAS Submit** | App store deployment |

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Expo CLI** (installed globally)
- **Supabase Account** (for backend)
- **iOS Simulator** (Mac) or **Android Emulator**
- **Physical device** (recommended for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sharon17kevin/chop_now.git
   cd chop_now/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials (see [Environment Configuration](#environment-configuration))

4. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run migrations from `supabase/migrations/` folder
   - Deploy Edge Functions from `supabase/functions/`
   - Configure Storage buckets for product images

5. **Start development server**
   ```bash
   npx expo start
   ```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Start with cache clear
npm start --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## Environment Configuration

### `.env.example`

```env
# App Environment
APP_ENV=development

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
API_BASE_URL=https://your-api.com

# Paystack (Payment Gateway)
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Expo Push Notifications
EXPO_PUBLIC_PUSH_KEY=your-expo-push-key

# Sentry (Error Tracking)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature Flags
ENABLE_DRIVER_DASHBOARD=false
ENABLE_PAYMENT_INTEGRATION=false
```

### Environment Variables Explanation

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (safe for client) |  |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Server |
| `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |  Upcoming |
| `PAYSTACK_SECRET_KEY` | Paystack secret | Server |
| `EXPO_PUBLIC_PUSH_KEY` | Expo push notification key |  Notifications |

---
## 🗺️ Roadmap

### Phase 1: Foundation (Completed )
-  User authentication & profiles
-  Product catalog & search
-  Shopping cart & wishlist
-  Order placement
-  Vendor registration
-  Admin dashboard
-  Reviews & ratings

### Phase 2: Core Features
-  **Driver Dashboard**
  - Driver registration & verification
  - Task assignment system
  - GPS navigation integration
  - Proof of delivery
  - Earnings tracking
  
-  **Vendor Workflow Enhancement**
  - Order acceptance/rejection
  - Kitchen display system
  - Preparation status tracking
  - Push notifications
  - Real-time order information
  - Vendor analytics

-  **Payment Integration**
  - Paystack gateway setup
  - Card payment processing
  - Wallet system
  - Transaction history
  - Refund management
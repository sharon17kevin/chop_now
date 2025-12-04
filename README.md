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

###  Current Development

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

### Frontend Architecture

**Navigation Structure:**
```
app/
├── index.tsx                 # Onboarding
├── login.tsx                 # Authentication
├── signup.tsx
├── _layout.tsx              # Root layout
└── (tabs)/                  # Main app tabs
    ├── (home)/              # Customer shopping
    ├── (orders)/            # Order management
    ├── (profile)/           # User profile
    ├── (admin)/             # Admin dashboard
    └── search.tsx           # Search screen
```

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

##  Project Structure

```
chop_now/
│
├── scripts/                          # Utility Scripts
│   ├── setup.sh                     # Project setup script
│   ├── deploy.sh                    # Deployment script
│   ├── migrate.sh                   # Database migration script
│   └── seed.sh                      # Database seeding script
│
├── frontend/                         # React Native Mobile Application
│   │
│   ├── .expo/                       # Expo generated files
│   │   ├── types/
│   │   │   └── router.d.ts
│   │   ├── devices.json
│   │   └── README.md
│   │
│   ├── __tests__/                   # Test Suite
│   │   ├── components/              # Component tests
│   │   ├── hooks/                   # Hook tests
│   │   ├── services/                # Service tests
│   │   ├── utils/                   # Utility tests
│   │   └── e2e/                     # End-to-end tests
│   │
│   ├── app/                         # Expo Router - File-based Navigation
│   │   │
│   │   ├── (tabs)/                  # Tab-based Navigation Root
│   │   │   │
│   │   │   ├── (home)/             # Customer Shopping Flow
│   │   │   │   ├── items/
│   │   │   │   │   └── [iteminfo].tsx      # Product details page
│   │   │   │   ├── vendor/
│   │   │   │   │   ├── [vendorId].tsx      # Vendor store page
│   │   │   │   │   └── vendorInfo.tsx      # Vendor information
│   │   │   │   ├── index.tsx               # Home/Browse products
│   │   │   │   ├── delivery.tsx            # Delivery options
│   │   │   │   ├── newaddress.tsx          # Add new address
│   │   │   │   ├── reviews.tsx             # Product reviews
│   │   │   │   └── _layout.tsx             # Home layout
│   │   │   │
│   │   │   ├── (orders)/           # Order Management
│   │   │   │   ├── index.tsx               # Orders list
│   │   │   │   ├── checkout.tsx            # Checkout flow
│   │   │   │   ├── breakdown.tsx           # Order breakdown
│   │   │   │   ├── trackorder.tsx          # Real-time order tracking
│   │   │   │   ├── payment-success.tsx     # Payment success page
│   │   │   │   ├── payment-failed.tsx      # Payment failure page
│   │   │   │   └── _layout.tsx             # Orders layout
│   │   │   │
│   │   │   ├── (profile)/          # User Profile & Settings
│   │   │   │   ├── index.tsx               # Profile home
│   │   │   │   ├── profile.tsx             # Edit profile
│   │   │   │   ├── payment.tsx             # Payment methods
│   │   │   │   ├── wallet.tsx              # Wallet management
│   │   │   │   ├── transactions.tsx        # Transaction history
│   │   │   │   ├── vendorReg.tsx           # Vendor registration
│   │   │   │   ├── driverReg.tsx           # Driver registration
│   │   │   │   ├── wishlist.tsx            # Saved items
│   │   │   │   ├── notifications.tsx       # Notifications
│   │   │   │   ├── settings.tsx            # App settings
│   │   │   │   ├── support.tsx             # Customer support
│   │   │   │   └── _layout.tsx             # Profile layout
│   │   │   │
│   │   │   ├── (vendor)/           # Enhanced Vendor Dashboard
│   │   │   │   ├── orders/
│   │   │   │   │   ├── index.tsx           # Active orders list
│   │   │   │   │   ├── [orderId].tsx       # Order details & management
│   │   │   │   │   ├── history.tsx         # Order history
│   │   │   │   │   └── kitchen.tsx         # Kitchen display system
│   │   │   │   ├── products/
│   │   │   │   │   ├── index.tsx           # Product management
│   │   │   │   │   ├── add.tsx             # Add new product
│   │   │   │   │   ├── [productId].tsx     # Edit product
│   │   │   │   │   └── schedule.tsx        # Menu scheduling
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── index.tsx           # Analytics overview
│   │   │   │   │   ├── revenue.tsx         # Revenue analytics
│   │   │   │   │   ├── sales.tsx           # Sales reports
│   │   │   │   │   └── customers.tsx       # Customer insights
│   │   │   │   ├── index.tsx               # Vendor dashboard home
│   │   │   │   ├── handoff.tsx             # Driver handoff management
│   │   │   │   ├── profile.tsx             # Vendor profile settings
│   │   │   │   └── _layout.tsx             # Vendor layout
│   │   │   │
│   │   │   ├── (driver)/           # Driver Dashboard
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── index.tsx           # Available tasks
│   │   │   │   │   ├── [taskId].tsx        # Task details
│   │   │   │   │   └── active.tsx          # Active delivery
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── index.tsx           # GPS navigation
│   │   │   │   │   └── map.tsx             # Map view
│   │   │   │   ├── delivery/
│   │   │   │   │   ├── pickup.tsx          # Pickup confirmation
│   │   │   │   │   ├── proof.tsx           # Proof of delivery (photo)
│   │   │   │   │   └── complete.tsx        # Delivery completion
│   │   │   │   ├── earnings/
│   │   │   │   │   ├── index.tsx           # Earnings overview
│   │   │   │   │   ├── history.tsx         # Earnings history
│   │   │   │   │   └── payout.tsx          # Payout management
│   │   │   │   ├── index.tsx               # Driver home/dashboard
│   │   │   │   ├── history.tsx             # Delivery history
│   │   │   │   ├── profile.tsx             # Driver profile
│   │   │   │   ├── verification.tsx        # Driver verification
│   │   │   │   └── _layout.tsx             # Driver layout
│   │   │   │
│   │   │   ├── (admin)/            # Admin Dashboard
│   │   │   │   ├── index.tsx               # Admin home
│   │   │   │   ├── analysis.tsx            # Platform analytics
│   │   │   │   ├── productReview.tsx       # Product moderation
│   │   │   │   ├── vendorReview.tsx        # Vendor applications
│   │   │   │   ├── driverReview.tsx        # Driver applications
│   │   │   │   ├── payments.tsx            # Payment management
│   │   │   │   ├── refunds.tsx             # Refund management
│   │   │   │   └── _layout.tsx             # Admin layout
│   │   │   │
│   │   │   ├── search.tsx                  # Global search
│   │   │   ├── sell.tsx                    # Quick vendor access
│   │   │   └── _layout.tsx                 # Tabs layout
│   │   │
│   │   ├── index.tsx                       # Landing/Onboarding
│   │   ├── login.tsx                       # Login screen
│   │   ├── signup.tsx                      # Signup screen
│   │   ├── signupstart.tsx                 # Signup entry
│   │   ├── forgot.tsx                      # Password reset
│   │   ├── otp.tsx                         # OTP verification
│   │   ├── +not-found.tsx                  # 404 page
│   │   └── _layout.tsx                     # Root layout
│   │
│   ├── assets/                      # Static Assets
│   │   ├── images/
│   │   │   ├── board_1.webp
│   │   │   ├── board_2.webp
│   │   │   ├── board_3.webp
│   │   │   ├── favicon.png
│   │   │   ├── icon.png
│   │   │   └── index.ts
│   │   ├── animations/              # Lottie animations
│   │   └── sounds/                  # Notification sounds
│   │
│   ├── components/                  # Reusable UI Components
│   │   │
│   │   ├── common/                  # Common Components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── Indicator.tsx
│   │   │   ├── LoadingSpinner.tsx   #
│   │   │   ├── EmptyState.tsx       #
│   │   │   └── ErrorBoundary.tsx    #
│   │   │
│   │   ├── cards/                   # Card Components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── GridProductCard.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   ├── DestinationCard.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── TaskCard.tsx         # Driver task card
│   │   │   ├── EarningsCard.tsx     # Earnings display
│   │   │   └── TransactionCard.tsx  # Transaction item
│   │   │
│   │   ├── forms/                   # Form Components
│   │   │   ├── PaymentMethodForm.tsx
│   │   │   ├── AddressForm.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── DriverVerificationForm.tsx
│   │   │   └── WalletTopUpForm.tsx
│   │   │
│   │   ├── payment/                 # Payment Components
│   │   │   ├── PaystackCheckout.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── WalletBalance.tsx
│   │   │   └── TransactionList.tsx
│   │   │
│   │   ├── driver/                  # Driver Components
│   │   │   ├── TaskList.tsx
│   │   │   ├── NavigationMap.tsx
│   │   │   ├── ProofOfDelivery.tsx
│   │   │   ├── EarningsChart.tsx
│   │   │   └── DeliveryTimer.tsx
│   │   │
│   │   ├── vendor/                  # Vendor Components
│   │   │   ├── OrderQueue.tsx       # Kitchen display
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   ├── MenuScheduler.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── HandoffQRCode.tsx
│   │   │
│   │   ├── notifications/           # Notification Components
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   └── NotificationCenter.tsx
│   │   │
│   │   ├── vectors/                 # SVG Icons
│   │   │   ├── index.ts
│   │   │   ├── FlourIcon.tsx
│   │   │   ├── FruitIcon.tsx
│   │   │   ├── GrainsIcon.tsx
│   │   │   ├── LegumesIcon.tsx
│   │   │   ├── MeatIcon.tsx
│   │   │   ├── MilkIcon.tsx
│   │   │   ├── OilIcon.tsx
│   │   │   ├── SpiceIcon.tsx
│   │   │   └── VegetableIcon.tsx
│   │   │
│   │   ├── ProductSkeleton.tsx
│   │   ├── ExpandingTile.tsx
│   │   ├── FilterSquare.tsx
│   │   ├── SliderButton.tsx
│   │   └── SliderToggle.tsx
│   │
│   ├── config/                      # Configuration Files
│   │   ├── app.config.ts            # App configuration
│   │   ├── api.config.ts            # API endpoints
│   │   ├── payment.config.ts        # Payment settings
│   │   └── maps.config.ts           # Maps configuration
│   │
│   ├── data/                        # Static/Mock Data
│   │   ├── mockData.ts
│   │   └── products.ts
│   │
│   ├── docs/                        # Documentation
│   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   ├── PRODUCT_UPLOAD_SETUP.md
│   │   ├── SETUP_CHECKLIST.md
│   │   ├── TROUBLESHOOTING_VENDOR_REVIEW.md
│   │   ├── VENDOR_REVIEW_SYSTEM.md
│   │   ├── HOT_DEALS_GUIDE.md
│   │   ├── DRIVER_SYSTEM.md         # Driver documentation
│   │   ├── PAYMENT_INTEGRATION.md   # Payment setup
│   │   ├── REALTIME_FEATURES.md     # Real-time guide
│   │   ├── NOTIFICATIONS_SETUP.md   # Notifications
│   │   └── API_DOCUMENTATION.md     # Complete API docs
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   │
│   │   ├── auth/                    # Authentication Hooks
│   │   │   ├── useAuth.tsx
│   │   │   ├── useRole.ts
│   │   │   └── useSession.ts        #
│   │   │
│   │   ├── products/                # Product Hooks
│   │   │   ├── useProducts.ts
│   │   │   ├── useHomeProducts.ts
│   │   │   ├── useVendorProducts.ts
│   │   │   └── useProductSchedule.ts #
│   │   │
│   │   ├── orders/                  # Order Hooks
│   │   │   ├── useOrders.ts
│   │   │   ├── useOrderTracking.ts  # Real-time tracking
│   │   │   └── useOrderStatus.ts    # Status updates
│   │   │
│   │   ├── payment/                 # Payment Hooks
│   │   │   ├── usePaystack.ts       # Paystack integration
│   │   │   ├── useWallet.ts         # Wallet operations
│   │   │   ├── useTransactions.ts   # Transaction history
│   │   │   └── useRefund.ts         # Refund processing
│   │   │
│   │   ├── driver/                  # Driver Hooks
│   │   │   ├── useDriverTasks.ts    # Task management
│   │   │   ├── useNavigation.ts     # GPS navigation
│   │   │   ├── useDelivery.ts       # Delivery operations
│   │   │   ├── useEarnings.ts       # Earnings tracking
│   │   │   └── useLocation.ts       # Location tracking
│   │   │
│   │   ├── vendor/                  # Vendor Hooks
│   │   │   ├── useVendorProfile.ts
│   │   │   ├── useVendorRating.ts
│   │   │   ├── useVendorOrders.ts   # Order management
│   │   │   ├── useKitchenDisplay.ts # Kitchen display
│   │   │   ├── useHandoff.ts        # Driver handoff
│   │   │   └── useRevenue.ts        # Revenue analytics
│   │   │
│   │   ├── notifications/           # Notification Hooks
│   │   │   ├── usePushNotifications.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useRealTimeUpdates.ts # Supabase realtime
│   │   │
│   │   ├── useAddToCart.ts
│   │   ├── useWishlist.ts
│   │   ├── useSearch.ts
│   │   ├── useTheme.tsx
│   │   ├── useDebounce.ts
│   │   └── useFrameworkReady.ts
│   │
│   ├── lib/                         # Core Libraries
│   │   ├── supabase.ts              # Supabase client
│   │   ├── queryClient.ts           # React Query config
│   │   ├── uploadService.ts         # File uploads
│   │   ├── paystack.ts              # Paystack SDK
│   │   ├── maps.ts                  # Google Maps
│   │   └── notifications.ts         # Notification config
│   │
│   ├── providers/                   # Context Providers
│   │   ├── QueryProvider.tsx        # React Query
│   │   ├── AuthProvider.tsx         # Auth context
│   │   ├── ThemeProvider.tsx        # Theme context
│   │   ├── NotificationProvider.tsx # Notifications
│   │   └── RealtimeProvider.tsx     # Realtime subscriptions
│   │
│   ├── services/                    # API Service Layer
│   │   │
│   │   ├── api/                     # API Clients
│   │   │   ├── supabase.ts
│   │   │   ├── paystack.ts          #
│   │   │   └── maps.ts              #
│   │   │
│   │   ├── auth/                    # Auth Services
│   │   │   ├── auth.ts
│   │   │   ├── session.ts
│   │   │   └── verification.ts
│   │   │
│   │   ├── payment/                 # Payment Services
│   │   │   ├── paystack.ts
│   │   │   ├── wallet.ts
│   │   │   ├── transactions.ts
│   │   │   └── refunds.ts
│   │   │
│   │   ├── driver/                  # Driver Services
│   │   │   ├── tasks.ts
│   │   │   ├── delivery.ts
│   │   │   ├── navigation.ts
│   │   │   ├── earnings.ts
│   │   │   └── verification.ts
│   │   │
│   │   ├── vendor/                  # Vendor Services
│   │   │   ├── orders.ts
│   │   │   ├── kitchen.ts
│   │   │   ├── handoff.ts
│   │   │   ├── analytics.ts
│   │   │   └── schedule.ts
│   │   │
│   │   ├── notifications/           # Notification Services
│   │   │   ├── push.ts
│   │   │   ├── email.ts
│   │   │   └── realtime.ts
│   │   │
│   │   ├── location/                # Location Services
│   │   │   ├── tracking.ts
│   │   │   ├── geocoding.ts
│   │   │   └── distance.ts
│   │   │
│   │   ├── products.ts
│   │   └── upload.ts
│   │
│   ├── stores/                      # Zustand State Management
│   │   ├── useUserStore.ts
│   │   ├── useProductStore.ts
│   │   ├── useWishlistStore.ts
│   │   ├── useSearchStore.ts
│   │   ├── addressStore.ts
│   │   ├── usePendingSignup.ts
│   │   ├── useCartStore.ts          # Enhanced
│   │   ├── usePaymentStore.ts       #
│   │   ├── useDriverStore.ts        #
│   │   ├── useVendorStore.ts        #
│   │   ├── useNotificationStore.ts  #
│   │   └── useOrderStore.ts         #
│   │
│   ├── styles/                      # Shared Styles
│   │   ├── typography.ts
│   │   ├── colors.ts                #
│   │   ├── spacing.ts               #
│   │   └── theme.ts                 #
│   │
│   ├── supabase/                    # Supabase Backend Config
│   │   │
│   │   ├── functions/               # Edge Functions
│   │   │   ├── send-otp/
│   │   │   │   └── index.ts
│   │   │   ├── verify-otp/
│   │   │   │   └── index.ts
│   │   │   ├── paystack-webhook/    # Payment webhook
│   │   │   │   └── index.ts
│   │   │   ├── verify-payment/      # Payment verification
│   │   │   │   └── index.ts
│   │   │   ├── process-refund/      # Refund processing
│   │   │   │   └── index.ts
│   │   │   ├── assign-driver/       # Auto-assign driver
│   │   │   │   └── index.ts
│   │   │   ├── send-notification/   # Send notifications
│   │   │   │   └── index.ts
│   │   │   └── calculate-earnings/  # Calculate earnings
│   │   │       └── index.ts
│   │   │
│   │   ├── migrations/              # Database Migrations
│   │   │   ├── 20251114_add_profile_fields.sql
│   │   │   ├── 20251114_profile_tab_complete_schema.sql
│   │   │   ├── 20251119_create_cart_items_table.sql
│   │   │   ├── 20251119_seed_orders.sql
│   │   │   ├── 20251119_seed_products.sql
│   │   │   ├── 20251201_add_deals_to_products.sql
│   │   │   ├── 20251202_enhanced_products_schema.sql
│   │   │   ├── 20251202_vendor_applications.sql
│   │   │   ├── 20251204_driver_tables.sql           #
│   │   │   ├── 20251204_delivery_tasks.sql          #
│   │   │   ├── 20251204_payments_wallet.sql         #
│   │   │   ├── 20251204_transactions.sql            #
│   │   │   ├── 20251204_earnings.sql                #
│   │   │   ├── 20251204_notifications.sql           #
│   │   │   ├── 20251204_realtime_triggers.sql       #
│   │   │   ├── 20251204_menu_schedule.sql           #
│   │   │   ├── 20251204_handoff_system.sql          #
│   │   │   ├── create_email_otps.sql
│   │   │   └── sample-products.sql
│   │   │
│   │   ├── policies/                # Row Level Security Policies
│   │   │   ├── drivers.sql
│   │   │   ├── deliveries.sql
│   │   │   ├── payments.sql
│   │   │   ├── wallet.sql
│   │   │   └── transactions.sql
│   │   │
│   │   ├── test_data/               # Test Data Seeds
│   │   │   ├── test_vendor_applications.sql
│   │   │   ├── test_drivers.sql     #
│   │   │   ├── test_deliveries.sql  #
│   │   │   └── test_payments.sql    #
│   │   │
│   │   └── setup-profiles.sql       # Initial setup
│   │
│   ├── types/                       # TypeScript Type Definitions
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   ├── payment.types.ts
│   │   ├── driver.types.ts
│   │   ├── vendor.types.ts
│   │   ├── notification.types.ts
│   │   └── database.types.ts        # Generated from Supabase
│   │
│   ├── utils/                       # Utility Functions
│   │   ├── time.ts
│   │   ├── currency.ts              #
│   │   ├── validation.ts            #
│   │   ├── distance.ts              #
│   │   ├── permissions.ts           #
│   │   ├── storage.ts               #
│   │   └── constants.ts             #
│   │
│   ├── .env                         # Environment variables (gitignored)
│   ├── .env.example                 # Environment template
│   ├── .env.development             # Development environment
│   ├── .env.production              # Production environment
│   ├── .gitignore
│   ├── .npmrc
│   ├── .prettierrc
│   ├── app.json                     # Expo configuration
│   ├── eas.json                     # EAS Build configuration
│   ├── eslint.config.js             # ESLint configuration
│   ├── expo-env.d.ts                # Expo type definitions
│   ├── HOT_DEALS_GUIDE.md           # Feature documentation
│   ├── jest.config.js               # Jest test configuration
│   ├── metro.config.js              # Metro bundler config
│   ├── package.json                 # Dependencies
│   ├── package-lock.json
│   └── tsconfig.json                # TypeScript configuration
│
├── .gitignore                       # Git ignore rules
├── LICENSE                          # Project license
├── CONTRIBUTING.md                  # Contribution guidelines
├── CHANGELOG.md                     # Version changelog
└── README.md                        # Main documentation
```

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
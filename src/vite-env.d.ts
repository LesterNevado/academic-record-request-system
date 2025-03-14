
/// <reference types="vite/client" />

// Add Stripe publishable key to Window interface
interface Window {
  STRIPE_PUBLISHABLE_KEY: string;
}

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PincodeResult {
  pincode: string;
  city: string;
  state: string;
  etaLabel: string;
  serviceable: boolean;
}

export interface PickupPoint {
  id: string;
  name: string;
  addressLine: string;
  distanceLabel: string;
  timingsLabel: string;
}

export interface OrderLine {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface OrderTotals {
  currency: string;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PaymentOption {
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

export type FulfilmentMode = "delivery" | "pickup";

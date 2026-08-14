import { useState } from "react";
import { CheckoutCard } from "./CheckoutCard";
import { CheckoutField } from "./CheckoutField";
import { OrderSummary } from "./OrderSummary";
import { PaymentOptions } from "./PaymentOptions";
import { PickupPointSelector } from "./PickupPointSelector";
import { PincodeLocator } from "./PincodeLocator";
import {
  sampleOrderLines,
  samplePaymentOptions,
  samplePickupPoints,
  sampleTotals,
} from "./sampleCheckout";
import type {
  DeliveryDetails,
  FulfilmentMode,
  OrderLine,
  OrderTotals,
  PaymentOption,
  PickupPoint,
} from "./types";

interface CheckoutPageProps {
  lines?: OrderLine[];
  totals?: OrderTotals;
  pickupPoints?: PickupPoint[];
  paymentOptions?: PaymentOption[];
  onPlaceOrder?: (payload: {
    details: DeliveryDetails;
    mode: FulfilmentMode;
    pickupPointId: string | null;
    paymentId: string;
  }) => void;
}

const emptyDetails: DeliveryDetails = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

export function CheckoutPage({
  lines = sampleOrderLines,
  totals = sampleTotals,
  pickupPoints = samplePickupPoints,
  paymentOptions = samplePaymentOptions,
  onPlaceOrder,
}: CheckoutPageProps) {
  const [details, setDetails] = useState<DeliveryDetails>(emptyDetails);
  const [mode, setMode] = useState<FulfilmentMode>("delivery");
  const [pickupPointId, setPickupPointId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>(paymentOptions[0]?.id ?? "");

  const set = (key: keyof DeliveryDetails) => (value: string) =>
    setDetails((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review your delivery, pickup and payment details before placing the order.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-5">
            <CheckoutCard step={1} title="Delivery details">
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckoutField
                  id="co-name"
                  label="Full name"
                  autoComplete="name"
                  placeholder="Ananya Sharma"
                  value={details.fullName}
                  onChange={(e) => set("fullName")(e.target.value)}
                />
                <CheckoutField
                  id="co-phone"
                  label="Phone number"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={details.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                />
                <CheckoutField
                  id="co-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={details.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className="sm:col-span-1"
                />
                <CheckoutField
                  id="co-address1"
                  label="Address line 1"
                  autoComplete="address-line1"
                  placeholder="Flat / House no., building"
                  value={details.addressLine1}
                  onChange={(e) => set("addressLine1")(e.target.value)}
                />
                <CheckoutField
                  id="co-address2"
                  label="Address line 2"
                  autoComplete="address-line2"
                  placeholder="Street, area, landmark"
                  value={details.addressLine2}
                  onChange={(e) => set("addressLine2")(e.target.value)}
                />
                <CheckoutField
                  id="co-city"
                  label="City"
                  autoComplete="address-level2"
                  placeholder="Bengaluru"
                  value={details.city}
                  onChange={(e) => set("city")(e.target.value)}
                />
                <CheckoutField
                  id="co-state"
                  label="State"
                  autoComplete="address-level1"
                  placeholder="Karnataka"
                  value={details.state}
                  onChange={(e) => set("state")(e.target.value)}
                />
              </div>
            </CheckoutCard>

            <CheckoutCard
              step={2}
              title="PIN code & location"
              description="Confirm serviceability and delivery time for your area."
            >
              <PincodeLocator
                value={details.pincode}
                onChange={set("pincode")}
                onResolved={(result) => {
                  if (result.serviceable) {
                    setDetails((prev) => ({
                      ...prev,
                      city: prev.city || result.city,
                      state: prev.state || result.state,
                    }));
                  }
                }}
              />
            </CheckoutCard>

            <CheckoutCard
              step={3}
              title="Pickup point"
              description="Prefer collecting it yourself? Choose a nearby pickup point."
            >
              <div className="mb-4 inline-flex rounded-lg border border-neutral-200 p-1">
                {(["delivery", "pickup"] as FulfilmentMode[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      mode === value
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {value === "delivery" ? "Home delivery" : "Store pickup"}
                  </button>
                ))}
              </div>

              {mode === "pickup" ? (
                <PickupPointSelector
                  points={pickupPoints}
                  selectedId={pickupPointId}
                  onSelect={setPickupPointId}
                />
              ) : (
                <p className="text-sm text-neutral-500">
                  Your order will be delivered to the address above.
                </p>
              )}
            </CheckoutCard>

            <CheckoutCard step={4} title="Payment">
              <PaymentOptions
                options={paymentOptions}
                selectedId={paymentId}
                onSelect={setPaymentId}
              />
            </CheckoutCard>
          </div>

          <OrderSummary
            lines={lines}
            totals={totals}
            disabled={mode === "pickup" && !pickupPointId}
            onPlaceOrder={() => onPlaceOrder?.({ details, mode, pickupPointId, paymentId })}
          />
        </div>
      </div>
    </main>
  );
}

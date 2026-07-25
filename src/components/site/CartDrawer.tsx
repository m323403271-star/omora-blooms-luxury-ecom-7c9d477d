                    <p className="text-[color:var(--gold)] text-sm mt-1">{formatPrice(i.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center hairline border rounded-full">
                        <button onClick={() => setQuantity(i.id, i.quantity - 1)} className="p-1.5" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm px-2 min-w-6 text-center">{i.quantity}</span>
                        <button onClick={() => setQuantity(i.id, i.quantity + 1)} className="p-1.5" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => remove(i.id)} className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)]">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t hairline px-6 py-5 space-y-4">
              {/* Airport pickup */}
              <div className="rounded-xl border hairline p-3">
                <label className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[color:var(--gold)]">
                  <MapPin className="h-3.5 w-3.5" /> Airport Pickup <span className="text-[color:var(--destructive)]">*</span>
                </label>
                <select
                  required
                  value={pickup}
                  onChange={(e) => updatePickup(e.target.value)}
                  className="mt-2 w-full bg-[color:var(--noir)] border hairline rounded-lg px-2.5 py-2 text-xs text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
                >
                  <option value="">Select a pickup point…</option>
                  {PICKUP_POINTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <p className="mt-2 flex items-start gap-1.5 text-[10px] text-[color:var(--muted-foreground)] leading-relaxed">
                  <ShieldAlert className="h-3 w-3 mt-0.5 text-[color:var(--gold)] flex-shrink-0" />
                  <span>Security rules restrict entry to gate check-in areas. Meet our agent at your chosen Pickup Point.</span>
                </p>
                <p className="mt-1 text-[10px] text-[color:var(--gold)]">⚡ Express 20–30 min delivery window.</p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted-foreground)]">Subtotal</span>
                <span className="text-[color:var(--gold)] font-medium">{formatPrice(total)}</span>
              </div>
              {ref && (
                <p className="text-[11px] text-[color:var(--gold)]">Referral applied: {ref}</p>
              )}
              <p className="text-xs text-[color:var(--muted-foreground)]">Shipping & taxes calculated at checkout. Complimentary luxury packaging included.</p>
              <button
                disabled={paying}
                onClick={async () => {
                  if (!pickup) { toast.error("Please select an airport pickup point to continue."); return; }
                  setPaying(true);
                  try {
                    await startRazorpayCheckout(items, (orderId) => {
                      savePickupForOrder(orderId, pickup);
                      clear();
                      close();
                      navigate({ to: "/order/$orderId", params: { orderId } });
                    });
                  } finally {
                    setPaying(false);
                  }
                }}
                className="btn-gold w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" /> {paying ? "Starting…" : "Pay with Razorpay"}
              </button>

              <a
                href={whatsappLink(message)}
                onClick={handleCheckout}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm"
              >
                <MessageCircle className="h-4 w-4" /> Order via WhatsApp
              </a>
              <Link to="/cart" onClick={close} className="btn-outline-gold w-full inline-flex items-center justify-center py-3 rounded-full text-sm">
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

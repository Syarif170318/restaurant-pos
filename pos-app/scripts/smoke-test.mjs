const BASE = process.env.BASE_URL ?? "http://localhost:3001";

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed++;
  console.error(`  ✗ ${name}: ${detail}`);
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log(`\nSmoke test → ${BASE}\n`);

  // 1. Login kasir
  const login = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "kasir1", pin: "1111" }),
  });
  if (!login.json.success || !login.json.data?.token) {
    fail("Login kasir1", JSON.stringify(login.json));
    return summary();
  }
  const token = login.json.data.token;
  const outletId = login.json.data.outletId;
  ok(`Login kasir1 (outletId: ${outletId?.slice(0, 8)}...)`);

  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 2. Auth me + outlet
  const me = await api("/api/auth/me", { headers: auth });
  if (!me.json.success || !me.json.data?.outlet?.name) {
    fail("GET /api/auth/me", JSON.stringify(me.json));
  } else {
    ok(`Auth me → outlet: ${me.json.data.outlet.name}`);
  }

  // 3. Tables (outlet scoped)
  const tables = await api("/api/tables", { headers: auth });
  if (!tables.json.success || tables.json.data.length === 0) {
    fail("GET /api/tables", "no tables");
  } else {
    ok(`Tables: ${tables.json.data.length} meja`);
  }

  // 4. Shift open (tolerate already open from prior run)
  const shiftOpen = await api("/api/shifts", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ action: "open", openingCash: 500000 }),
  });
  if (shiftOpen.json.success) {
    ok("Shift opened");
  } else if (shiftOpen.json.error === "Shift already open") {
    ok("Shift already open (OK)");
  } else {
    fail("Shift open", JSON.stringify(shiftOpen.json));
  }

  // 5. Menu + modifiers (via categories — same as mobile POS)
  const categories = await api("/api/menu/categories", { headers: auth });
  const allItems = (categories.json.data ?? []).flatMap((c) => c.items ?? []);
  if (!categories.json.success || allItems.length === 0) {
    fail("GET /api/menu/categories", "empty");
  } else {
    ok(`Menu via categories: ${allItems.length} items`);
  }
  const extraPedas = allItems
    .flatMap((i) => i.modifiers ?? [])
    .find((m) => m.name?.includes("Pedas"));
  if (!extraPedas) {
    fail("Modifiers", "Extra Pedas not found");
  } else {
    ok("Modifiers incl. Extra Pedas");
  }

  const nasiGoreng = allItems.find((m) => m.name.includes("Nasi Goreng"));
  if (!nasiGoreng) {
    fail("Order flow", "Nasi Goreng not in menu");
    return summary();
  }

  // 6. Create order with modifier
  const tableId = tables.json.data[0]?.id;
  const orderCreate = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "dine_in",
      tableId,
      items: [
        { menuItemId: nasiGoreng.id, quantity: 2, modifierIds: extraPedas ? [extraPedas.id] : [] },
      ],
    }),
  });
  if (!orderCreate.json.success) {
    fail("Create order", JSON.stringify(orderCreate.json));
    return summary();
  }
  const orderId = orderCreate.json.data.id;
  ok(`Order created: ${orderCreate.json.data.orderNumber}`);

  // 7. Confirm order
  const confirm = await api(`/api/orders/${orderId}/confirm`, { method: "POST", headers: auth });
  if (!confirm.json.success) {
    fail("Confirm order", JSON.stringify(confirm.json));
  } else {
    ok("Order confirmed");
  }

  // 8. QRIS payment (digital_wallet)
  const total = confirm.json.data?.totalAmount ?? orderCreate.json.data.totalAmount;
  const payQris = await api("/api/payments", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderId,
      paymentMethod: "digital_wallet",
      amountReceived: total,
      referenceNumber: "QRIS-TEST-001",
    }),
  });
  if (!payQris.json.success || !payQris.json.data?.qrisReference) {
    fail("QRIS payment", JSON.stringify(payQris.json));
  } else {
    ok(`QRIS payment OK (ref: ${payQris.json.data.qrisReference})`);
  }

  // 9. Reports (manager role)
  const mgrLogin = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "manager1", password: "password123" }),
  });
  const mgrAuth = {
    Authorization: `Bearer ${mgrLogin.json.data.token}`,
    "Content-Type": "application/json",
  };
  const report = await api("/api/reports/daily-summary", { headers: mgrAuth });
  if (!report.json.success) {
    fail("Daily summary", JSON.stringify(report.json));
  } else {
    ok(`Reports: ${report.json.data.orderCount} orders today`);
  }

  // --- Second order for split bill + void ---
  const order2 = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "takeaway",
      items: [
        { menuItemId: nasiGoreng.id, quantity: 1 },
        { menuItemId: allItems.find((m) => m.name.includes("Es Teh"))?.id ?? nasiGoreng.id, quantity: 1 },
      ],
    }),
  });
  if (!order2.json.success) {
    fail("Create order 2 (split)", JSON.stringify(order2.json));
    return summary();
  }
  const order2Id = order2.json.data.id;
  await api(`/api/orders/${order2Id}/confirm`, { method: "POST", headers: auth });

  const order2Full = await api(`/api/orders/${order2Id}`, { headers: auth });
  const items = order2Full.json.data?.items ?? [];
  if (items.length < 2) {
    fail("Split bill setup", "need 2 items");
  } else {
    const itemId = items[0].id;
    const splitPay = await api("/api/payments", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        orderId: order2Id,
        paymentMethod: "cash",
        amountReceived: 100000,
        itemIds: [itemId],
      }),
    });
    if (!splitPay.json.success || splitPay.json.data.fullyPaid) {
      fail("Split bill partial pay", JSON.stringify(splitPay.json));
    } else {
      ok("Split bill partial payment");
    }
  }

  // 10. Void order (draft-like: create new and void before confirm)
  const order3 = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "takeaway",
      items: [{ menuItemId: nasiGoreng.id, quantity: 1 }],
    }),
  });
  const voidRes = await api(`/api/orders/${order3.json.data.id}/void`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ reason: "Smoke test void" }),
  });
  if (!voidRes.json.success) {
    fail("Void order", JSON.stringify(voidRes.json));
  } else {
    ok("Void order");
  }

  // 11. Admin outlets
  const adminLogin = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  const adminAuth = { Authorization: `Bearer ${adminLogin.json.data.token}` };
  const outlets = await api("/api/outlets", { headers: adminAuth });
  if (!outlets.json.success || outlets.json.data.length < 2) {
    fail("Outlets", `expected 2+, got ${outlets.json.data?.length}`);
  } else {
    ok(`Outlets: ${outlets.json.data.length} cabang`);
  }

  // 12. Outlet isolation — tables from outlet2 should differ
  const out2 = outlets.json.data.find((o) => o.code === "OUT2");
  if (out2) {
    const reportOut2 = await api(`/api/reports/daily-summary?outletId=${out2.id}`, {
      headers: adminAuth,
    });
    if (!reportOut2.json.success) {
      fail("Report outlet 2", JSON.stringify(reportOut2.json));
    } else {
      ok(`Outlet 2 report: ${reportOut2.json.data.orderCount} orders (isolated)`);
    }
  }

  // 13. Inventory opname
  const invLogin = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "inventory1", password: "password123" }),
  });
  const invAuth = {
    Authorization: `Bearer ${invLogin.json.data.token}`,
    "Content-Type": "application/json",
  };
  const ingredients = await api("/api/inventory/ingredients", { headers: invAuth });
  if (!ingredients.json.success || ingredients.json.data.length === 0) {
    fail("Inventory ingredients", "empty");
  } else {
    const ing = ingredients.json.data[0];
    const current = ing.stock?.currentStock ?? 0;
    const opname = await api("/api/inventory/opname", {
      method: "POST",
      headers: invAuth,
      body: JSON.stringify({ ingredientId: ing.id, actualStock: current - 1 }),
    });
    if (!opname.json.success) {
      fail("Stock opname", JSON.stringify(opname.json));
    } else {
      ok(`Stock opname (adj: ${opname.json.data.adjustment})`);
    }
  }

  // 14. Suppliers
  const suppliers = await api("/api/suppliers", { headers: invAuth });
  if (!suppliers.json.success || suppliers.json.data.length === 0) {
    fail("Suppliers", "empty");
  } else {
    ok(`Suppliers: ${suppliers.json.data.length}`);
  }

  // 15. Shift close
  const shiftClose = await api("/api/shifts", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ action: "close", closingCash: 600000 }),
  });
  if (!shiftClose.json.success) {
    fail("Shift close", JSON.stringify(shiftClose.json));
  } else {
    ok("Shift closed");
  }

  // 16. QR Menu public order
  const pubMenu = await api("/api/public/menu?outlet=OUT1");
  if (!pubMenu.json.success || !pubMenu.json.data.categories?.length) {
    fail("Public QR menu", JSON.stringify(pubMenu.json));
  } else {
    ok("Public QR menu");
  }
  const qrItem = pubMenu.json.data.categories.flatMap((c) => c.items)[0];
  const qrOrder = await api("/api/public/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      outletCode: "OUT1",
      tableNumber: "A1",
      customerName: "QR Test",
      customerPhone: "081111111111",
      items: [{ menuItemId: qrItem.id, quantity: 1 }],
    }),
  });
  if (!qrOrder.json.success) {
    fail("QR order", JSON.stringify(qrOrder.json));
  } else {
    ok(`QR order: ${qrOrder.json.data.orderNumber}`);
  }

  // 17. Loyalty payment with redeem
  const orderLoyalty = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "takeaway",
      items: [{ menuItemId: nasiGoreng.id, quantity: 1 }],
    }),
  });
  await api(`/api/orders/${orderLoyalty.json.data.id}/confirm`, { method: "POST", headers: auth });
  const loyaltyPay = await api("/api/payments", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderId: orderLoyalty.json.data.id,
      paymentMethod: "cash",
      amountReceived: 100000,
      customerPhone: "081234567890",
      customerName: "Budi Pelanggan",
      redeemPoints: 10,
    }),
  });
  if (!loyaltyPay.json.success) {
    fail("Loyalty payment redeem", JSON.stringify(loyaltyPay.json));
  } else {
    ok("Loyalty payment with 10pt redeem");
  }

  // 18. Loyalty lookup
  const loyalty = await api("/api/loyalty/lookup?phone=081234567890", { headers: mgrAuth });
  if (!loyalty.json.success) {
    fail("Loyalty lookup", JSON.stringify(loyalty.json));
  } else {
    ok(`Loyalty: ${loyalty.json.data.customer.name} (${loyalty.json.data.customer.loyaltyPoints} pts)`);
  }

  // 19. Receipt thermal text
  const receiptRes = await fetch(`${BASE}/api/orders/${orderId}/receipt`, {
    headers: { Authorization: auth.Authorization },
  });
  if (!receiptRes.ok || !(await receiptRes.text()).includes("TOTAL")) {
    fail("Receipt", `status ${receiptRes.status}`);
  } else {
    ok("Thermal receipt text");
  }

  // 20. Refund (need paid order - use order from QRIS pay)
  const refund = await api(`/api/payments/${payQris.json.data.order.payments[0].id}/refund`, {
    method: "POST",
    headers: adminAuth,
    body: JSON.stringify({ reason: "Smoke test refund" }),
  });
  if (!refund.json.success) {
    fail("Refund", JSON.stringify(refund.json));
  } else {
    ok("Refund payment");
  }

  // 21. Hold order
  const holdOrder = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "dine_in",
      tableId,
      items: [{ menuItemId: nasiGoreng.id, quantity: 1 }],
    }),
  });
  const holdRes = await api(`/api/orders/${holdOrder.json.data.id}/hold`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ hold: true }),
  });
  if (!holdRes.json.success || !holdRes.json.data?.isHeld) {
    fail("Hold order", JSON.stringify(holdRes.json));
  } else {
    ok("Hold order");
  }

  // 22. Rush order
  const rushOrder = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "takeaway",
      items: [{ menuItemId: nasiGoreng.id, quantity: 1 }],
    }),
  });
  await api(`/api/orders/${rushOrder.json.data.id}/confirm`, { method: "POST", headers: auth });
  const rushRes = await api(`/api/orders/${rushOrder.json.data.id}/rush`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ rush: true }),
  });
  if (!rushRes.json.success || !rushRes.json.data?.isRush) {
    fail("Rush order", JSON.stringify(rushRes.json));
  } else {
    ok("Rush order");
  }

  // 23. Reservations
  const resv = await api("/api/reservations", {
    method: "POST",
    headers: mgrAuth,
    body: JSON.stringify({
      customerName: "Smoke Guest",
      phone: "081000000001",
      partySize: 2,
      reservedAt: new Date(Date.now() + 3600000).toISOString(),
      tableId,
    }),
  });
  if (!resv.json.success) {
    fail("Create reservation", JSON.stringify(resv.json));
  } else {
    ok("Reservation created");
  }

  // 24. Purchase order
  const poList = await api("/api/inventory/purchase-orders", { headers: invAuth });
  if (!poList.json.success) {
    fail("List PO", JSON.stringify(poList.json));
  } else {
    ok(`Purchase orders: ${poList.json.data.length}`);
  }

  // 25. Audit logs
  const audit = await api("/api/audit/logs", { headers: adminAuth });
  if (!audit.json.success) {
    fail("Audit logs", JSON.stringify(audit.json));
  } else {
    const auditCount =
      (audit.json.data.loginAudits?.length ?? 0) +
      (audit.json.data.transactionLogs?.length ?? 0);
    ok(`Audit logs: ${auditCount} entries`);
  }

  // 26. Users CRUD list
  const users = await api("/api/users", { headers: adminAuth });
  if (!users.json.success || users.json.data.length < 4) {
    fail("Users list", `got ${users.json.data?.length}`);
  } else {
    ok(`Users: ${users.json.data.length}`);
  }

  // 27. Reports export + forecast
  const csvRes = await fetch(`${BASE}/api/reports/export/csv?period=day`, {
    headers: { Authorization: mgrAuth.Authorization },
  });
  if (!csvRes.ok) {
    fail("CSV export", `status ${csvRes.status}`);
  } else {
    ok("CSV export");
  }
  const forecast = await api("/api/reports/forecast", { headers: mgrAuth });
  if (!forecast.json.success) {
    fail("Sales forecast", JSON.stringify(forecast.json));
  } else {
    ok(`Forecast trend: ${forecast.json.data.trend}`);
  }

  // 28. Delivery webhook
  const delivery = await api("/api/delivery/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "grabfood",
      externalId: "GF-SMOKE-001",
      outletCode: "OUT1",
      customerName: "Grab Customer",
      customerPhone: "081222333444",
      items: [{ name: "Mie Goreng", qty: 1, price: 35000 }],
      totalAmount: 35000,
    }),
  });
  if (!delivery.json.success) {
    fail("Delivery webhook", JSON.stringify(delivery.json));
  } else {
    ok("Delivery webhook");
  }

  // 29. Multi-method payment
  const multiOrder = await api("/api/orders", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderType: "takeaway",
      items: [{ menuItemId: nasiGoreng.id, quantity: 2 }],
    }),
  });
  await api(`/api/orders/${multiOrder.json.data.id}/confirm`, { method: "POST", headers: auth });
  const multiFull = await api(`/api/orders/${multiOrder.json.data.id}`, { headers: auth });
  const multiTotal = multiFull.json.data?.totalAmount ?? 100000;
  const half = Math.ceil(multiTotal / 2);
  const multiPay = await api("/api/payments", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      orderId: multiOrder.json.data.id,
      amountReceived: multiTotal,
      payments: [
        { method: "cash", amount: half },
        { method: "card", amount: multiTotal - half },
      ],
    }),
  });
  if (!multiPay.json.success || !multiPay.json.data?.fullyPaid) {
    fail("Multi-method payment", JSON.stringify(multiPay.json));
  } else {
    ok("Multi-method payment (cash+card)");
  }

  summary();
}

function summary() {
  console.log(`\n--- Result: ${passed} passed, ${failed} failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

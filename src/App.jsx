
import { useState, useEffect, useCallback } from "react";

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt = (n) =>
  "ج.م " + Number(n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const now = () => new Date().toLocaleString("ar-EG");
const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── initial data ──────────────────────────────────────────────────────────
const INIT_USERS = [
  { id: "u1", name: "المدير", username: "admin", password: "admin123", role: "admin" },
  { id: "u2", name: "أمين المخزن", username: "store", password: "store123", role: "storekeeper" },
  { id: "u3", name: "مندوب المبيعات", username: "sales", password: "sales123", role: "salesman" },
  { id: "u4", name: "مسؤول الشراء", username: "buyer", password: "buyer123", role: "buyer" },
];

const INIT_PRODUCTS = [
  { id: "p1", name: "أسمنت", unit: "شيكارة", stock: 500, buyPrice: 95, sellPrice: 120, minStock: 50 },
  { id: "p2", name: "حديد تسليح", unit: "طن", stock: 20, buyPrice: 24000, sellPrice: 28000, minStock: 3 },
  { id: "p3", name: "طوب خرساني", unit: "قطعة", stock: 1200, buyPrice: 5.5, sellPrice: 8, minStock: 200 },
  { id: "p4", name: "جبس", unit: "شيكارة", stock: 80, buyPrice: 32, sellPrice: 45, minStock: 20 },
  { id: "p5", name: "أسمنت أبيض", unit: "شيكارة", stock: 60, buyPrice: 145, sellPrice: 180, minStock: 15 },
];

const ROLES = {
  admin: "مدير",
  storekeeper: "أمين مخزن",
  salesman: "مندوب مبيعات",
  buyer: "مسؤول شراء",
};

// ─── storage ───────────────────────────────────────────────────────────────
const load = (key, def) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
};
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── tiny components ───────────────────────────────────────────────────────
const Badge = ({ children, color = "gray" }) => {
  const colors = {
    green: { background: "#d1fae5", color: "#065f46" },
    red: { background: "#fee2e2", color: "#991b1b" },
    amber: { background: "#fef3c7", color: "#92400e" },
    blue: { background: "#dbeafe", color: "#1e40af" },
    gray: { background: "#f3f4f6", color: "#374151" },
    purple: { background: "#ede9fe", color: "#5b21b6" },
  };
  return (
    <span style={{ ...colors[color], fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, display: "inline-block" }}>
      {children}
    </span>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</label>}
    <input style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", background: "#fff", color: "#111" }} {...props} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</label>}
    <select style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#fff", color: "#111", boxSizing: "border-box" }} {...props}>{children}</select>
  </div>
);

const Btn = ({ children, onClick, color = "gray", small, disabled }) => {
  const colors = {
    gray: { background: "#f9fafb", border: "1px solid #d1d5db", color: "#374151" },
    blue: { background: "#2563eb", border: "none", color: "#fff" },
    green: { background: "#16a34a", border: "none", color: "#fff" },
    red: { background: "#dc2626", border: "none", color: "#fff" },
    amber: { background: "#d97706", border: "none", color: "#fff" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...colors[color], padding: small ? "5px 12px" : "8px 16px", borderRadius: 8, fontSize: small ? 12 : 13, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, fontWeight: 500 }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16, ...style }}>
    {children}
  </div>
);

const Table = ({ cols, rows, empty = "لا توجد بيانات" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "#f9fafb" }}>
          {cols.map((c, i) => (
            <th key={i} style={{ padding: "8px 10px", textAlign: "right", color: "#6b7280", fontWeight: 500, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>{empty}</td></tr>
        ) : rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
            {r.map((c, j) => <td key={j} style={{ padding: "8px 10px", color: "#111" }}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Metric = ({ label, value, color }) => (
  <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", flex: 1, minWidth: 120 }}>
    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || "#111" }}>{value}</div>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Toast = ({ msg }) =>
  msg ? <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1f2937", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, zIndex: 9999, whiteSpace: "nowrap" }}>{msg}</div> : null;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [users, setUsers] = useState(() => load("bu_users", INIT_USERS));
  const [products, setProducts] = useState(() => load("bu_products", INIT_PRODUCTS));
  const [customers, setCustomers] = useState(() => load("bu_customers", []));
  const [suppliers, setSuppliers] = useState(() => load("bu_suppliers", []));
  const [invoices, setInvoices] = useState(() => load("bu_invoices", []));
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);

  useEffect(() => { save("bu_users", users); }, [users]);
  useEffect(() => { save("bu_products", products); }, [products]);
  useEffect(() => { save("bu_customers", customers); }, [customers]);
  useEffect(() => { save("bu_suppliers", suppliers); }, [suppliers]);
  useEffect(() => { save("bu_invoices", invoices); }, [invoices]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const can = (roles) => roles.includes(currentUser?.role);

  if (!currentUser) return <Login users={users} onLogin={setCurrentUser} />;

  const navItems = [
    { id: "dashboard", label: "لوحة التحكم", icon: "📊", roles: ["admin", "storekeeper", "salesman", "buyer"] },
    { id: "sales", label: "المبيعات", icon: "🧾", roles: ["admin", "salesman"] },
    { id: "purchases", label: "المشتريات", icon: "🛒", roles: ["admin", "buyer"] },
    { id: "inventory", label: "المخزن", icon: "📦", roles: ["admin", "storekeeper"] },
    { id: "customers", label: "العملاء", icon: "👥", roles: ["admin", "salesman"] },
    { id: "suppliers", label: "الموردون", icon: "🏭", roles: ["admin", "buyer"] },
    { id: "invoices", label: "الفواتير", icon: "📋", roles: ["admin", "salesman", "buyer"] },
    { id: "products", label: "الأصناف", icon: "🧱", roles: ["admin", "storekeeper"] },
    { id: "users", label: "المستخدمون", icon: "🔑", roles: ["admin"] },
    { id: "reports", label: "التقارير", icon: "📈", roles: ["admin"] },
  ].filter(n => n.roles.includes(currentUser.role));

  const pages = {
    dashboard: <Dashboard products={products} invoices={invoices} customers={customers} suppliers={suppliers} />,
    sales: <SalesPage products={products} setProducts={setProducts} customers={customers} invoices={invoices} setInvoices={setInvoices} showToast={showToast} setModal={setModal} currentUser={currentUser} />,
    purchases: <PurchasesPage products={products} setProducts={setProducts} suppliers={suppliers} invoices={invoices} setInvoices={setInvoices} showToast={showToast} setModal={setModal} currentUser={currentUser} />,
    inventory: <InventoryPage products={products} setProducts={setProducts} showToast={showToast} setModal={setModal} />,
    customers: <PartyPage type="customer" parties={customers} setParties={setCustomers} invoices={invoices} showToast={showToast} setModal={setModal} />,
    suppliers: <PartyPage type="supplier" parties={suppliers} setParties={setSuppliers} invoices={invoices} showToast={showToast} setModal={setModal} />,
    invoices: <InvoicesPage invoices={invoices} customers={customers} suppliers={suppliers} setModal={setModal} />,
    products: <ProductsPage products={products} setProducts={setProducts} showToast={showToast} setModal={setModal} />,
    users: <UsersPage users={users} setUsers={setUsers} showToast={showToast} setModal={setModal} currentUser={currentUser} />,
    reports: <ReportsPage invoices={invoices} products={products} customers={customers} suppliers={suppliers} />,
  };

  return (
    <div dir="rtl" style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", background: "#f3f4f6", fontSize: 14 }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: "#1e293b", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 12px", borderBottom: "1px solid #334155" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>🏗️ البنا للمواد</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{currentUser.name} — {ROLES[currentUser.role]}</div>
        </div>
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "block", width: "100%", textAlign: "right", padding: "10px 14px", background: page === n.id ? "#2563eb" : "none", border: "none", color: page === n.id ? "#fff" : "#cbd5e1", fontSize: 13, cursor: "pointer", borderRadius: page === n.id ? 8 : 0, margin: page === n.id ? "1px 4px" : 0, width: page === n.id ? "calc(100% - 8px)" : "100%" }}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid #334155" }}>
          <Btn color="gray" onClick={() => setCurrentUser(null)}>🚪 خروج</Btn>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {pages[page] || <div style={{ color: "#6b7280" }}>الصفحة غير متاحة</div>}
      </div>

      {modal && modal}
      <Toast msg={toast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════
function Login({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    const u = users.find(u => u.username === username && u.password === password);
    if (u) onLogin(u);
    else setErr("اسم المستخدم أو كلمة المرور غير صحيحة");
  };
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>🏗️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginTop: 8 }}>البنا للمواد الإنشائية</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>تسجيل الدخول</div>
        </div>
        <Input label="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)} placeholder="أدخل اسم المستخدم" />
        <Input label="كلمة المرور" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" onKeyDown={e => e.key === "Enter" && handle()} />
        {err && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <Btn color="blue" onClick={handle}>دخول</Btn>
        <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#6b7280" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>بيانات الدخول:</div>
          {[["admin","admin123","مدير"],["store","store123","أمين مخزن"],["sales","sales123","مبيعات"],["buyer","buyer123","شراء"]].map(([u,p,r]) => (
            <div key={u}>{r}: <b>{u}</b> / {p}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({ products, invoices, customers, suppliers }) {
  const today = todayStr();
  const todaySales = invoices.filter(i => i.type === "sale" && i.date.startsWith(today));
  const todayBuys = invoices.filter(i => i.type === "purchase" && i.date.startsWith(today));
  const totalSales = todaySales.reduce((s, i) => s + i.total, 0);
  const totalBuys = todayBuys.reduce((s, i) => s + i.total, 0);
  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalDebt = customers.reduce((s, c) => s + (c.balance || 0), 0);
  const totalOwed = suppliers.reduce((s, s2) => s + (s2.balance || 0), 0);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>📊 لوحة التحكم — {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <Metric label="مبيعات اليوم" value={fmt(totalSales)} color="#16a34a" />
        <Metric label="مشتريات اليوم" value={fmt(totalBuys)} color="#dc2626" />
        <Metric label="صافي اليوم" value={fmt(totalSales - totalBuys)} color={totalSales >= totalBuys ? "#16a34a" : "#dc2626"} />
        <Metric label="ديون العملاء" value={fmt(totalDebt)} color="#d97706" />
        <Metric label="مستحقات الموردين" value={fmt(totalOwed)} color="#7c3aed" />
        <Metric label="تنبيهات المخزن" value={lowStock.length} color={lowStock.length > 0 ? "#dc2626" : "#16a34a"} />
      </div>

      {lowStock.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#dc2626" }}>⚠️ أصناف منخفضة المخزون</h3>
          <Table cols={["الصنف", "المخزون الحالي", "الحد الأدنى", "الوحدة"]}
            rows={lowStock.map(p => [p.name, p.stock, p.minStock, p.unit])} />
        </Card>
      )}

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📋 آخر الفواتير</h3>
        <Table
          cols={["رقم الفاتورة", "النوع", "التاريخ", "الجهة", "الإجمالي", "المبلغ المدفوع", "المتبقي"]}
          rows={[...invoices].reverse().slice(0, 10).map(i => [
            i.id.slice(-6).toUpperCase(),
            i.type === "sale" ? <Badge color="blue">بيع</Badge> : <Badge color="purple">شراء</Badge>,
            new Date(i.date).toLocaleDateString("ar-EG"),
            i.partyName || "—",
            fmt(i.total),
            fmt(i.paid),
            <span style={{ color: (i.total - i.paid) > 0 ? "#dc2626" : "#16a34a" }}>{fmt(i.total - i.paid)}</span>,
          ])}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SALES PAGE
// ═══════════════════════════════════════════════════════════════════════════
function SalesPage({ products, setProducts, customers, invoices, setInvoices, showToast, setModal, currentUser }) {
  const [items, setItems] = useState([{ productId: "", qty: 1, price: 0 }]);
  const [customerId, setCustomerId] = useState("");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const addItem = () => setItems([...items, { productId: "", qty: 1, price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    if (field === "productId") {
      const p = products.find(p => p.id === val);
      if (p) updated[i].price = p.sellPrice;
    }
    setItems(updated);
  };

  const total = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
  const remaining = total - (parseFloat(paid) || 0);

  const submit = () => {
    if (!items[0].productId) { showToast("اختر صنفاً على الأقل"); return; }
    for (const it of items) {
      const p = products.find(p => p.id === it.productId);
      if (!p) continue;
      if ((parseFloat(it.qty) || 0) > p.stock) { showToast(`المخزون غير كافٍ للصنف: ${p.name}`); return; }
    }

    // deduct stock
    const updatedProducts = products.map(p => {
      const it = items.find(i => i.productId === p.id);
      return it ? { ...p, stock: p.stock - (parseFloat(it.qty) || 0) } : p;
    });
    setProducts(updatedProducts);

    // build invoice
    const inv = {
      id: uid(),
      type: "sale",
      date: new Date().toISOString(),
      partyId: customerId || null,
      partyName: customers.find(c => c.id === customerId)?.name || "نقدي",
      items: items.map(it => ({ ...it, productName: products.find(p => p.id === it.productId)?.name || "" })),
      total,
      paid: parseFloat(paid) || 0,
      notes,
      createdBy: currentUser.name,
    };
    setInvoices([...invoices, inv]);
    showToast("✅ تم تسجيل فاتورة البيع");
    setItems([{ productId: "", qty: 1, price: 0 }]);
    setPaid(0);
    setNotes("");
    setModal(<InvoicePreview inv={inv} onClose={() => setModal(null)} />);
  };

  const todaySales = invoices.filter(i => i.type === "sale" && i.date.startsWith(todayStr()));

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>🧾 تسجيل فاتورة بيع</h2>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Select label="العميل (اختياري)">
            <option value="">نقدي</option>
            {customers.map(c => <option key={c.id} value={c.id} onClick={() => setCustomerId(c.id)}>{c.name}</option>)}
          </Select>
          <div />
        </div>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>الأصناف</h4>
        {items.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
            <Select label={i === 0 ? "الصنف" : undefined} value={it.productId} onChange={e => updateItem(i, "productId", e.target.value)}>
              <option value="">اختر صنفاً</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.stock} {p.unit})</option>)}
            </Select>
            <Input label={i === 0 ? "الكمية" : undefined} type="number" value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} />
            <Input label={i === 0 ? "سعر البيع" : undefined} type="number" value={it.price} onChange={e => updateItem(i, "price", e.target.value)} />
            <Btn color="red" small onClick={() => removeItem(i)} disabled={items.length === 1}>✕</Btn>
          </div>
        ))}
        <Btn color="gray" onClick={addItem} small>+ إضافة صنف</Btn>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 14, paddingTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>الإجمالي</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{fmt(total)}</div>
            </div>
            <div>
              <Input label="المبلغ المدفوع (ج.م)" type="number" value={paid} onChange={e => setPaid(e.target.value)} />
            </div>
            <div style={{ background: remaining > 0 ? "#fef2f2" : "#f0fdf4", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>المتبقي (دين)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{fmt(remaining)}</div>
            </div>
          </div>
          <Input label="ملاحظات" value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
          <div style={{ marginTop: 8 }}><Btn color="green" onClick={submit}>✅ تسجيل الفاتورة</Btn></div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>مبيعات اليوم ({todaySales.length})</h3>
        <Table
          cols={["رقم الفاتورة", "العميل", "الإجمالي", "مدفوع", "متبقي", "الوقت", ""]}
          rows={todaySales.map(inv => [
            inv.id.slice(-6).toUpperCase(),
            inv.partyName,
            fmt(inv.total),
            fmt(inv.paid),
            <span style={{ color: (inv.total - inv.paid) > 0 ? "#dc2626" : "#16a34a" }}>{fmt(inv.total - inv.paid)}</span>,
            new Date(inv.date).toLocaleTimeString("ar-EG"),
            <Btn small color="gray" onClick={() => setModal(<InvoicePreview inv={inv} onClose={() => setModal(null)} />)}>عرض</Btn>,
          ])}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASES PAGE
// ═══════════════════════════════════════════════════════════════════════════
function PurchasesPage({ products, setProducts, suppliers, invoices, setInvoices, showToast, setModal, currentUser }) {
  const [items, setItems] = useState([{ productId: "", qty: 1, price: 0 }]);
  const [supplierId, setSupplierId] = useState("");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const addItem = () => setItems([...items, { productId: "", qty: 1, price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    if (field === "productId") {
      const p = products.find(p => p.id === val);
      if (p) updated[i].price = p.buyPrice;
    }
    setItems(updated);
  };

  const total = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
  const remaining = total - (parseFloat(paid) || 0);

  const submit = () => {
    if (!items[0].productId) { showToast("اختر صنفاً على الأقل"); return; }
    const updatedProducts = products.map(p => {
      const it = items.find(i => i.productId === p.id);
      return it ? { ...p, stock: p.stock + (parseFloat(it.qty) || 0), buyPrice: parseFloat(it.price) || p.buyPrice } : p;
    });
    setProducts(updatedProducts);
    const inv = {
      id: uid(),
      type: "purchase",
      date: new Date().toISOString(),
      partyId: supplierId || null,
      partyName: suppliers.find(s => s.id === supplierId)?.name || "نقدي",
      items: items.map(it => ({ ...it, productName: products.find(p => p.id === it.productId)?.name || "" })),
      total,
      paid: parseFloat(paid) || 0,
      notes,
      createdBy: currentUser.name,
    };
    setInvoices([...invoices, inv]);
    showToast("✅ تم تسجيل فاتورة الشراء");
    setItems([{ productId: "", qty: 1, price: 0 }]);
    setPaid(0);
    setNotes("");
    setModal(<InvoicePreview inv={inv} onClose={() => setModal(null)} />);
  };

  const todayBuys = invoices.filter(i => i.type === "purchase" && i.date.startsWith(todayStr()));

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>🛒 تسجيل فاتورة شراء</h2>
      <Card>
        <Select label="المورد (اختياري)" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
          <option value="">نقدي / غير محدد</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>الأصناف</h4>
        {items.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
            <Select label={i === 0 ? "الصنف" : undefined} value={it.productId} onChange={e => updateItem(i, "productId", e.target.value)}>
              <option value="">اختر صنفاً</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Input label={i === 0 ? "الكمية" : undefined} type="number" value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} />
            <Input label={i === 0 ? "سعر الشراء" : undefined} type="number" value={it.price} onChange={e => updateItem(i, "price", e.target.value)} />
            <Btn color="red" small onClick={() => removeItem(i)} disabled={items.length === 1}>✕</Btn>
          </div>
        ))}
        <Btn color="gray" onClick={addItem} small>+ إضافة صنف</Btn>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 14, paddingTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>الإجمالي</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>{fmt(total)}</div>
            </div>
            <Input label="المبلغ المدفوع (ج.م)" type="number" value={paid} onChange={e => setPaid(e.target.value)} />
            <div style={{ background: remaining > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>المتبقي (مستحق)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: remaining > 0 ? "#d97706" : "#16a34a" }}>{fmt(remaining)}</div>
            </div>
          </div>
          <Input label="ملاحظات" value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
          <div style={{ marginTop: 8 }}><Btn color="blue" onClick={submit}>✅ تسجيل الفاتورة</Btn></div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>مشتريات اليوم ({todayBuys.length})</h3>
        <Table
          cols={["رقم الفاتورة", "المورد", "الإجمالي", "مدفوع", "متبقي", "الوقت", ""]}
          rows={todayBuys.map(inv => [
            inv.id.slice(-6).toUpperCase(),
            inv.partyName,
            fmt(inv.total),
            fmt(inv.paid),
            <span style={{ color: (inv.total - inv.paid) > 0 ? "#d97706" : "#16a34a" }}>{fmt(inv.total - inv.paid)}</span>,
            new Date(inv.date).toLocaleTimeString("ar-EG"),
            <Btn small color="gray" onClick={() => setModal(<InvoicePreview inv={inv} onClose={() => setModal(null)} />)}>عرض</Btn>,
          ])}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════
function InventoryPage({ products, setProducts, showToast, setModal }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>📦 المخزون</h2>
      </div>
      <Card>
        <Table
          cols={["الصنف", "المخزون", "الوحدة", "سعر الشراء", "سعر البيع", "الحد الأدنى", "الحالة", ""]}
          rows={products.map(p => [
            p.name,
            p.stock.toLocaleString("ar-EG"),
            p.unit,
            fmt(p.buyPrice),
            fmt(p.sellPrice),
            p.minStock,
            p.stock <= p.minStock ? <Badge color="red">منخفض</Badge> : <Badge color="green">جيد</Badge>,
            <Btn small color="amber" onClick={() => setModal(
              <EditInventoryModal product={p} products={products} setProducts={setProducts} showToast={showToast} onClose={() => setModal(null)} />
            )}>تعديل</Btn>,
          ])}
        />
      </Card>
    </div>
  );
}

function EditInventoryModal({ product, products, setProducts, showToast, onClose }) {
  const [form, setForm] = useState({ ...product });
  const save = () => {
    setProducts(products.map(p => p.id === form.id ? { ...form, stock: parseFloat(form.stock) || 0, buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0, minStock: parseFloat(form.minStock) || 0 } : p));
    showToast("✅ تم تحديث بيانات الصنف");
    onClose();
  };
  return (
    <Modal title={`تعديل: ${product.name}`} onClose={onClose}>
      <Input label="المخزون الحالي" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
      <Input label="سعر الشراء (ج.م)" type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} />
      <Input label="سعر البيع (ج.م)" type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
      <Input label="الحد الأدنى للتنبيه" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>إلغاء</Btn>
        <Btn color="green" onClick={save}>حفظ</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS / SUPPLIERS (unified)
// ═══════════════════════════════════════════════════════════════════════════
function PartyPage({ type, parties, setParties, invoices, showToast, setModal }) {
  const isCustomer = type === "customer";
  const label = isCustomer ? "العميل" : "المورد";
  const labelPlural = isCustomer ? "العملاء" : "الموردون";
  const icon = isCustomer ? "👥" : "🏭";

  const partyInvoices = (id) => invoices.filter(i => i.partyId === id);
  const balance = (id) => {
    const invs = partyInvoices(id);
    return invs.reduce((s, i) => s + (i.total - i.paid), 0);
  };

  const addParty = (form) => {
    setParties([...parties, { id: uid(), ...form, balance: 0, createdAt: now() }]);
    showToast(`✅ تم إضافة ${label}`);
    setModal(null);
  };

  const recordPayment = (party, amount, note) => {
    setParties(parties.map(p => p.id === party.id ? { ...p, balance: Math.max(0, (p.balance || 0) - parseFloat(amount)) } : p));
    showToast(`✅ تم تسجيل دفعة من ${party.name}`);
    setModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{icon} {labelPlural}</h2>
        <Btn color="blue" onClick={() => setModal(<AddPartyModal label={label} onSave={addParty} onClose={() => setModal(null)} />)}>+ إضافة {label}</Btn>
      </div>
      <Card>
        <Table
          cols={["الاسم", "الهاتف", "العنوان", "الرصيد المستحق", "عدد الفواتير", "", ""]}
          rows={parties.map(p => {
            const bal = balance(p.id);
            return [
              p.name,
              p.phone || "—",
              p.address || "—",
              <span style={{ color: bal > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{fmt(bal)}</span>,
              partyInvoices(p.id).length,
              <Btn small color="gray" onClick={() => setModal(<PartyDetail party={p} invoices={partyInvoices(p.id)} isCustomer={isCustomer} onClose={() => setModal(null)} onPayment={recordPayment} />)}>التفاصيل</Btn>,
              <Btn small color="green" onClick={() => setModal(<PaymentModal party={p} isCustomer={isCustomer} onSave={recordPayment} onClose={() => setModal(null)} />)}>دفعة</Btn>,
            ];
          })}
        />
      </Card>
    </div>
  );
}

function AddPartyModal({ label, onSave, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  return (
    <Modal title={`إضافة ${label} جديد`} onClose={onClose}>
      <Input label="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <Input label="رقم الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <Input label="العنوان" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
      <Input label="ملاحظات" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>إلغاء</Btn>
        <Btn color="blue" onClick={() => form.name && onSave(form)}>حفظ</Btn>
      </div>
    </Modal>
  );
}

function PartyDetail({ party, invoices, isCustomer, onClose, onPayment }) {
  const total = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const remaining = total - totalPaid;
  return (
    <Modal title={`كشف حساب: ${party.name}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <Metric label="إجمالي الفواتير" value={fmt(total)} />
        <Metric label="إجمالي المدفوع" value={fmt(totalPaid)} color="#16a34a" />
        <Metric label="المتبقي" value={fmt(remaining)} color={remaining > 0 ? "#dc2626" : "#16a34a"} />
      </div>
      <Table
        cols={["رقم الفاتورة", "التاريخ", "الإجمالي", "مدفوع", "متبقي"]}
        rows={invoices.map(i => [
          i.id.slice(-6).toUpperCase(),
          new Date(i.date).toLocaleDateString("ar-EG"),
          fmt(i.total),
          fmt(i.paid),
          <span style={{ color: (i.total - i.paid) > 0 ? "#dc2626" : "#16a34a" }}>{fmt(i.total - i.paid)}</span>,
        ])}
      />
    </Modal>
  );
}

function PaymentModal({ party, isCustomer, onSave, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal title={`تسجيل دفعة — ${party.name}`} onClose={onClose}>
      <Input label="المبلغ (ج.م)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
      <Input label="ملاحظة" value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>إلغاء</Btn>
        <Btn color="green" onClick={() => amount && onSave(party, amount, note)}>تأكيد الدفعة</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICES LIST
// ═══════════════════════════════════════════════════════════════════════════
function InvoicesPage({ invoices, customers, suppliers, setModal }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = invoices.filter(i =>
    (filter === "all" || i.type === filter) &&
    (i.partyName?.includes(search) || i.id.includes(search) || !search)
  ).reverse();

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>📋 سجل الفواتير</h2>
      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {[["all","الكل"],["sale","مبيعات"],["purchase","مشتريات"]].map(([v,l]) => (
            <Btn key={v} color={filter === v ? "blue" : "gray"} small onClick={() => setFilter(v)}>{l}</Btn>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم الجهة أو رقم الفاتورة..." style={{ flex: 1, padding: "5px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", minWidth: 160 }} />
        </div>
        <Table
          cols={["رقم الفاتورة","النوع","التاريخ","الجهة","الإجمالي","مدفوع","متبقي","بواسطة",""]}
          rows={filtered.map(inv => [
            inv.id.slice(-6).toUpperCase(),
            inv.type === "sale" ? <Badge color="blue">بيع</Badge> : <Badge color="purple">شراء</Badge>,
            new Date(inv.date).toLocaleDateString("ar-EG"),
            inv.partyName || "—",
            fmt(inv.total),
            fmt(inv.paid),
            <span style={{ color: (inv.total - inv.paid) > 0 ? "#dc2626" : "#16a34a" }}>{fmt(inv.total - inv.paid)}</span>,
            inv.createdBy || "—",
            <Btn small color="gray" onClick={() => setModal(<InvoicePreview inv={inv} onClose={() => setModal(null)} />)}>عرض</Btn>,
          ])}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE PREVIEW
// ═══════════════════════════════════════════════════════════════════════════
function InvoicePreview({ inv, onClose }) {
  return (
    <Modal title={`فاتورة رقم: ${inv.id.slice(-6).toUpperCase()}`} onClose={onClose}>
      <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <div><b>النوع:</b> {inv.type === "sale" ? "فاتورة بيع" : "فاتورة شراء"}</div>
          <div><b>التاريخ:</b> {new Date(inv.date).toLocaleDateString("ar-EG")}</div>
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}><b>{inv.type === "sale" ? "العميل" : "المورد"}:</b> {inv.partyName || "نقدي"}</div>
        {inv.notes && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>ملاحظات: {inv.notes}</div>}
      </div>
      <Table
        cols={["الصنف","الكمية","سعر الوحدة","الإجمالي"]}
        rows={(inv.items || []).map(it => [
          it.productName || it.productId,
          it.qty,
          fmt(it.price),
          fmt((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)),
        ])}
      />
      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
          <span>الإجمالي</span><b>{fmt(inv.total)}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, color: "#16a34a" }}>
          <span>المدفوع</span><b>{fmt(inv.paid)}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: (inv.total - inv.paid) > 0 ? "#dc2626" : "#16a34a" }}>
          <span>المتبقي</span><span>{fmt(inv.total - inv.paid)}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        <Btn color="gray" onClick={onClose}>إغلاق</Btn>
        <Btn color="blue" onClick={() => window.print()}>🖨️ طباعة</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
function ProductsPage({ products, setProducts, showToast, setModal }) {
  const addProduct = (form) => {
    setProducts([...products, { id: uid(), ...form, stock: parseFloat(form.stock) || 0, buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0, minStock: parseFloat(form.minStock) || 0 }]);
    showToast("✅ تم إضافة الصنف");
    setModal(null);
  };
  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
    showToast("تم حذف الصنف");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🧱 إدارة الأصناف</h2>
        <Btn color="blue" onClick={() => setModal(<AddProductModal onSave={addProduct} onClose={() => setModal(null)} />)}>+ إضافة صنف</Btn>
      </div>
      <Card>
        <Table
          cols={["الصنف","الوحدة","المخزون","سعر الشراء","سعر البيع","هامش الربح","الحد الأدنى",""]}
          rows={products.map(p => {
            const margin = p.sellPrice - p.buyPrice;
            const marginPct = p.buyPrice ? ((margin / p.buyPrice) * 100).toFixed(1) : 0;
            return [
              p.name, p.unit, p.stock.toLocaleString("ar-EG"),
              fmt(p.buyPrice), fmt(p.sellPrice),
              <span style={{ color: margin >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(margin)} ({marginPct}%)</span>,
              p.minStock,
              <div style={{ display: "flex", gap: 4 }}>
                <Btn small color="amber" onClick={() => setModal(<EditProductModal product={p} products={products} setProducts={setProducts} showToast={showToast} onClose={() => setModal(null)} />)}>تعديل</Btn>
                <Btn small color="red" onClick={() => deleteProduct(p.id)}>حذف</Btn>
              </div>,
            ];
          })}
        />
      </Card>
    </div>
  );
}

function AddProductModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", unit: "شيكارة", stock: 0, buyPrice: 0, sellPrice: 0, minStock: 0 });
  return (
    <Modal title="إضافة صنف جديد" onClose={onClose}>
      <Input label="اسم الصنف" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: أسمنت، حديد..." />
      <Input label="وحدة القياس" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="شيكارة، طن، متر..." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="المخزون الابتدائي" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        <Input label="الحد الأدنى للتنبيه" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
        <Input label="سعر الشراء (ج.م)" type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} />
        <Input label="سعر البيع (ج.م)" type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>إلغاء</Btn>
        <Btn color="blue" onClick={() => form.name && onSave(form)}>إضافة</Btn>
      </div>
    </Modal>
  );
}

function EditProductModal({ product, products, setProducts, showToast, onClose }) {
  const [form, setForm] = useState({ ...product });
  const save = () => {
    setProducts(products.map(p => p.id === form.id ? { ...form, stock: parseFloat(form.stock)||0, buyPrice: parseFloat(form.buyPrice)||0, sellPrice: parseFloat(form.sellPrice)||0, minStock: parseFloat(form.minStock)||0 } : p));
    showToast("✅ تم تحديث الصنف");
    onClose();
  };
  return (
    <Modal title={`تعديل: ${product.name}`} onClose={onClose}>
      <Input label="اسم الصنف" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <Input label="وحدة القياس" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="المخزون" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        <Input label="الحد الأدنى" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
        <Input label="سعر الشراء (ج.م)" type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} />
        <Input label="سعر البيع (ج.م)" type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>إلغاء</Btn>
        <Btn color="green" onClick={save}>حفظ</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
function UsersPage({ users, setUsers, showToast, setModal, currentUser }) {
  const addUser = (form) => {
    setUsers([...users, { id: uid(), ...form }]);
    showToast("✅ تم إضافة المستخدم");
    setModal(null);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🔑 إدارة المستخدمين</h2>
        <Btn color="blue" onClick={() => setModal(<AddUserModal onSave={addUser} onClose={() => setModal(null)} />)}>+ إضافة مستخدم</Btn>
      </div>
      <Card>
        <Table
          cols={["الاسم","اسم المستخدم","الدور","",""]}
          rows={users.map(u => [
            u.name, u.username,
            <Badge color={u.role === "admin" ? "red" : u.role === "salesman" ? "blue" : u.role === "buyer" ? "purple" : "gray"}>{ROLES[u.role]}</Badge>,
            u.id !== currentUser.id ? <Btn small color="red" onClick={() => { setUsers(users.filter(x => x.id !== u.id)); showToast("تم حذف المستخدم"); }}>حذف</Btn> : <Badge color="green">أنت</Badge>,
          ])}
        />
      </Card>
    </div>
  );
}

function AddUserModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "salesman" });
  return (
    <Modal title="إضافة مستخدم جديد" onClose={onClose}>
      <Input label="الاسم الكامل" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <Input label="اسم المستخدم" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
      <Input label="كلمة المرور" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      <Select label="الدور" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
        {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </Select>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="gray" onClick={onClose}>إلغاء</Btn>
        <Btn color="blue" onClick={() => form.name && form.username && form.password && onSave(form)}>إضافة</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════
function ReportsPage({ invoices, products, customers, suppliers }) {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [type, setType] = useState("all");

  const filtered = invoices.filter(i => {
    const d = i.date.slice(0, 10);
    return d >= from && d <= to && (type === "all" || i.type === type);
  });

  const totalSales = filtered.filter(i => i.type === "sale").reduce((s, i) => s + i.total, 0);
  const totalBuys = filtered.filter(i => i.type === "purchase").reduce((s, i) => s + i.total, 0);
  const totalPaid = filtered.reduce((s, i) => s + i.paid, 0);
  const totalRemaining = filtered.reduce((s, i) => s + (i.total - i.paid), 0);

  const exportCSV = () => {
    const rows = [["رقم الفاتورة","النوع","التاريخ","الجهة","الإجمالي","المدفوع","المتبقي","بواسطة"]];
    filtered.forEach(i => rows.push([i.id.slice(-6),i.type==="sale"?"بيع":"شراء",i.date.slice(0,10),i.partyName||"",i.total,i.paid,i.total-i.paid,i.createdBy||""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"})); a.download = `تقرير-${from}-${to}.csv`; a.click();
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>📈 التقارير</h2>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <Input label="من تاريخ" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input label="إلى تاريخ" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Select label="النوع" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">الكل</option>
            <option value="sale">مبيعات</option>
            <option value="purchase">مشتريات</option>
          </Select>
          <Btn color="green" onClick={exportCSV}>⬇️ تصدير CSV</Btn>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Metric label="إجمالي المبيعات" value={fmt(totalSales)} color="#16a34a" />
        <Metric label="إجمالي المشتريات" value={fmt(totalBuys)} color="#dc2626" />
        <Metric label="صافي الربح" value={fmt(totalSales - totalBuys)} color={totalSales >= totalBuys ? "#16a34a" : "#dc2626"} />
        <Metric label="إجمالي المحصل" value={fmt(totalPaid)} color="#2563eb" />
        <Metric label="إجمالي المتبقي" value={fmt(totalRemaining)} color="#d97706" />
        <Metric label="عدد الفواتير" value={filtered.length} />
      </div>
      <Card>
        <Table
          cols={["رقم الفاتورة","النوع","التاريخ","الجهة","الإجمالي","مدفوع","متبقي"]}
          rows={filtered.reverse().map(i => [
            i.id.slice(-6).toUpperCase(),
            i.type === "sale" ? <Badge color="blue">بيع</Badge> : <Badge color="purple">شراء</Badge>,
            i.date.slice(0,10),
            i.partyName || "—",
            fmt(i.total),
            fmt(i.paid),
            <span style={{ color: (i.total - i.paid) > 0 ? "#dc2626" : "#16a34a" }}>{fmt(i.total - i.paid)}</span>,
          ])}
        />
      </Card>
    </div>
  );
}

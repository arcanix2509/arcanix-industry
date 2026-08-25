import { db, auth, onAuthStateChanged, googleProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, ADMIN_EMAIL } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Global Application State
window.cart = JSON.parse(localStorage.getItem('arcanix_cart')) || [];
window.wishlist = JSON.parse(localStorage.getItem('arcanix_wishlist')) || [];
let currentUser = null;

// Track Auth State
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavState();
});

// All 20 Route Definitions
const routes = {
  // 1. Core Shopping Pages
  'home': renderHomePage,
  'plp': renderProductListingPage,
  'pdp': renderProductDetailPage,
  'search': renderSearchResultsPage,
  
  // 2. Checkout Pages
  'cart': renderCartPage,
  'checkout': renderCheckoutPage,
  'order-confirmation': renderOrderConfirmationPage,

  // 3. User Account Pages
  'auth': renderAuthPage,
  'account': renderUserDashboardPage,
  'my-orders': renderOrdersPage,
  'wishlist': renderWishlistPage,

  // 4. Support & Legal Pages
  'help': () => renderStaticPage('Help Center / FAQ', 'Find instant solutions for account management, payments, and product downloads.'),
  'contact': () => renderStaticPage('Contact Us', 'Have questions? Reach out to our 24/7 technical team at support@arcanix.com.'),
  'privacy': () => renderStaticPage('Privacy Policy', 'Your data is secured with enterprise-grade encryption. We never share your personal information with third parties.'),
  'terms': () => renderStaticPage('Terms & Conditions', 'By accessing Arcanix Market, you agree to adhere to our standard digital license usage policies.'),
  'returns': () => renderStaticPage('Return & Refund Policy', 'We offer a 14-day hassle-free money-back guarantee for any broken or incompatible digital assets.'),
  'shipping': () => renderStaticPage('Shipping & Delivery Policy', 'All digital assets, code packages, and licenses are delivered instantly to your account post-purchase.'),

  // 5. Multi-Vendor Pages
  'seller-register': renderSellerRegisterPage,
  'seller-dashboard': renderSellerDashboardPage
};

const appContainer = document.getElementById('app-view');

// Client-Side Dynamic Router
function navigate() {
  const fullHash = window.location.hash.replace('#', '') || 'home';
  const [route, queryString] = fullHash.split('?');
  const params = new URLSearchParams(queryString);
  
  const renderFn = routes[route] || renderHomePage;
  appContainer.innerHTML = '';
  renderFn(params);
  updateCartBadge();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

// Dynamic Navigation Controls
function updateNavState() {
  const authBtn = document.getElementById('account-nav-btn');
  if (!authBtn) return;
  if (currentUser) {
    authBtn.innerText = currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'My Account';
    authBtn.href = '#account';
  } else {
    authBtn.innerText = 'Sign In';
    authBtn.href = '#auth';
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.innerText = window.cart.length;
}

// Global Actions
window.addToCart = (id, title, price, image) => {
  window.cart.push({ id, title, price, image });
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  updateCartBadge();
  alert(`${title} added to cart!`);
};

window.removeFromCart = (index) => {
  window.cart.splice(index, 1);
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  renderCartPage();
};

// ==========================================
// RENDER FUNCTIONS (PAGE VIEWS)
// ==========================================

// PAGE 1: Homepage
async function renderHomePage() {
  appContainer.innerHTML = `
    <section class="hero-banner" style="background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 48px 32px; border-radius: var(--radius-lg); margin-bottom: 32px; text-align: center;">
      <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 12px;">Discover High-Quality Digital Assets</h1>
      <p style="font-size: 1rem; opacity: 0.9;">Unity Source Code, 3D Models, and Developer Scripts</p>
    </section>

    <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Featured Categories</h2>
    <div class="grid" style="margin-bottom: 40px;">
      <div class="card" onclick="location.hash='plp?category=unity'" style="padding: 24px; cursor: pointer; text-align: center;"><h3>🎮 Unity Assets</h3></div>
      <div class="card" onclick="location.hash='plp?category=scripts'" style="padding: 24px; cursor: pointer; text-align: center;"><h3>💻 C# & Logic Scripts</h3></div>
      <div class="card" onclick="location.hash='plp?category=3dmodels'" style="padding: 24px; cursor: pointer; text-align: center;"><h3>🎨 3D Environment Packs</h3></div>
    </div>

    <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Trending Assets</h2>
    <div class="grid" id="home-products-grid"><p style="color: var(--text-muted);">Loading products...</p></div>
  `;
  fetchProductsGrid(document.getElementById('home-products-grid'));
}

// PAGE 2: Product Listing Page (PLP)
function renderProductListingPage(params) {
  const cat = params.get('category') || 'All';
  appContainer.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">Catalog: ${cat.toUpperCase()}</h2>
    <p style="color: var(--text-muted); margin-bottom: 24px;">Filter & find developer tools built by top sellers.</p>
    <div class="grid" id="plp-grid"><p style="color: var(--text-muted);">Fetching catalog...</p></div>
  `;
  fetchProductsGrid(document.getElementById('plp-grid'));
}

// PAGE 3: Product Detail Page (PDP)
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) { appContainer.innerHTML = `<p>Product Not Found.</p>`; return; }

  appContainer.innerHTML = `<p style="color: var(--text-muted);">Loading details...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) { appContainer.innerHTML = `<p>Product does not exist.</p>`; return; }
    const p = snap.data();

    appContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; margin-top: 20px;">
        <img src="${p.imageUrl || 'https://via.placeholder.com/400'}" style="width: 100%; border-radius: var(--radius-lg); border: 1px solid var(--border); object-fit: cover; max-height: 380px;"/>
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 8px;">${p.title}</h1>
          <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); margin-bottom: 16px;">$${p.price}</div>
          <p style="color: var(--text-muted); margin-bottom: 24px; white-space: pre-line; font-size: 0.925rem;">${p.description || 'No description provided.'}</p>
          <div style="display: flex; gap: 12px;">
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" class="btn btn-primary" style="flex: 1;">Add to Cart</button>
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" class="btn btn-outline" style="flex: 1;">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p style="color: var(--danger);">Error loading details: ${err.message}</p>`;
  }
}

// PAGE 4: Search Results Page
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 16px;">Search Results for "${query}"</h2>
    <div class="grid" id="search-grid"><p style="color: var(--text-muted);">Searching store...</p></div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'));
}

// PAGE 5: Cart Page
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div style="text-align: center; padding: 40px;"><h2>Your Cart is Empty</h2><br/><a href="#plp" class="btn btn-primary">Browse Assets</a></div>`;
    return;
  }
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);

  appContainer.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">Shopping Cart</h2>
    <div style="display: grid; grid-template-columns: 1fr 320px; gap: 24px;">
      <div>
        ${window.cart.map((item, idx) => `
          <div class="card" style="padding: 16px; margin-bottom: 12px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${item.image}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover;"/>
              <div>
                <strong>${item.title}</strong>
                <div style="color: var(--primary); font-weight: 700;">$${item.price}</div>
              </div>
            </div>
            <button onclick="removeFromCart(${idx})" class="btn btn-danger" style="padding: 6px 10px;">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="card" style="padding: 24px; height: fit-content;">
        <h3 style="margin-bottom: 16px;">Order Summary</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span>Total:</span> <strong style="font-size: 1.25rem;">$${total.toFixed(2)}</strong>
        </div>
        <button onclick="location.hash='checkout'" class="btn btn-primary" style="width: 100%;">Proceed to Checkout</button>
      </div>
    </div>
  `;
}

// PAGE 6: Checkout Page (Address & Payment)
function renderCheckoutPage() {
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);
  appContainer.innerHTML = `
    <div class="form-card" style="max-width: 560px;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 20px;">Checkout ($${total.toFixed(2)})</h2>
      <form id="checkout-form">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" required placeholder="John Doe"/>
        </div>
        <div class="form-group">
          <label>Billing & Delivery Address</label>
          <textarea required rows="2" placeholder="Street Address, City, Zip"></textarea>
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select style="width:100%; padding:10px; border-radius:var(--radius-md); border:1px solid var(--border);">
            <option>Credit / Debit Card</option>
            <option>UPI / Net Banking</option>
            <option>PayPal</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Complete Purchase</button>
      </form>
    </div>
  `;

  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    window.cart = [];
    localStorage.removeItem('arcanix_cart');
    updateCartBadge();
    location.hash = 'order-confirmation';
  });
}

// PAGE 7: Order Confirmation / Thank You Page
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <h1 style="font-size: 2.5rem; margin-bottom: 12px;">🎉</h1>
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">Order Placed Successfully!</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Order ID: #ARC-${Math.floor(100000 + Math.random() * 900000)}</p>
      <a href="#my-orders" class="btn btn-primary">Track Order</a>
    </div>
  `;
}

// PAGE 8: Login / Register Page
function renderAuthPage() {
  appContainer.innerHTML = `
    <div class="form-card">
      <h2 style="font-size: 1.25rem; font-weight: 700; text-align: center; margin-bottom: 20px;">Sign In or Create Account</h2>
      <button id="google-login-btn" class="btn btn-outline" style="width: 100%; margin-bottom: 16px;">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        Continue with Google
      </button>
      <form id="email-form">
        <div class="form-group"><label>Email</label><input type="email" id="a-email" required/></div>
        <div class="form-group"><label>Password</label><input type="password" id="a-pass" required/></div>
        <div style="display:flex; gap:10px;">
          <button type="submit" class="btn btn-primary" style="flex:1;">Login</button>
          <button type="button" id="reg-btn" class="btn btn-outline" style="flex:1;">Register</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, googleProvider).then(() => location.hash = 'account');
  document.getElementById('email-form').onsubmit = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, document.getElementById('a-email').value, document.getElementById('a-pass').value)
      .then(() => location.hash = 'account')
      .catch(err => alert(err.message));
  };
  document.getElementById('reg-btn').onclick = () => {
    createUserWithEmailAndPassword(auth, document.getElementById('a-email').value, document.getElementById('a-pass').value)
      .then(() => location.hash = 'account')
      .catch(err => alert(err.message));
  };
}

// PAGE 9: User Dashboard & Profile
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  appContainer.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; text-align: center;">
      <img src="${currentUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + currentUser.uid}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 12px; border: 2px solid var(--border);"/>
      <h2>${currentUser.displayName || 'Arcanix User'}</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">${currentUser.email}</p>

      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <a href="#my-orders" class="card" style="padding: 20px; text-decoration: none; color: inherit;">📦 My Orders</a>
        <a href="#wishlist" class="card" style="padding: 20px; text-decoration: none; color: inherit;">❤️ Saved Wishlist</a>
        <a href="#seller-register" class="card" style="padding: 20px; text-decoration: none; color: inherit;">🏪 Seller Hub</a>
        ${isAdmin ? `<a href="#seller-dashboard" class="card" style="padding: 20px; text-decoration: none; color: inherit; border-color: var(--danger);">⚙️ Admin Dashboard</a>` : ''}
      </div>

      <button id="so-btn" class="btn btn-outline" style="width: 100%;">Sign Out</button>
    </div>
  `;

  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// PAGE 10: My Orders & Order Tracking Page
function renderOrdersPage() {
  appContainer.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">My Orders & Track Status</h2>
    <table class="admin-table">
      <thead><tr><th>Order ID</th><th>Date</th><th>Status</th><th>Digital Download</th></tr></thead>
      <tbody>
        <tr><td>#ARC-924810</td><td>2026-08-24</td><td><span style="color: green; font-weight: bold;">Completed</span></td><td><a href="#" onclick="alert('Downloading License Key & Assets...')">Download Pack</a></td></tr>
      </tbody>
    </table>
  `;
}

// PAGE 11: Wishlist Page
function renderWishlistPage() {
  appContainer.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">My Saved Wishlist</h2>
    <p style="color: var(--text-muted);">No items saved to your wishlist yet.</p>
  `;
}

// PAGES 12-17: Support & Legal Static Pages
function renderStaticPage(title, content) {
  appContainer.innerHTML = `
    <div class="card" style="padding: 32px; max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 12px;">${title}</h1>
      <hr style="border: 0; border-top: 1px solid var(--border); margin-bottom: 20px;"/>
      <p style="color: var(--text-main); line-height: 1.6;">${content}</p>
    </div>
  `;
}

// PAGE 18: Become a Seller / Seller Registration Page
function renderSellerRegisterPage() {
  appContainer.innerHTML = `
    <div class="form-card" style="max-width: 500px;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Register as a Marketplace Seller</h2>
      <form onsubmit="event.preventDefault(); alert('Seller application submitted!'); location.hash='seller-dashboard';">
        <div class="form-group"><label>Studio / Store Name</label><input type="text" required placeholder="Arcanix Studios"/></div>
        <div class="form-group"><label>Portfolio / Website Link</label><input type="url" required placeholder="https://..."/></div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Application</button>
      </form>
    </div>
  `;
}

// PAGE 19 & 20: Seller Dashboard Page & Inventory Management
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2>Access Denied</h2>
        <p style="color: var(--text-muted); margin-bottom: 16px;">Admin or approved seller access required.</p>
        <a href="#auth" class="btn btn-outline">Sign In</a>
      </div>
    `;
    return;
  }

  appContainer.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">Seller Dashboard</h2>
    
    <div class="form-card" style="max-width: 600px; margin: 0 0 40px 0;">
      <h3 style="margin-bottom: 16px;">Publish New Asset</h3>
      <form id="seller-add-form">
        <div class="form-group"><label>Asset Title</label><input type="text" id="p-title" required/></div>
        <div class="form-group"><label>Price ($)</label><input type="number" step="0.01" id="p-price" required/></div>
        <div class="form-group"><label>Image URL</label><input type="url" id="p-image" required/></div>
        <div class="form-group"><label>Description</label><textarea id="p-desc" rows="3" required></textarea></div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Publish</button>
      </form>
    </div>

    <h3>Your Published Inventory</h3>
    <table class="admin-table">
      <thead><tr><th>Preview</th><th>Title</th><th>Price</th><th>Action</th></tr></thead>
      <tbody id="seller-table-body"><tr><td colspan="4">Loading items...</td></tr></tbody>
    </table>
  `;

  document.getElementById('seller-add-form').onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "products"), {
      title: document.getElementById('p-title').value,
      price: parseFloat(document.getElementById('p-price').value),
      imageUrl: document.getElementById('p-image').value,
      description: document.getElementById('p-desc').value,
      createdAt: new Date()
    });
    alert("Asset published!");
    renderSellerDashboardPage();
  };

  fetchSellerInventory();
}

// --- UTILITY DATA FETCHERS ---
async function fetchProductsGrid(container) {
  try {
    const snap = await getDocs(collection(db, "products"));
    container.innerHTML = '';
    if (snap.empty) { container.innerHTML = '<p style="color: var(--text-muted);">No products found.</p>'; return; }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      container.innerHTML += `
        <div class="card">
          <img src="${p.imageUrl || 'https://via.placeholder.com/300'}" style="width: 100%; height: 160px; object-fit: cover; border-bottom: 1px solid var(--border);"/>
          <div style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">${p.title}</h3>
            <p style="color: var(--text-muted); font-size: 0.825rem; flex: 1; margin-bottom: 12px; overflow: hidden; max-height: 40px;">${p.description || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.15rem; font-weight: 800;">$${p.price}</span>
              <a href="#pdp?id=${docSnap.id}" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;">View</a>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">Failed to load products: ${err.message}</p>`;
  }
}

async function fetchSellerInventory() {
  const tbody = document.getElementById('seller-table-body');
  if (!tbody) return;
  const snap = await getDocs(collection(db, "products"));
  tbody.innerHTML = '';
  snap.forEach((docSnap) => {
    const p = docSnap.data();
    tbody.innerHTML += `
      <tr>
        <td><img src="${p.imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"/></td>
        <td><strong>${p.title}</strong></td>
        <td>$${p.price}</td>
        <td><button onclick="deleteProduct('${docSnap.id}')" class="btn btn-danger" style="padding: 4px 8px;">Delete</button></td>
      </tr>
    `;
  });
}

window.deleteProduct = async (id) => {
  if (confirm("Remove product?")) {
    await deleteDoc(doc(db, "products", id));
    renderSellerDashboardPage();
  }
};
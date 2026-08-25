import { db, auth, onAuthStateChanged, googleProvider, signInWithPopup, signOut, signInWithEmailAndPassword, ADMIN_EMAIL } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.cart = JSON.parse(localStorage.getItem('arcanix_cart')) || [];
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavState();
});

const routes = {
  'home': renderHomePage,
  'plp': renderCategoryProductsPage,
  'pdp': renderProductDetailPage,
  'search': renderSearchResultsPage,
  'cart': renderCartPage,
  'checkout': renderCheckoutPage,
  'order-confirmation': renderOrderConfirmationPage,
  'auth': renderAuthPage,
  'account': renderUserDashboardPage,
  'seller-dashboard': renderSellerDashboardPage
};

const appContainer = document.getElementById('app-view');

// 1. Mobile Custom Styles Injection (Clean Top Navigation & Mobile Polish)
function injectMobileStyles() {
  if (document.getElementById('mobile-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'mobile-custom-styles';
  style.innerHTML = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { padding-bottom: 0 !important; background-color: #f1f2f6; }
    
    /* Sleek Mobile Header */
    .mobile-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #2874f0;
      color: #ffffff;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hamburger-btn {
      font-size: 1.4rem;
      cursor: pointer;
      background: none;
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .brand-logo {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
      letter-spacing: 0.5px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-icon-btn {
      color: #fff;
      text-decoration: none;
      font-size: 1.2rem;
      position: relative;
      display: flex;
      align-items: center;
    }
    .badge-count {
      position: absolute;
      top: -6px;
      right: -10px;
      background: #ff9f00;
      color: #000;
      font-weight: 700;
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 10px;
    }

    /* Grid layout */
    .grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
        gap: 16px !important;
      }
    }
    
    /* Scrollable Mobile Categories Strip */
    .cat-strip-container {
      display: flex !important;
      overflow-x: auto !important;
      white-space: nowrap !important;
      padding: 10px 12px !important;
      gap: 16px !important;
      background: #fff !important;
      border-bottom: 1px solid #e0e0e0 !important;
      -webkit-overflow-scrolling: touch;
    }
    .cat-strip-container::-webkit-scrollbar { display: none; }
    .cat-item {
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: center !important;
      font-size: 0.75rem !important;
      min-width: 56px !important;
      cursor: pointer;
      color: #333;
    }
    .cat-icon {
      font-size: 1.4rem !important;
      margin-bottom: 2px !important;
    }

    /* Card Optimization */
    .card {
      border: 1px solid #e0e0e0 !important;
      border-radius: 8px !important;
      padding: 8px !important;
      background: #fff !important;
      cursor: pointer;
    }
    .card-img {
      width: 100% !important;
      height: 130px !important;
      object-fit: cover !important;
      border-radius: 4px !important;
    }

    /* Hamburger Side Drawer Styles */
    .side-drawer {
      position: fixed;
      top: 0;
      left: -270px;
      width: 260px;
      height: 100%;
      background: #ffffff;
      box-shadow: 2px 0 10px rgba(0,0,0,0.25);
      z-index: 10000;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }
    .side-drawer.open { left: 0; }
    .drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: none;
    }
    .drawer-overlay.active { display: block; }
    .drawer-header {
      background: #2874f0;
      color: #fff;
      padding: 18px 16px;
      font-weight: 700;
      font-size: 1.1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .drawer-links {
      display: flex;
      flex-direction: column;
    }
    .drawer-links a {
      padding: 14px 20px;
      color: #333;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid #f0f0f0;
    }
    .drawer-links a:active { background: #f5f5f5; }
  `;
  document.head.appendChild(style);
}

// 2. Dynamic Header & Hamburger Drawer Setup
function setupHeaderAndDrawer() {
  const oldBottomNav = document.getElementById('mobile-bottom-nav');
  if (oldBottomNav) oldBottomNav.remove();

  // Inject Mobile Header
  if (!document.getElementById('main-header')) {
    const header = document.createElement('header');
    header.id = 'main-header';
    header.className = 'mobile-header';
    header.innerHTML = `
      <div class="header-left">
        <button class="hamburger-btn" onclick="toggleDrawer(true)" aria-label="Open Menu">☰</button>
        <a href="#home" class="brand-logo">Arcanix</a>
      </div>
      <div class="header-right">
        <a href="#search" class="header-icon-btn" aria-label="Search">🔍</a>
        <a href="#cart" class="header-icon-btn" aria-label="Cart">
          🛒<span class="badge-count" id="cart-count">0</span>
        </a>
        <a href="#account" id="account-nav-btn" class="header-icon-btn" style="font-size: 0.85rem; font-weight: 600;">Login</a>
      </div>
    `;
    document.body.prepend(header);
  }

  // Inject Drawer & Overlay
  if (!document.getElementById('hamburger-drawer')) {
    const drawer = document.createElement('div');
    drawer.id = 'hamburger-drawer';
    drawer.className = 'side-drawer';
    drawer.innerHTML = `
      <div class="drawer-header">
        <span>Arcanix Menu</span>
        <span style="cursor:pointer; font-size:1.2rem;" onclick="toggleDrawer(false)">✕</span>
      </div>
      <div class="drawer-links">
        <a href="#home" onclick="toggleDrawer(false)"><span>🏠</span> Home</a>
        <a href="#search" onclick="toggleDrawer(false)"><span>🔍</span> Search Products</a>
        <a href="#cart" onclick="toggleDrawer(false)"><span>🛒</span> My Cart</a>
        <a href="#account" onclick="toggleDrawer(false)"><span>👤</span> My Account</a>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'drawer-overlay';
    overlay.className = 'drawer-overlay';
    overlay.onclick = () => toggleDrawer(false);

    document.body.appendChild(drawer);
    document.body.appendChild(overlay);
  }
}

window.toggleDrawer = function(open) {
  const drawer = document.getElementById('hamburger-drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (!drawer || !overlay) return;
  if (open) {
    drawer.classList.add('open');
    overlay.classList.add('active');
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  }
};

function navigate() {
  injectMobileStyles();
  setupHeaderAndDrawer();

  const fullHash = window.location.hash.replace('#', '') || 'home';
  const [route, queryString] = fullHash.split('?');
  const params = new URLSearchParams(queryString);
  
  const renderFn = routes[route] || renderHomePage;
  appContainer.innerHTML = '';
  loadDynamicCategoriesStrip();
  renderFn(params);
  updateCartBadge();
  updateNavState();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

function updateNavState() {
  const authBtn = document.getElementById('account-nav-btn');
  if (!authBtn) return;
  if (currentUser) {
    authBtn.innerText = currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Account';
    authBtn.href = '#account';
  } else {
    authBtn.innerText = 'Login';
    authBtn.href = '#auth';
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.innerText = window.cart.length;
}

// Global Category Strip Loader
async function loadDynamicCategoriesStrip() {
  const strip = document.getElementById('dynamic-cat-strip');
  if (!strip) return;
  strip.className = 'cat-strip-container';

  try {
    const snap = await getDocs(collection(db, "categories"));
    if (snap.empty) {
      strip.innerHTML = '<div style="font-size:0.85rem; color:#878787; padding: 6px;">No categories available.</div>';
      return;
    }
    strip.innerHTML = `
      <div class="cat-item" onclick="location.hash='home'"><span class="cat-icon">🏠</span><span>All</span></div>
      ${snap.docs.map(docSnap => {
        const c = docSnap.data();
        return `
          <div class="cat-item" onclick="location.hash='plp?category=${encodeURIComponent(c.name)}'">
            <span class="cat-icon">${c.icon || '📦'}</span><span>${c.name}</span>
          </div>
        `;
      }).join('')}
    `;
  } catch(e) {
    console.error("Error loading categories strip:", e);
  }
}

window.addToCart = (id, title, price, image) => {
  window.cart.push({ id, title, price, image });
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  updateCartBadge();
  alert(`"${title}" added to Cart!`);
};

window.removeFromCart = (index) => {
  window.cart.splice(index, 1);
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  renderCartPage();
};

window.deleteItemByAdmin = async (colName, id) => {
  if (confirm(`Delete this item from ${colName}?`)) {
    try {
      await deleteDoc(doc(db, colName, id));
      alert("Deleted successfully!");
      renderSellerDashboardPage();
    } catch(err) {
      alert("Error deleting: " + err.message);
    }
  }
};

// 1. HOME PAGE
async function renderHomePage() {
  appContainer.innerHTML = `
    <div id="home-slider-container" style="margin: 10px 0;"></div>
    <div style="padding: 10px;">
      <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: #333;">Featured Products</h2>
      <div class="grid" id="home-products-grid"><p style="color: #666;">Loading products...</p></div>
    </div>
  `;
  fetchBanners();
  fetchProductsGrid(document.getElementById('home-products-grid'));
}

async function fetchBanners() {
  const container = document.getElementById('home-slider-container');
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "banners"));
    if (snap.empty) {
      container.style.display = 'none';
      return;
    }
    const b = snap.docs[0].data();
    container.style.display = 'block';
    container.innerHTML = `
      <div style="background: linear-gradient(90deg, #1e3c72, #2a5298); color: white; padding: 20px 14px; border-radius: 8px; text-align: center; background-image: url('${b.imageUrl}'); background-size: cover; background-position: center; min-height: 120px; display: flex; align-items: center; justify-content: center;">
        <div style="background: rgba(0,0,0,0.55); padding: 10px 16px; border-radius: 6px; width: 100%;">
          <h1 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 4px; color: #fff;">${b.title || 'Welcome'}</h1>
          <p style="font-size: 0.8rem; color: #eee; margin: 0;">${b.subtitle || ''}</p>
        </div>
      </div>
    `;
  } catch(e) {
    console.error("Banner fetch error:", e);
  }
}

// 2. CATEGORY PRODUCTS PAGE (PLP)
async function renderCategoryProductsPage(params) {
  const categoryName = params.get('category') || '';
  appContainer.innerHTML = `
    <div style="padding: 10px;">
      <h2 style="font-size: 1.05rem; margin-bottom: 10px;">Category: <b>${categoryName}</b></h2>
      <div class="grid" id="plp-grid"><p style="color: #666;">Loading products...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('plp-grid'), '', categoryName);
}

// 3. PRODUCT DETAIL PAGE (PDP)
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) return;
  appContainer.innerHTML = `<p style="padding:16px;">Loading item details...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const p = snap.data();

    appContainer.innerHTML = `
      <div style="padding: 12px; background: #fff;">
        <img src="${p.imageUrl || 'https://via.placeholder.com/400'}" style="width: 100%; border-radius: 8px; max-height: 280px; object-fit: cover; margin-bottom: 14px;"/>
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" style="flex: 1; padding: 12px 8px; font-size: 0.9rem; font-weight:700; background:#ff9f00; color:#fff; border:none; border-radius:4px;">ADD TO CART</button>
          <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" style="flex: 1; padding: 12px 8px; font-size: 0.9rem; font-weight:700; background:#fb641b; color:#fff; border:none; border-radius:4px;">BUY NOW</button>
        </div>
        <div>
          <h1 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 6px;">${p.title}</h1>
          <div style="font-size:0.8rem; color:#2874f0; font-weight:600; margin-bottom:8px;">Category: ${p.category || 'General'}</div>
          <div style="background:#388e3c; color:#fff; font-size:0.75rem; display:inline-block; padding:2px 6px; border-radius:4px; margin-bottom: 10px;">4.5 ★</div>
          <div style="margin-bottom: 12px;">
            <span style="font-size: 1.3rem; font-weight:800; color:#212121;">$${p.price}</span>
            ${p.tag ? `<span style="color:#388e3c; font-size:0.8rem; font-weight:700; margin-left:8px;">${p.tag}</span>` : ''}
          </div>
          <h4 style="margin-bottom: 6px; font-size: 0.95rem;">Description:</h4>
          <p style="color: #555; font-size: 0.85rem; line-height: 1.5; white-space: pre-line;">${p.description || 'No description provided.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p style="padding:16px;">Error loading product details.</p>`;
  }
}

// 4. SEARCH PAGE
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <div style="padding: 10px;">
      <h2 style="font-size: 1.05rem;">Search Results for "${query}"</h2>
      <div class="grid" id="search-grid" style="margin-top: 10px;"></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'), query);
}

// 5. CART PAGE
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div style="text-align: center; padding: 40px 16px; background:#fff;"><h2>Cart is Empty!</h2><br/><a href="#home" style="display:inline-block; padding:10px 20px; background:#fb641b; color:#fff; text-decoration:none; border-radius:4px;">Shop Now</a></div>`;
    return;
  }
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);

  appContainer.innerHTML = `
    <div style="padding: 10px; display: flex; flex-direction: column; gap: 12px;">
      <div style="background:#fff; padding: 12px; border-radius:6px;">
        <h3 style="margin-bottom: 12px; font-size: 1rem;">My Cart (${window.cart.length})</h3>
        ${window.cart.map((item, idx) => `
          <div style="display: flex; gap: 12px; padding: 10px 0; border-top: 1px solid #eee; align-items: center;">
            <img src="${item.image}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 4px;"/>
            <div style="flex: 1;">
              <h4 style="font-size: 0.85rem; margin-bottom: 4px;">${item.title}</h4>
              <div><span style="font-weight:700; font-size: 0.95rem;">$${item.price}</span></div>
            </div>
            <button onclick="removeFromCart(${idx})" style="background:none; border:none; color: #d32f2f; font-size: 0.8rem; font-weight:700; padding: 4px 8px; cursor:pointer;">REMOVE</button>
          </div>
        `).join('')}
      </div>
      <div style="background:#fff; padding: 14px; border-radius:6px;">
        <h4 style="color: #878787; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 10px; font-size: 0.85rem;">PRICE DETAILS</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;">
          <span>Items (${window.cart.length})</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 14px; font-weight: 800; border-top: 1px dashed #ccc; padding-top: 10px;">
          <span>Total Amount</span>
          <span style="color: #388e3c;">$${total.toFixed(2)}</span>
        </div>
        <button onclick="location.hash='checkout'" style="width: 100%; padding: 12px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:4px; cursor:pointer;">PLACE ORDER</button>
      </div>
    </div>
  `;
}

// 6. CHECKOUT PAGE
function renderCheckoutPage() {
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);
  appContainer.innerHTML = `
    <div style="padding: 14px; background:#fff; margin:10px; border-radius:6px;">
      <h2 style="margin-bottom: 14px; font-size: 1.1rem;">Checkout ($${total.toFixed(2)})</h2>
      <form id="checkout-form">
        <div style="margin-bottom:12px;"><label style="display:block; font-size:0.8rem; margin-bottom:4px;">Delivery Address</label><textarea required placeholder="Full Address..." style="width:100%; height:70px; padding:8px; border:1px solid #ccc; border-radius:4px;"></textarea></div>
        <div style="margin-bottom:16px;"><label style="display:block; font-size:0.8rem; margin-bottom:4px;">Payment Method</label>
          <select style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;"><option>UPI / NetBanking</option><option>Credit/Debit Card</option><option>Cash on Delivery</option></select>
        </div>
        <button type="submit" style="width: 100%; padding: 12px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:4px;">CONFIRM ORDER</button>
      </form>
    </div>
  `;
  document.getElementById('checkout-form').onsubmit = (e) => {
    e.preventDefault();
    window.cart = [];
    localStorage.removeItem('arcanix_cart');
    updateCartBadge();
    location.hash = 'order-confirmation';
  };
}

// 7. ORDER CONFIRMATION
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div style="text-align: center; padding: 40px 16px; background:#fff;">
      <h2 style="color: #388e3c; font-size: 1.3rem;">🎉 Order Confirmed!</h2>
      <p style="margin: 10px 0 16px 0; font-size: 0.85rem;">Thank you for shopping with us.</p>
      <a href="#home" style="display:inline-block; padding:10px 20px; background:#ff9f00; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">Continue Shopping</a>
    </div>
  `;
}

// 8. AUTHENTICATION (Google Login Refresh Fix Included)
function renderAuthPage() {
  appContainer.innerHTML = `
    <div style="padding: 16px; background:#fff; margin: 10px; border-radius: 6px;">
      <h2 style="text-align: center; margin-bottom: 16px; font-size: 1.2rem;">Account Login</h2>
      <button type="button" id="google-login-btn" style="width: 100%; margin-bottom: 16px; padding: 10px; background:#fff; border:1px solid #ccc; border-radius:4px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer;">
        <span>🌐</span> Continue with Google
      </button>
      <form id="email-form">
        <div style="margin-bottom:10px;"><label style="display:block; font-size:0.8rem;">Email Address</label><input type="email" id="a-email" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;"/></div>
        <div style="margin-bottom:14px;"><label style="display:block; font-size:0.8rem;">Password</label><input type="password" id="a-pass" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;"/></div>
        <button type="submit" style="width: 100%; padding: 10px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:4px;">Login</button>
      </form>
    </div>
  `;

  document.getElementById('google-login-btn').onclick = async (e) => {
    e.preventDefault();
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.hash = '#account';
    } catch(err) {
      alert("Google Login Error: " + err.message);
    }
  };

  document.getElementById('email-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('a-email').value, document.getElementById('a-pass').value);
      window.location.hash = '#account';
    } catch(err) {
      alert("Login Error: " + err.message);
    }
  };
}

// 9. USER ACCOUNT & ADMIN ACCESS
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  appContainer.innerHTML = `
    <div style="padding: 20px; background:#fff; text-align: center; margin: 10px; border-radius:6px;">
      <h3>User Profile</h3>
      <p style="color: #666; margin: 6px 0 16px 0; font-size: 0.85rem;">${currentUser.email}</p>
      <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; margin-bottom: 16px;">
        ${isAdmin ? `<a href="#seller-dashboard" style="display:block; width:100%; padding:10px; background:#ff9f00; color:#fff; text-decoration:none; font-weight:700; border-radius:4px;">⚙️ Admin Control Panel CMS</a>` : ''}
      </div>
      <button id="so-btn" style="width:100%; padding:10px; background:none; border:1px solid #ccc; border-radius:4px; cursor:pointer;">Logout</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// 10. ADMIN DASHBOARD (CMS)
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email && currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `<div style="padding:20px; background:#fff;"><h2>Access Denied</h2><p>Only authorized admin can access this page.</p></div>`;
    return;
  }

  appContainer.innerHTML = `
    <div style="padding: 12px; background:#fff; margin:10px; border-radius:6px;">
      <h2 style="font-size: 1.1rem; margin-bottom: 4px;">⚙️ Admin CMS</h2>
      <p style="color: #666; margin-bottom: 16px; font-size: 0.8rem;">Manage Banners, Categories & Products live on Firebase.</p>

      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
        
        <!-- SECTION A: Add Slider / Banner -->
        <form id="admin-banner-form" style="background: #fafafa; padding: 12px; border: 1px solid #eee; border-radius: 6px;">
          <h4 style="margin-bottom: 8px;">1. Add Main Banner</h4>
          <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Banner Title</label><input type="text" id="b-title" required placeholder="MEGA SALE" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
          <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Subtitle</label><input type="text" id="b-subtitle" placeholder="50% OFF" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
          <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Image URL</label><input type="url" id="b-image" required placeholder="https://..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
          <button type="submit" style="width:100%; padding:8px; background:#fb641b; color:#fff; border:none; border-radius:4px; font-weight:700;">Save Banner</button>
        </form>

        <!-- SECTION B: Add Category -->
        <form id="admin-cat-form" style="background: #fafafa; padding: 12px; border: 1px solid #eee; border-radius: 6px;">
          <h4 style="margin-bottom: 8px;">2. Add New Category</h4>
          <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Category Name</label><input type="text" id="c-name" required placeholder="e.g. Games" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
          <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Category Emoji/Icon</label><input type="text" id="c-icon" placeholder="🎮" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
          <button type="submit" id="c-submit-btn" style="width:100%; padding:8px; background:#ff9f00; color:#fff; border:none; border-radius:4px; font-weight:700;">Save Category</button>
        </form>

      </div>

      <!-- SECTION C: Add Product -->
      <form id="seller-add-form" style="background: #fafafa; padding: 12px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 24px;">
        <h4 style="margin-bottom: 8px;">3. Add New Product</h4>
        <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Title</label><input type="text" id="p-title" required placeholder="Wireless Mouse" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
        <div style="margin-bottom:8px;">
          <label style="font-size:0.75rem;">Category</label>
          <select id="p-category" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius:4px;">
            <option value="General">General</option>
          </select>
        </div>
        <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Price ($)</label><input type="number" step="0.01" id="p-price" required placeholder="29.99" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
        <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Offer Tag</label><input type="text" id="p-tag" placeholder="20% OFF" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
        <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Image URL</label><input type="url" id="p-image" required placeholder="https://..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"/></div>
        <div style="margin-bottom:8px;"><label style="font-size:0.75rem;">Description</label><textarea id="p-desc" rows="2" required placeholder="Description..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px;"></textarea></div>
        <button type="submit" style="width:100%; padding:8px; background:#fb641b; color:#fff; border:none; border-radius:4px; font-weight:700;">PUBLISH PRODUCT</button>
      </form>

      <!-- SECTION D: Manage Live Products -->
      <h4 style="margin-bottom: 8px;">Manage Live Products</h4>
      <div id="admin-items-list" style="overflow-x: auto;"></div>
    </div>
  `;

  // Fetch Categories
  async function populateCategoryDropdown() {
    const catSelect = document.getElementById('p-category');
    if (!catSelect) return;
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      catSelect.innerHTML = '<option value="General">General</option>';
      if (!catSnap.empty) {
        catSnap.docs.forEach(d => {
          const catName = d.data().name;
          const option = document.createElement('option');
          option.value = catName;
          option.textContent = catName;
          catSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Categories Fetch Error:", err);
    }
  }

  await populateCategoryDropdown();

  // Category Submit
  document.getElementById('admin-cat-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('c-submit-btn');
    const catName = document.getElementById('c-name').value.trim();
    const catIcon = document.getElementById('c-icon').value.trim();

    if (!catName) return;

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = "Saving...";

      await addDoc(collection(db, "categories"), {
        name: catName,
        icon: catIcon || '📦',
        createdAt: new Date()
      });

      alert(`Category "${catName}" added!`);
      document.getElementById('admin-cat-form').reset();
      
      await loadDynamicCategoriesStrip();
      await populateCategoryDropdown();
    } catch (err) {
      alert("Error adding category: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Save Category";
    }
  };

  // Banner Submit
  document.getElementById('admin-banner-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "banners"), {
        title: document.getElementById('b-title').value,
        subtitle: document.getElementById('b-subtitle').value,
        imageUrl: document.getElementById('b-image').value,
        createdAt: new Date()
      });
      alert("Banner saved!");
      document.getElementById('admin-banner-form').reset();
      fetchBanners();
    } catch(err) {
      alert("Error adding banner: " + err.message);
    }
  };

  // Product Submit
  document.getElementById('seller-add-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "products"), {
        title: document.getElementById('p-title').value,
        category: document.getElementById('p-category').value,
        price: parseFloat(document.getElementById('p-price').value),
        tag: document.getElementById('p-tag').value || '',
        imageUrl: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value,
        createdAt: new Date()
      });
      alert("Product published!");
      document.getElementById('seller-add-form').reset();
      renderSellerDashboardPage();
    } catch(err) {
      alert("Error adding product: " + err.message);
    }
  };

  // Admin Items Table
  const itemsContainer = document.getElementById('admin-items-list');
  try {
    const prodSnap = await getDocs(collection(db, "products"));
    if (prodSnap.empty) {
      itemsContainer.innerHTML = '<p style="color:#878787;">No products yet.</p>';
      return;
    }

    itemsContainer.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
        <thead><tr style="border-bottom: 1px solid #ccc;"><th style="padding:6px;">Img</th><th style="padding:6px;">Title</th><th style="padding:6px;">Price</th><th style="padding:6px;">Action</th></tr></thead>
        <tbody>
          ${prodSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:6px;"><img src="${data.imageUrl}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;"/></td>
                <td style="padding:6px;"><b>${data.title}</b></td>
                <td style="padding:6px;">$${data.price}</td>
                <td style="padding:6px;"><button onclick="deleteItemByAdmin('products', '${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Del</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    itemsContainer.innerHTML = '<p>Error loading items list.</p>';
  }
}

// Fetch Products Grid
async function fetchProductsGrid(container, searchQuery = '', categoryFilter = '') {
  try {
    const snap = await getDocs(collection(db, "products"));
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = '<p style="grid-column: 1/-1; padding:10px;">No products found in the store yet.</p>';
      return;
    }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (categoryFilter && p.category !== categoryFilter) return;

      container.innerHTML += `
        <div class="card" onclick="location.hash='pdp?id=${docSnap.id}'">
          <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" class="card-img"/>
          <h3 style="font-size: 0.85rem; font-weight: 600; margin: 6px 0 4px 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color:#212121;">${p.title}</h3>
          <div style="margin-bottom: 4px;">
            <span style="background:#388e3c; color:#fff; font-size: 0.65rem; font-weight:700; padding: 2px 4px; border-radius:3px;">4.5 ★</span>
          </div>
          <div>
            <span style="font-weight:700; font-size: 0.95rem; color:#212121;">$${p.price}</span>
            ${p.tag ? `<span style="color:#388e3c; font-size: 0.7rem; font-weight:700; margin-left:4px;">${p.tag}</span>` : ''}
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p style="padding:10px;">Error loading store items.</p>`;
  }
}

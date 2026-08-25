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

// 1. Dynamic Mobile & Hamburger Styles Injection
function injectMobileStyles() {
  if (document.getElementById('mobile-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'mobile-custom-styles';
  style.innerHTML = `
    body {
      padding-bottom: 0 !important;
    }
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
    
    /* Dynamic Scrollable Mobile Categories Strip */
    .cat-strip-container {
      display: flex !important;
      overflow-x: auto !important;
      white-space: nowrap !important;
      padding: 8px 12px !important;
      gap: 12px !important;
      background: #fff !important;
      border-bottom: 1px solid #eee !important;
      -webkit-overflow-scrolling: touch;
    }
    .cat-strip-container::-webkit-scrollbar {
      display: none;
    }
    .cat-item {
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: center !important;
      font-size: 0.75rem !important;
      min-width: 60px !important;
      cursor: pointer;
    }
    .cat-icon {
      font-size: 1.5rem !important;
      margin-bottom: 4px !important;
    }

    /* Card Optimization */
    .card {
      border: 1px solid #eee !important;
      border-radius: 8px !important;
      padding: 8px !important;
      background: #fff !important;
    }
    .card-img {
      width: 100% !important;
      height: 140px !important;
      object-fit: cover !important;
      border-radius: 4px !important;
    }

    /* Hamburger Side Drawer Styles */
    .hamburger-btn {
      font-size: 1.5rem;
      cursor: pointer;
      background: none;
      border: none;
      color: inherit;
      padding: 4px 8px;
    }
    .side-drawer {
      position: fixed;
      top: 0;
      left: -270px;
      width: 260px;
      height: 100%;
      background: #ffffff;
      box-shadow: 2px 0 10px rgba(0,0,0,0.2);
      z-index: 10000;
      transition: left 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .side-drawer.open {
      left: 0;
    }
    .drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.4);
      z-index: 9999;
      display: none;
    }
    .drawer-overlay.active {
      display: block;
    }
    .drawer-header {
      background: #2874f0;
      color: #fff;
      padding: 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .drawer-links {
      display: flex;
      flex-direction: column;
      padding: 12px 0;
    }
    .drawer-links a {
      padding: 12px 20px;
      color: #333;
      text-decoration: none;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  `;
  document.head.appendChild(style);
}

// 2. Hamburger Drawer Setup
function setupHamburgerMenu() {
  const oldBottomNav = document.getElementById('mobile-bottom-nav');
  if (oldBottomNav) oldBottomNav.remove();

  if (document.getElementById('hamburger-drawer')) return;

  const drawer = document.createElement('div');
  drawer.id = 'hamburger-drawer';
  drawer.className = 'side-drawer';
  drawer.innerHTML = `
    <div class="drawer-header">
      <span>Menu</span>
      <span style="cursor:pointer;" onclick="toggleDrawer(false)">✕</span>
    </div>
    <div class="drawer-links">
      <a href="#home" onclick="toggleDrawer(false)"><span>🏠</span> Home</a>
      <a href="#search" onclick="toggleDrawer(false)"><span>🔍</span> Search</a>
      <a href="#cart" onclick="toggleDrawer(false)"><span>🛒</span> My Cart</a>
      <a href="#account" onclick="toggleDrawer(false)"><span>👤</span> Account / Profile</a>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.id = 'drawer-overlay';
  overlay.className = 'drawer-overlay';
  overlay.onclick = () => toggleDrawer(false);

  document.body.appendChild(drawer);
  document.body.appendChild(overlay);
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
  setupHamburgerMenu();

  const fullHash = window.location.hash.replace('#', '') || 'home';
  const [route, queryString] = fullHash.split('?');
  const params = new URLSearchParams(queryString);
  
  const renderFn = routes[route] || renderHomePage;
  appContainer.innerHTML = '';
  loadDynamicCategoriesStrip();
  renderFn(params);
  updateCartBadge();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

function updateNavState() {
  const authBtn = document.getElementById('account-nav-btn');
  if (!authBtn) return;
  if (currentUser) {
    authBtn.innerText = currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'My Account';
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
      strip.innerHTML = '<div style="font-size:0.85rem; color:#878787; padding: 10px;">No categories added yet.</div>';
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
    <div id="home-slider-container" style="margin-bottom: 16px;"></div>
    <div class="section-card" style="padding: 12px;">
      <div class="section-title" style="margin-bottom: 12px;">
        <span style="font-size: 1.1rem; font-weight: 700;">Featured Products</span>
      </div>
      <div class="grid" id="home-products-grid"><p style="color: var(--text-muted);">Loading products...</p></div>
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
      <div style="background: linear-gradient(90deg, #1e3c72, #2a5298); color: white; padding: 24px 16px; border-radius: 8px; text-align: center; background-image: url('${b.imageUrl}'); background-size: cover; background-position: center; min-height: 120px; display: flex; align-items: center; justify-content: center;">
        <div style="background: rgba(0,0,0,0.55); padding: 12px 20px; border-radius: 6px; width: 100%;">
          <h1 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 4px; color: #fff;">${b.title || 'Welcome'}</h1>
          <p style="font-size: 0.85rem; color: #eee; margin: 0;">${b.subtitle || ''}</p>
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
    <div class="section-card" style="padding: 12px;">
      <h2 style="font-size: 1.1rem; margin-bottom: 12px;">Category: ${categoryName}</h2>
      <div class="grid" id="plp-grid"><p style="color: var(--text-muted);">Loading products...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('plp-grid'), '', categoryName);
}

// 3. PRODUCT DETAIL PAGE (PDP)
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) return;
  appContainer.innerHTML = `<p>Loading item details...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const p = snap.data();

    appContainer.innerHTML = `
      <div class="section-card" style="padding: 16px;">
        <div>
          <img src="${p.imageUrl || 'https://via.placeholder.com/400'}" style="width: 100%; border: 1px solid var(--border); border-radius: 8px; max-height: 300px; object-fit: cover; margin-bottom: 16px;"/>
          <div style="display: flex; gap: 8px;">
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" class="btn btn-fk-yellow" style="flex: 1; padding: 12px 8px; font-size: 0.9rem;">ADD TO CART</button>
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" class="btn btn-fk-orange" style="flex: 1; padding: 12px 8px; font-size: 0.9rem;">BUY NOW</button>
          </div>
        </div>
        <div style="margin-top: 16px;">
          <h1 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 6px;">${p.title}</h1>
          <div style="font-size:0.8rem; color:var(--fk-blue); font-weight:600; margin-bottom:8px;">Category: ${p.category || 'General'}</div>
          <div class="badge-rating" style="margin-bottom: 10px;">4.5 ★</div>
          <div style="margin-bottom: 12px;">
            <span class="price-main" style="font-size: 1.3rem;">$${p.price}</span>
            ${p.tag ? `<span class="discount-tag" style="font-size: 0.75rem;">${p.tag}</span>` : ''}
          </div>
          <h4 style="margin-bottom: 6px; font-size: 0.95rem;">Description:</h4>
          <p style="color: #555; font-size: 0.85rem; line-height: 1.5; white-space: pre-line;">${p.description || 'No description provided.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p>Error loading product details.</p>`;
  }
}

// 4. SEARCH PAGE
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <div class="section-card" style="padding: 12px;">
      <h2 style="font-size: 1.1rem;">Search Results for "${query}"</h2>
      <div class="grid" id="search-grid" style="margin-top: 12px;"></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'), query);
}

// 5. CART PAGE
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div class="section-card" style="text-align: center; padding: 40px 16px;"><h2>Cart is Empty!</h2><br/><a href="#home" class="btn btn-fk-orange">Shop Now</a></div>`;
    return;
  }
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);

  appContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="section-card" style="padding: 12px;">
        <h3 style="margin-bottom: 12px; font-size: 1.1rem;">My Cart (${window.cart.length})</h3>
        ${window.cart.map((item, idx) => `
          <div style="display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid var(--border); align-items: center;">
            <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"/>
            <div style="flex: 1;">
              <h4 style="font-size: 0.9rem; margin-bottom: 4px;">${item.title}</h4>
              <div><span class="price-main" style="font-size: 0.95rem;">$${item.price}</span></div>
            </div>
            <button onclick="removeFromCart(${idx})" class="btn" style="color: #d32f2f; font-size: 0.8rem; padding: 4px 8px;">REMOVE</button>
          </div>
        `).join('')}
      </div>
      <div class="section-card" style="height: fit-content; padding: 16px;">
        <h4 style="color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 12px; font-size: 0.9rem;">PRICE DETAILS</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;">
          <span>Items (${window.cart.length})</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-weight: 800; border-top: 1px dashed var(--border); padding-top: 12px;">
          <span>Total Amount</span>
          <span style="color: var(--green-success);">$${total.toFixed(2)}</span>
        </div>
        <button onclick="location.hash='checkout'" class="btn btn-fk-orange" style="width: 100%;">PLACE ORDER</button>
      </div>
    </div>
  `;
}

// 6. CHECKOUT PAGE
function renderCheckoutPage() {
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);
  appContainer.innerHTML = `
    <div class="form-card" style="padding: 16px;">
      <h2 style="margin-bottom: 16px; font-size: 1.1rem;">Checkout ($${total.toFixed(2)})</h2>
      <form id="checkout-form">
        <div class="form-group"><label>Delivery / Address</label><textarea required placeholder="Address..." style="width:100%; height:70px;"></textarea></div>
        <div class="form-group"><label>Payment Method</label>
          <select style="width:100%; padding:8px;"><option>UPI / NetBanking</option><option>Credit/Debit Card</option><option>Cash on Delivery</option></select>
        </div>
        <button type="submit" class="btn btn-fk-orange" style="width: 100%; padding: 12px;">CONFIRM ORDER</button>
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
    <div class="section-card" style="text-align: center; padding: 32px 16px;">
      <h2 style="color: var(--green-success); font-size: 1.3rem;">🎉 Order Confirmed!</h2>
      <p style="margin: 12px 0 20px 0; font-size: 0.85rem;">Thank you for shopping with us.</p>
      <a href="#home" class="btn btn-fk-yellow">Continue Shopping</a>
    </div>
  `;
}

// 8. AUTHENTICATION (Google Login Refresh Fix Included)
function renderAuthPage() {
  appContainer.innerHTML = `
    <div class="form-card" style="padding: 16px;">
      <h2 style="text-align: center; margin-bottom: 16px; font-size: 1.2rem;">Account Login</h2>
      <button type="button" id="google-login-btn" class="btn btn-outline" style="width: 100%; margin-bottom: 16px; padding: 10px; display:flex; align-items:center; justify-content:center; gap:8px;">
        <span>🌐</span> Continue with Google
      </button>
      <form id="email-form">
        <div class="form-group"><label>Email Address</label><input type="email" id="a-email" required style="width:100%; padding:8px;"/></div>
        <div class="form-group"><label>Password</label><input type="password" id="a-pass" required style="width:100%; padding:8px;"/></div>
        <button type="submit" class="btn btn-fk-orange" style="width: 100%; padding: 10px;">Login</button>
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
    <div class="section-card" style="padding: 20px; text-align: center;">
      <h3>User Profile</h3>
      <p style="color: var(--text-muted); margin: 8px 0 16px 0; font-size: 0.85rem;">${currentUser.email}</p>
      <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; margin-bottom: 16px;">
        ${isAdmin ? `<a href="#seller-dashboard" class="btn btn-fk-yellow" style="width:100%; text-align:center;">⚙️ Admin Control Panel CMS</a>` : ''}
      </div>
      <button id="so-btn" class="btn btn-outline" style="width:100%;">Logout</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// 10. ADMIN DASHBOARD (CMS)
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email && currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `<div class="section-card"><h2>Access Denied</h2><p>Only authorized admin can access this page.</p></div>`;
    return;
  }

  appContainer.innerHTML = `
    <div class="section-card" style="padding: 12px;">
      <h2 style="font-size: 1.2rem; margin-bottom: 4px;">⚙️ Admin CMS</h2>
      <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 0.8rem;">Manage Sliders, Categories & Products live on Firebase.</p>

      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
        
        <!-- SECTION A: Add Slider / Banner -->
        <form id="admin-banner-form" style="background: #fafafa; padding: 12px; border: 1px solid var(--border); border-radius: 6px;">
          <h4 style="margin-bottom: 8px;">1. Add Main Banner</h4>
          <div class="form-group"><label>Banner Title</label><input type="text" id="b-title" required placeholder="MEGA SALE" style="width:100%; padding:6px;"/></div>
          <div class="form-group"><label>Subtitle</label><input type="text" id="b-subtitle" placeholder="50% OFF" style="width:100%; padding:6px;"/></div>
          <div class="form-group"><label>Image URL</label><input type="url" id="b-image" required placeholder="https://..." style="width:100%; padding:6px;"/></div>
          <button type="submit" class="btn btn-fk-orange" style="width:100%;">Save Banner</button>
        </form>

        <!-- SECTION B: Add Category -->
        <form id="admin-cat-form" style="background: #fafafa; padding: 12px; border: 1px solid var(--border); border-radius: 6px;">
          <h4 style="margin-bottom: 8px;">2. Add New Category</h4>
          <div class="form-group"><label>Category Name</label><input type="text" id="c-name" required placeholder="e.g. Games" style="width:100%; padding:6px;"/></div>
          <div class="form-group"><label>Category Emoji/Icon</label><input type="text" id="c-icon" placeholder="🎮" style="width:100%; padding:6px;"/></div>
          <button type="submit" id="c-submit-btn" class="btn btn-fk-yellow" style="width:100%;">Save Category</button>
        </form>

      </div>

      <!-- SECTION C: Add Product -->
      <form id="seller-add-form" style="background: #fafafa; padding: 12px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 24px;">
        <h4 style="margin-bottom: 8px;">3. Add New Product</h4>
        <div class="form-group"><label>Title</label><input type="text" id="p-title" required placeholder="Wireless Mouse" style="width:100%; padding:6px;"/></div>
        <div class="form-group">
          <label>Category</label>
          <select id="p-category" style="width: 100%; padding: 8px; border: 1px solid var(--border);">
            <option value="General">General</option>
          </select>
        </div>
        <div class="form-group"><label>Price ($)</label><input type="number" step="0.01" id="p-price" required placeholder="29.99" style="width:100%; padding:6px;"/></div>
        <div class="form-group"><label>Offer Tag</label><input type="text" id="p-tag" placeholder="20% OFF" style="width:100%; padding:6px;"/></div>
        <div class="form-group"><label>Image URL</label><input type="url" id="p-image" required placeholder="https://..." style="width:100%; padding:6px;"/></div>
        <div class="form-group"><label>Description</label><textarea id="p-desc" rows="2" required placeholder="Description..." style="width:100%; padding:6px;"></textarea></div>
        <button type="submit" class="btn btn-fk-orange" style="width:100%;">PUBLISH PRODUCT</button>
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
      itemsContainer.innerHTML = '<p style="color:var(--text-muted);">No products yet.</p>';
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
                <td style="padding:6px;"><button onclick="deleteItemByAdmin('products', '${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:4px;">Del</button></td>
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
      container.innerHTML = '<p style="grid-column: 1/-1;">No products found in the store yet.</p>';
      return;
    }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (categoryFilter && p.category !== categoryFilter) return;

      container.innerHTML += `
        <div class="card" onclick="location.hash='pdp?id=${docSnap.id}'">
          <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" class="card-img"/>
          <h3 style="font-size: 0.85rem; font-weight: 600; margin: 6px 0 4px 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${p.title}</h3>
          <div style="margin-bottom: 4px;">
            <span class="badge-rating" style="font-size: 0.7rem; padding: 2px 4px;">4.5 ★</span>
          </div>
          <div>
            <span class="price-main" style="font-size: 0.95rem;">$${p.price}</span>
            ${p.tag ? `<span class="discount-tag" style="font-size: 0.7rem;">${p.tag}</span>` : ''}
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p>Error loading store items.</p>`;
  }
}

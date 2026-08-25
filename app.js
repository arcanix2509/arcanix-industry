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

// 1. CSS & Layout Setup
function injectResponsiveStyles() {
  if (document.getElementById('responsive-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'responsive-custom-styles';
  style.innerHTML = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Inter, -apple-system, Roboto, sans-serif; }
    body { background-color: #f1f3f6; color: #212121; }

    .main-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px;
    }

    /* Sticky Navigation */
    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #2874f0;
      color: #ffffff;
      box-shadow: 0 2px 4px 0 rgba(0,0,0,.08);
    }
    .header-top {
      max-width: 1280px;
      margin: 0 auto;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .hamburger-btn {
      font-size: 1.4rem;
      cursor: pointer;
      background: none;
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
    }
    .brand-logo {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
      font-style: italic;
    }
    .brand-logo span { color: #ffe500; font-style: normal; }

    .header-search-box {
      flex: 1;
      max-width: 600px;
      position: relative;
    }
    .header-search-box input {
      width: 100%;
      padding: 9px 42px 9px 16px;
      border: none;
      border-radius: 2px;
      outline: none;
      font-size: 0.9rem;
    }
    .header-search-box button {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px 8px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .header-link {
      color: #fff;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-count {
      background: #ffe500;
      color: #000;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 1px 6px;
      border-radius: 10px;
    }

    /* Mobile Responsive Search */
    .mobile-search-strip {
      display: none;
      background: #2874f0;
      padding: 0 12px 10px 12px;
    }

    @media (max-width: 767px) {
      .desktop-search { display: none !important; }
      .mobile-search-strip { display: block !important; }
    }
    @media (min-width: 768px) {
      .hamburger-btn { display: none !important; }
      .main-container { padding: 16px; }
    }

    /* Grid Layout */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (min-width: 600px) {
      .products-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
    }
    @media (min-width: 900px) {
      .products-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
    }
    @media (min-width: 1100px) {
      .products-grid { grid-template-columns: repeat(5, 1fr); gap: 16px; }
    }

    .product-card {
      background: #fff;
      border-radius: 4px;
      padding: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .product-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }
    .product-card-img {
      width: 100%;
      height: 170px;
      object-fit: contain;
      margin-bottom: 10px;
    }
    .product-card-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: #212121;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .rating-badge {
      background: #388e3c;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      width: fit-content;
      margin-bottom: 6px;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .main-price { font-size: 1rem; font-weight: 700; color: #212121; }
    .offer-tag { font-size: 0.75rem; font-weight: 700; color: #388e3c; }

    /* Side Drawer */
    .side-drawer {
      position: fixed;
      top: 0; left: -280px;
      width: 270px; height: 100%;
      background: #fff;
      box-shadow: 2px 0 10px rgba(0,0,0,0.25);
      z-index: 10000;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .side-drawer.open { left: 0; }
    .drawer-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: none;
    }
    .drawer-overlay.active { display: block; }
    .drawer-header {
      background: #2874f0;
      color: #fff;
      padding: 16px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .drawer-links a {
      padding: 14px 16px;
      color: #333;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  `;
  document.head.appendChild(style);
}

// 2. Header & Navigation Component
function setupResponsiveHeader() {
  const oldHeader = document.getElementById('main-header');
  if (!oldHeader) {
    const header = document.createElement('header');
    header.id = 'main-header';
    header.className = 'app-header';
    header.innerHTML = `
      <div class="header-top">
        <div class="header-left">
          <button class="hamburger-btn" onclick="toggleDrawer(true)" aria-label="Open Menu">☰</button>
          <a href="#home" class="brand-logo">Arcanix <span>Plus</span></a>
        </div>

        <div class="header-search-box desktop-search">
          <input type="text" id="desktop-search-input" placeholder="Search for products, brands and more..." onkeydown="handleSearch(event, 'desktop-search-input')"/>
          <button onclick="triggerSearch('desktop-search-input')">🔍</button>
        </div>

        <div class="header-right">
          <a href="#account" id="account-nav-btn" class="header-link">
            <span>👤</span> <span id="auth-btn-text">Login</span>
          </a>
          <a href="#cart" class="header-link">
            <span>🛒</span> Cart <span class="badge-count" id="cart-count">0</span>
          </a>
        </div>
      </div>

      <div class="mobile-search-strip">
        <div class="header-search-box" style="max-width: 100%;">
          <input type="text" id="mobile-search-input" placeholder="Search products, brands and more..." onkeydown="handleSearch(event, 'mobile-search-input')"/>
          <button onclick="triggerSearch('mobile-search-input')">🔍</button>
        </div>
      </div>
    `;
    document.body.prepend(header);
  }

  if (!document.getElementById('hamburger-drawer')) {
    const drawer = document.createElement('div');
    drawer.id = 'hamburger-drawer';
    drawer.className = 'side-drawer';
    drawer.innerHTML = `
      <div class="drawer-header">
        <span>Arcanix Menu</span>
        <span style="cursor:pointer;" onclick="toggleDrawer(false)">✕</span>
      </div>
      <div class="drawer-links">
        <a href="#home" onclick="toggleDrawer(false)"><span>🏠</span> Home</a>
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

// Search Actions
window.handleSearch = function(e, inputId) {
  if (e.key === 'Enter') triggerSearch(inputId);
};

window.triggerSearch = function(inputId) {
  const query = document.getElementById(inputId).value.trim();
  if (query) {
    location.hash = `search?q=${encodeURIComponent(query)}`;
  }
};

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
  injectResponsiveStyles();
  setupResponsiveHeader();

  const fullHash = window.location.hash.replace('#', '') || 'home';
  const [route, queryString] = fullHash.split('?');
  const params = new URLSearchParams(queryString);
  
  const renderFn = routes[route] || renderHomePage;
  appContainer.className = 'main-container';
  appContainer.innerHTML = '';
  
  renderFn(params);
  updateCartBadge();
  updateNavState();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

function updateNavState() {
  const authText = document.getElementById('auth-btn-text');
  const authBtn = document.getElementById('account-nav-btn');
  if (!authText || !authBtn) return;

  if (currentUser) {
    authText.innerText = currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Account';
    authBtn.href = '#account';
  } else {
    authText.innerText = 'Login';
    authBtn.href = '#auth';
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.innerText = window.cart.length;
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

// 3. HOME PAGE (BANNER & CATEGORY DROPDOWN)
async function renderHomePage() {
  appContainer.innerHTML = `
    <div id="home-slider-container" style="margin-bottom: 16px;"></div>

    <div style="background: #fff; padding: 16px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      
      <!-- Category Dropdown Filter Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; color:#212121;" id="grid-title">Deals of the Day</h2>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 0.85rem; font-weight: 600; color: #666;">Category:</label>
          <select id="homepage-cat-dropdown" onchange="handleHomeCategoryChange(this.value)" style="padding: 8px 12px; border: 1px solid #2874f0; border-radius: 4px; background: #fff; font-size: 0.85rem; font-weight: 600; color: #2874f0; outline: none; cursor: pointer;">
            <option value="">All Categories 📦</option>
          </select>
        </div>
      </div>

      <div class="products-grid" id="home-products-grid"><p style="color: #666;">Loading store items...</p></div>
    </div>
  `;

  fetchBanners();
  populateHomeCategoryDropdown();
  fetchProductsGrid(document.getElementById('home-products-grid'));
}

// Fetch Banner with Fallback & Image Fix
async function fetchBanners() {
  const container = document.getElementById('home-slider-container');
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "banners"));
    if (snap.empty) {
      container.style.display = 'none';
      return;
    }
    
    const banners = snap.docs.map(doc => doc.data());
    const b = banners[banners.length - 1]; 
    
    const fallbackImage = 'https://picsum.photos/1200/400';
    const bannerImgUrl = b.imageUrl ? b.imageUrl.trim() : fallbackImage;

    container.style.display = 'block';
    container.innerHTML = `
      <div style="position: relative; width: 100%; min-height: 200px; max-height: 350px; overflow: hidden; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); background: #e0e0e0;">
        <img src="${bannerImgUrl}" 
             alt="${b.title || 'Banner Image'}" 
             onerror="this.onerror=null; this.src='${fallbackImage}';" 
             style="width: 100%; height: 260px; object-fit: cover; display: block;" />
        
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0, 0, 0, 0.75)); padding: 20px 24px; color: #ffffff;">
          <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${b.title || 'Special Promotion'}</h1>
          <p style="font-size: 0.95rem; font-weight: 600; color: #ffe500; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">${b.subtitle || ''}</p>
        </div>
      </div>
    `;
  } catch(e) {
    console.error("Banner fetch error:", e);
    container.style.display = 'none';
  }
}

// Populate Homepage Category Dropdown
async function populateHomeCategoryDropdown() {
  const catSelect = document.getElementById('homepage-cat-dropdown');
  if (!catSelect) return;
  try {
    const snap = await getDocs(collection(db, "categories"));
    if (!snap.empty) {
      snap.docs.forEach(docSnap => {
        const c = docSnap.data();
        const option = document.createElement('option');
        option.value = c.name;
        option.textContent = `${c.icon || '📦'} ${c.name}`;
        catSelect.appendChild(option);
      });
    }
  } catch(e) {
    console.error("Error loading categories dropdown:", e);
  }
}

// Handle Category Filter Change
window.handleHomeCategoryChange = function(selectedCat) {
  const gridTitle = document.getElementById('grid-title');
  if (gridTitle) {
    gridTitle.innerText = selectedCat ? `Category: ${selectedCat}` : "Deals of the Day";
  }
  fetchProductsGrid(document.getElementById('home-products-grid'), '', selectedCat);
};

// 4. CATEGORY PRODUCTS PAGE (PLP)
async function renderCategoryProductsPage(params) {
  const categoryName = params.get('category') || '';
  appContainer.innerHTML = `
    <div style="background:#fff; padding: 16px; border-radius:4px;">
      <h2 style="font-size: 1.1rem; margin-bottom: 14px; color:#212121;">Showing results for: <b>${categoryName}</b></h2>
      <div class="products-grid" id="plp-grid"><p style="color: #666;">Loading products...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('plp-grid'), '', categoryName);
}

// 5. PRODUCT DETAIL PAGE (PDP)
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) return;
  appContainer.innerHTML = `<p style="padding:20px; background:#fff;">Loading product specifications...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const p = snap.data();

    appContainer.innerHTML = `
      <div style="background: #fff; border-radius:4px; padding: 20px; display: flex; flex-wrap: wrap; gap: 32px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="flex: 1 1 320px; text-align: center;">
          <img src="${p.imageUrl || 'https://via.placeholder.com/400'}" style="width: 100%; max-height: 380px; object-fit: contain; margin-bottom: 20px;"/>
          <div style="display: flex; gap: 12px;">
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" style="flex: 1; padding: 14px 8px; font-size: 0.95rem; font-weight:700; background:#ff9f00; color:#fff; border:none; border-radius:2px; cursor:pointer;">ADD TO CART</button>
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" style="flex: 1; padding: 14px 8px; font-size: 0.95rem; font-weight:700; background:#fb641b; color:#fff; border:none; border-radius:2px; cursor:pointer;">BUY NOW</button>
          </div>
        </div>
        <div style="flex: 1 1 320px;">
          <h1 style="font-size: 1.3rem; font-weight: 500; margin-bottom: 8px; color:#212121; line-height:1.4;">${p.title}</h1>
          <div class="rating-badge" style="margin-bottom: 12px;">4.5 ★</div>
          <div style="font-size:0.85rem; color:#878787; font-weight:600; margin-bottom:14px;">Category: ${p.category || 'General'}</div>
          <div style="margin-bottom: 20px; border-bottom:1px solid #f0f0f0; padding-bottom:14px;">
            <span style="font-size: 1.8rem; font-weight:800; color:#212121;">$${p.price}</span>
            ${p.tag ? `<span style="color:#388e3c; font-size:0.9rem; font-weight:700; margin-left:12px;">${p.tag}</span>` : ''}
          </div>
          <h4 style="margin-bottom: 8px; font-size: 0.95rem; font-weight:700; color:#212121;">Product Details:</h4>
          <p style="color: #555; font-size: 0.9rem; line-height: 1.6; white-space: pre-line;">${p.description || 'No description provided.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p>Error loading product details.</p>`;
  }
}

// 6. SEARCH PAGE
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <div style="background:#fff; padding: 16px; border-radius:4px;">
      <h2 style="font-size: 1.1rem; margin-bottom: 12px; color:#212121;">Search Results for "${query}"</h2>
      <div class="products-grid" id="search-grid"></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'), query);
}

// 7. CART PAGE
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div style="text-align: center; padding: 50px 16px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);"><h2>Your Shopping Cart is Empty!</h2><br/><a href="#home" style="display:inline-block; padding:12px 28px; background:#2874f0; color:#fff; text-decoration:none; border-radius:2px; font-weight:700; font-size:0.9rem;">Shop Now</a></div>`;
    return;
  }
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);

  appContainer.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 16px;">
      <div style="flex: 2 1 320px; background:#fff; padding: 16px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <h3 style="margin-bottom: 16px; font-size: 1.1rem; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">My Cart (${window.cart.length})</h3>
        ${window.cart.map((item, idx) => `
          <div style="display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <img src="${item.image}" style="width: 70px; height: 70px; object-fit: contain;"/>
            <div style="flex: 1;">
              <h4 style="font-size: 0.9rem; font-weight:500; margin-bottom: 6px; color:#212121;">${item.title}</h4>
              <div><span style="font-weight:700; font-size: 1.05rem; color:#212121;">$${item.price}</span></div>
            </div>
            <button onclick="removeFromCart(${idx})" style="background:none; border:none; color: #2874f0; font-size: 0.85rem; font-weight:700; cursor:pointer;">REMOVE</button>
          </div>
        `).join('')}
      </div>
      <div style="flex: 1 1 260px; background:#fff; padding: 16px; border-radius:4px; height: fit-content; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <h4 style="color: #878787; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 14px; font-size: 0.85rem; font-weight:700;">PRICE DETAILS</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
          <span>Price (${window.cart.length} items)</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; color:#388e3c;">
          <span>Delivery Charges</span>
          <span>FREE</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 18px; font-weight: 800; border-top: 1px dashed #e0e0e0; padding-top: 14px; font-size: 1.1rem;">
          <span>Total Amount</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <button onclick="location.hash='checkout'" style="width: 100%; padding: 13px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer; font-size:0.95rem;">PLACE ORDER</button>
      </div>
    </div>
  `;
}

// 8. CHECKOUT PAGE
function renderCheckoutPage() {
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; max-width: 600px; margin: 0 auto; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h2 style="margin-bottom: 18px; font-size: 1.2rem; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">Order Summary ($${total.toFixed(2)})</h2>
      <form id="checkout-form">
        <div style="margin-bottom:14px;"><label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Delivery Address</label><textarea required placeholder="Enter complete address..." style="width:100%; height:80px; padding:10px; border:1px solid #ccc; border-radius:2px; font-size:0.9rem;"></textarea></div>
        <div style="margin-bottom:20px;"><label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Payment Mode</label>
          <select style="width:100%; padding:10px; border:1px solid #ccc; border-radius:2px; font-size:0.9rem;"><option>UPI / NetBanking</option><option>Credit / Debit Card</option><option>Cash on Delivery</option></select>
        </div>
        <button type="submit" style="width: 100%; padding: 14px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer; font-size:1rem;">CONFIRM & PAY</button>
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

// 9. ORDER CONFIRMATION
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div style="text-align: center; padding: 50px 16px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h2 style="color: #388e3c; font-size: 1.5rem; margin-bottom:8px;">🎉 Order Placed Successfully!</h2>
      <p style="margin-bottom: 24px; color:#666; font-size: 0.95rem;">An email confirmation has been sent to your registered account.</p>
      <a href="#home" style="display:inline-block; padding:12px 28px; background:#2874f0; color:#fff; text-decoration:none; border-radius:2px; font-weight:700;">Continue Shopping</a>
    </div>
  `;
}

// 10. AUTHENTICATION
function renderAuthPage() {
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; max-width: 400px; margin: 20px auto; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 1.3rem; color:#2874f0; font-weight:800;">Login / Sign Up</h2>
      <button type="button" id="google-login-btn" style="width: 100%; margin-bottom: 16px; padding: 11px; background:#fff; border:1px solid #ccc; border-radius:2px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer;">
        <span>🌐</span> Sign in with Google
      </button>
      <form id="email-form">
        <div style="margin-bottom:12px;"><label style="display:block; font-size:0.85rem; margin-bottom:4px;">Email</label><input type="email" id="a-email" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:2px;"/></div>
        <div style="margin-bottom:16px;"><label style="display:block; font-size:0.85rem; margin-bottom:4px;">Password</label><input type="password" id="a-pass" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:2px;"/></div>
        <button type="submit" style="width: 100%; padding: 12px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer;">CONTINUE</button>
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

// 11. USER DASHBOARD
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; text-align: center; max-width: 480px; margin: 0 auto; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.2rem;">My Account</h3>
      <p style="color: #666; margin: 6px 0 20px 0; font-size: 0.9rem;">${currentUser.email}</p>
      <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-bottom: 20px;">
        ${isAdmin ? `<a href="#seller-dashboard" style="display:block; width:100%; padding:12px; background:#2874f0; color:#fff; text-decoration:none; font-weight:700; border-radius:2px;">⚙️ Admin Control Panel (CMS)</a>` : ''}
      </div>
      <button id="so-btn" style="width:100%; padding:12px; background:none; border:1px solid #ccc; border-radius:2px; cursor:pointer; font-weight:600; color:#d32f2f;">Logout Account</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// 12. ADMIN DASHBOARD
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email && currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `<div style="padding:20px; background:#fff;"><h2>Access Denied</h2><p>Only authorized admin can access this page.</p></div>`;
    return;
  }

  appContainer.innerHTML = `
    <div style="padding: 20px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h2 style="font-size: 1.2rem; margin-bottom: 4px;">⚙️ Admin Panel (E-Commerce CMS)</h2>
      <p style="color: #666; margin-bottom: 20px; font-size: 0.85rem;">Manage Banners, Categories & Live Products.</p>

      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        
        <!-- SECTION A: Add Slider / Banner -->
        <form id="admin-banner-form" style="flex: 1 1 300px; background: #fafafa; padding: 16px; border: 1px solid #eee; border-radius: 4px;">
          <h4 style="margin-bottom: 12px;">1. Add Hero Banner</h4>
          <div style="margin-bottom:8px;"><label style="font-size:0.8rem;">Title</label><input type="text" id="b-title" required placeholder="FESTIVE SALE" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="margin-bottom:8px;"><label style="font-size:0.8rem;">Subtitle</label><input type="text" id="b-subtitle" placeholder="Up to 80% OFF" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="margin-bottom:12px;"><label style="font-size:0.8rem;">Image URL</label><input type="url" id="b-image" required placeholder="https://..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <button type="submit" style="width:100%; padding:8px; background:#fb641b; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;">Save Banner</button>
        </form>

        <!-- SECTION B: Add Category -->
        <form id="admin-cat-form" style="flex: 1 1 300px; background: #fafafa; padding: 16px; border: 1px solid #eee; border-radius: 4px;">
          <h4 style="margin-bottom: 12px;">2. Add New Category</h4>
          <div style="margin-bottom:8px;"><label style="font-size:0.8rem;">Category Name</label><input type="text" id="c-name" required placeholder="Electronics" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="margin-bottom:12px;"><label style="font-size:0.8rem;">Icon Emoji</label><input type="text" id="c-icon" placeholder="⚡" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <button type="submit" id="c-submit-btn" style="width:100%; padding:8px; background:#2874f0; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;">Save Category</button>
        </form>

      </div>

      <!-- SECTION C: Add Product -->
      <form id="seller-add-form" style="background: #fafafa; padding: 16px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 24px;">
        <h4 style="margin-bottom: 12px;">3. Publish New Product</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1 1 200px; margin-bottom:8px;"><label style="font-size:0.8rem;">Title</label><input type="text" id="p-title" required placeholder="Headphones" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          
          <div style="flex: 1 1 200px; margin-bottom:8px;">
            <label style="font-size:0.8rem;">Select Category</label>
            <select id="p-category" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius:2px; background:#fff; font-size:0.85rem;">
              <option value="General">General</option>
            </select>
          </div>

          <div style="flex: 1 1 200px; margin-bottom:8px;"><label style="font-size:0.8rem;">Price ($)</label><input type="number" step="0.01" id="p-price" required placeholder="49.99" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 200px; margin-bottom:8px;"><label style="font-size:0.8rem;">Offer Tag</label><input type="text" id="p-tag" placeholder="Hot Deal" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 100%; margin-bottom:8px;"><label style="font-size:0.8rem;">Image URL</label><input type="url" id="p-image" required placeholder="https://..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 100%; margin-bottom:12px;"><label style="font-size:0.8rem;">Description</label><textarea id="p-desc" rows="2" required placeholder="Product specifications..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"></textarea></div>
        </div>
        <button type="submit" style="width:100%; padding:10px; background:#fb641b; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;">PUBLISH PRODUCT NOW</button>
      </form>

      <!-- SECTION D: Manage Live Products -->
      <h4 style="margin-bottom: 12px;">Manage Live Products</h4>
      <div id="admin-items-list" style="overflow-x: auto;"></div>
    </div>
  `;

  // Dynamic Dropdown for Product Form in Admin Dashboard
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
      await populateCategoryDropdown();
    } catch (err) {
      alert("Error adding category: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Save Category";
    }
  };

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

  const itemsContainer = document.getElementById('admin-items-list');
  try {
    const prodSnap = await getDocs(collection(db, "products"));
    if (prodSnap.empty) {
      itemsContainer.innerHTML = '<p style="color:#878787;">No live products found.</p>';
      return;
    }

    itemsContainer.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead><tr style="border-bottom: 2px solid #e0e0e0; text-align:left;"><th style="padding:10px;">Item</th><th style="padding:10px;">Title</th><th style="padding:10px;">Price</th><th style="padding:10px;">Action</th></tr></thead>
        <tbody>
          ${prodSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:8px;"><img src="${data.imageUrl}" style="width: 40px; height: 40px; object-fit: contain;"/></td>
                <td style="padding:8px;"><b>${data.title}</b></td>
                <td style="padding:8px;">$${data.price}</td>
                <td style="padding:8px;"><button onclick="deleteItemByAdmin('products', '${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:4px 10px; border-radius:2px; cursor:pointer;">Delete</button></td>
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

// 13. DATA FETCHING (PRODUCTS GRID)
async function fetchProductsGrid(container, searchQuery = '', categoryFilter = '') {
  try {
    const snap = await getDocs(collection(db, "products"));
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = '<p style="grid-column: 1/-1;">No products found in store.</p>';
      return;
    }

    let matchFound = false;
    snap.forEach((docSnap) => {
      const p = docSnap.data();
      
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (categoryFilter && p.category !== categoryFilter) return;

      matchFound = true;
      container.innerHTML += `
        <div class="product-card" onclick="location.hash='pdp?id=${docSnap.id}'">
          <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" class="product-card-img"/>
          <div>
            <div class="product-card-title">${p.title}</div>
            <div class="rating-badge">4.5 ★</div>
            <div class="price-row">
              <span class="main-price">$${p.price}</span>
              ${p.tag ? `<span class="offer-tag">${p.tag}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    if (!matchFound) {
      container.innerHTML = '<p style="grid-column: 1/-1; color:#878787;">No products available for this category.</p>';
    }
  } catch (err) {
    container.innerHTML = `<p>Error loading store items.</p>`;
  }
}

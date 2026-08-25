import { db, auth, onAuthStateChanged, googleProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, ADMIN_EMAIL } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.cart = JSON.parse(localStorage.getItem('arcanix_cart')) || [];
window.wishlist = JSON.parse(localStorage.getItem('arcanix_wishlist')) || [];
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavState();
});

const routes = {
  'home': renderHomePage,
  'plp': renderProductListingPage,
  'pdp': renderProductDetailPage,
  'search': renderSearchResultsPage,
  'cart': renderCartPage,
  'checkout': renderCheckoutPage,
  'order-confirmation': renderOrderConfirmationPage,
  'auth': renderAuthPage,
  'account': renderUserDashboardPage,
  'my-orders': renderOrdersPage,
  'wishlist': renderWishlistPage,
  'help': () => renderStaticPage('Flipkart Customer Care', 'Need help with downloads or purchases? Contact 24/7 support.'),
  'seller-register': renderSellerRegisterPage,
  'seller-dashboard': renderSellerDashboardPage
};

const appContainer = document.getElementById('app-view');

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

window.addToCart = (id, title, price, image) => {
  window.cart.push({ id, title, price, image });
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  updateCartBadge();
  alert(`${title} added to Cart!`);
};

window.removeFromCart = (index) => {
  window.cart.splice(index, 1);
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  renderCartPage();
};

// PAGE 1: Flipkart Style Home
async function renderHomePage() {
  appContainer.innerHTML = `
    <!-- Flipkart Banner Slider Placeholder -->
    <div style="background: linear-gradient(90deg, #1e3c72, #2a5298); color: white; padding: 40px; border-radius: 4px; margin-bottom: 20px; text-align: center;">
      <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px;">BIG SAVINGS ON UNITY ASSETS & CODE ⚡</h1>
      <p>Get up to 80% OFF on Top Rated 3D Environments & C# Scripts</p>
    </div>

    <div class="section-card">
      <div class="section-title">
        <span>Deals of the Day</span>
        <a href="#plp" class="btn btn-fk-yellow" style="padding: 6px 16px; font-size: 0.85rem;">VIEW ALL</a>
      </div>
      <div class="grid" id="home-products-grid"><p style="color: var(--text-muted);">Fetching deals...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('home-products-grid'));
}

// PAGE 2: Catalog Page (PLP)
function renderProductListingPage(params) {
  const cat = params.get('category') || 'All';
  appContainer.innerHTML = `
    <div class="section-card">
      <h2 style="font-size: 1.3rem; margin-bottom: 16px;">Results for "${cat.toUpperCase()}"</h2>
      <div class="grid" id="plp-grid"><p style="color: var(--text-muted);">Loading catalog...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('plp-grid'));
}

// PAGE 3: Detail Page (PDP)
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) return;
  appContainer.innerHTML = `<p>Loading asset details...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const p = snap.data();
    const originalPrice = (p.price * 1.4).toFixed(2);

    appContainer.innerHTML = `
      <div class="section-card" style="display: grid; grid-template-columns: 380px 1fr; gap: 32px;">
        <div>
          <img src="${p.imageUrl || 'https://via.placeholder.com/400'}" style="width: 100%; border: 1px solid var(--border); border-radius: 4px; max-height: 380px; object-fit: cover; margin-bottom: 16px;"/>
          <div style="display: flex; gap: 12px;">
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" class="btn btn-fk-yellow" style="flex: 1;">ADD TO CART</button>
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" class="btn btn-fk-orange" style="flex: 1;">BUY NOW</button>
          </div>
        </div>

        <div>
          <h1 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 8px;">${p.title}</h1>
          <div class="badge-rating" style="margin-bottom: 12px;">4.8 ★</div>
          
          <div style="margin-bottom: 16px;">
            <span class="price-main">$${p.price}</span>
            <span class="price-strike">$${originalPrice}</span>
            <span class="discount-tag">40% off</span>
          </div>

          <h4 style="margin-bottom: 8px;">Product Description:</h4>
          <p style="color: #555; font-size: 0.95rem; line-height: 1.6; white-space: pre-line;">${p.description || 'High performance asset pack for Unity projects.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p>Error loading product.</p>`;
  }
}

// PAGE 4: Search View
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <div class="section-card">
      <h2>Search Results for "${query}"</h2>
      <div class="grid" id="search-grid" style="margin-top: 16px;"></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'));
}

// PAGE 5: Cart
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div class="section-card" style="text-align: center; padding: 40px;"><h2>Your Shopping Cart is Empty!</h2><br/><a href="#home" class="btn btn-fk-blue" style="background:var(--fk-blue); color:#fff;">Shop Now</a></div>`;
    return;
  }
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);

  appContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 340px; gap: 16px;">
      <div class="section-card">
        <h3 style="margin-bottom: 16px;">My Cart (${window.cart.length})</h3>
        ${window.cart.map((item, idx) => `
          <div style="display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid var(--border);">
            <img src="${item.image}" style="width: 80px; height: 80px; object-fit: cover;"/>
            <div style="flex: 1;">
              <h4>${item.title}</h4>
              <div style="margin-top: 8px;"><span class="price-main">$${item.price}</span></div>
            </div>
            <button onclick="removeFromCart(${idx})" class="btn" style="color: var(--text-main); font-size: 0.9rem;">REMOVE</button>
          </div>
        `).join('')}
      </div>

      <div class="section-card" style="height: fit-content;">
        <h4 style="color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px;">PRICE DETAILS</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span>Price (${window.cart.length} items)</span>
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

// PAGE 6: Checkout
function renderCheckoutPage() {
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);
  appContainer.innerHTML = `
    <div class="form-card">
      <h2 style="margin-bottom: 20px; font-size: 1.2rem;">Order Checkout ($${total.toFixed(2)})</h2>
      <form id="checkout-form">
        <div class="form-group"><label>Delivery Address</label><textarea required placeholder="Full Address"></textarea></div>
        <div class="form-group"><label>Payment Mode</label>
          <select><option>UPI / NetBanking</option><option>Credit/Debit Card</option></select>
        </div>
        <button type="submit" class="btn btn-fk-orange" style="width: 100%;">PAY NOW</button>
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

// PAGE 7: Confirmation
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div class="section-card" style="text-align: center; padding: 40px;">
      <h1 style="color: var(--green-success);">🎉 Order Confirmed!</h1>
      <p style="margin: 12px 0;">Your digital assets are ready for download in your account.</p>
      <a href="#my-orders" class="btn btn-fk-yellow">View Downloads</a>
    </div>
  `;
}

// PAGE 8: Auth
function renderAuthPage() {
  appContainer.innerHTML = `
    <div class="form-card">
      <h2 style="text-align: center; margin-bottom: 20px;">Login to Arcanix</h2>
      <button id="google-login-btn" class="btn btn-outline" style="width: 100%; margin-bottom: 16px;">Continue with Google</button>
      <form id="email-form">
        <div class="form-group"><label>Email</label><input type="email" id="a-email" required/></div>
        <div class="form-group"><label>Password</label><input type="password" id="a-pass" required/></div>
        <button type="submit" class="btn btn-fk-orange" style="width: 100%;">Login</button>
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
}

// PAGE 9: Account
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  appContainer.innerHTML = `
    <div class="section-card" style="max-width: 600px; margin: 0 auto; text-align: center;">
      <h2>Hello, ${currentUser.displayName || 'Developer'}</h2>
      <p style="color: var(--text-muted); margin-bottom: 20px;">${currentUser.email}</p>
      <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
        <a href="#my-orders" class="btn btn-outline">My Downloads</a>
        ${isAdmin ? `<a href="#seller-dashboard" class="btn btn-fk-yellow">Admin Panel</a>` : ''}
      </div>
      <button id="so-btn" class="btn btn-outline">Logout</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// PAGE 10: Downloads
function renderOrdersPage() {
  appContainer.innerHTML = `
    <div class="section-card">
      <h2>My Purchased Downloads</h2>
      <table class="admin-table" style="margin-top: 16px;">
        <thead><tr><th>Asset Name</th><th>Date</th><th>Package</th></tr></thead>
        <tbody>
          <tr><td>FPS Survival Unity Pack</td><td>2026-08-25</td><td><a href="#" onclick="alert('Starting Download...')">Download .unitypackage</a></td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderWishlistPage() { renderStaticPage('Wishlist', 'No saved items.'); }
function renderStaticPage(t, c) { appContainer.innerHTML = `<div class="section-card"><h2>${t}</h2><p style="margin-top:10px;">${c}</p></div>`; }
function renderSellerRegisterPage() { renderStaticPage('Seller Hub', 'Submit seller application.'); }

// Seller Panel
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `<div class="section-card"><h2>Access Denied</h2></div>`;
    return;
  }
  appContainer.innerHTML = `
    <div class="section-card">
      <h2>Seller Admin Dashboard</h2>
      <form id="seller-add-form" style="margin-top: 16px; max-width: 500px;">
        <div class="form-group"><label>Asset Title</label><input type="text" id="p-title" required/></div>
        <div class="form-group"><label>Price ($)</label><input type="number" step="0.01" id="p-price" required/></div>
        <div class="form-group"><label>Image URL</label><input type="url" id="p-image" required/></div>
        <div class="form-group"><label>Description</label><textarea id="p-desc" required></textarea></div>
        <button type="submit" class="btn btn-fk-orange">PUBLISH ASSET</button>
      </form>
    </div>
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
    alert("Asset Listed!");
    renderHomePage();
  };
}

// Fetcher Grid with Ratings & Discount Badges
async function fetchProductsGrid(container) {
  try {
    const snap = await getDocs(collection(db, "products"));
    container.innerHTML = '';
    if (snap.empty) { container.innerHTML = '<p>No products available.</p>'; return; }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const originalPrice = (p.price * 1.35).toFixed(2);

      container.innerHTML += `
        <div class="card" onclick="location.hash='pdp?id=${docSnap.id}'">
          <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" class="card-img"/>
          <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${p.title}</h3>
          
          <div style="margin-bottom: 8px;">
            <span class="badge-rating">4.5 ★</span>
          </div>

          <div>
            <span class="price-main">$${p.price}</span>
            <span class="price-strike">$${originalPrice}</span>
            <span class="discount-tag">35% off</span>
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p>Error loading items.</p>`;
  }
}

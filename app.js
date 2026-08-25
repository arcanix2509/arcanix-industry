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
  'pdp': renderProductDetailPage,
  'search': renderSearchResultsPage,
  'cart': renderCartPage,
  'checkout': renderCheckoutPage,
  'order-confirmation': renderOrderConfirmationPage,
  'auth': renderAuthPage,
  'account': renderUserDashboardPage,
  'my-orders': renderOrdersPage,
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
  alert(`"${title}" added to Cart!`);
};

window.removeFromCart = (index) => {
  window.cart.splice(index, 1);
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  renderCartPage();
};

window.deleteProductByAdmin = async (id) => {
  if (confirm("Are you sure you want to delete this item?")) {
    await deleteDoc(doc(db, "products", id));
    alert("Item deleted successfully!");
    renderSellerDashboardPage();
  }
};

// HOME PAGE: Purely Dynamic Products Listing
async function renderHomePage() {
  appContainer.innerHTML = `
    <div class="section-card">
      <div class="section-title">
        <span>All Items & Products</span>
      </div>
      <div class="grid" id="home-products-grid"><p style="color: var(--text-muted);">Loading products...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('home-products-grid'));
}

// PRODUCT DETAIL PAGE (PDP)
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) return;
  appContainer.innerHTML = `<p>Loading item details...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const p = snap.data();

    appContainer.innerHTML = `
      <div class="section-card" style="display: grid; grid-template-columns: 360px 1fr; gap: 32px;">
        <div>
          <img src="${p.imageUrl || 'https://via.placeholder.com/400'}" style="width: 100%; border: 1px solid var(--border); border-radius: 4px; max-height: 380px; object-fit: cover; margin-bottom: 16px;"/>
          <div style="display: flex; gap: 12px;">
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" class="btn btn-fk-yellow" style="flex: 1;">ADD TO CART</button>
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" class="btn btn-fk-orange" style="flex: 1;">BUY NOW</button>
          </div>
        </div>

        <div>
          <h1 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 8px;">${p.title}</h1>
          <div class="badge-rating" style="margin-bottom: 12px;">4.5 ★</div>
          
          <div style="margin-bottom: 16px;">
            <span class="price-main">$${p.price}</span>
            ${p.tag ? `<span class="discount-tag">${p.tag}</span>` : ''}
          </div>

          <h4 style="margin-bottom: 8px;">Item Description:</h4>
          <p style="color: #555; font-size: 0.95rem; line-height: 1.6; white-space: pre-line;">${p.description || 'No description provided.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p>Error loading product details.</p>`;
  }
}

// SEARCH PAGE
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <div class="section-card">
      <h2>Search Results for "${query}"</h2>
      <div class="grid" id="search-grid" style="margin-top: 16px;"></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'), query);
}

// CART PAGE
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div class="section-card" style="text-align: center; padding: 40px;"><h2>Your Shopping Cart is Empty!</h2><br/><a href="#home" class="btn btn-fk-orange">Shop Now</a></div>`;
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
            <button onclick="removeFromCart(${idx})" class="btn" style="color: #d32f2f; font-size: 0.9rem;">REMOVE</button>
          </div>
        `).join('')}
      </div>

      <div class="section-card" style="height: fit-content;">
        <h4 style="color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px;">PRICE DETAILS</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
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

// CHECKOUT PAGE
function renderCheckoutPage() {
  let total = window.cart.reduce((sum, item) => sum + item.price, 0);
  appContainer.innerHTML = `
    <div class="form-card">
      <h2 style="margin-bottom: 20px; font-size: 1.2rem;">Complete Payment ($${total.toFixed(2)})</h2>
      <form id="checkout-form">
        <div class="form-group"><label>Delivery / Contact Details</label><textarea required placeholder="Enter Address or Contact Info"></textarea></div>
        <div class="form-group"><label>Payment Method</label>
          <select><option>UPI / NetBanking</option><option>Credit/Debit Card</option><option>Cash on Delivery</option></select>
        </div>
        <button type="submit" class="btn btn-fk-orange" style="width: 100%;">CONFIRM ORDER</button>
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

// ORDER CONFIRMATION
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div class="section-card" style="text-align: center; padding: 40px;">
      <h1 style="color: var(--green-success);">🎉 Order Successfully Placed!</h1>
      <p style="margin: 12px 0;">Thank you for shopping with us.</p>
      <a href="#home" class="btn btn-fk-yellow">Continue Shopping</a>
    </div>
  `;
}

// AUTHENTICATION
function renderAuthPage() {
  appContainer.innerHTML = `
    <div class="form-card">
      <h2 style="text-align: center; margin-bottom: 20px;">Account Login</h2>
      <button id="google-login-btn" class="btn btn-outline" style="width: 100%; margin-bottom: 16px;">Continue with Google</button>
      <form id="email-form">
        <div class="form-group"><label>Email Address</label><input type="email" id="a-email" required/></div>
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

// USER ACCOUNT & ADMIN CHECK
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  appContainer.innerHTML = `
    <div class="section-card" style="max-width: 600px; margin: 0 auto; text-align: center;">
      <h2>User Profile</h2>
      <p style="color: var(--text-muted); margin: 8px 0 20px 0;">${currentUser.email}</p>
      <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
        ${isAdmin ? `<a href="#seller-dashboard" class="btn btn-fk-yellow">⚙️ Admin Control Panel</a>` : ''}
      </div>
      <button id="so-btn" class="btn btn-outline">Logout</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

function renderOrdersPage() { appContainer.innerHTML = `<div class="section-card"><h2>My Orders</h2><p>No recent orders.</p></div>`; }

// ADMIN PANEL: Full Control Over Products (Add & Delete)
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `<div class="section-card"><h2>Access Denied</h2><p>Only authorized admin can access this page.</p></div>`;
    return;
  }

  appContainer.innerHTML = `
    <div class="section-card">
      <h2>⚙️ Admin Control Panel</h2>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Add new items or manage existing products on your store.</p>

      <form id="seller-add-form" style="max-width: 600px; background: #fafafa; padding: 20px; border: 1px solid var(--border); border-radius: 4px;">
        <h3 style="margin-bottom: 12px;">Add New Product</h3>
        <div class="form-group"><label>Product Title</label><input type="text" id="p-title" required placeholder="e.g. Wireless Headphones / Unity Asset Pack"/></div>
        <div class="form-group"><label>Price ($)</label><input type="number" step="0.01" id="p-price" required placeholder="29.99"/></div>
        <div class="form-group"><label>Offer Tag (Optional)</label><input type="text" id="p-tag" placeholder="e.g. 20% OFF or Special Deal"/></div>
        <div class="form-group"><label>Product Image URL</label><input type="url" id="p-image" required placeholder="https://..."/></div>
        <div class="form-group"><label>Full Description</label><textarea id="p-desc" rows="4" required placeholder="Enter detailed product description..."></textarea></div>
        <button type="submit" class="btn btn-fk-orange">PUBLISH PRODUCT</button>
      </form>

      <h3 style="margin-top: 32px; margin-bottom: 16px;">Manage Listed Items</h3>
      <div id="admin-items-list"><p>Loading live store items...</p></div>
    </div>
  `;

  // Fetch items for deletion management
  const itemsContainer = document.getElementById('admin-items-list');
  const snap = await getDocs(collection(db, "products"));
  if (snap.empty) {
    itemsContainer.innerHTML = '<p>No live items found in store.</p>';
  } else {
    itemsContainer.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Image</th><th>Title</th><th>Price</th><th>Action</th></tr></thead>
        <tbody>
          ${snap.docs.map(docSnap => {
            const data = docSnap.data();
            return `
              <tr>
                <td><img src="${data.imageUrl}" style="width: 40px; height: 40px; object-fit: cover;"/></td>
                <td><b>${data.title}</b></td>
                <td>$${data.price}</td>
                <td><button onclick="deleteProductByAdmin('${docSnap.id}')" class="btn" style="background:#d32f2f; color:#fff; padding:4px 12px; font-size:0.8rem;">Delete</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  document.getElementById('seller-add-form').onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "products"), {
      title: document.getElementById('p-title').value,
      price: parseFloat(document.getElementById('p-price').value),
      tag: document.getElementById('p-tag').value || '',
      imageUrl: document.getElementById('p-image').value,
      description: document.getElementById('p-desc').value,
      createdAt: new Date()
    });
    alert("New product published live!");
    renderSellerDashboardPage();
  };
}

// Dynamic Store Renderer
async function fetchProductsGrid(container, searchQuery = '') {
  try {
    const snap = await getDocs(collection(db, "products"));
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = '<p style="grid-column: 1/-1;">No products found in the store yet. Add items via Admin Panel.</p>';
      return;
    }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      container.innerHTML += `
        <div class="card" onclick="location.hash='pdp?id=${docSnap.id}'">
          <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" class="card-img"/>
          <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${p.title}</h3>
          
          <div style="margin-bottom: 8px;">
            <span class="badge-rating">4.5 ★</span>
          </div>

          <div>
            <span class="price-main">$${p.price}</span>
            ${p.tag ? `<span class="discount-tag">${p.tag}</span>` : ''}
          </div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p>Error loading store items.</p>`;
  }
}

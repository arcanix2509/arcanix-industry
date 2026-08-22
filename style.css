@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

:root {
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --border: #e2e8f0;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --danger: #ef4444;
  --success: #10b981;
  --radius: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
}

body {
  background-color: var(--bg-main);
  color: var(--text-main);
  min-height: 100vh;
}

/* Responsive Header / Nav */
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 5%;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1000;
}

nav h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--primary);
}

/* Mobile Hamburger Menu Toggle */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-main);
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #ffffff;
    flex-direction: column;
    align-items: stretch;
    padding: 20px;
    gap: 15px;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    display: none;
  }

  .nav-links.active {
    display: flex;
  }

  .nav-links a, .nav-links .btn {
    width: 100%;
    text-align: center;
  }
}

.container {
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }

/* AI Advisor Specific Layout */
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  height: 75vh;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-icon {
  width: 36px;
  height: 36px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-weight: bold;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.925rem;
  line-height: 1.5;
}

.message.user {
  align-self: flex-end;
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.message.ai {
  align-self: flex-start;
  background: #f1f5f9;
  color: var(--text-main);
  border-bottom-left-radius: 2px;
}

.chat-input-area {
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 10px;
}

.chat-input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
}

.chat-input-area input:focus {
  border-color: var(--primary);
}

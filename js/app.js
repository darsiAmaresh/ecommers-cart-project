// ===== IMPORTS =====
import { products } from './data/products.js';
import { customer } from './data/customer.js';
import { pricing } from './data/pricing.js';

import { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  getCartItemCount,
  clearCart 
} from './utils/cartUtils.js';

import { calculateFinalTotal, applyCoupon } from './utils/calculationUtils.js';
import { formatCurrency, showToast, generateOrderId } from './utils/displayUtils.js';
import { createProductCard } from './components/productCard.js';
import { createCartItem } from './components/cartItem.js';

// ===== APPLICATION STATE =====
class ShoppingApp {
  constructor() {
    this.cart = this.loadCartFromStorage() || [];
    this.filteredProducts = [...products];
    this.appliedCoupon = null;
    this.currentFilters = {
      category: 'all',
      priceRange: 1000,
      rating: 'all',
      search: ''
    };
    
    this.init();
  }

  // ===== INITIALIZATION =====
  init() {
    this.renderCustomerInfo();
    this.renderCategoryFilters();
    this.renderProducts();
    this.updateCartUI();
    this.attachEventListeners();
    this.loadSavedFilters();
  }

  // ===== RENDER CUSTOMER INFO =====
  renderCustomerInfo() {
    const userNameEl = document.getElementById('userName');
    const badgeEl = document.getElementById('membershipBadge');
    
    if (userNameEl) {
      userNameEl.textContent = customer.name.split(' ')[0];
    }
    
    if (badgeEl) {
      badgeEl.textContent = customer.membershipType.toUpperCase();
      if (customer.membershipType === 'premium') {
        badgeEl.classList.add('premium');
      }
    }
  }

  // ===== RENDER CATEGORY FILTERS =====
  renderCategoryFilters() {
    const categoryFilters = document.getElementById('categoryFilters');
    if (!categoryFilters) return;

    const categories = ['all', ...new Set(products.map(p => p.category))];
    
    categoryFilters.innerHTML = categories.map(category => `
      <label>
        <input 
          type="checkbox" 
          name="category" 
          value="${category}" 
          ${category === 'all' ? 'checked' : ''}
        >
        ${category === 'all' ? 'All Categories' : category}
      </label>
    `).join('');

    // Single selection for categories
    const checkboxes = categoryFilters.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          checkboxes.forEach(cb => {
            if (cb !== e.target) cb.checked = false;
          });
          this.currentFilters.category = e.target.value;
          this.applyFilters();
        }
      });
    });
  }

  // ===== RENDER PRODUCTS =====
  renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    if (this.filteredProducts.length === 0) {
      productsGrid.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }

    productsGrid.style.display = 'grid';
    noResults.style.display = 'none';

    this.filteredProducts.forEach(product => {
      const card = createProductCard(product, (prod) => this.handleAddToCart(prod));
      productsGrid.appendChild(card);
    });
  }

  // ===== FILTER PRODUCTS =====
  applyFilters() {
    let filtered = [...products];

    // Category filter
    if (this.currentFilters.category !== 'all') {
      filtered = filtered.filter(p => 
        p.category === this.currentFilters.category
      );
    }

    // Price range filter
    filtered = filtered.filter(p => 
      p.price <= this.currentFilters.priceRange
    );

    // Rating filter
    if (this.currentFilters.rating !== 'all') {
      const minRating = parseFloat(this.currentFilters.rating);
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    // Search filter
    if (this.currentFilters.search) {
      const searchTerm = this.currentFilters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.brand.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredProducts = filtered;
    this.renderProducts();
    this.saveFiltersToStorage();
  }

  // ===== SORT PRODUCTS =====
  sortProducts(sortBy) {
    switch(sortBy) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        this.filteredProducts = [...products];
    }
    this.renderProducts();
  }

  // ===== CART OPERATIONS =====
  handleAddToCart(product) {
    this.cart = addToCart(this.cart, product, 1);
    this.updateCartUI();
    this.saveCartToStorage();
    showToast(`${product.name} added to cart!`, 'success');
  }

  handleUpdateQuantity(productId, newQuantity) {
    this.cart = updateQuantity(this.cart, productId, newQuantity);
    this.updateCartUI();
    this.saveCartToStorage();
  }

  handleRemoveFromCart(productId) {
    const item = this.cart.find(i => i.id === productId);
    this.cart = removeFromCart(this.cart, productId);
    this.updateCartUI();
    this.saveCartToStorage();
    showToast(`${item.name} removed from cart`, 'success');
  }

  handleClearCart() {
    if (this.cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cart = clearCart();
      this.appliedCoupon = null;
      this.updateCartUI();
      this.saveCartToStorage();
      showToast('Cart cleared', 'success');
    }
  }

  // ===== UPDATE CART UI =====
  updateCartUI() {
    this.updateCartCount();
    this.renderCartItems();
    this.updateCartTotals();
  }

  updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
      const count = getCartItemCount(this.cart);
      countEl.textContent = count;
      countEl.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  renderCartItems() {
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');
    const cartFooter = document.getElementById('cartFooter');
    
    if (!cartContent) return;

    if (this.cart.length === 0) {
      emptyCart.style.display = 'block';
      cartFooter.style.display = 'none';
      cartContent.innerHTML = '';
      cartContent.appendChild(emptyCart);
      return;
    }

    emptyCart.style.display = 'none';
    cartFooter.style.display = 'block';
    cartContent.innerHTML = '';

    this.cart.forEach(item => {
      const cartItemEl = createCartItem(
        item,
        (id, qty) => this.handleUpdateQuantity(id, qty),
        (id) => this.handleRemoveFromCart(id)
      );
      cartContent.appendChild(cartItemEl);
    });
  }

  updateCartTotals() {
    if (this.cart.length === 0) return;

    const totals = calculateFinalTotal(
      this.cart, 
      pricing, 
      customer.membershipType,
      this.appliedCoupon
    );

    // Update UI elements
    this.updateElement('subtotalAmount', formatCurrency(totals.subtotal));
    this.updateElement('taxAmount', formatCurrency(totals.tax));
    this.updateElement('shippingAmount', 
      totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping)
    );
    this.updateElement('totalAmount', formatCurrency(totals.total));

    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    const totalDiscount = totals.memberDiscount + totals.couponDiscount;
    
    if (totalDiscount > 0) {
      discountRow.style.display = 'flex';
      this.updateElement('discountAmount', `-${formatCurrency(totalDiscount)}`);
    } else {
      discountRow.style.display = 'none';
    }
  }

  updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ===== COUPON HANDLING =====
  handleApplyCoupon() {
    const couponInput = document.getElementById('couponInput');
    const couponCode = couponInput.value.trim().toUpperCase();
    
    if (!couponCode) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    if (this.cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const result = applyCoupon(subtotal, couponCode, pricing.coupons);

    if (result.success) {
      this.appliedCoupon = couponCode;
      this.updateCartTotals();
      showToast(result.message, 'success');
      couponInput.value = '';
    } else {
      showToast(result.message, 'error');
    }
  }

  // ===== CHECKOUT =====
  handleCheckout() {
    if (this.cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    const totals = calculateFinalTotal(
      this.cart, 
      pricing, 
      customer.membershipType,
      this.appliedCoupon
    );

    this.renderCheckoutModal(totals);
    this.openModal('checkoutModal');
  }

  renderCheckoutModal(totals) {
    // Render checkout items
    const checkoutItems = document.getElementById('checkoutItems');
    if (checkoutItems) {
      checkoutItems.innerHTML = this.cart.map(item => `
        <div class="checkout-item">
          <span>${item.name} x${item.quantity}</span>
          <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
      `).join('');
    }

    // Update totals
    this.updateElement('checkoutSubtotal', formatCurrency(totals.subtotal));
    this.updateElement('checkoutTax', formatCurrency(totals.tax));
    this.updateElement('checkoutShipping', 
      totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping)
    );
    this.updateElement('checkoutTotal', formatCurrency(totals.total));

    // Render customer info
    const customerInfo = document.getElementById('customerInfo');
    if (customerInfo) {
      customerInfo.innerHTML = `
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
        <p><strong>Address:</strong> ${customer.location.city}, ${customer.location.state}, ${customer.location.country}</p>
        <p><strong>Membership:</strong> <span style="color: var(--primary-color); font-weight: 600;">${customer.membershipType.toUpperCase()}</span></p>
      `;
    }
  }

  handleConfirmOrder() {
    const orderId = generateOrderId();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (customer.location.city === 'Mumbai' ? 2 : 5));

    // Show success modal
    this.updateElement('orderId', orderId);
    this.updateElement('deliveryDate', deliveryDate.toDateString());
    
    this.closeModal('checkoutModal');
    this.openModal('successModal');

    // Clear cart after successful order
    setTimeout(() => {
      this.cart = clearCart();
      this.appliedCoupon = null;
      this.updateCartUI();
      this.saveCartToStorage();
      this.closeCartSidebar();
    }, 1000);

    // Save order to localStorage (for demo)
    this.saveOrder(orderId, deliveryDate);
  }

  saveOrder(orderId, deliveryDate) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push({
      orderId,
      date: new Date().toISOString(),
      deliveryDate: deliveryDate.toISOString(),
      items: [...this.cart],
      customer: customer.name,
      total: calculateFinalTotal(this.cart, pricing, customer.membershipType, this.appliedCoupon).total
    });
    localStorage.setItem('orders', JSON.stringify(orders));
  }

  // ===== MODAL CONTROLS =====
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('overlay');
    
    if (modal) {
      modal.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('overlay');
    
    if (modal) {
      modal.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  // ===== CART SIDEBAR =====
  openCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    cartSidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    cartSidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  // ===== LOCAL STORAGE =====
  saveCartToStorage() {
    localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
  }

  loadCartFromStorage() {
    const saved = localStorage.getItem('shoppingCart');
    return saved ? JSON.parse(saved) : [];
  }

  saveFiltersToStorage() {
    localStorage.setItem('filters', JSON.stringify(this.currentFilters));
  }

  loadSavedFilters() {
    const saved = localStorage.getItem('filters');
    if (saved) {
      this.currentFilters = JSON.parse(saved);
      
      // Apply saved price range
      const priceRangeInput = document.getElementById('priceRange');
      if (priceRangeInput) {
        priceRangeInput.value = this.currentFilters.priceRange;
        document.getElementById('maxPrice').textContent = 
          `₹${this.currentFilters.priceRange}`;
      }

      // Apply saved rating
      const ratingInputs = document.querySelectorAll('input[name="rating"]');
      ratingInputs.forEach(input => {
        if (input.value === this.currentFilters.rating) {
          input.checked = true;
        }
      });

      this.applyFilters();
    }
  }

  // ===== EVENT LISTENERS =====
  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value;
        this.applyFilters();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.currentFilters.search = searchInput.value;
        this.applyFilters();
      });
    }

    // Price Range
    const priceRange = document.getElementById('priceRange');
    const maxPrice = document.getElementById('maxPrice');
    
    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        const value = e.target.value;
        maxPrice.textContent = `₹${value}`;
        this.currentFilters.priceRange = parseInt(value);
        this.applyFilters();
      });
    }

    // Rating Filter
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    ratingInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.currentFilters.rating = e.target.value;
        this.applyFilters();
      });
    });

    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortProducts(e.target.value);
      });
    }

    // Reset Filters
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Cart Toggle
    const cartToggle = document.getElementById('cartToggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', () => {
        this.openCartSidebar();
      });
    }

    // Close Cart
    const closeCart = document.getElementById('closeCart');
    if (closeCart) {
      closeCart.addEventListener('click', () => {
        this.closeCartSidebar();
      });
    }

    // Apply Coupon
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => {
        this.handleApplyCoupon();
      });
    }

    // Clear Cart
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        this.handleClearCart();
      });
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.handleCheckout();
      });
    }

    // Confirm Order
    const confirmOrderBtn = document.getElementById('confirmOrder');
    if (confirmOrderBtn) {
      confirmOrderBtn.addEventListener('click', () => {
        this.handleConfirmOrder();
      });
    }

    // Close Modals
    const closeCheckout = document.getElementById('closeCheckout');
    const cancelCheckout = document.getElementById('cancelCheckout');
    const closeSuccess = document.getElementById('closeSuccess');
    
    if (closeCheckout) {
      closeCheckout.addEventListener('click', () => {
        this.closeModal('checkoutModal');
      });
    }

    if (cancelCheckout) {
      cancelCheckout.addEventListener('click', () => {
        this.closeModal('checkoutModal');
      });
    }

    if (closeSuccess) {
      closeSuccess.addEventListener('click', () => {
        this.closeModal('successModal');
      });
    }

    // Overlay Click
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeCartSidebar();
        this.closeModal('checkoutModal');
        this.closeModal('successModal');
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeCartSidebar();
        this.closeModal('checkoutModal');
        this.closeModal('successModal');
      }
    });
  }

  // ===== RESET FILTERS =====
  resetFilters() {
    this.currentFilters = {
      category: 'all',
      priceRange: 1000,
      rating: 'all',
      search: ''
    };

    // Reset UI
    document.getElementById('searchInput').value = '';
    document.getElementById('priceRange').value = 1000;
    document.getElementById('maxPrice').textContent = '₹1000';
    
    document.querySelectorAll('input[name="category"]').forEach(cb => {
      cb.checked = cb.value === 'all';
    });

    document.querySelectorAll('input[name="rating"]').forEach(radio => {
      radio.checked = radio.value === 'all';
    });

    document.getElementById('sortSelect').value = 'default';

    this.applyFilters();
    showToast('Filters reset', 'success');
  }
}

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
  const app = new ShoppingApp();
  
  // Make app globally accessible for debugging
  window.app = app;
  
  console.log('🛒 ShopKart App Initialized');
  console.log('📦 Total Products:', products.length);
  console.log('🛍️ Cart Items:', app.cart.length);
});
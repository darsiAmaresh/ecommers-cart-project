import { formatCurrency, generateStars } from '../utils/displayUtils.js';

export const createProductCard = (product, onAddToCart) => {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  
  card.innerHTML = `
    <div class="product-image">
      <i class="fas ${product.icon}"></i>
      <span class="product-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}">
        ${product.inStock ? 'In Stock' : 'Out of Stock'}
      </span>
    </div>
    
    <div class="product-info">
      <div class="product-category">${product.category}</div>
      <h3 class="product-name">${product.name}</h3>
      <div class="product-brand">${product.brand}</div>
      <p class="product-description">${product.description}</p>
      
      <div class="product-rating">
        <span class="stars">${generateStars(product.rating)}</span>
        <span class="rating-value">${product.rating}</span>
        <span class="reviews-count">(${product.reviews})</span>
      </div>
      
      <div class="product-footer">
        <div class="product-price">
          <span class="price-currency">₹</span>${product.price.toFixed(2)}
        </div>
        <button 
          class="add-to-cart-btn" 
          ${!product.inStock ? 'disabled' : ''}
          data-product-id="${product.id}"
        >
          <i class="fas ${product.inStock ? 'fa-cart-plus' : 'fa-ban'}"></i>
          ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
  
  // Add event listener
  const addBtn = card.querySelector('.add-to-cart-btn');
  if (product.inStock) {
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onAddToCart(product);
      
      // Visual feedback
      addBtn.classList.add('added');
      addBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
      setTimeout(() => {
        addBtn.classList.remove('added');
        addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
      }, 1500);
    });
  }
  
  return card;
};
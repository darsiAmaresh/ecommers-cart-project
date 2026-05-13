import { formatCurrency } from '../utils/displayUtils.js';

export const createCartItem = (item, onUpdateQuantity, onRemove) => {
  const cartItem = document.createElement('div');
  cartItem.className = 'cart-item';
  cartItem.dataset.itemId = item.id;
  
  cartItem.innerHTML = `
    <div class="cart-item-image">
      <i class="fas ${item.icon}"></i>
    </div>
    
    <div class="cart-item-details">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-price">${formatCurrency(item.price)}</div>
      
      <div class="quantity-controls">
        <button class="quantity-btn decrease" data-id="${item.id}">
          <i class="fas fa-minus"></i>
        </button>
        <span class="quantity-value">${item.quantity}</span>
        <button class="quantity-btn increase" data-id="${item.id}">
          <i class="fas fa-plus"></i>
        </button>
        <button class="remove-item-btn" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  // Event listeners
  cartItem.querySelector('.decrease').addEventListener('click', () => {
    onUpdateQuantity(item.id, item.quantity - 1);
  });
  
  cartItem.querySelector('.increase').addEventListener('click', () => {
    if (item.quantity < 10) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  });
  
  cartItem.querySelector('.remove-item-btn').addEventListener('click', () => {
    onRemove(item.id);
  });
  
  return cartItem;
};
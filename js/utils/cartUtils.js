// Cart Utility Functions
export const addToCart = (currentCart, product, quantity = 1) => {
  const existingItem = currentCart.find(item => item.id === product.id);
  
  if (existingItem) {
    return currentCart.map(item =>
      item.id === product.id 
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  
  return [...currentCart, { ...product, quantity }];
};

export const removeFromCart = (currentCart, productId) => {
  return currentCart.filter(item => item.id !== productId);
};

export const updateQuantity = (currentCart, productId, newQuantity) => {
  if (newQuantity === 0) {
    return removeFromCart(currentCart, productId);
  }
  
  return currentCart.map(item =>
    item.id === productId 
      ? { ...item, quantity: newQuantity }
      : item
  );
};

export const getCartItemCount = (currentCart) => {
  return currentCart.reduce((total, item) => total + item.quantity, 0);
};

export const clearCart = () => [];
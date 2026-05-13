// Calculation Utilities
export const calculateSubtotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateTax = (subtotal, taxRate) => {
  return subtotal * taxRate;
};

export const calculateShipping = (subtotal, shippingFee, threshold) => {
  return subtotal >= threshold ? 0 : shippingFee;
};

export const calculateDiscount = (subtotal, membershipType, discounts) => {
  const discountRate = discounts[membershipType] || 0;
  return subtotal * discountRate;
};

export const applyCoupon = (subtotal, couponCode, coupons) => {
  const coupon = coupons[couponCode];
  
  if (!coupon) {
    return { success: false, discount: 0, message: "Invalid coupon code" };
  }
  
  if (subtotal < coupon.minPurchase) {
    return { 
      success: false, 
      discount: 0, 
      message: `Minimum purchase of ₹${coupon.minPurchase} required` 
    };
  }
  
  const discount = coupon.type === 'percentage' 
    ? subtotal * coupon.value 
    : coupon.value;
  
  return { 
    success: true, 
    discount, 
    message: `Coupon ${couponCode} applied successfully!` 
  };
};

export const calculateFinalTotal = (cart, pricingRules, membershipType, couponCode = null) => {
  const subtotal = calculateSubtotal(cart);
  const tax = calculateTax(subtotal, pricingRules.taxRate);
  const shipping = calculateShipping(
    subtotal, 
    pricingRules.shippingFee, 
    pricingRules.freeShippingThreshold
  );
  const memberDiscount = calculateDiscount(
    subtotal, 
    membershipType, 
    pricingRules.discounts
  );
  
  let couponDiscount = 0;
  if (couponCode) {
    const result = applyCoupon(subtotal, couponCode, pricingRules.coupons);
    if (result.success) {
      couponDiscount = result.discount;
    }
  }
  
  const total = subtotal + tax + shipping - memberDiscount - couponDiscount;
  
  return {
    subtotal,
    tax,
    shipping,
    memberDiscount,
    couponDiscount,
    total: Math.max(0, total)
  };
};
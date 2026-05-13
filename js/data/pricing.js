// Pricing Configuration
export const pricing = {
  taxRate: 0.18,
  shippingFee: 50,
  freeShippingThreshold: 500,
  
  discounts: {
    premium: 0.10,
    regular: 0.05
  },
  
  coupons: {
    'WELCOME10': { type: 'percentage', value: 0.10, minPurchase: 200 },
    'SAVE50': { type: 'flat', value: 50, minPurchase: 500 },
    'MEGA20': { type: 'percentage', value: 0.20, minPurchase: 1000 },
    'FIRST100': { type: 'flat', value: 100, minPurchase: 1500 }
  }
};
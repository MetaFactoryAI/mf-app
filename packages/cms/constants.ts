export const PRODUCT_STAGES = {
  submitted: {
    name: 'submitted',
    description: 'A new submission to the product pipeline',
  },
  rejected: {
    name: 'rejected',
    description: 'Products rejected from pipeline, not to be produced',
  },
  design: {
    name: 'design',
    description: 'Products currently in the design phase',
  },
  sampling: {
    name: 'sampling',
    description: 'Design completed, awaiting approval of samples',
  },
  scheduled: {
    name: 'scheduled',
    description: 'Product is scheduled for a release.',
  },
  sale_live: {
    name: 'sale_live',
    description: 'Product is available for purchase',
  },
  production: {
    name: 'production',
    description: 'Product is in production',
  },
  shipping: {
    name: 'shipping',
    description: 'Product is at fulfillment center and ready to ship',
  },
  fulfillment_completed: {
    name: 'fulfillment_completed',
    description: 'All orders of product are fulfilled',
  },
};

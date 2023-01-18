export const PRODUCT_STAGES = {
  submitted: {
    name: 'submitted',
    displayName: 'Submitted',
    description: 'A new submission to the product pipeline',
    progress: 0.05,
  },
  rejected: {
    name: 'rejected',
    displayName: 'Rejected',
    description: 'Products rejected from pipeline, not to be produced',
    progress: 0,
  },
  design: {
    name: 'design',
    displayName: 'Design',
    description: 'Products currently in the design phase',
    progress: 0.1,
  },
  sampling: {
    name: 'sampling',
    displayName: 'Sampling',
    description: 'Design completed, awaiting approval of samples',
    progress: 0.2,
  },
  scheduled: {
    name: 'scheduled',
    displayName: 'Scheduled',
    description: 'Product is scheduled for a release.',
    progress: 0.25,
  },
  sale_live: {
    name: 'sale_live',
    displayName: 'Sale Live',
    description: 'Product is available for purchase',
    progress: 0.3,
  },
  production: {
    name: 'production',
    displayName: 'Production',
    description: 'Product is in production',
    progress: 0.4,
  },
  shipping: {
    name: 'shipping',
    displayName: 'Shipping',
    description: 'Product is at fulfillment center and ready to ship',
    progress: 0.45,
  },
  fulfillment_completed: {
    name: 'fulfillment_completed',
    displayName: 'Fulfillment Completed',
    description: 'All orders of product are fulfilled',
    progress: 0.5,
  },
};
export type StageName = keyof typeof PRODUCT_STAGES;
export type ProductStage = typeof PRODUCT_STAGES[keyof typeof PRODUCT_STAGES];

export const COLLABORATOR_ROLES = {
  designer: {
    name: 'Designer',
    description:
      'Controls the product design aspects and transforms what the brand wants into a finalized design.',
  },
  accountManager: {
    name: 'Account Manager',
    description:
      'Owns the relationship with the brand and communicates important info & feedback',
  },
  productionManager: {
    name: 'Production Manager',
    description:
      'Owns the relationship with a producer and adjusts production requirements as necessary.',
  },
  wearablesDesigner: {
    name: 'Wearables Designer',
    description:
      'Takes the completed product design and turns it into 3D wearables.',
  },
  brand: {
    name: 'Brand',
    description: 'The IP owners of the brand the product was created for',
  },
  other: {
    name: 'Other',
    description: 'Misc. contributions',
  },
};

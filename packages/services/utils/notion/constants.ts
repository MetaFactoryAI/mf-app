export const Properties = {
  atShipBob: {
    id: '%3A%5EEB' as const,
    type: 'checkbox',
    propertyName: 'At SB?' as const,
  },
  // 'Pre-Order (20%)': {
  //   id: '%3Ajbw' as const,
  //   type: 'number',
  //   propertyName: 'Pre-Order (20%)' as const,
  // },
  // 'Distro %': {
  //   id: '%3Bv%7CM' as const,
  //   type: 'rich_text',
  //   propertyName: 'Distro %' as const,
  // },
  altPrint: {
    id: '%3CHTd' as const,
    type: 'rich_text',
    propertyName: 'Alt Print' as const,
  },
  wroId: {
    id: '%3DkaY' as const,
    type: 'number',
    propertyName: 'WRO ID' as const,
  },
  brand: {
    id: '%40qO%60' as const,
    type: 'relation',
    propertyName: 'Brand Rel' as const,
  },
  Drive: {
    id: 'AJNT' as const,
    type: 'files',
    propertyName: 'Drive' as const,
  },
  templateNumber: {
    id: 'BA%7B%3A' as const,
    type: 'rollup',
    propertyName: 'Template # Rollup' as const,
  },
  dropDate: {
    id: 'BETg' as const,
    type: 'date',
    propertyName: 'Drop Date' as const,
  },
  techEthAddress: {
    id: 'BHmK' as const,
    type: 'rollup',
    propertyName: 'Tech ETH address' as const,
  },
  // '% Value': {
  //   id: 'Bw%3Bc' as const,
  //   type: 'formula',
  //   propertyName: '% Value' as const,
  // },
  cloModel: {
    id: 'B%7D%7Be' as const,
    type: 'files',
    propertyName: 'CLO3d Model' as const,
  },
  // 'Related to MF Brands Space (Related to Products (Brand Rel))': {
  //   id: 'Co%5Eg' as const,
  //   type: 'relation',
  //   propertyName as const:
  //     'Related to MF Brands Space (Related to Products (Brand Rel))',
  // },
  wearableFiles: {
    id: 'DuP%5B' as const,
    type: 'files',
    propertyName: 'Wearable Files' as const,
  },
  Cost: {
    id: 'EKwo' as const,
    type: 'number',
    propertyName: 'Cost' as const,
  },
  designerRel: {
    id: 'Er_%3F' as const,
    type: 'relation',
    propertyName: 'Designer Rel [NEW]' as const,
  },
  creationDate: {
    id: 'FiLY' as const,
    type: 'created_time',
    propertyName: 'Creation Date' as const,
  },
  // 'Action Rel': {
  //   id: 'G%3EdB' as const,
  //   type: 'relation',
  //   propertyName: 'Action Rel' as const,
  // },
  Distro: {
    id: 'GEb%7C' as const,
    type: 'select',
    propertyName: 'Distro' as const,
  },
  printMethod: {
    id: 'GoU%5B' as const,
    type: 'rollup',
    propertyName: 'Print' as const,
  },
  designerEthAddress: {
    id: 'G%7Dr%5B' as const,
    type: 'rollup',
    propertyName: 'Designer ETH Address Rollup' as const,
  },
  discordLink: {
    id: 'IO%3Fk' as const,
    type: 'rollup',
    propertyName: 'Discord Link' as const,
  },
  Fulfillment: {
    id: 'IuqI' as const,
    type: 'select',
    propertyName: 'Fulfillment' as const,
  },
  Description: {
    id: 'JPU%5E' as const,
    type: 'rich_text',
    propertyName: 'Description' as const,
  },
  noBuyerRewards: {
    id: 'JY%7CY' as const,
    type: 'checkbox',
    propertyName: 'No Buyer Rewards' as const,
  },
  templateRel: {
    id: 'Jbd%5C' as const,
    type: 'relation',
    propertyName: 'Template Rel' as const,
  },
  // 'Tracking # to SB': {
  //   id: 'PZWC' as const,
  //   type: 'rich_text',
  //   propertyName: 'Tracking # to SB' as const,
  // },
  designFiles: {
    id: 'PhR%3C' as const,
    type: 'files',
    propertyName: 'Design File(s)' as const,
  },
  prodRollup: {
    id: 'Pwd%5B' as const,
    type: 'rollup',
    propertyName: 'Prod Rollup' as const,
  },
  technician: {
    id: 'Qf%5Bf' as const,
    type: 'relation',
    propertyName: 'Technician Rel' as const,
  },
  'Related to Garment Templates (Related to Products (Template Rel))': {
    id: 'TNLw' as const,
    type: 'relation',
    propertyName:
      'Related to Garment Templates (Related to Products (Template Rel))' as const,
  },
  brandEthAddress: {
    id: 'USr%5D' as const,
    type: 'rich_text',
    propertyName: 'Brand ETH Addy' as const,
  },
  logoRollup: {
    id: 'VcJs' as const,
    type: 'rollup',
    propertyName: 'Logo Rollup' as const,
  },
  addedToShop: {
    id: 'Vsnl' as const,
    type: 'checkbox',
    propertyName: 'Added to Shop' as const,
  },
  Priority: {
    id: 'XG%3C%3B' as const,
    type: 'select',
    propertyName: 'Priority' as const,
  },
  // 'Neck Tag design': {
  //   id: 'Zyrm' as const,
  //   type: 'files',
  //   propertyName: 'Neck Tag design' as const,
  // },
  // 'Last Edit Date': {
  //   id: '%5BQBF' as const,
  //   type: 'last_edited_time',
  //   propertyName: 'Last Edit Date' as const,
  // },
  // 'Related to Applicants (Shadowing)': {
  //   id: '%5BTe~' as const,
  //   type: 'relation',
  //   propertyName: 'Related to Applicants (Shadowing)' as const,
  // },
  status: {
    id: '%5C_D%3C' as const,
    type: 'select',
    propertyName: 'Status' as const,
  },
  isFutureDistro: {
    id: '%5DJjZ' as const,
    type: 'checkbox',
    propertyName: 'Future Distro' as const,
  },
  hasKongChip: {
    id: 'aBrt' as const,
    type: 'checkbox',
    propertyName: 'SiLo Chip' as const,
  },
  wearableStatus: {
    id: 'bagO' as const,
    type: 'select',
    propertyName: 'Wearable Status' as const,
  },
  SKU: {
    id: 'docp' as const,
    type: 'rich_text',
    propertyName: 'SKU' as const,
  },
  Producer: {
    id: 'ggmh' as const,
    type: 'relation',
    propertyName: 'Producer' as const,
  },
  // designerRelOld: {
  //   id: 'jI%7BI' as const,
  //   type: 'relation',
  //   propertyName: 'Designer Rel [OLD]' as const,
  // },
  socialMediaAssets: {
    id: 'k%7Ca_' as const,
    type: 'url',
    propertyName: 'Social Media Assets' as const,
  },
  // 'Inv Mng By Changed': {
  //   id: 'm%7DDO' as const,
  //   type: 'checkbox',
  //   propertyName: 'Inv Mng By Changed' as const,
  // },
  'Asset Completion': {
    id: 'n%3B%3Dn' as const,
    type: 'formula',
    propertyName: 'Asset Completion' as const,
  },
  Price: {
    id: 'nul%3A' as const,
    type: 'number',
    propertyName: 'Price' as const,
  },
  // Event: {
  //   id: 'ny%7Bm' as const,
  //   type: 'multi_select',
  //   propertyName: 'Event' as const,
  // },
  // 'Related to Invoices (Column)': {
  //   id: 'pLic' as const,
  //   type: 'relation',
  //   propertyName: 'Related to Invoices (Column)' as const,
  // },
  images: {
    id: 'qRmJ' as const,
    type: 'files',
    propertyName: '3D Static' as const,
  },
  // 'Neck Tag Roll-up': {
  //   id: 'rZ%3FB' as const,
  //   type: 'rollup',
  //   propertyName: 'Neck Tag Roll-up' as const,
  // },
  // 'Related to ETHDenver2022 (Column)': {
  //   id: 'rsKP' as const,
  //   type: 'relation',
  //   propertyName: 'Related to ETHDenver2022 (Column)' as const,
  // },
  quantity: {
    id: 'tXS%3E' as const,
    type: 'rich_text',
    propertyName: 'QTY/Edition' as const,
  },
  animation3D: {
    id: 'uotb' as const,
    type: 'files',
    propertyName: '3D Animation' as const,
  },
  relatedToManufacturers: {
    id: '%7Dsbq' as const,
    type: 'relation',
    propertyName: 'Related to Manufacturers (Property)' as const,
  },
  Name: {
    id: 'title' as const,
    type: 'title',
    propertyName: 'Name' as const,
  },
};

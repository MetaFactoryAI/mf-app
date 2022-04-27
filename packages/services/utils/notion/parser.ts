import { isAddress } from '@ethersproject/address';
import { z } from 'zod';

import { notionClient } from './client';

const URLValue = z.string().url().or(z.literal(''));

export const TextBlock = z.object({
  type: z.literal('text'),
  text: z.object({
    content: z.string(),
    link: z.object({ url: URLValue }).nullable(),
  }),
  plain_text: z.string(),
  href: z.string().nullable(),
});

const EthereumAddress = TextBlock.refine(
  ({ plain_text }) => isAddress(plain_text),
  { message: 'Invalid Ethereum Address ' },
);

const TitleProperty = z.object({
  id: z.string(),
  type: z.literal('title'),
  title: z.array(TextBlock).max(1),
});

const RichTextProperty = z.object({
  id: z.string(),
  type: z.literal('rich_text'),
  rich_text: z.array(TextBlock),
});

const CheckboxProperty = z.object({
  id: z.string(),
  type: z.literal('checkbox'),
  checkbox: z.boolean(),
});

const NumberProperty = z.object({
  id: z.string(),
  type: z.literal('number'),
  number: z.number().nullable(),
});

const DateProperty = z.object({
  id: z.string(),
  type: z.literal('date'),
  date: z
    .object({
      start: z.string(),
      end: z.string().nullable(),
      time_zone: z.string().nullable(),
    })
    .nullable(),
});

const SelectProperty = z.object({
  id: z.string(),
  type: z.literal('select'),
  select: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })
    .nullable(),
});

const FileBlock = z.object({
  name: z.string(),
  type: z.literal('file'),
  file: z.object({ url: URLValue, expiry_time: z.string() }),
});

const ExternalFileBlock = z.object({
  name: z.string(),
  type: z.literal('external'),
  external: z.object({ url: URLValue }),
});

const MultiSelectBlock = z.object({
  type: z.literal('multi_select'),
  multi_select: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    }),
  ),
});

const MultiSelectProperty = MultiSelectBlock.extend({
  id: z.string(),
});

const SingleFileProperty = z.object({
  id: z.string(),
  type: z.literal('files'),
  files: z.array(FileBlock).max(1),
});

const FilesProperty = z.object({
  id: z.string(),
  type: z.literal('files'),
  files: z.array(FileBlock),
});

const ExternalFilesProperty = z.object({
  id: z.string(),
  type: z.literal('files'),
  files: z.array(ExternalFileBlock),
});

const URLProperty = z.object({
  id: z.string(),
  type: z.literal('url'),
  url: URLValue.nullable(),
});

const RequiredURLProperty = z.object({
  id: z.string(),
  type: z.literal('url'),
  url: URLValue,
});

const resolveRelation = async ({ id }: { id: string }) => ({
  id,
  value: await notionClient.pages.retrieve({ page_id: id }),
});

const RelationProperty = z.object({
  id: z.string(),
  type: z.literal('relation'),
  relation: z.array(z.object({ id: z.string() }).transform(resolveRelation)),
});

export type PropertyName = keyof z.infer<typeof ProductPage.shape.properties>;

export const BasePage = z.object({
  object: z.literal('page'),
  id: z.string(),
  created_time: z.string(),
  last_edited_time: z.string(),
  // cover: z.object({}).nullable(),
  // icon: z.null(),
  parent: z.object({ type: z.literal('database_id'), database_id: z.string() }),
  archived: z.boolean(),
  url: URLValue,
});

export const ProductPage = BasePage.extend({
  properties: z.object({
    // 'At SB?': CheckboxProperty,
    // 'Pre-Order (20%)': NumberProperty,
    // 'Distro %': RichTextProperty,
    // 'Alt Print': RichTextProperty,
    'WRO ID': NumberProperty,
    'Brand Rel': RelationProperty,
    // Drive: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   files: z.array(z.unknown()),
    // }),
    // 'Template # Rollup': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     array: z.array(
    //       z.object({
    //         type: z.string(),
    //         rich_text: z.array(TextBlock),
    //       }),
    //     ),
    //     function: z.string(),
    //   }),
    // }),
    'Drop Date': DateProperty,
    'Tech ETH address': z.object({
      id: z.string(),
      type: z.string(),
      rollup: z.object({
        type: z.string(),
        array: z.array(
          z.object({
            type: z.string(),
            rich_text: z.array(EthereumAddress),
          }),
        ),
        function: z.string(),
      }),
    }),
    // '% Value': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   formula: z.object({ type: z.string(), number: z.number() }),
    // }),
    // 'Related to MF Brands Space (Related to Products (Brand Rel))': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.unknown()),
    // }),
    'CLO3d Model': SingleFileProperty,
    'Wearable Files': ExternalFilesProperty,
    'Cost ea.': NumberProperty,
    'Designer Rel [NEW]': RelationProperty,
    'Creation Date': z.object({
      id: z.string(),
      type: z.string(),
      created_time: z.string(),
    }),
    // 'Action Rel': RelationProperty,
    Distro: SelectProperty,
    // Print: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.literal('array'),
    //     array: z.array(MultiSelectBlock),
    //     function: z.string(),
    //   }),
    // }),
    // 'Designer ETH Address Rollup': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     array: z.array(z.unknown()),
    //     function: z.string(),
    //   }),
    // }),
    'Discord Link': z.object({
      id: z.string(),
      type: z.string(),
      rollup: z.object({
        type: z.string(),
        array: z.array(
          z.object({ type: z.string(), url: URLValue.nullable() }),
        ),
        function: z.string(),
      }),
    }),
    Fulfillment: SelectProperty,
    Description: RichTextProperty,
    'No Buyer Rewards': CheckboxProperty,
    'Template Rel': RelationProperty,
    'Tracking # to SB': RichTextProperty,
    'Design File(s)': FilesProperty,
    // 'Brand ETH Addy': RichTextProperty,
    'Technician Rel': RelationProperty,
    // 'Prod Rollup': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     array: z.array(
    //       z.object({
    //         type: z.string(),
    //         title: z.array(
    //           z.object({
    //             type: z.string(),
    //             text: z.object({ content: z.string(), link: z.null() }),
    //             annotations: z.object({
    //               bold: z.boolean(),
    //               italic: z.boolean(),
    //               strikethrough: z.boolean(),
    //               underline: z.boolean(),
    //               code: z.boolean(),
    //               color: z.string(),
    //             }),
    //             plain_text: z.string(),
    //             href: z.null(),
    //           }),
    //         ),
    //       }),
    //     ),
    //     function: z.string(),
    //   }),
    // }),
    // 'Related to Garment Templates (Related to Products (Template Rel))': z.object(
    //   {
    //     id: z.string(),
    //     type: z.string(),
    //     relation: z.array(z.unknown()),
    //   },
    // ),
    // 'Logo Rollup': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     array: z.array(
    //       z.object({ type: z.string(), files: z.array(z.unknown()) }),
    //     ),
    //     function: z.string(),
    //   }),
    // }),
    // 'Added to Shop': CheckboxProperty,
    Priority: SelectProperty,
    // 'Neck Tag design': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   files: z.array(
    //     z.object({
    //       name: z.string(),
    //       type: z.string(),
    //       file: z.object({ url: z.string(), expiry_time: z.string() }),
    //     }),
    //   ),
    // }),
    // 'Last Edit Date': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   last_edited_time: z.string(),
    // }),
    // 'Related to Applicants (Shadowing)': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.unknown()),
    // }),
    Status: SelectProperty,
    'Future Distro': CheckboxProperty,
    'SiLo Chip': SelectProperty,
    'Wearable Status': MultiSelectProperty,
    SKU: RichTextProperty,
    // Producer: RelationProperty,
    '3D Static': FilesProperty,
    'Social Media Assets': URLProperty,
    'Shopify Link': RequiredURLProperty,
    // 'Related to Customer Service (Column)': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.object({ id: z.string() })),
    // }),
    // 'Designer Rel [OLD]': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.unknown()),
    // }),
    // 'Inv Mng By Changed': CheckboxProperty,
    // 'Asset Completion': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   formula: z.object({ type: z.string(), string: z.string() }),
    // }),
    // Event: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   multi_select: z.array(z.unknown()),
    // }),
    // 'Related to Invoices (Column)': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.unknown()),
    // }),
    // 'Neck Tag Roll-up': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     number: z.number(),
    //     function: z.string(),
    //   }),
    // }),
    Price: NumberProperty,
    'QTY/Edition': RichTextProperty,
    '3D Animation': SingleFileProperty,
    // 'Related to Manufacturers (Property)': RelationProperty,
    Name: TitleProperty,
  }),
});

export const DatabaseResult = z.object({
  object: z.literal('list'),
  results: z.array(ProductPage),
});

export const BrandPage = BasePage.extend({
  properties: z.object({
    'Discord Link': URLProperty,
    Description: RichTextProperty,
    'ETH Address': z.object({
      id: z.string(),
      type: z.string(),
      rich_text: z.array(EthereumAddress),
    }),
    Logo: FilesProperty.or(ExternalFilesProperty),
    // Website: URLProperty,
    // Twitter: URLProperty,
    // Instagram: URLProperty,
    // 'Related to Products  (Brand Rel)': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.unknown()),
    // }),
    // 'Related to Products (Brand Rel)': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.object({ id: z.string() })),
    // }),
    Created: z.object({
      id: z.string(),
      type: z.string(),
      created_time: z.string(),
    }),
    Name: TitleProperty,
  }),
});

export const DesignerPage = BasePage.extend({
  properties: z.object({
    // Skills: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   multi_select: z.array(z.unknown()),
    // }),
    // "Last Edited": z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   last_edited_time: z.string(),
    // }),
    Social: URLProperty,
    'Eth Address': z.object({
      id: z.string(),
      type: z.string(),
      rich_text: z.array(EthereumAddress),
    }),
    // Role: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   multi_select: z.array(z.unknown()),
    // }),
    // 'Time Zone': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   select: z.null(),
    // }),
    Status: z.object({
      id: z.string(),
      type: z.string(),
      multi_select: z.array(z.unknown()),
    }),
    Name: TitleProperty,
  }),
});

export const TemplatePage = BasePage.extend({
  properties: z.object({
    Priority: SelectProperty,
    'Base Price': NumberProperty,
    'Size Guide': SingleFileProperty,
    'Print Tech': MultiSelectProperty,
    Style: SelectProperty,
    // 'Rendering Template': z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   files: z.array(z.unknown()),
    // }),
    // Palette: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   multi_select: z.array(z.unknown()),
    // }),
    Gender: SelectProperty,
    // Created: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   created_time: z.string(),
    // }),
    'Product Sheet': FilesProperty,
    'Template File(s)': FilesProperty,
    Description: RichTextProperty,
    // "Related to Products (Template Rel)": z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.object({ id: z.string() })),
    // }),
    // "MOQ Rollup": z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     array: z.array(
    //       z.object({
    //         type: z.string(),
    //         select: z.object({
    //           id: z.string(),
    //           name: z.string(),
    //           color: z.string(),
    //         }),
    //       })
    //     ),
    //     function: z.string(),
    //   }),
    // }),
    'Made In': RichTextProperty,
    URL: URLProperty,
    // 'Rel Manufacturers': RelationProperty,
    Composition: RichTextProperty,
    'Style #': RichTextProperty,
    // "Rel Products": z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   relation: z.array(z.unknown()),
    // }),
    // Select: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   checkbox: z.boolean(),
    // }),
    // Rating: z.object({ id: z.string(), type: z.string(), select: z.null() }),
    // Frequency: z.object({
    //   id: z.string(),
    //   type: z.string(),
    //   rollup: z.object({
    //     type: z.string(),
    //     number: z.number(),
    //     function: z.string(),
    //   }),
    // }),
    'CLO3d Model (CHECK AVATAR GENDER)': SingleFileProperty,
    'Size Notes': RichTextProperty,
    'Neck Tag?': CheckboxProperty,
    Ref: TitleProperty,
  }),
});

import { CONFIG } from '../config';
import { createClient, useZeusVariables } from '../graphql/client';

const client = createClient(CONFIG.graphqlUrl, CONFIG.graphqlToken);

const STAGES = [
  {
    name: 'submitted',
    description: 'A new submission to the product pipeline',
  },
  {
    name: 'rejected',
    description: 'Products rejected from pipeline, not to be produced',
  },
  { name: 'design', description: 'Products currently in the design phase' },
  {
    name: 'sampling',
    description: 'Design completed, awaiting approval of samples',
  },
  { name: 'scheduled', description: 'Product is scheduled for a release.' },
  { name: 'sale_live', description: 'Product is available for purchase' },
  { name: 'production', description: 'Product is in production' },
  {
    name: 'shipping',
    description: 'Product is at fulfillment center and ready to ship',
  },
  {
    name: 'fulfillment_completed',
    description: 'All orders of product are fulfilled',
  },
];

async function seedDatabase() {
  const variables = useZeusVariables({
    data: '[create_stage_input!]',
  })({
    data: STAGES,
  });
  const { $ } = variables;

  try {
    const res = await client.mutate(
      {
        create_stage_items: [
          { data: $('data') },
          {
            name: true,
          },
        ],
      },
      {
        operationName: 'initStages',
        variables,
      },
    );
    console.log(res);
  } catch (e) {
    console.log(e);
  }
}

seedDatabase();

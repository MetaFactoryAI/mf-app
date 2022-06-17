import { seedFileFormats, seedStages } from '../lib/mfosSeed';
import { migrateProductFiles } from '../lib/migrateProductFiles';
import { migrateProducts } from '../lib/migrateProducts';
import { createClient } from '../mfos';
import { CONFIG } from '../utils/config';

const client = createClient(CONFIG.mfosGraphqlUrl, CONFIG.mfosGraphqlToken);

const migrate = async () => {
  await seedStages(client);
  await seedFileFormats(client);
  await migrateProducts(client);
  await migrateProductFiles(client);
};

migrate();

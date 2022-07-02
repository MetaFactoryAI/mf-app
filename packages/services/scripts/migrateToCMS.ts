import {
  seedCollaboratorRoles,
  seedFileFormats,
  seedStages,
} from '../lib/mfosSeed';
import { migrateRobots } from '../lib/notionMigration/migrateNotionRobots';
import { migrateProductContributors } from '../lib/notionMigration/migrateProductContributors';
import { migrateProductFiles } from '../lib/notionMigration/migrateProductFiles';
import { migrateProducts } from '../lib/notionMigration/migrateProducts';
import { createClient } from '../mfos';
import { CONFIG } from '../utils/config';

const client = createClient(CONFIG.mfosGraphqlUrl, CONFIG.mfosGraphqlToken);

const migrate = async () => {
  await seedStages(client);
  await seedFileFormats(client);
  await seedCollaboratorRoles(client);
  await migrateRobots();
  await migrateProducts();
  await migrateProductFiles(client);
  await migrateProductContributors(client);
};

migrate();

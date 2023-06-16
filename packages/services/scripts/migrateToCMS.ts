import { MFOS_GRAPHQL_URL } from 'shared/config/public';
import { MFOS_GRAPHQL_TOKEN } from 'shared/config/secret';

import { migrateRobots } from '../lib/notionMigration/migrateNotionRobots';
import { migrateProductContributors } from '../lib/notionMigration/migrateProductContributors';
import { migrateProductFiles } from '../lib/notionMigration/migrateProductFiles';
import { migrateProducts } from '../lib/notionMigration/migrateProducts';
import { createClient } from '../mfos';
import {
  seedCollaboratorRoles,
  seedFileFormats,
  seedStages,
} from '../mfos/seed';

const client = createClient(MFOS_GRAPHQL_URL, MFOS_GRAPHQL_TOKEN);

const migrate = async () => {
  await seedStages(client);
  await seedFileFormats(client);
  await seedCollaboratorRoles(client);
  await migrateRobots();
  await migrateProducts();
  await migrateProductFiles(client);
  await migrateProductContributors(client);
};

// eslint-disable-next-line no-console
migrate().catch((e) => console.log(e));

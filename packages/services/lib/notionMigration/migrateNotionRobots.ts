import assert from 'assert';

import { logger } from '../../utils/logger';
import { getRobot } from '../../utils/notion/productHelpers';
import { isNotNullOrUndefined } from '../../utils/typeHelpers';
import { getNotionRobots } from '../notionHelpers';
import { createSystemUserIfNotExists } from '../../mfos/system/mutations';
import { SystemUser } from '../../mfos/system/selectors';

export async function migrateRobots(): Promise<void> {
  const robotsPages = await getNotionRobots({
    and: [
      {
        property: 'Role',
        multi_select: { is_not_empty: true },
      },
      {
        property: 'Eth Address',
        text: { is_not_empty: true },
      },
    ],
  });
  const users = robotsPages.map(getRobot).filter(isNotNullOrUndefined);

  const usersRes: Record<string, SystemUser> = {};
  for (const u of users) {
    try {
      assert(u.id, 'user ID Required');
      usersRes[u.id] = await createSystemUserIfNotExists(u, 'Robot');
    } catch (e) {
      logger.warn('Error creating user', { error: e });
    }
  }
  logger.info('finished migrating robots', {
    numRobots: users.length,
  });
}

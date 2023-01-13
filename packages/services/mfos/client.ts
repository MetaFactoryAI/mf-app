import { createClient } from './index';
import { MFOS_GRAPHQL_URL } from 'shared/config/public';
import { MFOS_GRAPHQL_TOKEN } from 'shared/config/secret';

export const mfosClient = createClient(MFOS_GRAPHQL_URL, MFOS_GRAPHQL_TOKEN);

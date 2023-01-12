import { createClient } from 'services/mfos';
import { MFOS_GRAPHQL_TOKEN, MFOS_GRAPHQL_URL } from 'app/config/client';

export const mfosClient = createClient(MFOS_GRAPHQL_URL, MFOS_GRAPHQL_TOKEN);

import { createClient } from 'services/mfos';
import {
  MFOS_GRAPHQL_PUBLIC_TOKEN,
  MFOS_GRAPHQL_URL,
} from 'shared/config/public';

export const mfosClient = createClient(
  MFOS_GRAPHQL_URL,
  MFOS_GRAPHQL_PUBLIC_TOKEN,
);

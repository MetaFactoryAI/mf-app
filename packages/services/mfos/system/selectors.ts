import { System } from 'services/mfos';

export const systemRolesSelector = System.Selector('directus_roles')({
  id: true,
  name: true,
  icon: true,
  enforce_tfa: true,
  admin_access: true,
  app_access: true,
});
export type SystemRole = System.InputType<
  System.GraphQLTypes['directus_roles'],
  typeof systemRolesSelector
>;
export const systemUsersSelector = System.Selector('directus_users')({
  id: true,
  first_name: true,
  last_name: true,
  provider: true,
  external_identifier: true,
  role: [{}, systemRolesSelector],
  status: true,
});
export type SystemUser = System.InputType<
  System.GraphQLTypes['directus_users'],
  typeof systemUsersSelector
>;

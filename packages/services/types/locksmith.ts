export interface LocksmithLockResponse {
  _id: number;
  _title: string;
  _has_resource: boolean;
  _resource_path: string;
  _resource_url: string;
  _resource_admin_url: string;
  _resource_type_for_humans: string;
  _resource_description: string;
  _updated_at: string;
  _notices: Notice[];
  resource_id: number;
  resource_type: string;
  resource_options: Record<string, unknown>;
  enabled: boolean;
  options: Options;
  keys: Key[];
}

interface Notice {
  status: string;
  title: string;
  description: string;
}

interface Options {
  hide_links_to_resource: boolean;
  hide_resource: boolean;
  hide_resource_from_sitemaps: boolean;
  manual: boolean;
  noindex: boolean;
  passcode_prompt: string;
}

interface Key {
  _id: number;
  options: Record<string, unknown>;
  conditions: Condition[];
}

interface Condition {
  _id: number;
  type: string;
  inverse: boolean;
  options: ConditionOptions;
}

interface ConditionOptions {
  passcodes?: string[];
  passcodes_single_use?: boolean;
  input_masked?: boolean;
  customer_remember?: boolean;
  liquid_condition?: string;
  liquid_prelude?: string;
}

import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  municipalityId?: string;
  bypassTenant?: boolean;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

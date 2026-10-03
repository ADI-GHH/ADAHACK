import { useSyncExternalStore } from 'react';
import { subscribeCompanyDb, getCompanySnapshot } from './mockCompanyDb';

export function useCompanySnapshot() {
  return useSyncExternalStore(subscribeCompanyDb, getCompanySnapshot);
}

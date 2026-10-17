import { Parser, Store, Quad } from 'n3';
import { SOCIAL_STUDIES_TTL, GAGNE_TTL, TEXT_TTL, READ_STRATEGY_TTL } from './embeddedTtl';
import { NAMESPACES } from './types';

export interface OntologyStores {
  socialStore: Store;
  gagneStore: Store;
  textStore: Store;
  readStore: Store;
  combinedStore: Store;
  tripleCounts: {
    social: number;
    gagne: number;
    text: number;
    read: number;
    total: number;
  };
}

let cachedStores: OntologyStores | null = null;

/**
 * TTL 문자열을 N3 Store로 파싱합니다.
 */
export function parseTtlToStore(ttlString: string, baseIRI?: string): Promise<{ store: Store; count: number }> {
  return new Promise((resolve, reject) => {
    const store = new Store();
    const parser = new Parser({ baseIRI });
    
    parser.parse(ttlString, (error, quad, prefixes) => {
      if (error) {
        reject(error);
      } else if (quad) {
        store.addQuad(quad);
      } else {
        resolve({ store, count: store.size });
      }
    });
  });
}

/**
 * 4개 온톨로지를 로드하고 각 Store 및 통합 Store를 생성합니다.
 * 접두사 충돌을 방지하기 위해 각 온톨로지는 고유 네임스페이스를 유지하며,
 * 통합 Store에서는 완전한 URI(NamedNode)를 기반으로 인덱싱됩니다.
 */
export async function loadOntologyStores(forceReload = false): Promise<OntologyStores> {
  if (cachedStores && !forceReload) {
    return cachedStores;
  }

  // 1. 각 TTL 파싱
  const [socialRes, gagneRes, textRes, readRes] = await Promise.all([
    parseTtlToStore(SOCIAL_STUDIES_TTL, NAMESPACES.curr),
    parseTtlToStore(GAGNE_TTL, NAMESPACES.gagne),
    parseTtlToStore(TEXT_TTL, NAMESPACES.pisa),
    parseTtlToStore(READ_STRATEGY_TTL, NAMESPACES.read),
  ]);

  // 2. 통합 Store 구성
  const combinedStore = new Store();
  socialRes.store.forEach((q) => combinedStore.addQuad(q));
  gagneRes.store.forEach((q) => combinedStore.addQuad(q));
  textRes.store.forEach((q) => combinedStore.addQuad(q));
  readRes.store.forEach((q) => combinedStore.addQuad(q));

  cachedStores = {
    socialStore: socialRes.store,
    gagneStore: gagneRes.store,
    textStore: textRes.store,
    readStore: readRes.store,
    combinedStore,
    tripleCounts: {
      social: socialRes.count,
      gagne: gagneRes.count,
      text: textRes.count,
      read: readRes.count,
      total: combinedStore.size,
    },
  };

  return cachedStores;
}

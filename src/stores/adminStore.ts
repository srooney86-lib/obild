import { create } from 'zustand';
import {
  DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE,
  DEFAULT_TEXT_TYPE_TO_READING_FUNCTION,
} from '@/lib/ontology/mappings';
import { ContentElementType } from '@/lib/ontology/types';

export interface AuditLog {
  id: string;
  action: string;
  target: string;
  operator: string;
  timestamp: string;
  details?: string;
}

export interface TtlFileMeta {
  fileName: string;
  type: 'curriculum' | 'instruction' | 'textType' | 'readingStrategy';
  tripleCount: number;
  status: 'valid' | 'warning' | 'error';
  lastModified: string;
}

interface AdminState {
  contentElementMappings: Record<ContentElementType, string[]>;
  textTypeMappings: Record<string, string[]>;
  ttlFiles: TtlFileMeta[];
  auditLogs: AuditLog[];
  updateContentElementMapping: (type: ContentElementType, textTypes: string[]) => void;
  updateTextTypeMapping: (textType: string, readingFunctions: string[]) => void;
  resetMappingsToDefault: () => void;
  addAuditLog: (action: string, target: string, operator: string, details?: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  contentElementMappings: { ...DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE },
  textTypeMappings: { ...DEFAULT_TEXT_TYPE_TO_READING_FUNCTION },
  ttlFiles: [
    { fileName: '사회과.ttl', type: 'curriculum', tripleCount: 125, status: 'valid', lastModified: '2026-10-16' },
    { fileName: '가네.ttl', type: 'instruction', tripleCount: 78, status: 'valid', lastModified: '2026-10-16' },
    { fileName: 'text.ttl', type: 'textType', tripleCount: 38, status: 'valid', lastModified: '2026-10-16' },
    { fileName: 'readstrategy.ttl', type: 'readingStrategy', tripleCount: 247, status: 'valid', lastModified: '2026-10-16' },
  ],
  auditLogs: [
    { id: '1', action: '시스템 초기화', target: '온톨로지 4종 로드', operator: '시스템', timestamp: '2026-10-17 09:00:00' },
    { id: '2', action: '매핑 규칙 확인', target: '4.3절 매핑 테이블 적용', operator: '관리자', timestamp: '2026-10-17 09:10:00' },
  ],

  updateContentElementMapping: (type, textTypes) => {
    set((state) => ({
      contentElementMappings: { ...state.contentElementMappings, [type]: textTypes },
    }));
  },

  updateTextTypeMapping: (textType, readingFunctions) => {
    set((state) => ({
      textTypeMappings: { ...state.textTypeMappings, [textType]: readingFunctions },
    }));
  },

  resetMappingsToDefault: () => {
    set({
      contentElementMappings: { ...DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE },
      textTypeMappings: { ...DEFAULT_TEXT_TYPE_TO_READING_FUNCTION },
    });
  },

  addAuditLog: (action, target, operator, details) => {
    set((state) => ({
      auditLogs: [
        {
          id: Date.now().toString(),
          action,
          target,
          operator,
          timestamp: new Date().toLocaleString('ko-KR'),
          details,
        },
        ...state.auditLogs,
      ],
    }));
  },
}));

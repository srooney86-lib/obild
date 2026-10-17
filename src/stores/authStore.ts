import { create } from 'zustand';
import { UserProfile, UserRole } from '@/lib/ontology/types';

interface AuthState {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  loginAs: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  toggleApproval: (uid: string) => void;
  allUsers: UserProfile[];
}

const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'user_teacher_1',
    id: 'teacher1',
    displayName: '김교사 (사회과)',
    email: 'teacher1@obild.local',
    role: 'teacher',
    approved: true,
    school: '국립공주대학교부설중학교',
    createdAt: '2026-03-01T09:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    uid: 'user_admin_1',
    id: 'admin',
    displayName: '시스템 관리자',
    email: 'admin@obild.local',
    role: 'admin',
    approved: true,
    school: '교육정보원',
    createdAt: '2026-01-01T09:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    uid: 'user_teacher_pending',
    id: 'teacher_new',
    displayName: '박교사 (승인대기)',
    email: 'teacher_new@obild.local',
    role: 'teacher',
    approved: false,
    school: '미래중학교',
    createdAt: '2026-10-15T14:30:00Z',
    lastLoginAt: '2026-10-15T14:30:00Z',
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: DEFAULT_USERS[0], // 기본값: 승인된 일반 교사
  isAuthenticated: true,
  allUsers: DEFAULT_USERS,

  loginAs: (role) => {
    const user = DEFAULT_USERS.find((u) => u.role === role) || DEFAULT_USERS[0];
    set({ currentUser: user, isAuthenticated: true });
  },

  switchRole: (role) => {
    set((state) => {
      const user = state.allUsers.find((u) => u.role === role) || state.currentUser;
      return { currentUser: user };
    });
  },

  toggleApproval: (uid) => {
    set((state) => ({
      allUsers: state.allUsers.map((u) =>
        u.uid === uid ? { ...u, approved: !u.approved } : u
      ),
    }));
  },
}));

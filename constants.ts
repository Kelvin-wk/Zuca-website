
import { UpdatePost, User, UserRole } from './types';

export const INITIAL_UPDATES: UpdatePost[] = [
  {
    id: '1',
    // Added missing userId to satisfy UpdatePost interface requirements
    userId: 'admin-system',
    title: 'Joint Sunday Mass',
    content: 'We will be having a joint mass with other university catholic groups this coming Sunday at the main campus chapel.',
    date: '2026-02-23',
    image: 'https://picsum.photos/seed/mass/800/400',
    category: 'Event'
  },
  {
    id: '2',
    // Added missing userId to satisfy UpdatePost interface requirements
    userId: 'admin-system',
    title: 'Bible Trivia Rewards',
    content: 'Top 3 scorers in this months Bible trivia will receive special branded ZUCA journals and rosaries!',
    date: '2026-02-18',
    image: 'https://picsum.photos/seed/rewards/800/400',
    category: 'Notice'
  },
  {
    id: '3',
    // Added missing userId to satisfy UpdatePost interface requirements
    userId: 'admin-system',
    title: 'Charity Walk 2024',
    content: 'Registration is now open for our annual charity walk. All proceeds go to the local children\'s home.',
    date: '2026-02-25',
    category: 'Event'
  }
];

export const MOCK_LEADERBOARD: Partial<User>[] = [
  { id: '101', name: 'John Doe', points: 2450, role: UserRole.STUDENT },
  { id: '102', name: 'Mary Wambui', points: 2100, role: UserRole.STUDENT },
  { id: '103', name: 'James Kimani', points: 1950, role: UserRole.NON_STUDENT },
  { id: '104', name: 'Sarah Atieno', points: 1800, role: UserRole.STUDENT },
  { id: '105', name: 'Peter Kamau', points: 1550, role: UserRole.NON_STUDENT }
];

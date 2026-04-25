import { describe, it, expect } from 'vitest';
import { _getNextCode, serializeToChsl, parseFromChsl } from '@/src/lib/serialize';
import { Chat } from '@/src/types';

describe('CHSL Serialization', () => {
  it('should generate the next lexicographical code correctly', () => {
    expect(_getNextCode('000000')).toBe('000001');
    expect(_getNextCode('00000Z')).toBe('000010');
  });

  it('should round-trip a chat object through CHSL', () => {
    const mockChat: Chat = {
      id: 'test-id',
      character_id: 'char-1',
      title: 'Test Chat',
      globals: {},
      messages: [
        {
          id: '000000',
          role: 'user',
          content: 'Hello world',
          modified_at: 123456789
        }
      ],
      created_at: 123456789,
      modified_at: 123456789
    };

    const { chsl, json } = serializeToChsl(mockChat);
    const parsed = parseFromChsl(chsl, json);

    expect(parsed.id).toBe(mockChat.id);
    expect(parsed.messages.length).toBe(1);
    expect(parsed.messages[0].content).toBe('Hello world');
    expect(parsed.messages[0].role).toBe('user');
  });
});
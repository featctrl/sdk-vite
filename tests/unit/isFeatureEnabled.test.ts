import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock @featctrl/typescript before importing the module under test ──────────

const mockIsEnabled = vi.fn<(key: string) => boolean | undefined>();

vi.mock('@featctrl/typescript', () => ({
  flagStore: { isEnabled: mockIsEnabled, getAll: () => new Map(), getConfig: vi.fn() },
  sseClient: null,
}));

// Import AFTER the mock is in place.
const { isFeatureEnabled } = await import('../../src/index.js');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('isFeatureEnabled', () => {
  beforeEach(() => {
    mockIsEnabled.mockReset();
  });

  describe('when the flag is unknown (isEnabled returns undefined)', () => {
    it('returns defaultValue=false when the flag is unknown', () => {
      mockIsEnabled.mockReturnValue(undefined);
      expect(isFeatureEnabled('unknown-flag', false)).toBe(false);
    });

    it('returns defaultValue=true when the flag is unknown', () => {
      mockIsEnabled.mockReturnValue(undefined);
      expect(isFeatureEnabled('unknown-flag', true)).toBe(true);
    });
  });

  describe('when the flag is known and enabled', () => {
    it('returns true regardless of defaultValue=false', () => {
      mockIsEnabled.mockReturnValue(true);
      expect(isFeatureEnabled('my-flag', false)).toBe(true);
    });

    it('returns true regardless of defaultValue=true', () => {
      mockIsEnabled.mockReturnValue(true);
      expect(isFeatureEnabled('my-flag', true)).toBe(true);
    });
  });

  describe('when the flag is known and disabled', () => {
    it('returns false regardless of defaultValue=true', () => {
      mockIsEnabled.mockReturnValue(false);
      expect(isFeatureEnabled('my-flag', true)).toBe(false);
    });

    it('returns false regardless of defaultValue=false', () => {
      mockIsEnabled.mockReturnValue(false);
      expect(isFeatureEnabled('my-flag', false)).toBe(false);
    });
  });

  it('passes the flag key to flagStore.isEnabled', () => {
    mockIsEnabled.mockReturnValue(undefined);
    isFeatureEnabled('specific-key', false);
    expect(mockIsEnabled).toHaveBeenCalledWith('specific-key');
  });
});


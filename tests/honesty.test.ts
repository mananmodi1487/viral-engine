import { describe, it, expect } from 'vitest';
import { checkInbound, checkOutbound, hasBlockers, REPLACEMENT_RULES } from '@viral-engine/core';

describe('honesty: inbound scan', () => {
  it('flags an explicit guaranteed-virality claim as a blocker', () => {
    const r = checkInbound('This tool will give you guaranteed viral growth.');
    expect(r.passed).toBe(false);
    expect(hasBlockers(r)).toBe(true);
    expect(r.findings.some((f) => f.rule === 'guaranteed virality')).toBe(true);
  });

  it('flags an unsourced adoption figure as a blocker', () => {
    const r = checkInbound('Trusted by 10,000 professionals worldwide.');
    expect(hasBlockers(r)).toBe(true);
    expect(r.findings.some((f) => f.matched.includes('10,000'))).toBe(true);
  });

  it('flags a star promise as a blocker', () => {
    const r = checkInbound('This repo will reach 100K stars by design.');
    expect(hasBlockers(r)).toBe(true);
  });

  it('does NOT flag an honest disclaimer about virality', () => {
    // This repo's own copy is full of these; flagging them would break the tool.
    const honest = [
      'Nobody can promise 100K stars.',
      'No guaranteed virality, ever.',
      'This does not guarantee viral growth.',
      'We never promise 100K stars.',
      'It is not guaranteed to go viral.',
    ];
    for (const text of honest) {
      const r = checkInbound(text);
      expect(r.passed, `should not block: "${text}"`).toBe(true);
    }
  });

  it('treats empty superlatives as notes, not blockers', () => {
    const r = checkInbound('A revolutionary, seamless, world-class tool.');
    expect(r.passed).toBe(true);
    expect(r.findings.every((f) => f.severity === 'note')).toBe(true);
    expect(r.findings.length).toBeGreaterThan(0);
  });

  it('passes a clean, specific document', () => {
    const r = checkInbound(
      'It is not a habit tracker. It is placement-risk management for students in placement season. This fails if students read it as another productivity lecture.',
    );
    expect(r.passed).toBe(true);
    expect(r.findings).toHaveLength(0);
  });

  it('every rule has a non-empty suggestion', () => {
    for (const rule of REPLACEMENT_RULES) {
      expect(rule.suggestion.length).toBeGreaterThan(20);
      expect(['blocker', 'warning', 'note']).toContain(rule.severity);
    }
  });
});

describe('honesty: outbound scan (our own output)', () => {
  it('blocks an invented testimonial shape', () => {
    const r = checkOutbound('One testimonial: "this was amazing and delightful"');
    expect(r.passed).toBe(false);
  });

  it('blocks an unbacked figure in generated output', () => {
    const r = checkOutbound('This tool now has 12,000 users.');
    expect(r.passed).toBe(false);
  });

  it('passes generated copy that uses placeholders', () => {
    const r = checkOutbound('Replace this with [your real number] and say how you will measure it.');
    expect(r.passed).toBe(true);
  });

  it('is stricter than the inbound scan', () => {
    const text = '500 users';
    expect(checkInbound(text).passed).toBe(true);
    expect(checkOutbound(text).passed).toBe(false);
  });
});

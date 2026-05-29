import { describe, it, expect } from 'vitest';
import { QUESTIONS, getById, getNext, getSection } from '../../api/_lib/questions.js';

describe('questions', () => {
  it('has 10 anchor questions', () => {
    expect(QUESTIONS.filter(q => !q.is_followup).length).toBe(10);
  });

  it('Q1 has 2 select inputs (industry + headcount)', () => {
    const q = getById('Q1');
    expect(q.inputs).toHaveLength(2);
    expect(q.inputs[0].type).toBe('select');
    expect(q.inputs[1].type).toBe('select');
  });

  it('Q4 next action is gate', () => {
    expect(getNext('Q4').action).toBe('gate');
    expect(getNext('Q4').next_anchor).toBe('Q5');
  });

  it('Q10 next action is complete', () => {
    expect(getNext('Q10').action).toBe('complete');
  });

  it('Q1 next is Q2 (action=next)', () => {
    expect(getNext('Q1')).toEqual({ action: 'next', next_anchor: 'Q2' });
  });

  it('groups by section', () => {
    expect(getSection('Q1')).toBe(1);
    expect(getSection('Q3')).toBe(2);
    expect(getSection('Q5')).toBe(3);
    expect(getSection('Q7')).toBe(4);
    expect(getSection('Q10')).toBe(5);
  });

  it('Q3 has follow-up strategy', () => {
    expect(getById('Q3').followup_strategy).toBe('ai_one_of_three');
  });

  it('Q6 has conditional follow-up strategy', () => {
    expect(getById('Q6').followup_strategy).toBe('ai_if_systems_disconnected');
  });

  it('industry options include all 8 Arqentia sectors', () => {
    const sectors = getById('Q1').inputs[0].options.map(o => o.value);
    expect(sectors).toEqual(expect.arrayContaining([
      'distribucion', 'retail', 'manufactura', 'servicios',
      'logistica', 'salud', 'construccion', 'educacion'
    ]));
  });
});

import { describe, expect, it } from 'vitest';
import { classify, gradeToGrade4, gradeToLetter } from './gpa';

describe('gpa mirror — matches backend engine boundaries', () => {
  it.each([
    [10, 'A'],
    [8.5, 'A'],
    [8.4, 'B+'],
    [8.0, 'B+'],
    [7.9, 'B'],
    [7.0, 'B'],
    [6.9, 'C+'],
    [6.5, 'C+'],
    [6.4, 'C'],
    [5.5, 'C'],
    [5.4, 'D+'],
    [5.0, 'D+'],
    [4.9, 'D'],
    [4.0, 'D'],
    [3.9, 'F'],
    [0, 'F'],
  ])('gradeToLetter(%s) = %s', (g, letter) => {
    expect(gradeToLetter(g as number)).toBe(letter);
  });

  it.each([
    [10, 4.0],
    [8.0, 3.5],
    [7.0, 3.0],
    [6.5, 2.5],
    [5.5, 2.0],
    [5.0, 1.5],
    [4.0, 1.0],
    [3.9, 0.0],
  ])('gradeToGrade4(%s) = %s', (g, g4) => {
    expect(gradeToGrade4(g as number)).toBe(g4);
  });

  it.each([
    [4.0, 'xuat_sac'],
    [3.6, 'xuat_sac'],
    [3.59, 'gioi'],
    [3.2, 'gioi'],
    [3.19, 'kha'],
    [2.5, 'kha'],
    [2.49, 'trung_binh'],
    [2.0, 'trung_binh'],
    [1.99, 'yeu'],
    [0, 'yeu'],
  ])('classify(%s) = %s', (cpa, tier) => {
    expect(classify(cpa as number)).toBe(tier);
  });
});

const { suggestSchedule } = require('../scheduler');

describe('suggestSchedule', () => {
  test('assigns fasting medication to hour 7', () => {
    const meds = [{ id: '1', condition: 'fasting', frequencyHours: 24, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(7);
  });

  test('assigns before_meal medication to hour 7', () => {
    const meds = [{ id: '1', condition: 'before_meal', frequencyHours: 8, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(7);
  });

  test('assigns after_meal medication to hour 9', () => {
    const meds = [{ id: '1', condition: 'after_meal', frequencyHours: 8, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(9);
  });

  test('assigns any medication to hour 10 when no conflicts', () => {
    const meds = [{ id: '1', condition: 'any', frequencyHours: 24, active: true }];
    const result = suggestSchedule(meds);
    expect(result.find((r) => r.id === '1').suggestedStartHour).toBe(10);
  });

  test('avoids conflict for any medication when hour 10 is taken', () => {
    const meds = [
      { id: '1', condition: 'any', frequencyHours: 24, active: true },
      { id: '2', condition: 'any', frequencyHours: 24, active: true },
    ];
    const result = suggestSchedule(meds);
    const h1 = result.find((r) => r.id === '1').suggestedStartHour;
    const h2 = result.find((r) => r.id === '2').suggestedStartHour;
    expect(Math.abs(h1 - h2)).toBeGreaterThan(1);
  });

  test('skips inactive medications', () => {
    const meds = [{ id: '1', condition: 'fasting', frequencyHours: 24, active: false }];
    const result = suggestSchedule(meds);
    expect(result).toHaveLength(0);
  });
});

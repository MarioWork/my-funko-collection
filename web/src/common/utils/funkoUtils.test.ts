import { funkoLabelOf } from './funkoUtils';

it('reads the number and name alone for a regular release', () => {
  expect(funkoLabelOf({ number: '78', name: 'Thanos', isChase: false, exclusive: '' })).toBe('#78 Thanos');
});

it('adds Chase for a chase', () => {
  expect(funkoLabelOf({ number: '78', name: 'Thanos', isChase: true, exclusive: '' })).toBe('#78 Thanos (Chase)');
});

it('adds the exclusive, and Chase first when it is both', () => {
  expect(funkoLabelOf({ number: '78', name: 'Thanos', isChase: false, exclusive: 'SDCC' })).toBe(
    '#78 Thanos (Exclusive: SDCC)',
  );
  expect(funkoLabelOf({ number: '78', name: 'Thanos', isChase: true, exclusive: 'SDCC' })).toBe(
    '#78 Thanos (Chase, Exclusive: SDCC)',
  );
});

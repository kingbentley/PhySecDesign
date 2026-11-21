// How a wait is worded on the set-up and sign-in pages (story 1.2; story 1.3, D-8, A-19). Kept in
// its own module, with no imports, so the sign-in client and its tests can use it without the
// set-up page's rules.

/** "1 minute", "2 minutes 30 seconds", "45 seconds"; "a few minutes" when the wait is unknown. */
export function waitWording(seconds) {
  const number = Number(seconds);
  if (seconds === undefined || seconds === null || !Number.isFinite(number) || number <= 0) return 'a few minutes';
  const whole = Math.ceil(number);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  const part = (count, unit) => `${count} ${unit}${count === 1 ? '' : 's'}`;
  if (minutes === 0) return part(rest, 'second');
  return rest === 0 ? part(minutes, 'minute') : `${part(minutes, 'minute')} ${part(rest, 'second')}`;
}

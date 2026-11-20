import { DATA_FORMAT_VERSION } from "../../shared/release";

// The conversion runner (AD-20). Conversions change an object's own tables from one data-format
// version to the next. They are applied only when the runner is called, never when an object
// starts. The format bookkeeping in `_meta` belongs to the runner; a conversion never touches it.

export interface Conversion {
  /** The data-format version this conversion reads. */
  from: number;
  /** The version it writes; always `from + 1`. */
  to: number;
  description: string;
  run(sql: SqlStorage): void;
}

/** The conversions shipped with this build. Empty until the first change of record shape. */
export const CONVERSIONS: readonly Conversion[] = [];

export interface ConversionResult {
  from: number;
  to: number;
  applied: string[];
}

/**
 * Applies the listed conversions in order, from `recorded` up to `target`. Each step runs in its
 * own transaction together with raising the recorded version, so a failure keeps the data at the
 * last completed step. `readVersion` and `writeVersion` are supplied by the object base.
 */
export function applyConversions(
  storage: DurableObjectStorage,
  list: readonly Conversion[],
  readVersion: () => number,
  writeVersion: (version: number) => void,
  target: number = DATA_FORMAT_VERSION,
): ConversionResult {
  const from = readVersion();
  const applied: string[] = [];
  let current = from;
  if (current > target) throw new Error(`Data format ${current} is newer than the target ${target}.`);
  while (current < target) {
    const step = list.find((conversion) => conversion.from === current);
    if (!step) throw new Error(`No conversion from data format ${current}.`);
    if (step.to !== current + 1) throw new Error(`The conversion from ${current} must write ${current + 1}.`);
    storage.transactionSync(() => {
      step.run(storage.sql);
      writeVersion(step.to);
    });
    applied.push(step.description);
    current = step.to;
  }
  return { from, to: current, applied };
}

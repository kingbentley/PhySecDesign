// One alarm per object, many due times (AD-20). An object that uses its alarm for more than one
// kind of work keeps each kind's due time in a schedule table and always sets its single alarm
// to the earliest. Scheduling one kind never removes another.

export const ALARM_SCHEDULE_TABLE = "_alarm_schedule";

export class AlarmSchedule {
  constructor(private readonly storage: DurableObjectStorage) {
    storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS ${ALARM_SCHEDULE_TABLE} (kind TEXT PRIMARY KEY, due_at INTEGER NOT NULL)`,
    );
  }

  /** Sets (or moves) the due time of one kind of work and re-arms the alarm. */
  async schedule(kind: string, dueAt: number): Promise<void> {
    this.storage.sql.exec(
      `INSERT INTO ${ALARM_SCHEDULE_TABLE} (kind, due_at) VALUES (?, ?)
       ON CONFLICT(kind) DO UPDATE SET due_at = excluded.due_at`,
      kind,
      Math.floor(dueAt),
    );
    await this.rearm();
  }

  /** Removes one kind of work and re-arms the alarm for the rest. */
  async cancel(kind: string): Promise<void> {
    this.storage.sql.exec(`DELETE FROM ${ALARM_SCHEDULE_TABLE} WHERE kind = ?`, kind);
    await this.rearm();
  }

  entries(): { kind: string; dueAt: number }[] {
    return this.storage.sql
      .exec<{ kind: string; due_at: number }>(`SELECT kind, due_at FROM ${ALARM_SCHEDULE_TABLE} ORDER BY due_at, kind`)
      .toArray()
      .map((row) => ({ kind: row.kind, dueAt: row.due_at }));
  }

  earliest(): number | null {
    const row = this.storage.sql
      .exec<{ due: number | null }>(`SELECT MIN(due_at) AS due FROM ${ALARM_SCHEDULE_TABLE}`)
      .toArray()[0];
    return row?.due ?? null;
  }

  /** The kinds due at `now`, earliest first. Nothing is removed until its work is done. */
  due(now: number): { kind: string; dueAt: number }[] {
    return this.storage.sql
      .exec<{ kind: string; due_at: number }>(
        `SELECT kind, due_at FROM ${ALARM_SCHEDULE_TABLE} WHERE due_at <= ? ORDER BY due_at, kind`,
        now,
      )
      .toArray()
      .map((row) => ({ kind: row.kind, dueAt: row.due_at }));
  }

  /** Removes a kind once its work succeeded, unless its due time was moved in the meantime. */
  complete(kind: string, dueAt: number): void {
    this.storage.sql.exec(`DELETE FROM ${ALARM_SCHEDULE_TABLE} WHERE kind = ? AND due_at = ?`, kind, dueAt);
  }

  /** Sets the object's one alarm to the earliest due time, or clears it when nothing is due. */
  async rearm(): Promise<void> {
    const earliest = this.earliest();
    const current = await this.storage.getAlarm();
    if (earliest === null) {
      if (current !== null) await this.storage.deleteAlarm();
      return;
    }
    if (current !== earliest) await this.storage.setAlarm(earliest);
  }
}

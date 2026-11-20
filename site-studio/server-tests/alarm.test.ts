import { env } from "cloudflare:workers";
import { runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { AlarmSchedule } from "../server/objects/alarmSchedule";
import type { ObjectBase } from "../server/objects/ObjectBase";

describe("alarm schedule", () => {
  it("keeps several due times and always sets the one alarm to the earliest", async () => {
    const stub = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName("alarm-schedule"));
    const t0 = Date.now() + 60 * 60 * 1000;
    const steps = await runInDurableObject(stub, async (_instance, state) => {
      const schedule = new AlarmSchedule(state.storage);
      const seen: (number | null)[] = [];
      await schedule.schedule("backup", t0 + 10_000);
      seen.push(await state.storage.getAlarm());
      await schedule.schedule("cleanup", t0 + 5_000); // earlier: becomes the alarm
      seen.push(await state.storage.getAlarm());
      await schedule.schedule("report", t0 + 20_000); // later: alarm unchanged, nothing removed
      seen.push(await state.storage.getAlarm());
      const entries = schedule.entries();
      const due = schedule.due(t0 + 6_000).map((entry) => entry.kind); // cleanup is due
      schedule.complete("cleanup", t0 + 5_000);
      await schedule.rearm();
      seen.push(await state.storage.getAlarm());
      await schedule.cancel("backup");
      seen.push(await state.storage.getAlarm());
      await schedule.cancel("report");
      seen.push(await state.storage.getAlarm());
      return { seen, entries, due };
    });
    expect(steps.seen).toEqual([t0 + 10_000, t0 + 5_000, t0 + 5_000, t0 + 10_000, t0 + 20_000, null]);
    expect(steps.entries.map((entry) => entry.kind)).toEqual(["cleanup", "backup", "report"]);
    expect(steps.due).toEqual(["cleanup"]);
  });

  it("runs the due work when the alarm fires and re-arms for the rest", async () => {
    const stub = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName("alarm-fire"));
    const later = Date.now() + 60 * 60 * 1000;
    await runInDurableObject(stub, async (instance: ObjectBase, state) => {
      const handlers = instance["alarmHandlers"];
      handlers.set("now", () => {
        state.storage.sql.exec("CREATE TABLE IF NOT EXISTS fired (kind TEXT)");
        state.storage.sql.exec("INSERT INTO fired VALUES ('now')");
      });
      await instance["schedule"].schedule("later", later);
      await instance["schedule"].schedule("now", Date.now() - 1);
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    const after = await runInDurableObject(stub, async (instance: ObjectBase, state) => ({
      fired: state.storage.sql.exec("SELECT kind FROM fired").toArray().map((row) => row.kind),
      remaining: instance["schedule"].entries().map((entry) => entry.kind),
      alarm: await state.storage.getAlarm(),
    }));
    expect(after).toEqual({ fired: ["now"], remaining: ["later"], alarm: later });
  });

  it("keeps a kind scheduled when its handler throws", async () => {
    const stub = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName("alarm-throw"));
    // Due in an hour, so the runtime does not fire the alarm itself; the due work runs as of then.
    const dueAt = Date.now() + 60 * 60 * 1000;
    const outcome = await runInDurableObject(stub, async (instance: ObjectBase) => {
      instance["alarmHandlers"].set("fragile", () => {
        throw new Error("handler failed");
      });
      await instance["schedule"].schedule("fragile", dueAt);
      let failed = false;
      try {
        await instance["runDueWork"](dueAt + 1);
      } catch {
        failed = true;
      }
      const remaining = instance["schedule"].entries();
      await instance["schedule"].cancel("fragile");
      return { failed, remaining };
    });
    expect(outcome).toEqual({ failed: true, remaining: [{ kind: "fragile", dueAt }] });
  });

  it("runs nothing and keeps the schedule while the data format does not match", async () => {
    const stub = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName("alarm-format"));
    const outcome = await runInDurableObject(stub, async (instance: ObjectBase, state) => {
      let ran = false;
      instance["alarmHandlers"].set("work", () => {
        ran = true;
      });
      await instance["schedule"].schedule("work", Date.now() - 1);
      state.storage.sql.exec("UPDATE _meta SET format_version = format_version + 1 WHERE id = 1");
      await instance.alarm();
      return { ran, remaining: instance["schedule"].entries().map((entry) => entry.kind) };
    });
    expect(outcome).toEqual({ ran: false, remaining: ["work"] });
  });
});

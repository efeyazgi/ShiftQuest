import { describe, expect, it } from "vitest";

import { saveFingerprint } from "@/features/sync/save-fingerprint";

describe("saveFingerprint", () => {
  it("treats reordered cloud JSONB objects as the same save", () => {
    const local = {
      profile: { id: "engineer-1", level: "C1" },
      progress: { totalXp: 820, completedScenarioIds: ["office-b1"] },
      settings: { audio: { volume: 0.8, narration: true } },
    };
    const cloud = {
      settings: { audio: { narration: true, volume: 0.8 } },
      progress: { completedScenarioIds: ["office-b1"], totalXp: 820 },
      profile: { level: "C1", id: "engineer-1" },
    };

    expect(saveFingerprint(cloud)).toBe(saveFingerprint(local));
  });

  it("keeps array order significant", () => {
    expect(saveFingerprint({ attempts: ["first", "second"] })).not.toBe(
      saveFingerprint({ attempts: ["second", "first"] }),
    );
  });

  it("still detects an actual progression difference", () => {
    expect(saveFingerprint({ progress: { totalXp: 800 } })).not.toBe(
      saveFingerprint({ progress: { totalXp: 900 } }),
    );
  });
});

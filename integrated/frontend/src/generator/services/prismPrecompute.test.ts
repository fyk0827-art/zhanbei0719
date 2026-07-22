import { describe, expect, it } from "vitest";
import { englishPlanetName } from "./prismPrecompute";

describe("English PRISM labels", () => {
  it("translates the life-key planet used in career reasons", () => {
    expect(englishPlanetName("冥王星")).toBe("Pluto");
    expect(englishPlanetName("太阳")).toBe("Sun");
  });
});

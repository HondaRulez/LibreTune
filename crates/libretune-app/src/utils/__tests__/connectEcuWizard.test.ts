import { describe, it, expect } from "vitest";
import {
  wizardSteps,
  nextStep,
  prevStep,
  isLastStep,
  transportLabel,
  stepTitle,
  type WizardStep,
} from "../connectEcuWizard";

describe("wizardSteps", () => {
  it("walks the full flow for a live transport", () => {
    const expected: WizardStep[] = ["transport", "params", "connect", "resolveIni", "name"];
    expect(wizardSteps("usb")).toEqual(expected);
    expect(wizardSteps("bluetooth")).toEqual(expected);
    expect(wizardSteps("wifi")).toEqual(expected);
    expect(wizardSteps(null)).toEqual(expected);
  });

  it("skips connection steps when offline", () => {
    expect(wizardSteps("offline")).toEqual(["transport", "name"]);
  });
});

describe("nextStep / prevStep", () => {
  it("advances through a live flow and clamps at the end", () => {
    expect(nextStep("transport", "usb")).toBe("params");
    expect(nextStep("params", "usb")).toBe("connect");
    expect(nextStep("connect", "usb")).toBe("resolveIni");
    expect(nextStep("resolveIni", "usb")).toBe("name");
    expect(nextStep("name", "usb")).toBe("name"); // clamps
  });

  it("goes back and clamps at the start", () => {
    expect(prevStep("name", "usb")).toBe("resolveIni");
    expect(prevStep("params", "usb")).toBe("transport");
    expect(prevStep("transport", "usb")).toBe("transport"); // clamps
  });

  it("jumps straight to name (and back) on the offline path", () => {
    expect(nextStep("transport", "offline")).toBe("name");
    expect(prevStep("name", "offline")).toBe("transport");
  });
});

describe("isLastStep", () => {
  it("is true only on the final step of the active path", () => {
    expect(isLastStep("name", "usb")).toBe(true);
    expect(isLastStep("resolveIni", "usb")).toBe(false);
    expect(isLastStep("name", "offline")).toBe(true);
    expect(isLastStep("transport", "offline")).toBe(false);
  });
});

describe("labels", () => {
  it("labels transports and steps", () => {
    expect(transportLabel("usb")).toMatch(/USB/);
    expect(transportLabel("offline")).toMatch(/No connection/);
    expect(stepTitle("resolveIni")).toMatch(/definition/i);
  });
});

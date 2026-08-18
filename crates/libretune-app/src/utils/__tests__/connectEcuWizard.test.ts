import { describe, it, expect } from "vitest";
import {
  wizardSteps,
  nextStep,
  prevStep,
  isLastStep,
  transportLabel,
  stepTitle,
  isSerialTransport,
  paramsComplete,
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

describe("isSerialTransport", () => {
  it("treats USB and Bluetooth as serial, WiFi and offline as not", () => {
    expect(isSerialTransport("usb")).toBe(true);
    expect(isSerialTransport("bluetooth")).toBe(true);
    expect(isSerialTransport("wifi")).toBe(false);
    expect(isSerialTransport("offline")).toBe(false);
  });
});

describe("paramsComplete", () => {
  const base = { port: "", baud: 115200, host: "", tcpPort: 29000 };

  it("requires a port for serial transports", () => {
    expect(paramsComplete("usb", base)).toBe(false);
    expect(paramsComplete("usb", { ...base, port: "COM3" })).toBe(true);
    expect(paramsComplete("bluetooth", { ...base, port: "COM7" })).toBe(true);
  });

  it("requires host and a positive port for WiFi", () => {
    expect(paramsComplete("wifi", base)).toBe(false);
    expect(paramsComplete("wifi", { ...base, host: "192.168.1.10" })).toBe(true);
    expect(paramsComplete("wifi", { ...base, host: "192.168.1.10", tcpPort: 0 })).toBe(false);
  });

  it("needs nothing for offline", () => {
    expect(paramsComplete("offline", base)).toBe(true);
  });
});

describe("labels", () => {
  it("labels transports and steps", () => {
    expect(transportLabel("usb")).toMatch(/USB/);
    expect(transportLabel("offline")).toMatch(/No connection/);
    expect(stepTitle("resolveIni")).toMatch(/definition/i);
  });
});

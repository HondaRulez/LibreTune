/**
 * State model for the "Connect ECU" wizard (Phase 1 — navigation skeleton).
 *
 * The wizard guides a first-time ECU connection: pick a transport, enter the
 * connection parameters, connect and read the ECU's firmware signature, resolve
 * the matching INI definition (local → online → manual), then name and create
 * the project. This module holds only the *step ordering* logic so it can be
 * unit-tested without any UI or Tauri backend. Later phases fill each step in.
 */

/** How the user connects to the ECU. */
export type WizardTransport = "usb" | "bluetooth" | "wifi" | "offline";

/** The ordered steps of the wizard. */
export type WizardStep = "transport" | "params" | "connect" | "resolveIni" | "name";

/**
 * The steps that apply for a given transport.
 *
 * The "offline" path skips everything connection-related and goes straight from
 * choosing the transport to naming the project (the user picks an INI by hand,
 * matching today's New Project behaviour). A live transport walks the full
 * connect → detect → resolve flow.
 */
export function wizardSteps(transport: WizardTransport | null): WizardStep[] {
  if (transport === "offline") return ["transport", "name"];
  return ["transport", "params", "connect", "resolveIni", "name"];
}

/** The step after `current`, or `current` itself when already at the last step. */
export function nextStep(current: WizardStep, transport: WizardTransport | null): WizardStep {
  const steps = wizardSteps(transport);
  const i = steps.indexOf(current);
  if (i < 0) return steps[0];
  return steps[Math.min(i + 1, steps.length - 1)];
}

/** The step before `current`, or `current` itself when already at the first step. */
export function prevStep(current: WizardStep, transport: WizardTransport | null): WizardStep {
  const steps = wizardSteps(transport);
  const i = steps.indexOf(current);
  if (i <= 0) return steps[0];
  return steps[i - 1];
}

/** Whether `current` is the final step for this transport. */
export function isLastStep(current: WizardStep, transport: WizardTransport | null): boolean {
  const steps = wizardSteps(transport);
  return steps.indexOf(current) === steps.length - 1;
}

/** Human labels for the transports. */
export function transportLabel(t: WizardTransport): string {
  switch (t) {
    case "usb":
      return "USB / Serial";
    case "bluetooth":
      return "Bluetooth";
    case "wifi":
      return "WiFi / Network (TCP)";
    case "offline":
      return "No connection right now";
  }
}

/** Short title shown in the wizard header for each step. */
export function stepTitle(step: WizardStep): string {
  switch (step) {
    case "transport":
      return "How do you want to connect?";
    case "params":
      return "Connection settings";
    case "connect":
      return "Connecting & detecting ECU";
    case "resolveIni":
      return "ECU definition";
    case "name":
      return "Name your project";
  }
}

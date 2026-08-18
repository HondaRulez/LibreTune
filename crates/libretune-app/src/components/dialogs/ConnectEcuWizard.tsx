import { useState } from "react";
import { Dialog, Button } from "../common";
import {
  WizardTransport,
  WizardStep,
  wizardSteps,
  nextStep,
  prevStep,
  isLastStep,
  transportLabel,
  stepTitle,
} from "../../utils/connectEcuWizard";

interface ConnectEcuWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Connect-ECU wizard — Phase 1 skeleton.
 *
 * Provides the guided multi-step shell (transport → params → connect → detect →
 * resolve INI → name). Navigation and the offline branch are fully wired and
 * unit-tested (`utils/connectEcuWizard.ts`); the per-step content is filled in
 * by later phases, which will reuse the existing `ConnectionDialog`,
 * `connect_to_ecu`, `search_online_inis` / `download_ini`, `import_ini` and
 * project-creation flows. Steps that aren't implemented yet show a clear
 * placeholder so the flow is navigable end-to-end.
 */
export default function ConnectEcuWizard({ isOpen, onClose }: ConnectEcuWizardProps) {
  const [transport, setTransport] = useState<WizardTransport | null>(null);
  const [step, setStep] = useState<WizardStep>("transport");
  const [projectName, setProjectName] = useState("");

  const steps = wizardSteps(transport);
  const stepIndex = steps.indexOf(step);
  const last = isLastStep(step, transport);
  const canAdvance = step !== "transport" || transport !== null;

  function reset() {
    setTransport(null);
    setStep("transport");
    setProjectName("");
  }
  function handleClose() {
    reset();
    onClose();
  }

  const transports: WizardTransport[] = ["usb", "bluetooth", "wifi", "offline"];

  return (
    <Dialog open={isOpen} onClose={handleClose} title="Connect ECU / New Project" size="md">
      <Dialog.Body>
        <div style={{ opacity: 0.7, fontSize: 12, marginBottom: "0.75rem" }}>
          Step {stepIndex + 1} of {steps.length} — {stepTitle(step)}
        </div>

        {step === "transport" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {transports.map((t) => (
              <label
                key={t}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
              >
                <input
                  type="radio"
                  name="wizard-transport"
                  checked={transport === t}
                  onChange={() => setTransport(t)}
                />
                <span>{transportLabel(t)}</span>
              </label>
            ))}
          </div>
        )}

        {step === "params" && (
          <PlaceholderStep
            phase="Phase 2"
            text={`Connection settings for ${transport ? transportLabel(transport) : ""} (port / baud, or host / TCP port) go here — reusing the existing ConnectionDialog fields and port scan.`}
          />
        )}

        {step === "connect" && (
          <PlaceholderStep
            phase="Phase 3"
            text="Connects (connect_to_ecu) and reads the ECU firmware signature."
          />
        )}

        {step === "resolveIni" && (
          <PlaceholderStep
            phase="Phase 3"
            text="Resolves the INI definition automatically: local match by signature → online search/download → manual upload fallback."
          />
        )}

        {step === "name" && (
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Project name</label>
            <input
              type="text"
              value={projectName}
              placeholder="My ECU project"
              onChange={(e) => setProjectName(e.target.value)}
              style={{ width: "100%" }}
            />
            {transport === "offline" && (
              <p style={{ opacity: 0.7, fontSize: 12, marginTop: "0.5rem" }}>
                Offline: you'll pick an INI definition by hand (today's New Project behaviour).
              </p>
            )}
            <p style={{ opacity: 0.6, fontSize: 12, marginTop: "0.75rem" }}>
              Project creation is wired in a later phase.
            </p>
          </div>
        )}
      </Dialog.Body>

      <Dialog.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        {stepIndex > 0 && (
          <Button variant="secondary" onClick={() => setStep(prevStep(step, transport))}>
            Back
          </Button>
        )}
        {last ? (
          <Button variant="primary" onClick={handleClose} disabled={!projectName.trim()}>
            Finish
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => setStep(nextStep(step, transport))}
            disabled={!canAdvance}
          >
            Next
          </Button>
        )}
      </Dialog.Footer>
    </Dialog>
  );
}

function PlaceholderStep({ phase, text }: { phase: string; text: string }) {
  return (
    <div
      style={{
        border: "1px dashed var(--color-border, #8884)",
        borderRadius: 6,
        padding: "1rem",
        opacity: 0.85,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Coming in {phase}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

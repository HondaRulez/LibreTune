import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
  isSerialTransport,
  paramsComplete,
  WIZARD_BAUD_RATES,
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

  // Connection parameters (Phase 2).
  const [ports, setPorts] = useState<string[]>([]);
  const [scanningPorts, setScanningPorts] = useState(false);
  const [port, setPort] = useState("");
  const [baud, setBaud] = useState(115200);
  const [host, setHost] = useState("");
  const [tcpPort, setTcpPort] = useState(29000);

  const params = { port, baud, host, tcpPort };

  async function scanPorts() {
    setScanningPorts(true);
    try {
      const found = await invoke<string[]>("get_serial_ports");
      setPorts(found);
      if (found.length > 0 && !found.includes(port)) setPort(found[0]);
    } catch {
      setPorts([]);
    } finally {
      setScanningPorts(false);
    }
  }

  // Scan serial ports when entering the params step for a serial transport.
  useEffect(() => {
    if (step === "params" && isSerialTransport(transport)) void scanPorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, transport]);

  const steps = wizardSteps(transport);
  const stepIndex = steps.indexOf(step);
  const last = isLastStep(step, transport);
  const canAdvance =
    step === "transport"
      ? transport !== null
      : step === "params"
        ? paramsComplete(transport, params)
        : true;

  function reset() {
    setTransport(null);
    setStep("transport");
    setProjectName("");
    setPorts([]);
    setPort("");
    setHost("");
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

        {step === "params" && isSerialTransport(transport) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {transport === "bluetooth" && (
              <p style={{ opacity: 0.7, fontSize: 12, margin: 0 }}>
                Bluetooth ECUs appear as a serial (COM) port — pair the device in your OS
                first, then pick its port below.
              </p>
            )}
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Port</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {ports.length === 0 ? (
                    <option value="">No ports found</option>
                  ) : (
                    ports.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))
                  )}
                </select>
                <Button variant="secondary" onClick={scanPorts} disabled={scanningPorts}>
                  {scanningPorts ? "Scanning…" : "Refresh"}
                </Button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Baud rate</label>
              <select value={baud} onChange={(e) => setBaud(parseInt(e.target.value))}>
                {WIZARD_BAUD_RATES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === "params" && transport === "wifi" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ opacity: 0.7, fontSize: 12, margin: 0 }}>
              For a networked ECU (e.g. rusEFI over WiFi), enter its host/IP and TCP port.
            </p>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Host / IP</label>
              <input
                type="text"
                value={host}
                placeholder="192.168.4.1"
                onChange={(e) => setHost(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>TCP port</label>
              <input
                type="number"
                value={tcpPort}
                onChange={(e) => setTcpPort(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
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

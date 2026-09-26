import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { demoApi, type DemoSession } from "../lib/demo-api";
import type { ConsentState, PatientOption } from "../types";

export function useDemoSession() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [notesText, setNotesText] = useState("");
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectPatient = useCallback(async (patientId: string) => {
    setIsLoading(true);
    try {
      const next = await demoApi.createSession(patientId);
      setSession(next);
      setNotesText(next.notes_text);
      setConsentState(await demoApi.consent(patientId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start the demo session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const available = await demoApi.patients();
        setPatients(available);
        const maria = available.find((patient) => patient.patient_id === "pt-maria-conti");
        if (maria) await selectPatient(maria.patient_id);
      } catch (error) {
        setIsLoading(false);
        toast.error(
          error instanceof Error ? error.message : "The local HIPAcampus backend is not available",
        );
      }
    })();
  }, [selectPatient]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const updateNotes = (value: string) => {
    setNotesText(value);
    clearTimeout(saveTimer.current);
    if (!session) return;
    saveTimer.current = setTimeout(() => {
      void demoApi.saveNotes(session.session_id, value).catch(() => {
        toast.error("Notes remain in the editor, but the local save failed.");
      });
    }, 500);
  };

  const setConsent = async (category: string, consented: boolean) => {
    if (!session) return;
    try {
      const next = await demoApi.setConsent(session.patient_id, category, consented);
      setConsentState(next);
      toast.success(
        `${category.replace("_", " ")} consent ${consented ? "enabled" : "revoked"} for this synthetic patient`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Consent update failed");
    }
  };

  const reset = async () => {
    if (!session) return;
    try {
      const result = await demoApi.reset(session.session_id);
      setNotesText(result.notes_text);
      setConsentState(await demoApi.consent(session.patient_id));
      toast.success("Maria demo reset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    }
  };

  return {
    patients,
    session,
    notesText,
    consent,
    isLoading,
    selectPatient,
    updateNotes,
    setConsent,
    reset,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { demoApi, type DemoSession } from "../lib/demo-api";
import type { ConsentState, EvidenceSource, PatientOption } from "../types";

export function useDemoSession() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [notesText, setNotesText] = useState("");
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [patientSources, setPatientSources] = useState<EvidenceSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectPatient = useCallback(async (patientId: string) => {
    setIsLoading(true);
    try {
      const [next, nextConsent, nextSources] = await Promise.all([
        demoApi.createSession(patientId),
        demoApi.consent(patientId),
        demoApi.patientSources(patientId),
      ]);
      setSession(next);
      setNotesText(next.notes_text);
      setConsentState(nextConsent);
      setPatientSources(nextSources);
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
          error instanceof Error ? error.message : "The local HIPAAcampus backend is not available",
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
      setPatientSources(await demoApi.patientSources(session.patient_id));
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
      const [nextConsent, nextSources] = await Promise.all([
        demoApi.consent(session.patient_id),
        demoApi.patientSources(session.patient_id),
      ]);
      setConsentState(nextConsent);
      setPatientSources(nextSources);
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
    patientSources,
    isLoading,
    selectPatient,
    updateNotes,
    setConsent,
    reset,
  };
}

import { CalendarDays, Check, PanelRight, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ConsentState, MeetingDetails, PatientOption } from "../types";

type MeetingHeaderProps = {
  meeting: MeetingDetails;
  sourcesOpen: boolean;
  onToggleSources: () => void;
  patients: PatientOption[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  consent: ConsentState | null;
  onConsentChange: (category: string, consented: boolean) => void;
  onReset: () => void;
  disabled?: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  behavioral_health: "Behavioral health",
  medications: "Medications",
};

export function MeetingHeader({
  meeting,
  sourcesOpen,
  onToggleSources,
  patients,
  selectedPatientId,
  onSelectPatient,
  consent,
  onConsentChange,
  onReset,
  disabled,
}: MeetingHeaderProps) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {meeting.scheduledFor}
        </p>
        <h1 className="font-display text-4xl font-medium sm:text-5xl">{meeting.title}</h1>
        <div className="mt-4 w-full max-w-sm">
          <Select
            value={selectedPatientId ?? ""}
            onValueChange={onSelectPatient}
            disabled={disabled}
          >
            <SelectTrigger aria-label="Synthetic demo patient">
              <SelectValue placeholder="Select a synthetic patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.patient_id} value={patient.patient_id}>
                  {patient.name}, {patient.age} — synthetic demo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Check className="size-3.5" /> Synthetic demo patient — never real clinical data
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!consent}>
              <ShieldCheck /> Consent
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Demo consent v{consent?.consent_version ?? "—"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(consent?.categories ?? {}).map(([category, state]) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={state.consented}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) => onConsentChange(category, checked === true)}
              >
                {CATEGORY_LABELS[category] ?? category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={onReset} disabled={disabled}>
          <RotateCcw /> Reset demo
        </Button>
        <Button variant="outline" onClick={onToggleSources} aria-pressed={sourcesOpen}>
          <PanelRight /> Sources
        </Button>
      </div>
    </div>
  );
}

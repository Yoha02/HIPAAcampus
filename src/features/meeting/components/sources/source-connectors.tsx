import { Badge } from "@/components/ui/badge";

import { SOURCE_CATEGORIES } from "../../lib/source-categories";
import { DEMO_CONNECTORS } from "../../sources";
import { SourceDot } from "./source-dot";

export function SourceConnectors() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect a system to pull sources into this record automatically.
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {DEMO_CONNECTORS.map((connector) => (
          <li key={connector.name} className="flex items-center gap-3 px-3 py-3">
            <SourceDot category={connector.category} className="size-2.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{connector.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {SOURCE_CATEGORIES[connector.category].label} · {connector.description}
              </p>
            </div>
            <Badge variant="secondary">Coming soon</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

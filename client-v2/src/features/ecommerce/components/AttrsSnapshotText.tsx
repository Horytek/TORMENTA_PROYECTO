import { formatAttrsSnapshot } from "../utils/attrsSnapshot";

export function AttrsSnapshotText({
  snapshot,
  className = "text-xs text-stone-500 mt-0.5",
}: {
  snapshot?: unknown;
  className?: string;
}) {
  const text = formatAttrsSnapshot(snapshot);
  if (!text) return null;
  return <p className={className}>{text}</p>;
}

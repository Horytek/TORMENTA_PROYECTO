import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-black/15 px-4 py-8 text-center">
      <p className="text-[14px] font-semibold">{title}</p>
      {body ? <p className="mt-1 text-[13px] text-black/50">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

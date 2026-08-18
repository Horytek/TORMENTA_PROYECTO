import { useParams } from "react-router-dom";
import { AtelierWorkspace } from "../components/AtelierWorkspace";
import { AtelierProductFrame } from "../components/ProductFrame";

export default function WorkspacePage({ role }: { role: "cliente" | "creador" }) {
  const { id } = useParams();
  const orderId = Number(id);
  return (
    <AtelierProductFrame requireRole={role}>
      <main>
        {orderId ? (
          <AtelierWorkspace orderId={orderId} role={role} />
        ) : (
          <p className="at-ui px-5 py-16 text-center text-[var(--at-stone)]">Encargo no encontrado.</p>
        )}
      </main>
    </AtelierProductFrame>
  );
}

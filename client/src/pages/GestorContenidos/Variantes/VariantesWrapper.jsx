import { Routes, Route, Navigate } from 'react-router-dom';
import Variantes from './Variantes';

function VariantesWrapper() {
    return (
        <Routes>
            <Route index element={<Variantes />} />
            <Route path="tonalidades" element={<Variantes />} />
            <Route path="tallas" element={<Variantes />} />
            <Route path="unidades" element={<Variantes />} />
            <Route path="atributos" element={<Variantes />} />
            <Route path="*" element={<Navigate to="/gestor-contenidos/variantes" replace />} />
        </Routes>
    );
}

export default VariantesWrapper;

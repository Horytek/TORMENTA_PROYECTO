import './Historico.css';
import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams } from 'react-router-dom';

function Historico() {
  const { id } = useParams();

  return (
    <div className="Historico">
      <HeaderHistorico productId={id} />
      <br />
      <HistoricoTable ingresoId={id} />
    </div>
  );
}

export default Historico;

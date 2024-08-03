import './Historico.css';
import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams } from 'react-router-dom';

function Historico() {
  const { id } = useParams();

  // Aquí puedes hacer una llamada a la API para obtener los datos históricos usando el id

  return (
    <div className="Historico">
      <HeaderHistorico />

      <br />
      <HistoricoTable ingresoId={id} />
    </div>
  );
}

export default Historico;

import React from 'react';
import './HeaderHistorico.css';
import ButtonHistorico from '../ComponentsHistorico/ButtonHistorico';

function HeaderHistorico() {
  return (
    <div className="headerHistorico">
      <div className="info">
        <h2>TORMENTA JEANS - 20610968801</h2>
        <p>Almacén: ALM CENTRAL ESCALERA / 3 BOTONES JEANS - TORMENTA</p>
        <p>COD: 010010001 / Stock Actual: 48.00 UND / Stock Separado: 0.00 UND / Stock Tránsito: 30.00 UND / Marca: TORMENTA JEANS</p>
      </div>
      <div className="actions">
        <ButtonHistorico label="IMPRIMIR" />
        <ButtonHistorico label="EXCEL" />
        <select>
          <option>ALM CENTRAL ESCALERA</option>
        </select>
      </div>
    </div>
  );
}

export default HeaderHistorico;

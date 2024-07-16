import React from 'react';
import './HeaderHistorico.css';
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { FaRegFileExcel } from "react-icons/fa";
import { ButtonNormal } from '@/components/Buttons/Buttons';

function HeaderHistorico() {
  return (
    <div className="headerHistorico">
      <div className="info">
        <h2>TORMENTA JEANS - 20610968801</h2>
        <p>Almacén: ALM CENTRAL ESCALERA / 3 BOTONES JEANS - TORMENTA</p>
        <p>COD: 010010001 / Stock Actual: 48.00 UND / Stock Separado: 0.00 UND / Stock Tránsito: 30.00 UND / Marca: TORMENTA JEANS</p>
        <div className="filters">
          <input type="date" className="date-input" />
          <input type="date" className="date-input" />
        </div>
      </div>
      <div className="actions">
        <ButtonNormal color={'#01BDD6'}>
          <MdOutlineLocalPrintshop className="inline-block text-lg" />IMPRIMIR
        </ButtonNormal>
        <ButtonNormal color={'#01BDD6'}>
          <FaRegFileExcel className="inline-block text-lg" /> EXCEL
        </ButtonNormal>
        <select>
          <option>ALM CENTRAL ESCALERA</option>
        </select>
      </div>
    </div>
  );
}

export default HeaderHistorico;

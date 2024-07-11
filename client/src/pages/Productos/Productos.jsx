import './Productos.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import {ButtonSave, ButtonClose, ButtonNormal, ButtonIcon} from '@/components/Buttons/Buttons';
import { FaPlus } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
//import { useState } from 'react'

function Productos() {

    return (
      <div>
        <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Productos', href: '/productos' }]} />
        <hr className="mb-4" />
        <h1 className='font-extrabold text-4xl'>Productos</h1>
        <div className="flex justify-between mt-5 mb-4 items-center" >
            <h6 className='font-bold'>Lista de Productos</h6>
            <div className='relative w-2/4' >
                <div className='absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none'>
                    <IoIosSearch className='w-4 h-4 text-gray-500'/>
                </div>
                <input type="text" placeholder='Ingrese un producto' className='search-product border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5' />
            </div>
            <div className="flex gap-5">
            <ButtonNormal color={'#01BDD6'}>
                Filtrar
            </ButtonNormal>
            <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }} />}>
                Agregar producto
            </ButtonIcon>
            </div>
        </div>
          <ButtonSave/>
          <ButtonClose/>
      </div>
    );
  }
  
  export default Productos;
  
const numeroALetras = (num) => {
    const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const especiales = {
        11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
        16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve'
    };

    const getUnidades = (num) => unidades[num];
    const getDecenas = (num) => {
        if (num < 10) return getUnidades(num);
        if (num >= 10 && num < 20) return decenas[0]; // Caso específico de diez
        if (num < 20) return especiales[num];
        if (num < 100) return decenas[Math.floor(num / 10) - 1] + (num % 10 ? ' y ' + getUnidades(num % 10) : '');
        return '';
    };

    const getCentenas = (num) => {
        if (num < 100) return getDecenas(num);
        if (num === 100) return 'cien';
        if (num < 1000) return centenas[Math.floor(num / 100) - 1] + (num % 100 ? ' ' + getDecenas(num % 100) : '');
        return '';
    };

    const getMiles = (num) => {
        if (num < 1000) return getCentenas(num);
        return (Math.floor(num / 1000) === 1 ? 'mil' : getCentenas(Math.floor(num / 1000)) + ' mil') + (num % 1000 ? ' ' + getCentenas(num % 1000) : '');
    };

    const getMillones = (num) => {
        if (num < 1000000) return getMiles(num);
        return (Math.floor(num / 1000000) === 1 ? 'un millón' : getCentenas(Math.floor(num / 1000000)) + ' millones') + (num % 1000000 ? ' ' + getMiles(num % 1000000) : '');
    };

    const parteEntera = Math.floor(num);
    const parteDecimal = Math.round((num - parteEntera) * 100);

    const enteroLetras = parteEntera === 0 ? 'cero' : getMillones(parteEntera);
    const decimalLetras = parteDecimal > 0 ? `${parteDecimal}/100` : '00/100';

    return `${enteroLetras} CON ${decimalLetras} SOLES`.replace(/\s+/g, ' ').trim();
};

const NumeroALetras = ({ num }) => {
    return (
         <>{numeroALetras(num).toUpperCase()}</>
    );
};

export default NumeroALetras;

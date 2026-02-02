const valor = "••••••••••••••••";
const isMaskedOrEmpty = !valor || valor.trim() === '' || /^[•●]+$/.test(valor.trim());
console.log(`Value: "${valor}"`);
console.log(`Char Code: ${valor.charCodeAt(0)}`);
console.log(`Is Masked: ${isMaskedOrEmpty}`);

const valor2 = "•••••••••••••••• "; // with space
console.log(`Value2 (trimmed): "${valor2.trim()}"`);
console.log(`Is Masked2: ${!valor2 || valor2.trim() === '' || /^[•●]+$/.test(valor2.trim())}`);

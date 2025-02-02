import axios from "@/api/axios";

const downloadExcelReport = async (mes, year, almacen) => {
    try {
        const response = await axios.get(`/kardex/generate-excel`, {
            params: { mes, year, almacen },
            responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `reporte-kardex-${mes}-${year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Error al descargar el archivo Excel:", error);
    }
};

export default downloadExcelReport;

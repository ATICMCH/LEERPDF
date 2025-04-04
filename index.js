/**
 * Es la clave de mi api de openAI
 */
const apikey = tu_api_key;
/**
 * Url donde hacmeos las peticiones
 */
const url = 'https://api.openai.com/v1/chat/completions';
//Inicializamos las variables para los valores
let fechaFactura = "";
let numerofactura = "";
let empresaEmisora = "";
let cifempresa = "";
let paisprocedente = "";
let concepto = "";
let monto = "";
let iva = "";
/**
 * Array donde guardamos los valores del excel
 */
let valoresExtraidos = [];


//Evento que se dispara cuando elegimos un fichero tipo .pdf
document.getElementById('fileInput').addEventListener('change', function (event) {
    /**
     * Fichero PDF
     */
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        const reader = new FileReader();

        // Cuando el archivo esté cargado, procesarlo
        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            leerPdf(arrayBuffer);
        };

        // Leer el archivo como arrayBuffer
        reader.readAsArrayBuffer(file);
    } else {
        alert('Por favor, selecciona un archivo PDF.');
    }
    //Reiniciamos el valor del input (de la recogida de datos de la factura) para poder hacer otra petición
    document.getElementById("pregunta").value = "";
});
/**
 * Función para leer el PDF con PDF.js
 * @param {*} arrayBuffer 
 */
function leerPdf(arrayBuffer) {
    //Carga el documento pdf
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    //Función que carga el texto del pdf
    loadingTask.promise.then(function (pdf) {
        console.log('PDF cargado');
        extraerTexto(pdf);
    }).catch(function (error) {
        console.error('Error al cargar el PDF: ', error);
    });
}
/**
 * Función para extraer el texto del pdf  
 * @param {*} pdf 
 */
function extraerTexto(pdf) {
    /**
     * Texto final extaído
     */
    let textoCompleto = '';
    /**
     * Las paginas totales que tiene el pdf
     */
    const totalPages = pdf.numPages;
    /**
     * Contador de paginas procesadas
     */
    let paginasProcesadas = 0;

    // Iterar sobre cada página del PDF y extraer el texto
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        pdf.getPage(pageNum).then(function (page) {
            page.getTextContent().then(function (textContent) {
                /**
                 *  Almacenamos el texto extraído de cada página
                 */
                const pageText = textContent.items.map(item => item.str).join(' ');
                textoCompleto += pageText + '\n';
                paginasProcesadas++; // Contar cuántas páginas hemos procesado

                // Cuando terminemos de extraer texto de todas las páginas, mostrarlo
                if (paginasProcesadas === totalPages) {
                    mostrarTexto(textoCompleto);


                }
            });
        });
    }
}
/**
 * Función para mostrar el pdf en el html en formato texto, enviar la peticion a la api y habilitar el boton de descargar excel
 * @param {*} texto 
 */
function mostrarTexto(texto) {
    //const container = document.getElementById('pdfTextContainer');
    //container.textContent = texto;
    let recogida = "me puedes decir de esta factura la fecha de emision, el numero de factura, nombre de la empresa emisora,el cif de la empresa, de que pais procede, el concepto, el monto y el tipo de iva. Tu respuesta debe ser como si fuera una url : fecha_emision=24/03/2025&numero_factura=DGFCJ2500165093&nombre_empresa_emisora=DIGI_Spain_Telecom_S.L.U.&cif_empresa=B-84919760&pais_procedencia=España&concepto=Fibra_SMART_300Mb_y_Fibra_SMART_600Mb&monto=25,00€&iva=21%"
    //Ponemos en el input que no se ve la peticion para recoger los datos
    document.getElementById("pregunta").value = texto + recogida;
}
/**
 * Función para mandar la peticion a la api y que nos devuelva una respuesta
 * @param {*} pregunta 
 * @returns Respuesta formato json
 */
async function getCompletion(pregunta) {

    const res = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apikey
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "user", content: pregunta }  // Aquí agregas el mensaje del usuario
            ]
        }),
    });

    return await res.json();
}


const pregunta = document.querySelector("#pregunta");
const boton = document.querySelector("#boton");
boton.addEventListener("click", async () => {
    if (!pregunta.value) return;
    const response = await getCompletion(pregunta.value);
    console.log(response);
    /**
     * Respuesta de la api
     */
    let cadena = response.choices[0].message.content;
    /**
     * Datos parametrizados en formato url
     */
    let params = new URLSearchParams(cadena);
    console.log(cadena);
    //Damos valor a las variables
    fechaFactura = params.get("fecha_emision");
    numerofactura = params.get("numero_factura");
    empresaEmisora = params.get("nombre_empresa_emisora");
    cifempresa = params.get("cif_empresa");
    paisprocedente = params.get("pais_procedencia");
    concepto = params.get("concepto");
    monto = params.get("monto");
    iva = params.get("iva");

    valoresExtraidos = [fechaFactura, numerofactura, empresaEmisora,
        cifempresa, paisprocedente, concepto, monto, iva];
    console.log(valoresExtraidos)
    const container = document.getElementById('pdfTextContainer');
    //Creamos elementos del DOM para poner en el body los valores a recogidos
    let ul = document.createElement("ul");
    for (let i = 0; i < valoresExtraidos.length; i++) {
        let li = document.createElement("li");
        li.textContent = valoresExtraidos[i];
        ul.appendChild(li);
    }
    container.appendChild(ul);
    //Habilitamos el botón de descargar excel 
    document.getElementById('downloadBtn').style.display = 'inline-block';

});
//Evento que se dispara cuando hacemos click en el boton de añadir fichero
document.getElementById('downloadBtn').addEventListener('click', function () {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx';
    fileInput.click();
    //Evento que se dispara cuando cambia el fichero ya sea cuando se añade o se cambia a otro
    fileInput.addEventListener('change', function (event) {
        /**
         * Nombre del fichero excel
         */
        const file = event.target.files[0];

        const reader = new FileReader();
        //Evento que se dispara cuando se carga la lectura de ficheros
        reader.onload = function (e) {
            // Leer el archivo Excel existente como ArrayBuffer
            const wb = XLSX.read(e.target.result, { type: 'array' });
            console.log(wb);
            // Acceder a la primera hoja del archivo
            const ws = wb.Sheets[wb.SheetNames[0]];
            console.log(ws)
            // Verificar si la hoja tiene el rango definido
            if (!ws['!ref']) {
                console.log("La hoja de cálculo está vacía. Se agregarán datos por defecto.");
                ws['A1'] = { v: 'Valor por defecto' }; // Agregar un valor por defecto si está vacía
                ws['!ref'] = "A1:A1";  // Asignar un rango para que no falle en la siguiente operación
            }

            // Verificamos y actualizamos el rango 'ref' para asegurarnos de que cubra todo el contenido
            const range = XLSX.utils.decode_range(ws['!ref']);
            // La última fila vacía
            const lastRow = range.e.r + 1;
            console.log(lastRow)

            // Escribir los valores extraídos en las nuevas filas (debemos agregar la información en la siguiente fila vacía)
            for (let i = 0; i < valoresExtraidos.length; i++) {
                //Para ver el iva, vemos de que tipo es y lo metemos en la columna indicada
                if (i == 7) {
                    if (valoresExtraidos[i] == "21%") {
                        ws[XLSX.utils.encode_cell({ r: lastRow, c: 9 })] = { v: "21%" };
                    } else if (valoresExtraidos[i] == "10%") {
                        ws[XLSX.utils.encode_cell({ r: lastRow, c: 11 })] = { v: "10%" };
                    } else if (valoresExtraidos[i] == "5%") {
                        ws[XLSX.utils.encode_cell({ r: lastRow, c: 13 })] = { v: "5%" };
                    } else {
                        ws[XLSX.utils.encode_cell({ r: lastRow, c: 15 })] = { v: "4%" };
                    }
                } else {
                    //mientras no sea 7 (el iva) que lo ponga en las columnas prgresivamente (0...1...2...)
                    ws[XLSX.utils.encode_cell({ r: lastRow, c: i })] = { v: valoresExtraidos[i] };
                }
            }


            // Actualizar el rango 'ref' para incluir la nueva celda escrita
            ws['!ref'] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 }, // Mantener la primera fila como título
                e: { r: lastRow, c: 16 }  // Extender el rango para incluir las nuevas filas
            });

            // Generar y descargar el archivo modificado
            console.log(ws);
            XLSX.writeFile(wb, 'actualizado.xlsx');
        };

        // Leer el archivo Excel como ArrayBuffer
        reader.readAsArrayBuffer(file);

    });
});



const btnCargar = document.getElementById('btn-cargar');
const modal = document.getElementById('modal-validacion');
const listaPendientes = document.getElementById('categorias-pendientes');
const btnConfirmar = document.getElementById('btn-confirmar')
// const btnFinalizar = document.getElementById('btn-finalizar')

// btnFinalizar.addEventListener('click', () => {
//     const filas = document.querySelectorAll('.select-categoria');
//     const datosFinales = Array.from(filas).map(sel => {
//         const base = JSON.parse(sel.dataset.json);
//         return { ...base, categoria: sel.value };
//     });

//     window.electronAPI.saveToDatabase(datosFinales);
// });


// Al hacer clic en el botón "Confirmar y Guardar" del modal
btnConfirmar.addEventListener('click', () => {
    const selects = document.querySelectorAll('.input-categoria');
    const datosParaGuardar = [];

    selects.forEach(s => {
        datosParaGuardar.push({
            fecha: s.dataset.fecha,
            descripcion: s.dataset.desc,
            importe: s.dataset.imp,
            categoria: s.value
        });
    });

    // Enviamos la lista final a la base de datos
    window.electronAPI.saveToDatabase(datosParaGuardar);
    modal.style.display = 'none';
});

btnCargar.addEventListener('click', async () => {
    try {
        const filePath = await window.electronAPI.openFileDialog();
        if (filePath) {
            console.log("Archivo seleccionado:", filePath);
            // Llamamos a la función que antes faltaba
            validarCategorias(filePath);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// Definimos la función que causaba el ReferenceError
async function validarCategorias(path) {
    console.log("Validando categorías para:", path);

    // Le pedimos a Python que analice el archivo
    window.electronAPI.uploadFile(path);

    // Mostramos el modal (puedes poner un spinner de carga aquí)
    modal.style.display = 'block';
    listaCategorias.innerHTML = "Consultando base de datos...";
}

// Escuchamos la respuesta de Python (configurado en preload.js)
window.electronAPI.onPythonOutput(((data) => {
    console.log(data.status);

    console.log("Datos recibidos en el Renderer:", data); // <-- DEBUG

    if (data.status === "ok" && data.pendientes) {
        listaPendientes.innerHTML = ""; // Limpiar

        // Mostrar el modal antes de poblarlo
        modal.style.display = 'flex';

        data.pendientes.forEach((gasto, index) => {
            const row = document.createElement('div');
            row.className = "gasto-row";

            // Determinamos si es negativo o positivo para el color
            const claseMonto = gasto.importe < 0 ? 'negativo' : 'positivo';

            row.innerHTML = `
                <span>${gasto.fecha}</span>
                <strong>${gasto.descripcion}</strong>
                <span class="monto ${claseMonto}">$${gasto.importe.toFixed(2)}</span>
                <select class="input-categoria">
                    <option value="Comida">Comida</option>
                    <option value="Supermercado">Supermercado</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Ingreso">Sueldo/Ingreso</option>
                    <option value="Delivey">Delivery</option>
                    <option value="BUG">BUG</option>
                    <option value="Otros">Otros</option>
                </select>
            `;
            listaPendientes.appendChild(row);
        });
    } else {
        console.error("Error en los datos o status no es ok", data);
    }
}));

function renderizarFormularioCategorias(pendientes) {
    listaCategorias.innerHTML = ""; // Limpiar
    pendientes.forEach((desc, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <p><strong>${desc}</strong></p>
            <select id="cat-${index}">
                <option value="Comida">Comida</option>
                <option value="Servicios">Servicios</option>
                <option value="Ocio">Ocio</option>
                <option value="Supermercado">Supermercado</option>
            </select>
            <hr>
        `;
        listaCategorias.appendChild(div);
    });
}
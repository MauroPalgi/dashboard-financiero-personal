const btnCargar = document.getElementById('btn-cargar');
const modal = document.getElementById('modal-validacion');
const listaPendientes = document.getElementById('categorias-pendientes');
const btnConfirmar = document.getElementById('btn-confirmar')

// Al hacer clic en el botón "Confirmar y Guardar" del modal
btnConfirmar.addEventListener('click', () => {
    const selects = document.querySelectorAll('.input-categoria');
    const datosParaGuardar = [];

    selects.forEach(s => {
        datosParaGuardar.push({
            fecha: s.dataset.fecha,
            descripcion: s.dataset.desc,
            monto: s.dataset.monto,
            categoria: s.value
        });
    });

    // Enviamos la lista final a la base de datos
    window.electronAPI.saveToDatabase(datosParaGuardar);
    // ACTUALIZAR GRÁFICO AL INSTANTE
    actualizarGrafico(datosFinales);

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
            const claseMonto = gasto.monto < 0 ? 'negativo' : 'positivo';

            row.innerHTML = `
                <span>${gasto.fecha}</span>
                <strong>${gasto.descripcion}</strong>
                <span class="monto ${claseMonto}">$${gasto.monto.toFixed(2)}</span>
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

window.electronAPI.onUpdateGraphTotal((datos) => {
    console.log("Datos recibidos para graficar:", datos);

    if (!datos || datos.length === 0) {
        console.warn("La base de datos está vacía, no hay nada que graficar.");
        return;
    }

    const acumulado = {};
    datos.forEach(mov => {
        const monto = parseFloat(mov.monto);
        // Solo graficamos gastos (negativos)
        if (monto < 0) {
            const cat = mov.categoria || 'Sin Categoría';
            acumulado[cat] = (acumulado[cat] || 0) + Math.abs(monto);
        }
    });

    const labels = Object.keys(acumulado);
    const values = Object.values(acumulado);

    console.log("Labels:", labels, "Values:", values);

    const trace = {
        values: values,
        labels: labels,
        type: 'pie',
        hole: 0.4,
        marker: {
            colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0']
        }
    };

    const layout = {
        title: 'Distribución de Gastos Totales',
        paper_bgcolor: '#2d2d2d',
        plot_bgcolor: '#2d2d2d',
        font: { color: '#e0e0e0' },
        showlegend: true
    };

    // Usamos el ID exacto del div
    Plotly.newPlot('grafico-gastos', [trace], layout).catch(err => {
        console.error("Error al renderizar Plotly:", err);
    });
});


// UTILS
async function validarCategorias(path) {
    console.log("Validando categorías para:", path);

    // Le pedimos a Python que analice el archivo
    window.electronAPI.uploadFile(path);

    // Mostramos el modal (puedes poner un spinner de carga aquí)
    modal.style.display = 'block';
    listaPendientes.innerHTML = "Consultando base de datos...";
}

function renderizarFormularioCategorias(pendientes) {
    listaPendientes.innerHTML = ""; // Limpiar
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
        listaPendientes.appendChild(div);
    });
}

function actualizarGrafico(datos) {
    // 1. Filtrar solo gastos (montos negativos) y agrupar por categoría
    console.log(datos);
    
    const categorias = {};

    datos.forEach(d => {
        const monto = Math.abs(parseFloat(d.monto));
        if (parseFloat(d.monto) < 0) {
            categorias[d.categoria] = (categorias[d.categoria] || 0) + monto;
        }
    });

    // 2. Preparar datos para Plotly
    const labels = Object.keys(categorias);
    const values = Object.values(categorias);

    const data = [{
        values: values,
        labels: labels,
        type: 'pie',
        hole: .4,
        marker: {
            colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']
        },
        textinfo: "label+percent",
        insidetextorientation: "radial"
    }];

    const layout = {
        title: 'Resumen de Gastos por Categoría',
        height: 450,
        paper_bgcolor: 'rgba(0,0,0,0)', // Transparente para usar el fondo del CSS
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e0e0e0' },
        showlegend: true,
        legend: { orientation: 'h', y: -0.1 },
        margin: { t: 50, b: 50, l: 20, r: 20 }
    };

    Plotly.newPlot('grafico-gastos', data, layout);
}
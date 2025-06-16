let tareaArrastrada = null;

// --- Alternar Tema ---
const alternarTema = document.getElementById("alternar-tema");
const cuerpo = document.body;

// Cargar tema desde localStorage o usar claro por defecto
const temaActual = localStorage.getItem("tema") || "claro";
cuerpo.setAttribute("data-tema", temaActual);
alternarTema.textContent = temaActual === "oscuro" ? "☀️" : "🌙";

alternarTema.addEventListener("click", () => {
    let tema = cuerpo.getAttribute("data-tema");
    if (tema === "oscuro") {
        cuerpo.setAttribute("data-tema", "claro");
        localStorage.setItem("tema", "claro");
        alternarTema.textContent = "🌙";
    } else {
        cuerpo.setAttribute("data-tema", "oscuro");
        localStorage.setItem("tema", "oscuro");
        alternarTema.textContent = "☀️";
    }
});

// --- Funciones de Gestión de Tareas ---

function generarIdUnico() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function agregarTarea(idColumna, textoTarea = '', idTarea = generarIdUnico()) {
    if (!textoTarea) {
        textoTarea = prompt("Escribe una nueva tarea:");
        if (!textoTarea) return; // El usuario canceló
    }

    const tarea = document.createElement("div");
    tarea.className = "tarea";
    tarea.setAttribute("draggable", "true");
    tarea.setAttribute("data-id-tarea", idTarea); // Asignar ID único
    tarea.setAttribute("data-id-columna", idColumna); // Guardar ID de columna para persistencia

    const contenidoTarea = document.createElement("span");
    contenidoTarea.className = "texto-tarea";
    contenidoTarea.textContent = textoTarea;

    const botonEliminar = document.createElement("button");
    botonEliminar.className = "btn-eliminar-tarea";
    botonEliminar.textContent = "X";
    botonEliminar.onclick = () => eliminarTarea(idTarea, idColumna);

    tarea.appendChild(contenidoTarea);
    tarea.appendChild(botonEliminar);

    agregarEventosArrastrarSoltar(tarea);
    document.querySelector(`#${idColumna} .lista-tareas`).appendChild(tarea);

    guardarTareas(); // Guardar tareas en localStorage
}

function eliminarTarea(idTarea, idColumna) {
    const elementoTarea = document.querySelector(`.tarea[data-id-tarea="${idTarea}"]`);
    if (elementoTarea) {
        elementoTarea.remove();
        guardarTareas(); // Guardar tareas después de eliminar
    }
}

function agregarEventosArrastrarSoltar(tarea) {
    tarea.addEventListener("dragstart", (e) => {
        tareaArrastrada = tarea;
        tarea.classList.add("arrastrando");
        // Opcional: establecer datos para la transferencia (buena práctica)
        e.dataTransfer.setData("text/plain", tarea.getAttribute("data-id-tarea"));
    });

    tarea.addEventListener("dragend", () => {
        tareaArrastrada.classList.remove("arrastrando");
        tareaArrastrada = null;
    });
}

function configurarEventosColumnas() {
    document.querySelectorAll(".lista-tareas").forEach(lista => {
        lista.addEventListener("dragover", (e) => {
            e.preventDefault(); // Esencial para permitir el soltar
            lista.classList.add("arrastrando-sobre");
            // Opcional: agregar feedback visual sobre dónde se soltará el elemento
            const elementoDespues = obtenerElementoDespuesDeArrastrar(lista, e.clientY);
            const arrastrable = document.querySelector('.arrastrando');
            if (elementoDespues == null) {
                lista.appendChild(arrastrable);
            } else {
                lista.insertBefore(arrastrable, elementoDespues);
            }
        });

        lista.addEventListener("dragleave", () => {
            lista.classList.remove("arrastrando-sobre");
        });

        lista.addEventListener("drop", (e) => {
            e.preventDefault();
            lista.classList.remove("arrastrando-sobre");
            if (tareaArrastrada) {
                const idColumnaDestino = lista.parentElement.id;
                tareaArrastrada.setAttribute("data-id-columna", idColumnaDestino); // Actualizar ID de columna
                lista.appendChild(tareaArrastrada); // Ya se movió por dragover
                guardarTareas(); // Guardar tareas después de mover
            }
        });
    });
}

// Función para determinar dónde insertar el elemento arrastrado
function obtenerElementoDespuesDeArrastrar(contenedor, y) {
    const elementosArrastrables = [...contenedor.querySelectorAll('.tarea:not(.arrastrando)')];

    return elementosArrastrables.reduce((masCercano, hijo) => {
        const caja = hijo.getBoundingClientRect();
        const desplazamiento = y - caja.top - caja.height / 2;
        if (desplazamiento < 0 && desplazamiento > masCercano.desplazamiento) {
            return { desplazamiento: desplazamiento, elemento: hijo };
        } else {
            return masCercano;
        }
    }, { desplazamiento: Number.NEGATIVE_INFINITY }).elemento;
}

// --- Persistencia con localStorage ---
function guardarTareas() {
    const tareas = {};
    document.querySelectorAll(".columna").forEach(columna => {
        const idColumna = columna.id;
        const elementosTarea = columna.querySelectorAll(".tarea");
        tareas[idColumna] = [];
        elementosTarea.forEach(elementoTarea => {
            tareas[idColumna].push({
                id: elementoTarea.getAttribute("data-id-tarea"),
                texto: elementoTarea.querySelector(".texto-tarea").textContent
            });
        });
    });
    localStorage.setItem("tareas", JSON.stringify(tareas));
}

function cargarTareas() {
    const tareasGuardadas = JSON.parse(localStorage.getItem("tareas"));
    if (tareasGuardadas) {
        for (const idColumna in tareasGuardadas) {
            tareasGuardadas[idColumna].forEach(datosTarea => {
                agregarTarea(idColumna, datosTarea.texto, datosTarea.id);
            });
        }
    }
}

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", () => {
    configurarEventosColumnas();
    cargarTareas(); // Cargar tareas cuando la página se carga
});

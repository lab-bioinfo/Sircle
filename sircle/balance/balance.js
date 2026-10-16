// balance.js - CON obtenerDatosFormulario() para exportación TSV/TXT/SQL

const inputs = document.querySelectorAll("input");

inputs.forEach(input => {
    input.addEventListener("input", calcularBalance);
});

function calcularBalance() {
    let ing12a = 0, egr12a = 0;
    let ing12b = 0, egr12b = 0;

    document.querySelectorAll("tbody tr[data-group]").forEach(row => {
        const inputs = row.querySelectorAll("input");

        // 08–12, 12–18, 18–20
        const dayTotal =
            (parseInt(inputs[0].value) || 0) +
            (parseInt(inputs[1].value) || 0) +
            (parseInt(inputs[2].value) || 0);

        // 20–08
        const nightTotal = parseInt(inputs[3].value) || 0;

        row.querySelector(".row-total-day").textContent = dayTotal;
        row.querySelector(".row-total-night").textContent = nightTotal;

        if (row.dataset.group === "ingresos") {
            ing12a += dayTotal;
            ing12b += nightTotal;
        } else {
            egr12a += dayTotal;
            egr12b += nightTotal;
        }
    });

    document.getElementById("ing-12a").textContent = ing12a;
    document.getElementById("egr-12a").textContent = egr12a;
    document.getElementById("ing-12b").textContent = ing12b;
    document.getElementById("egr-12b").textContent = egr12b;

    document.getElementById("bal-12a").textContent = ing12a - egr12a;
    document.getElementById("bal-12b").textContent = ing12b - egr12b;
    document.getElementById("bal-24").textContent =
        (ing12a + ing12b) - (egr12a + egr12b);
}

// ─────────────────────────────────────────────────────
// CARGA DINÁMICA DEL MÓDULO ELIMINACIÓN
// ─────────────────────────────────────────────────────
fetch("eliminacion.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("eliminacion-container").innerHTML = html;
    })
    .catch(error => {
        console.error("Error cargando eliminacion.html", error);
    });

// ─────────────────────────────────────────────────────
// OBTENER DATOS PARA EXPORTACIÓN TSV / TXT / SQL
//
// Estructura devuelta (preparada para columnas SQL futuras):
// {
//   ingresos: {
//     alimentacion_dia, alimentacion_noch,
//     hidratacion_dia,  hidratacion_noch,
//     suero_dia,        suero_noch,
//     transfusion_dia,  transfusion_noch,
//     tratamiento_dia,  tratamiento_noch,
//     otros_dia,        otros_noch
//   },
//   egresos: {
//     orina_dia,        orina_noch,
//     deposiciones_dia, deposiciones_noch,
//     gastrico_dia,     gastrico_noch,
//     drenaje_dia,      drenaje_noch,
//     diuresis_dia,     diuresis_noch,
//     perdidas_dia,     perdidas_noch,
//     otros_dia,        otros_noch
//   },
//   totales: {
//     ingreso_dia, ingreso_noche,
//     egreso_dia,  egreso_noche,
//     balance_dia, balance_noche, balance_24h
//   },
//   eliminacion: { orina, vomitos, deposiciones, otros }
// }
// ─────────────────────────────────────────────────────

function obtenerDatosFormulario() {
    // Nombres de concepto en el mismo orden que aparecen en el HTML
    const nombresIngresos = [
        'alimentacion', 'hidratacion', 'suero',
        'transfusion',  'tratamiento', 'otros'
    ];
    const nombresEgresos = [
        'orina', 'deposiciones', 'gastrico',
        'drenaje', 'diuresis', 'perdidas', 'otros'
    ];

    const ingresos = {};
    const egresos  = {};

    // Recorre cada fila data-group
    let idxIng = 0;
    let idxEgr = 0;

    document.querySelectorAll("tbody tr[data-group]").forEach(row => {
        const rowInputs = row.querySelectorAll("input[type='number']");
        if (rowInputs.length < 4) return;

        const dia = (parseInt(rowInputs[0].value) || 0) +
                    (parseInt(rowInputs[1].value) || 0) +
                    (parseInt(rowInputs[2].value) || 0);
        const noch = parseInt(rowInputs[3].value) || 0;

        if (row.dataset.group === "ingresos") {
            const nombre = nombresIngresos[idxIng] || `ing_${idxIng}`;
            ingresos[`${nombre}_dia`]  = dia;
            ingresos[`${nombre}_noch`] = noch;
            idxIng++;
        } else {
            const nombre = nombresEgresos[idxEgr] || `egr_${idxEgr}`;
            egresos[`${nombre}_dia`]  = dia;
            egresos[`${nombre}_noch`] = noch;
            idxEgr++;
        }
    });

    // Totales desde el DOM (ya calculados por calcularBalance)
    const ingDia   = parseInt(document.getElementById("ing-12a")?.textContent) || 0;
    const ingNoch  = parseInt(document.getElementById("ing-12b")?.textContent) || 0;
    const egrDia   = parseInt(document.getElementById("egr-12a")?.textContent) || 0;
    const egrNoch  = parseInt(document.getElementById("egr-12b")?.textContent) || 0;
    const balDia   = parseInt(document.getElementById("bal-12a")?.textContent) || 0;
    const balNoch  = parseInt(document.getElementById("bal-12b")?.textContent) || 0;
    const bal24    = parseInt(document.getElementById("bal-24")?.textContent)  || 0;

    const totales = {
        ingreso_dia:    ingDia,
        ingreso_noche:  ingNoch,
        egreso_dia:     egrDia,
        egreso_noche:   egrNoch,
        balance_dia:    balDia,
        balance_noche:  balNoch,
        balance_24h:    bal24
    };

    // Eliminación (se carga dinámicamente desde eliminacion.html)
const eliminacion = {};
eliminacion.orina        = document.getElementById('elim-orina')?.value        || '';
eliminacion.vomitos      = document.getElementById('elim-vomitos')?.value      || '';
eliminacion.deposiciones = document.getElementById('elim-deposiciones')?.value || '';
eliminacion.otros        = document.getElementById('otros')?.value             || '';

    return {
        ingresos,
        egresos,
        totales,
        eliminacion,
        timestamp: new Date().toISOString()
    };
}

// Exportar al sistema de navegación
window.obtenerDatosFormulario = obtenerDatosFormulario;
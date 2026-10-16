// ====================
// cib-export.js — VERSIÓN COMPLETA CON TODOS LOS MÓDULOS
// Depende de: cib-estado.js, cib-storage.js
// ====================

const MAPA_COLUMNAS = {

    // ─────────────────────────────────────────
    // METADATOS
    // ─────────────────────────────────────────
    'codigo':         { fuente: 'metadatos', extraer: () => `SIRCLE${codigoSecuencia.toString().padStart(4, '0')}` },
    'fecha_registro': { fuente: 'metadatos', extraer: () => new Date().toLocaleString('es-CL') },

    // ─────────────────────────────────────────
    // MÓDULO 1 — INGRESO
    // ─────────────────────────────────────────
    'nombre':              { fuente: 'ingreso', extraer: (d) => d.patientName     || d.nombre     || '' },
    'apellido':            { fuente: 'ingreso', extraer: (d) => d.patientLastname || d.apellido   || '' },
    'edad':                { fuente: 'ingreso', extraer: (d) => d.patientAge      || d.edad       || '' },
    'rut':                 { fuente: 'ingreso', extraer: (d) => d.patientRUT      || d.rut        || '' },
    'fecha_ingreso': {
        fuente: 'ingreso',
        extraer: (d) => {
            const raw = d.admissionDate || d.fecha_ingreso || '';
            return raw ? formatearFechaEspañol(separarFechaHora(raw).fecha) : '';
        }
    },
    'fecha_nacimiento': {
        fuente: 'ingreso',
        extraer: (d) => {
            const raw = d.birthDate || d.fecha_nacimiento || '';
            return raw ? formatearFechaEspañol(separarFechaHora(raw).fecha) : '';
        }
    },
    'cuenta_corriente':     { fuente: 'ingreso', extraer: (d) => d.accountNumber    || '' },
    'prevision':            { fuente: 'ingreso', extraer: (d) => d.healthInsurance   || d.prevision   || '' },
    'procedencia':          { fuente: 'ingreso', extraer: (d) => d.origin            || d.procedencia || '' },
    'acompaniamiento':      { fuente: 'ingreso', extraer: (d) => d.companionship     || 'no' },
    'familiar_responsable': { fuente: 'ingreso', extraer: (d) => d.responsibleFamily || '' },
    'parentesco':           { fuente: 'ingreso', extraer: (d) => d.parentesco        || '' },
    'telefono':             { fuente: 'ingreso', extraer: (d) => d.contactPhone      || d.telefono    || '' },
    'diagnostico':          { fuente: 'ingreso', extraer: (d) => d.admissionDiagnosis || d.diagnostico || '' },
    'diagnostico_otro':     { fuente: 'ingreso', extraer: (d) => d.diagnosisOther    || '' },
    'antecedentes':         { fuente: 'ingreso', extraer: (d) => d.morbidHistory     || d.antecedentes || '' },
    'antecedentes_otro':    { fuente: 'ingreso', extraer: (d) => d.morbidOther       || '' },
    'tiene_alergias':       { fuente: 'ingreso', extraer: (d) => d.allergies         || 'no' },
    'alergias_lista':       { fuente: 'ingreso', extraer: (d) => d.allergiesList     || '' },
    'alergias_otro':        { fuente: 'ingreso', extraer: (d) => d.allergiesOther    || '' },
    'no_puncionar':         { fuente: 'ingreso', extraer: (d) => d['no-puncture']    || d.noPuncture  || '' },
    'no_presion_arterial':  { fuente: 'ingreso', extraer: (d) => d['no-bp']          || d.noBloodPressure || '' },
    'extremidad_pa':        { fuente: 'ingreso', extraer: (d) => d.bpExtremidad      || '' },
    'fav':                  { fuente: 'ingreso', extraer: (d) => d.fav               || '' },
    'dias_dialisis':        { fuente: 'ingreso', extraer: (d) => d.dialysisDays      || '' },
    'centro_dialisis':      { fuente: 'ingreso', extraer: (d) => d.dialysisCenter    || '' },

    // ─────────────────────────────────────────
    // MÓDULO 2 — IAAS
    // name reales del HTML: triage-category, requires-precautions,
    // transmission-agent, precaution-days  (con guión, no camelCase)
    // ─────────────────────────────────────────
    'triage':                { fuente: 'iaas', extraer: (d) => d['triage-category']      || d.triage              || '' },
    'requiere_precauciones': { fuente: 'iaas', extraer: (d) => d['requires-precautions'] || d.requiresPrecautions  || 'no' },
    'precauciones':          { fuente: 'iaas', extraer: (d) => d.precautions             || '' },
    'agente_transmision':    { fuente: 'iaas', extraer: (d) => d['transmission-agent']   || d.transmissionAgent   || '' },
    'dias_precaucion':       { fuente: 'iaas', extraer: (d) => d['precaution-days']      || d.precautionDays      || '' },

    // ─────────────────────────────────────────
    // MÓDULO 3 — ELEMENTOS INVASIVOS
    // obtenerDatosFormulario() devuelve { bloques:[{elementosInstalados:[...]}] }
    // ─────────────────────────────────────────
    'ei_fecha_dia': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b => b.fechaHora || '').filter(Boolean).join(' | ')
    },
    'ei_elementos': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.elementosInstalados || []).map(e => e.elemento || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ei_dias': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.elementosInstalados || []).map(e => e.dias || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ei_calibre': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.elementosInstalados || []).map(e => e.calibre || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ei_ubicacion': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.elementosInstalados || []).map(e => e.ubicacion || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ei_codigo': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.elementosInstalados || []).map(e => e.codigo || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ei_responsable': {
        fuente: 'elementos',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.elementosInstalados || []).map(e => e.responsable || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },

    // ─────────────────────────────────────────
    // MÓDULO 4 — INDICACIONES MÉDICAS
    // obtenerDatosFormulario() devuelve { bloques:[{regimenes, reposos, medicamentos, kinesioterapia}] }
    // ─────────────────────────────────────────
    'ind_regimen': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.regimenes || []).map(r => r.tipo || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_reposo': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.reposos || []).map(r => r.tipo || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_medicamentos': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.medicamentos || []).map(m => m.nombre || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_dosis': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.medicamentos || []).map(m => `${m.dosis || ''}${m.unidad ? ' '+m.unidad : ''}`).filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_via': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.medicamentos || []).map(m => m.via || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_frecuencia': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.medicamentos || []).map(m => m.frecuencia || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_hora_inicio_med': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.medicamentos || []).map(m => m.horaInicio || '').filter(Boolean).join(', ')
        ).filter(Boolean).join(' | ')
    },
    'ind_kinesioterapia': {
        fuente: 'indicaciones',
        extraer: (d) => (d.bloques || []).map(b =>
            (b.kinesioterapia || []).join(', ')
        ).filter(Boolean).join(' | ')
    },

    // ─────────────────────────────────────────
    // MÓDULO 5 — EXÁMENES
    // obtenerDatosFormulario() devuelve { laboratorio, imagenologia, interconsultas, controlesSeriados }
    // ─────────────────────────────────────────
    'ex_lab_examenes': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.laboratorio)
            ? d.laboratorio.map(e => e.examen || '').filter(Boolean).join('; ') : ''
    },
    'ex_lab_codigos': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.laboratorio)
            ? d.laboratorio.map(e => e.codigo || '').filter(Boolean).join('; ') : ''
    },
    'ex_lab_fechas': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.laboratorio)
            ? d.laboratorio.map(e => e.fecha ? formatearFechaEspañol(separarFechaHora(e.fecha).fecha) : '').filter(Boolean).join('; ') : ''
    },
    'ex_lab_horas': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.laboratorio)
            ? d.laboratorio.map(e => e.fecha ? separarFechaHora(e.fecha).hora : '').filter(Boolean).join('; ') : ''
    },
    'ex_img_examenes': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.imagenologia)
            ? d.imagenologia.map(e => e.examen || '').filter(Boolean).join('; ') : ''
    },
    'ex_img_fechas': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.imagenologia)
            ? d.imagenologia.map(e => e.fecha ? formatearFechaEspañol(separarFechaHora(e.fecha).fecha) : '').filter(Boolean).join('; ') : ''
    },
    'ex_img_horas': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.imagenologia)
            ? d.imagenologia.map(e => e.fecha ? separarFechaHora(e.fecha).hora : '').filter(Boolean).join('; ') : ''
    },
    'ex_interconsultas': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.interconsultas)
            ? d.interconsultas.map(i => i.tipo || '').filter(Boolean).join('; ') : ''
    },
    'ex_controles_tipo': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.controlesSeriados)
            ? d.controlesSeriados.map(c => c.tipo || '').filter(Boolean).join('; ') : ''
    },
    'ex_controles_valor': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.controlesSeriados)
            ? d.controlesSeriados.map(c => `${c.valor || ''} ${c.unidad || ''}`.trim()).filter(Boolean).join('; ') : ''
    },
    'ex_controles_fecha': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.controlesSeriados)
            ? d.controlesSeriados.map(c => c.fecha ? formatearFechaEspañol(c.fecha) : '').filter(Boolean).join('; ') : ''
    },
    'ex_controles_hora': {
        fuente: 'examenes',
        extraer: (d) => Array.isArray(d.controlesSeriados)
            ? d.controlesSeriados.map(c => c.hora || '').filter(Boolean).join('; ') : ''
    },

    // ─────────────────────────────────────────
    // MÓDULO 6 — CONTROL DE SIGNOS VITALES
    // obtenerDatosFormulario() en control-signos.js (ver nota abajo)
    // devuelve { mediciones: [{fecha, hora, fc, fr, temperatura, sato2, fio2,
    //   pas, pad, pam, llene_capilar, glasgow, dolor, ubicacion_dolor,
    //   diuresis, bic_farmaco, bic_flujo, bic_dilucion}] }
    // ─────────────────────────────────────────
    'csv_fechas': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.fecha || '').filter(Boolean).join('; ')
    },
    'csv_horas': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.hora || '').filter(Boolean).join('; ')
    },
    'csv_fc': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.fc || '').filter(Boolean).join('; ')
    },
    'csv_fr': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.fr || '').filter(Boolean).join('; ')
    },
    'csv_temperatura': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.temperatura || '').filter(Boolean).join('; ')
    },
    'csv_sato2': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.sato2 || '').filter(Boolean).join('; ')
    },
    'csv_fio2': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.fio2 || '').filter(Boolean).join('; ')
    },
    'csv_pas': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.pas || '').filter(Boolean).join('; ')
    },
    'csv_pad': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.pad || '').filter(Boolean).join('; ')
    },
    'csv_pam': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.pam || '').filter(Boolean).join('; ')
    },
    'csv_llene_capilar': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.llene_capilar || '').filter(Boolean).join('; ')
    },
    'csv_glasgow': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.glasgow_total || '').filter(Boolean).join('; ')
    },
    'csv_dolor_ena': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.dolor_intensidad || '').filter(Boolean).join('; ')
    },
    'csv_ubicacion_dolor': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.ubicacion || '').filter(Boolean).join('; ')
    },
    'csv_diuresis': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.diuresis || '').filter(Boolean).join('; ')
    },
    'csv_bic_farmaco': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.bic_farmaco || '').filter(Boolean).join('; ')
    },
    'csv_bic_flujo': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.bic_flujo || '').filter(Boolean).join('; ')
    },
    'csv_bic_dilucion': {
        fuente: 'control-signos',
        extraer: (d) => (d.mediciones || []).map(m => m.bic_dilucion || '').filter(Boolean).join('; ')
    },

    // ─────────────────────────────────────────
    // MÓDULO 7 — BALANCE HÍDRICO
    // obtenerDatosFormulario() en balance.js devuelve:
    // { ingresos:{alimentacion, hidratacion, suero, transfusion, tratamiento, otros},
    //   egresos:{orina, deposiciones, contenido_gastrico, drenaje, diuresis_horaria,
    //            perdidas_insensibles, otros},
    //   totales:{ingreso_dia, ingreso_noche, egreso_dia, egreso_noche,
    //            balance_dia, balance_noche, balance_24h},
    //   eliminacion:{orina, vomitos, deposiciones, otros} }
    // ─────────────────────────────────────────
    'bh_ing_alimentacion_dia':  { fuente: 'balance', extraer: (d) => d.ingresos?.alimentacion_dia  || '' },
    'bh_ing_alimentacion_noch': { fuente: 'balance', extraer: (d) => d.ingresos?.alimentacion_noch || '' },
    'bh_ing_hidratacion_dia':   { fuente: 'balance', extraer: (d) => d.ingresos?.hidratacion_dia   || '' },
    'bh_ing_hidratacion_noch':  { fuente: 'balance', extraer: (d) => d.ingresos?.hidratacion_noch  || '' },
    'bh_ing_suero_dia':         { fuente: 'balance', extraer: (d) => d.ingresos?.suero_dia         || '' },
    'bh_ing_suero_noch':        { fuente: 'balance', extraer: (d) => d.ingresos?.suero_noch        || '' },
    'bh_ing_transfusion_dia':   { fuente: 'balance', extraer: (d) => d.ingresos?.transfusion_dia   || '' },
    'bh_ing_transfusion_noch':  { fuente: 'balance', extraer: (d) => d.ingresos?.transfusion_noch  || '' },
    'bh_ing_tratamiento_dia':   { fuente: 'balance', extraer: (d) => d.ingresos?.tratamiento_dia   || '' },
    'bh_ing_tratamiento_noch':  { fuente: 'balance', extraer: (d) => d.ingresos?.tratamiento_noch  || '' },
    'bh_ing_otros_dia':         { fuente: 'balance', extraer: (d) => d.ingresos?.otros_dia         || '' },
    'bh_ing_otros_noch':        { fuente: 'balance', extraer: (d) => d.ingresos?.otros_noch        || '' },
    'bh_egr_orina_dia':         { fuente: 'balance', extraer: (d) => d.egresos?.orina_dia          || '' },
    'bh_egr_orina_noch':        { fuente: 'balance', extraer: (d) => d.egresos?.orina_noch         || '' },
    'bh_egr_deposiciones_dia':  { fuente: 'balance', extraer: (d) => d.egresos?.deposiciones_dia   || '' },
    'bh_egr_deposiciones_noch': { fuente: 'balance', extraer: (d) => d.egresos?.deposiciones_noch  || '' },
    'bh_egr_gastrico_dia':      { fuente: 'balance', extraer: (d) => d.egresos?.gastrico_dia       || '' },
    'bh_egr_gastrico_noch':     { fuente: 'balance', extraer: (d) => d.egresos?.gastrico_noch      || '' },
    'bh_egr_drenaje_dia':       { fuente: 'balance', extraer: (d) => d.egresos?.drenaje_dia        || '' },
    'bh_egr_drenaje_noch':      { fuente: 'balance', extraer: (d) => d.egresos?.drenaje_noch       || '' },
    'bh_egr_diuresis_dia':      { fuente: 'balance', extraer: (d) => d.egresos?.diuresis_dia       || '' },
    'bh_egr_diuresis_noch':     { fuente: 'balance', extraer: (d) => d.egresos?.diuresis_noch      || '' },
    'bh_egr_perdidas_dia':      { fuente: 'balance', extraer: (d) => d.egresos?.perdidas_dia       || '' },
    'bh_egr_perdidas_noch':     { fuente: 'balance', extraer: (d) => d.egresos?.perdidas_noch      || '' },
    'bh_egr_otros_dia':         { fuente: 'balance', extraer: (d) => d.egresos?.otros_dia          || '' },
    'bh_egr_otros_noch':        { fuente: 'balance', extraer: (d) => d.egresos?.otros_noch         || '' },
    'bh_total_ingreso_dia':     { fuente: 'balance', extraer: (d) => d.totales?.ingreso_dia        || '' },
    'bh_total_ingreso_noche':   { fuente: 'balance', extraer: (d) => d.totales?.ingreso_noche      || '' },
    'bh_total_egreso_dia':      { fuente: 'balance', extraer: (d) => d.totales?.egreso_dia         || '' },
    'bh_total_egreso_noche':    { fuente: 'balance', extraer: (d) => d.totales?.egreso_noche       || '' },
    'bh_balance_12h_dia':       { fuente: 'balance', extraer: (d) => d.totales?.balance_dia        || '' },
    'bh_balance_12h_noche':     { fuente: 'balance', extraer: (d) => d.totales?.balance_noche      || '' },
    'bh_balance_24h':           { fuente: 'balance', extraer: (d) => d.totales?.balance_24h        || '' },
    'bh_elim_orina':            { fuente: 'balance', extraer: (d) => d.eliminacion?.orina          || '' },
    'bh_elim_vomitos':          { fuente: 'balance', extraer: (d) => d.eliminacion?.vomitos        || '' },
    'bh_elim_deposiciones':     { fuente: 'balance', extraer: (d) => d.eliminacion?.deposiciones   || '' },
    'bh_elim_otros':            { fuente: 'balance', extraer: (d) => d.eliminacion?.otros          || '' },

    // ─────────────────────────────────────────
    // MÓDULO 8 — EXAMEN FÍSICO
    // obtenerDatosFormulario() en examen_fisico.js devuelve
    // { bloques:[{ numero, fechaHora, campos:{...todos los name del HTML} }] }
    // Los bloques extra (días adicionales) se unen con " | "
    // Los inputs visibles de autocomplete (_input) se ignoran; solo se usa el hidden
    // ─────────────────────────────────────────
    'ef_fecha_dia': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.fechaHora || '').filter(Boolean).join(' | ')
    },
    'ef_hora_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.hora_largo || '').filter(Boolean).join(' | ')
    },
    'ef_hora_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.hora_noche || '').filter(Boolean).join(' | ')
    },
    'ef_responsable_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.responsable_largo || '').filter(Boolean).join(' | ')
    },
    'ef_responsable_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.responsable_noche || '').filter(Boolean).join(' | ')
    },
    'ef_cabeza_cuello_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.cabeza_cuello_largo || '').filter(Boolean).join(' | ')
    },
    'ef_cabeza_cuello_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.cabeza_cuello_noche || '').filter(Boolean).join(' | ')
    },
    'ef_torax_abdomen_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.torax_abdomen_largo || '').filter(Boolean).join(' | ')
    },
    'ef_torax_abdomen_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.torax_abdomen_noche || '').filter(Boolean).join(' | ')
    },
    'ef_espalda_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.espalda_largo || '').filter(Boolean).join(' | ')
    },
    'ef_espalda_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.espalda_noche || '').filter(Boolean).join(' | ')
    },
    'ef_ext_sup_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.ext_sup_largo || '').filter(Boolean).join(' | ')
    },
    'ef_ext_sup_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.ext_sup_noche || '').filter(Boolean).join(' | ')
    },
    'ef_ext_inf_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.ext_inf_largo || '').filter(Boolean).join(' | ')
    },
    'ef_ext_inf_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.ext_inf_noche || '').filter(Boolean).join(' | ')
    },
    'ef_genitales_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.genitales_largo || '').filter(Boolean).join(' | ')
    },
    'ef_genitales_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.genitales_noche || '').filter(Boolean).join(' | ')
    },
    'ef_sist_linfatico_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.sistema_linfatico_largo || '').filter(Boolean).join(' | ')
    },
    'ef_sist_linfatico_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.sistema_linfatico_noche || '').filter(Boolean).join(' | ')
    },
    'ef_coloracion_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.coloracion_largo || '').filter(Boolean).join(' | ')
    },
    'ef_coloracion_otro_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.coloracion_otros_largo || '').filter(Boolean).join(' | ')
    },
    'ef_coloracion_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.coloracion_noche || '').filter(Boolean).join(' | ')
    },
    'ef_coloracion_otro_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.coloracion_otros_noche || '').filter(Boolean).join(' | ')
    },
    'ef_temperatura_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.temperatura_largo || '').filter(Boolean).join(' | ')
    },
    'ef_temperatura_otro_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.temperatura_otros_largo || '').filter(Boolean).join(' | ')
    },
    'ef_temperatura_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.temperatura_noche || '').filter(Boolean).join(' | ')
    },
    'ef_temperatura_otro_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.temperatura_otros_noche || '').filter(Boolean).join(' | ')
    },
    'ef_pulsos_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.pulsos_largo || '').filter(Boolean).join(' | ')
    },
    'ef_pulsos_ubicacion_largo': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.pulsos_ubicacion_largo || '').filter(Boolean).join(' | ')
    },
    'ef_pulsos_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.pulsos_noche || '').filter(Boolean).join(' | ')
    },
    'ef_pulsos_ubicacion_noche': {
        fuente: 'examen-fisico',
        extraer: (d) => (d.bloques || []).map(b => b.campos?.pulsos_ubicacion_noche || '').filter(Boolean).join(' | ')
    },

    // ─────────────────────────────────────────
    // MÓDULO 9 — PLAN DE ENFERMERÍA
    // name="plan_enfermeria" (hidden con valores separados por coma)
    // name="plan_enfermeria_otros" (textarea)
    // ─────────────────────────────────────────
    'plan_enfermeria':      { fuente: 'plan-enfermeria', extraer: (d) => d.plan_enfermeria       || '' },
    'plan_enfermeria_otros':{ fuente: 'plan-enfermeria', extraer: (d) => d.plan_enfermeria_otros  || '' },

    // ─────────────────────────────────────────
    // MÓDULO 10 — ATENCIÓN DE ENFERMERÍA
    // obtenerDatosFormulario() en atencion.js devuelve campos del HTML
    // + datos_lpp con las valoraciones LPP
    // ─────────────────────────────────────────
    'at_csv_horario':          { fuente: 'atencion-1', extraer: (d) => d.csv_horario          || '' },
    'at_monitoreo_continuo':   { fuente: 'atencion-1', extraer: (d) => d.monitoreo_continuo   || '' },
    'at_cama_camilla':         { fuente: 'atencion-1', extraer: (d) => d.cama_camilla         || '' },
    'at_posicion':             { fuente: 'atencion-1', extraer: (d) => d.posicion_camilla     || '' },
    'at_fio2':                 { fuente: 'atencion-1', extraer: (d) => d.fio2                 || '' },
    'at_tipo_dispositivo':     { fuente: 'atencion-1', extraer: (d) => d.tipo_dispositivo     || '' },
    'at_proteccion_piel_o2':   { fuente: 'atencion-1', extraer: (d) => d.proteccion_piel_o2   || '' },
    'at_aspiracion_sec':       { fuente: 'atencion-1', extraer: (d) => d.aspiracion_secreciones || '' },
    'at_agua_humidificador':   { fuente: 'atencion-1', extraer: (d) => d.agua_humidificador   || '' },
    'at_rotacion_dispositivo': { fuente: 'atencion-1', extraer: (d) => d.rotacion_dispositivo || '' },
    'at_proteccion_piel_aseo': { fuente: 'atencion-1', extraer: (d) => d.proteccion_piel_aseo || '' },
    'at_cnaf':                 { fuente: 'atencion-1', extraer: (d) => d.resp_cnaf            || '' },
    'at_vmni':                 { fuente: 'atencion-1', extraer: (d) => d.resp_vmni            || '' },
    'at_vmi':                  { fuente: 'atencion-1', extraer: (d) => d.resp_vmi             || '' },
    // LPP — valoraciones (puede haber más de una)
    'at_lpp_puntaje_braden_largo': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.puntajeBradenLargo ?? '').join('; ')
    },
    'at_lpp_riesgo_largo': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.riesgoLargo || '').filter(Boolean).join('; ')
    },
    'at_lpp_puntaje_braden_noche': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.puntajeBradenNoche ?? '').join('; ')
    },
    'at_lpp_riesgo_noche': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.riesgoNoche || '').filter(Boolean).join('; ')
    },
    'at_lpp_presencia_upp_largo': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.uppLargo || '').filter(Boolean).join('; ')
    },
    'at_lpp_presencia_upp_noche': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.uppNoche || '').filter(Boolean).join('; ')
    },
    'at_lpp_ubicaciones_largo': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v =>
            (v.ubicacionesLargo || []).map(u => u.nombre || '').filter(Boolean).join(', ')
        ).filter(Boolean).join('; ')
    },
    'at_lpp_ubicaciones_noche': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v =>
            (v.ubicacionesNoche || []).map(u => u.nombre || '').filter(Boolean).join(', ')
        ).filter(Boolean).join('; ')
    },
    'at_lpp_responsable': {
        fuente: 'atencion-1',
        extraer: (d) => (d.datos_lpp || []).map(v => v.responsable || '').filter(Boolean).join('; ')
    },

    // ─────────────────────────────────────────
    // MÓDULO 11 — PREVENCIÓN IAAS
    // obtenerDatosFormulario() en prec.js devuelve los datos de flebitis, NAVM e ITU
    // ─────────────────────────────────────────
    'prec_fleb_fijacion':   { fuente: 'prec-iaas', extraer: (d) => d.flebitis?.fijacion   !== undefined ? (d.flebitis.fijacion   ? 'sí' : 'no') : '' },
    'prec_fleb_vencimiento':{ fuente: 'prec-iaas', extraer: (d) => d.flebitis?.vencimiento !== undefined ? (d.flebitis.vencimiento ? 'sí' : 'no') : '' },
    'prec_fleb_grado':      { fuente: 'prec-iaas', extraer: (d) => d.flebitis?.grado       || '' },
    'prec_fleb_obs':        { fuente: 'prec-iaas', extraer: (d) => d.flebitis?.obs         || '' },
    'prec_navm_posicion':   { fuente: 'prec-iaas', extraer: (d) => d.navm?.posicion        !== undefined ? (d.navm.posicion   ? 'sí' : 'no') : '' },
    'prec_navm_cuff':       { fuente: 'prec-iaas', extraer: (d) => d.navm?.cuff            || '' },
    'prec_navm_aspiracion': { fuente: 'prec-iaas', extraer: (d) => d.navm?.aspiracion      || '' },
    'prec_navm_bucal':      { fuente: 'prec-iaas', extraer: (d) => d.navm?.bucal           || '' },
    'prec_navm_manos':      { fuente: 'prec-iaas', extraer: (d) => d.navm?.manos           || '' },
    'prec_navm_clorhex':    { fuente: 'prec-iaas', extraer: (d) => d.navm?.clorhex         || '' },
    'prec_navm_obs':        { fuente: 'prec-iaas', extraer: (d) => d.navm?.obs             || '' },
    'prec_itu_aseo':        { fuente: 'prec-iaas', extraer: (d) => d.itu?.aseo             || '' },
    'prec_itu_fijacion':    { fuente: 'prec-iaas', extraer: (d) => d.itu?.fijacion         !== undefined ? (d.itu.fijacion ? 'sí' : 'no') : '' },
    'prec_itu_obs':         { fuente: 'prec-iaas', extraer: (d) => d.itu?.obs              || '' },

    // ─────────────────────────────────────────
    // MÓDULO 12 — EVOLUCIÓN
    // obtenerDatosFormulario() en evolucion.js devuelve:
    // { tecnico_largo:[{hora, observacion, responsable}],
    //   tecnico_noche:[{...}],
    //   enfermera_largo:[{...}],
    //   enfermera_noche:[{...}] }
    // ─────────────────────────────────────────
    'ev_tec_largo_horas': {
        fuente: 'evolucion',
        extraer: (d) => (d.tecnico_largo || []).map(r => r.hora || '').filter(Boolean).join('; ')
    },
    'ev_tec_largo_obs': {
        fuente: 'evolucion',
        extraer: (d) => (d.tecnico_largo || []).map(r => r.observacion || '').filter(Boolean).join(' / ')
    },
    'ev_tec_largo_responsable': {
        fuente: 'evolucion',
        extraer: (d) => (d.tecnico_largo || []).map(r => r.responsable || '').filter(Boolean).join('; ')
    },
    'ev_tec_noche_horas': {
        fuente: 'evolucion',
        extraer: (d) => (d.tecnico_noche || []).map(r => r.hora || '').filter(Boolean).join('; ')
    },
    'ev_tec_noche_obs': {
        fuente: 'evolucion',
        extraer: (d) => (d.tecnico_noche || []).map(r => r.observacion || '').filter(Boolean).join(' / ')
    },
    'ev_tec_noche_responsable': {
        fuente: 'evolucion',
        extraer: (d) => (d.tecnico_noche || []).map(r => r.responsable || '').filter(Boolean).join('; ')
    },
    'ev_enf_largo_horas': {
        fuente: 'evolucion',
        extraer: (d) => (d.enfermera_largo || []).map(r => r.hora || '').filter(Boolean).join('; ')
    },
    'ev_enf_largo_obs': {
        fuente: 'evolucion',
        extraer: (d) => (d.enfermera_largo || []).map(r => r.observacion || '').filter(Boolean).join(' / ')
    },
    'ev_enf_largo_responsable': {
        fuente: 'evolucion',
        extraer: (d) => (d.enfermera_largo || []).map(r => r.responsable || '').filter(Boolean).join('; ')
    },
    'ev_enf_noche_horas': {
        fuente: 'evolucion',
        extraer: (d) => (d.enfermera_noche || []).map(r => r.hora || '').filter(Boolean).join('; ')
    },
    'ev_enf_noche_obs': {
        fuente: 'evolucion',
        extraer: (d) => (d.enfermera_noche || []).map(r => r.observacion || '').filter(Boolean).join(' / ')
    },
    'ev_enf_noche_responsable': {
        fuente: 'evolucion',
        extraer: (d) => (d.enfermera_noche || []).map(r => r.responsable || '').filter(Boolean).join('; ')
    },

    // ─────────────────────────────────────────
    // MÓDULO 13 — INDICADORES HHHA
    // obtenerDatosFormulario() en hhha.js devuelve los campos del formulario
    // ─────────────────────────────────────────
    'hhha_hoja_ingreso_medico':    { fuente: 'hhha', extraer: (d) => d.hoja_ingreso_medico    !== undefined ? (d.hoja_ingreso_medico    ? 'sí' : 'no') : '' },
    'hhha_ingreso_estadistico':    { fuente: 'hhha', extraer: (d) => d.ingreso_estadistico     !== undefined ? (d.ingreso_estadistico     ? 'sí' : 'no') : '' },
    'hhha_hoja_dau':               { fuente: 'hhha', extraer: (d) => d.hoja_dau               !== undefined ? (d.hoja_dau               ? 'sí' : 'no') : '' },
    'hhha_docs_externos':          { fuente: 'hhha', extraer: (d) => d.docs_externos           !== undefined ? (d.docs_externos           ? 'sí' : 'no') : '' },
    'hhha_hoja_evolucion':         { fuente: 'hhha', extraer: (d) => d.hoja_evolucion          !== undefined ? (d.hoja_evolucion          ? 'sí' : 'no') : '' },
    'hhha_examenes':               { fuente: 'hhha', extraer: (d) => d.examenes_ficha          !== undefined ? (d.examenes_ficha          ? 'sí' : 'no') : '' },
    'hhha_protocolo_pertenencias': { fuente: 'hhha', extraer: (d) => d.protocolo_pertenencias !== undefined ? (d.protocolo_pertenencias  ? 'sí' : 'no') : '' },
    'hhha_hoja_enfermeria':        { fuente: 'hhha', extraer: (d) => d.hoja_enfermeria         !== undefined ? (d.hoja_enfermeria         ? 'sí' : 'no') : '' },
    'hhha_brazalete':              { fuente: 'hhha', extraer: (d) => d.brazalete               || '' },
    'hhha_ubicacion_brazalete':    { fuente: 'hhha', extraer: (d) => d.ubicacion_brazalete     || '' },
    'hhha_pizarra':                { fuente: 'hhha', extraer: (d) => d.pizarra                 || '' },
    'hhha_obs_identificacion':     { fuente: 'hhha', extraer: (d) => d.obs_identificacion      || '' },
    'hhha_pertenencias':           { fuente: 'hhha', extraer: (d) => d.pertenencias            || '' },
    'hhha_obs_pertenencias':       { fuente: 'hhha', extraer: (d) => d.obs_pertenencias        || '' },
    'hhha_responsable_nombre':     { fuente: 'hhha', extraer: (d) => d.responsable_nombre      || '' },
    'hhha_responsable_usuario':    { fuente: 'hhha', extraer: (d) => d.responsable_usuario     || '' },
};

// ─────────────────────────────────────────────────────
// GENERACIÓN TSV
// ─────────────────────────────────────────────────────

function limpiarParaTSV(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/"/g, '""').trim();
}

function obtenerEncabezadosTSV() { return Object.keys(MAPA_COLUMNAS).join('\t'); }

function generarFilaTSV() {
    return Object.values(MAPA_COLUMNAS).map(col => {
        let val = col.fuente === 'metadatos' ? col.extraer() : col.extraer(datosCompletos[col.fuente] || {});
        return limpiarParaTSV(val);
    }).join('\t');
}

// ─────────────────────────────────────────────────────
// ACCIONES DE EXPORTACIÓN
// ─────────────────────────────────────────────────────

async function almacenarTSV(desdeModal = false) {
    if (!desdeModal) { mostrarVistaPrevia('almacenar'); return; }
    const conDatos = Object.keys(datosCompletos).filter(id => Object.keys(datosCompletos[id] || {}).length > 0).length;
    if (conDatos === 0) { alert('No hay datos para almacenar. Complete al menos un módulo.'); cerrarModal(); return; }
    try {
        await enviarAPython(generarFilaTSV());
        tsvData.push(generarFilaTSV());
        codigoSecuencia++;
        mostrarNotificacion(`✅ Datos almacenados (Código: SIRCLE${(codigoSecuencia - 1).toString().padStart(4, '0')})`, 'success');
        cerrarModal();
    } catch (error) {
        mostrarNotificacion('❌ Error al almacenar datos', 'error');
    }
}

function descargarTSV(desdeModal = false) {
    if (!desdeModal) { mostrarVistaPrevia('descargar_tsv'); return; }
    if (tsvData.length === 0) { mostrarNotificacion('No hay datos almacenados para descargar.', 'warning'); cerrarModal(); return; }
    const contenido = [obtenerEncabezadosTSV(), ...tsvData].join('\n');
    descargarArchivo(contenido, `cib_database_${new Date().toISOString().split('T')[0].replace(/-/g,'')}.tsv`, 'text/tab-separated-values');
    mostrarNotificacion(`📊 TSV descargado (${tsvData.length} ingresos)`, 'success');
    cerrarModal();
}

function descargarTXT(desdeModal = false) {
    if (!desdeModal) { mostrarVistaPrevia('descargar_txt'); return; }
    descargarArchivo(generarContenidoTXT(), `hoja_enfermeria_${Date.now()}.txt`, 'text/plain');
    mostrarNotificacion('📄 Archivo TXT descargado', 'success');
    cerrarModal();
}

function descargarArchivo(contenido, nombre, tipo = 'text/plain') {
    const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────
// GENERACIÓN TXT
// ─────────────────────────────────────────────────────

function generarContenidoTXT() {
    let txt = 'HOJA DE ENFERMERÍA DIGITAL\n========================================\n';
    txt += `Fecha: ${new Date().toLocaleString('es-CL')}\n`;
    txt += `Código: SIRCLE${codigoSecuencia.toString().padStart(3, '0')}\n`;
    txt += '========================================\n';

    MODULES.forEach((module, index) => {
        const datos = datosCompletos[module.id] || {};
        txt += `\n${'='.repeat(60)}\nMÓDULO ${index + 1}: ${module.name.toUpperCase()}\n${'='.repeat(60)}\n\n`;
        if (Object.keys(datos).length === 0) { txt += 'Sin datos registrados\n'; return; }
        switch (module.id) {
            case 'ingreso':       txt += _txtIngreso(datos);       break;
            case 'iaas':          txt += _txtIAAS(datos);          break;
            case 'elementos':     txt += _txtElementos(datos);     break;
            case 'indicaciones':  txt += _txtIndicaciones(datos);  break;
            case 'examenes':      txt += _txtExamenes(datos);      break;
            case 'control-signos':txt += _txtControlSignos(datos); break;
            case 'balance':       txt += _txtBalance(datos);       break;
            case 'examen-fisico': txt += _txtExamenFisico(datos);  break;
            case 'plan-enfermeria': txt += _txtPlanEnfermeria(datos); break;
            case 'atencion-1':    txt += _txtAtencion(datos);      break;
            case 'prec-iaas':     txt += _txtPrecIAAS(datos);      break;
            case 'evolucion':     txt += _txtEvolucion(datos);     break;
            case 'hhha':          txt += _txtHHHA(datos);          break;
            default:
                Object.entries(datos).forEach(([k,v]) => { if (v && typeof v === 'string' && v.trim()) txt += `${k}: ${v}\n`; });
        }
    });
    return txt;
}

// — Formateo por módulo ——————————————————————

function _txtIngreso(d) {
    let t = 'DATOS DEL PACIENTE:\n===================\n';
    const fi = (d.admissionDate||d.fecha_ingreso) ? formatearFechaEspañol(separarFechaHora(d.admissionDate||d.fecha_ingreso).fecha) : '';
    const fn = (d.birthDate||d.fecha_nacimiento)  ? formatearFechaEspañol(separarFechaHora(d.birthDate||d.fecha_nacimiento).fecha)  : '';
    [
        ['Nombre',            d.patientName      || d.nombre],
        ['Apellido',          d.patientLastname  || d.apellido],
        ['Edad',              d.patientAge       || d.edad],
        ['RUT',               d.patientRUT       || d.rut],
        ['Fecha ingreso',     fi],
        ['Fecha nacimiento',  fn],
        ['Cta. corriente',    d.accountNumber],
        ['Previsión',         d.healthInsurance  || d.prevision],
        ['Procedencia',       d.origin           || d.procedencia],
        ['Teléfono',          d.contactPhone     || d.telefono],
        ['Diagnóstico',       d.admissionDiagnosis || d.diagnostico],
        ['Especif. diagnóst', d.diagnosisOther],
        ['Antecedentes',      d.morbidHistory    || d.antecedentes],
        ['Alergias',          d.allergiesList    || d.alergias],
        ['No puncionar',      d['no-puncture']   || d.noPuncture],
        ['No tomar PA',       d['no-bp']         || d.noBloodPressure],
        ['Extremidad PA',     d.bpExtremidad],
        ['FAV',               d.fav],
        ['Días diálisis',     d.dialysisDays     || d.dias_dialisis],
        ['Centro diálisis',   d.dialysisCenter   || d.centro_dialisis],
    ].forEach(([l,v]) => { if (v) t += `${l}:\t${v}\n`; });
    return t;
}

function _txtIAAS(d) {
    let t = 'CATEGORIZACIÓN Y PRECAUCIONES:\n===============================\n';
    const triage = d['triage-category'] || d.triage;
    if (triage) t += `Triage:\t${triage}\n`;
    const req = d['requires-precautions'] || d.requiresPrecautions;
    if (req === 'si') {
        t += '\nPRECAUCIONES:\n';
        if (d.precautions) t += `Tipo:\t${d.precautions}\n`;
        const agente = d['transmission-agent'] || d.transmissionAgent;
        if (agente) t += `Agente:\t${agente}\n`;
        const dias = d['precaution-days'] || d.precautionDays;
        if (dias) t += `Días:\t${dias}\n`;
    } else { t += 'Precauciones:\tNo requiere\n'; }
    return t;
}

function _txtElementos(d) {
    let t = 'ELEMENTOS INVASIVOS:\n====================\n';
    (d.bloques || []).forEach((b, i) => {
        t += `\nDÍA ${i+1}: ${b.fechaHora || ''}\n`;
        if (b.elementosInstalados?.length) {
            t += 'Elemento\tDías\tCalibre\tUbicación\tCódigo\tResponsable\n';
            b.elementosInstalados.forEach(e => {
                t += `${e.elemento}\t${e.dias}\t${e.calibre}\t${e.ubicacion}\t${e.codigo}\t${e.responsable}\n`;
            });
        } else { t += 'Sin elementos instalados\n'; }
    });
    return t;
}

function _txtIndicaciones(d) {
    let t = 'INDICACIONES MÉDICAS:\n=====================\n';
    (d.bloques || []).forEach((b, i) => {
        t += `\nDÍA ${i+1}: ${b.fechaHora || ''}\n`;
        if (b.regimenes?.length)    t += `Régimen:\t${b.regimenes.map(r=>r.tipo).join('; ')}\n`;
        if (b.reposos?.length)      t += `Reposo:\t${b.reposos.map(r=>r.tipo).join('; ')}\n`;
        if (b.kinesioterapia?.length) t += `Kinesioterapia:\t${b.kinesioterapia.join('; ')}\n`;
        if (b.medicamentos?.length) {
            t += 'Medicamentos:\n';
            b.medicamentos.forEach((m,j) => {
                t += `  ${j+1}. ${m.nombre} — ${m.dosis}${m.unidad?' '+m.unidad:''} — ${m.via} — ${m.frecuencia} — Inicio: ${m.horaInicio}\n`;
            });
        }
    });
    return t;
}

function _txtExamenes(d) {
    let t = 'EXÁMENES E INTERCONSULTAS:\n===========================\n\n';
    if (d.laboratorio?.length) {
        t += 'LABORATORIO\nExamen\tCódigo\tFecha\tHora\n';
        d.laboratorio.forEach(e => {
            const {fecha,hora} = separarFechaHora(e.fecha);
            t += `${e.examen||'N/A'}\t${e.codigo||''}\t${formatearFechaEspañol(fecha)}\t${hora}\n`;
        });
        t += '\n';
    }
    if (d.imagenologia?.length) {
        t += 'IMAGENOLOGÍA\nExamen\tFecha\tHora\n';
        d.imagenologia.forEach(e => {
            const {fecha,hora} = separarFechaHora(e.fecha);
            t += `${e.examen||'N/A'}\t${formatearFechaEspañol(fecha)}\t${hora}\n`;
        });
        t += '\n';
    }
    if (d.interconsultas?.length) {
        t += 'INTERCONSULTAS\n';
        d.interconsultas.forEach((i,idx) => { t += `${idx+1}. ${i.tipo||''}\n`; });
        t += '\n';
    }
    if (d.controlesSeriados?.length) {
        t += 'CONTROLES SERIADOS\nTipo\tValor\tUnidad\tFecha\tHora\n';
        d.controlesSeriados.forEach(c => {
            t += `${c.tipo||''}\t${c.valor||''}\t${c.unidad||''}\t${c.fecha||''}\t${c.hora||''}\n`;
        });
    }
    return t;
}

function _txtControlSignos(d) {
    let t = 'CONTROL DE SIGNOS VITALES:\n===========================\n';
    (d.mediciones || []).forEach((m, i) => {
        t += `\nMedición ${i+1} — ${m.fecha||''} ${m.hora||''}\n`;
        [
            ['FC',              m.fc],
            ['FR',              m.fr],
            ['T° Axilar',       m.temperatura],
            ['SatO₂',           m.sato2],
            ['FiO₂',            m.fio2],
            ['PAS',             m.pas],
            ['PAD',             m.pad],
            ['PAM',             m.pam],
            ['Llene capilar',   m.llene_capilar],
            ['Glasgow',         m.glasgow_total],
            ['Dolor (ENA)',      m.dolor_intensidad],
            ['Ubicación dolor',  m.ubicacion],
            ['Diuresis horaria', m.diuresis],
            ['BIC fármaco',     m.bic_farmaco],
            ['BIC flujo',       m.bic_flujo],
            ['BIC dilución',    m.bic_dilucion],
        ].forEach(([l,v]) => { if (v) t += `  ${l}:\t${v}\n`; });
    });
    return t;
}

function _txtBalance(d) {
    let t = 'BALANCE HÍDRICO:\n================\n';
    if (d.ingresos) {
        t += '\nINGRESOS (día / noche):\n';
        [['Alimentación','alimentacion'],['Hidratación','hidratacion'],
         ['Suero','suero'],['Transfusión','transfusion'],
         ['Tratamiento','tratamiento'],['Otros','otros']].forEach(([l,k]) => {
            const dia = d.ingresos[`${k}_dia`], noch = d.ingresos[`${k}_noch`];
            if (dia||noch) t += `  ${l}:\t${dia||0} / ${noch||0}\n`;
        });
    }
    if (d.egresos) {
        t += '\nEGRESOS (día / noche):\n';
        [['Orina','orina'],['Deposiciones','deposiciones'],
         ['Contenido gástrico','gastrico'],['Drenaje','drenaje'],
         ['Diuresis horaria','diuresis'],['Pérdidas insensibles','perdidas'],
         ['Otros','otros']].forEach(([l,k]) => {
            const dia = d.egresos[`${k}_dia`], noch = d.egresos[`${k}_noch`];
            if (dia||noch) t += `  ${l}:\t${dia||0} / ${noch||0}\n`;
        });
    }
    if (d.totales) {
        t += `\nBalance 12h (día):\t${d.totales.balance_dia||0}\n`;
        t += `Balance 12h (noche):\t${d.totales.balance_noche||0}\n`;
        t += `Balance 24h:\t${d.totales.balance_24h||0}\n`;
    }
    if (d.eliminacion) {
        t += '\nELIMINACIÓN:\n';
        [['Orina','orina'],['Vómitos','vomitos'],['Deposiciones','deposiciones'],['Otros','otros']].forEach(([l,k]) => {
            if (d.eliminacion[k]) t += `  ${l}:\t${d.eliminacion[k]}\n`;
        });
    }
    return t;
}

function _txtExamenFisico(d) {
    let t = 'EXAMEN FÍSICO:\n==============\n';
    (d.bloques || []).forEach((b, i) => {
        t += `\nDÍA ${i+1}: ${b.fechaHora||''}\n`;
        const c = b.campos || {};
        if (c.hora_largo||c.responsable_largo) t += `Largo — Hora: ${c.hora_largo||''} | Responsable: ${c.responsable_largo||''}\n`;
        if (c.hora_noche||c.responsable_noche) t += `Noche — Hora: ${c.hora_noche||''} | Responsable: ${c.responsable_noche||''}\n`;
        [
            ['Cabeza y cuello',        'cabeza_cuello'],
            ['Tórax y abdomen',        'torax_abdomen'],
            ['Espalda',                'espalda'],
            ['Ext. superiores',        'ext_sup'],
            ['Ext. inferiores',        'ext_inf'],
            ['Genitales',              'genitales'],
            ['Sistema linfático',      'sistema_linfatico'],
        ].forEach(([l,k]) => {
            const largo = c[`${k}_largo`], noche = c[`${k}_noche`];
            if (largo||noche) { t += `\n${l}:\n`; if (largo) t += `  Largo:\t${largo}\n`; if (noche) t += `  Noche:\t${noche}\n`; }
        });
        [['Coloración','coloracion','coloracion_otros'],
         ['Temperatura','temperatura','temperatura_otros'],
         ['Pulsos','pulsos','pulsos_ubicacion']].forEach(([l,k,ke]) => {
            const largo = c[`${k}_largo`], noche = c[`${k}_noche`];
            if (largo||noche) {
                t += `\n${l}:\n`;
                if (largo) t += `  Largo:\t${largo}${c[`${ke}_largo`] ? ' — '+c[`${ke}_largo`] : ''}\n`;
                if (noche) t += `  Noche:\t${noche}${c[`${ke}_noche`] ? ' — '+c[`${ke}_noche`] : ''}\n`;
            }
        });
    });
    return t;
}

function _txtPlanEnfermeria(d) {
    let t = 'PLAN DE ENFERMERÍA:\n===================\n';
    if (d.plan_enfermeria) {
        const items = d.plan_enfermeria.split(',').filter(Boolean);
        items.forEach((item, i) => { t += `${i+1}. ${item.trim()}\n`; });
    }
    if (d.plan_enfermeria_otros) t += `\nOtros:\t${d.plan_enfermeria_otros}\n`;
    return t;
}

function _txtAtencion(d) {
    let t = 'ATENCIÓN DE ENFERMERÍA:\n=======================\n';
    [
        ['CSV horario',        d.csv_horario],
        ['Monitoreo continuo', d.monitoreo_continuo],
        ['Posición',           d.posicion_camilla],
        ['FiO₂',              d.fio2],
        ['Tipo dispositivo',   d.tipo_dispositivo],
        ['Prot. piel O₂',     d.proteccion_piel_o2],
        ['Aspiración sec.',    d.aspiracion_secreciones],
        ['Agua humidificador', d.agua_humidificador],
        ['Rotación dispositivo',d.rotacion_dispositivo],
        ['Prot. piel aseo',    d.proteccion_piel_aseo],
        ['CNAF',               d.resp_cnaf],
        ['VMNI',               d.resp_vmni],
        ['VMI',                d.resp_vmi],
    ].forEach(([l,v]) => { if (v) t += `${l}:\t${v}\n`; });
    if (d.glasgow_total) {
        t += `\nGlasgow:\t${d.glasgow_total} (${d.glasgow_clasificacion||''})\n`;
        t += `  Ocular: ${d.glasgow_ocular||''} | Verbal: ${d.glasgow_verbal||''} | Motor: ${d.glasgow_motor||''}\n`;
    }
    if (d.datos_lpp?.length) {
        t += '\nLPP:\n';
        d.datos_lpp.forEach((v, i) => {
            t += `  Valoración ${i+1}:\n`;
            if (v.puntajeBradenLargo != null) t += `    Braden largo: ${v.puntajeBradenLargo} (${v.riesgoLargo||''})\n`;
            if (v.puntajeBradenNoche != null) t += `    Braden noche: ${v.puntajeBradenNoche} (${v.riesgoNoche||''})\n`;
            if (v.uppLargo==='si') t += `    UPP largo: sí | Ubicaciones: ${(v.ubicacionesLargo||[]).map(u=>u.nombre).join(', ')}\n`;
            if (v.uppNoche==='si') t += `    UPP noche: sí | Ubicaciones: ${(v.ubicacionesNoche||[]).map(u=>u.nombre).join(', ')}\n`;
            if (v.responsable) t += `    Responsable: ${v.responsable}\n`;
        });
    }
    return t;
}

function _txtPrecIAAS(d) {
    let t = 'PREVENCIÓN IAAS:\n================\n';
    if (d.flebitis) {
        t += '\nFLEBITIS:\n';
        t += `  Fijación: ${d.flebitis.fijacion?'sí':'no'} | Vencimiento: ${d.flebitis.vencimiento?'sí':'no'}\n`;
        t += `  Grado INS: ${d.flebitis.grado||''}\n`;
        if (d.flebitis.obs) t += `  Obs: ${d.flebitis.obs}\n`;
    }
    if (d.navm) {
        t += '\nNAVM:\n';
        [['Posición 30-45°','posicion'],['Cuff','cuff'],['Aspiración','aspiracion'],
         ['Aseo bucal','bucal'],['Lavado manos','manos'],['Higiene oral','clorhex']].forEach(([l,k]) => {
            if (d.navm[k]) t += `  ${l}: ${d.navm[k]===true?'sí':d.navm[k]}\n`;
        });
        if (d.navm.obs) t += `  Obs: ${d.navm.obs}\n`;
    }
    if (d.itu) {
        t += '\nITU:\n';
        if (d.itu.aseo) t += `  Aseo genital: ${d.itu.aseo}\n`;
        t += `  Fijación: ${d.itu.fijacion?'sí':'no'}\n`;
        if (d.itu.obs) t += `  Obs: ${d.itu.obs}\n`;
    }
    return t;
}

function _txtEvolucion(d) {
    let t = 'EVOLUCIÓN:\n==========\n';
    const secciones = [
        ['TÉCNICO — Turno Largo', d.tecnico_largo],
        ['TÉCNICO — Turno Noche', d.tecnico_noche],
        ['ENFERMERA — Turno Largo', d.enfermera_largo],
        ['ENFERMERA — Turno Noche', d.enfermera_noche],
    ];
    secciones.forEach(([label, registros]) => {
        if (!registros?.length) return;
        t += `\n${label}:\n`;
        registros.forEach((r, i) => {
            t += `  ${i+1}. [${r.hora||'--:--'}] ${r.observacion||''} — ${r.responsable||''}\n`;
        });
    });
    return t;
}

function _txtHHHA(d) {
    let t = 'INDICADORES HHHA:\n=================\n';
    t += '\nORDEN FICHA:\n';
    [['Hoja ingreso médico','hoja_ingreso_medico'],['Ingreso estadístico','ingreso_estadistico'],
     ['Hoja DAU','hoja_dau'],['Docs externos','docs_externos'],['Hoja evolución','hoja_evolucion'],
     ['Exámenes','examenes_ficha'],['Protocolo pertenencias','protocolo_pertenencias'],
     ['Hoja enfermería','hoja_enfermeria']].forEach(([l,k]) => {
        if (d[k] !== undefined) t += `  ${l}: ${d[k]?'✓':'✗'}\n`;
    });
    t += '\nIDENTIFICACIÓN:\n';
    if (d.brazalete)           t += `  Brazalete correcto: ${d.brazalete}\n`;
    if (d.ubicacion_brazalete) t += `  Ubicación: ${d.ubicacion_brazalete}\n`;
    if (d.pizarra)             t += `  Pizarra correcta: ${d.pizarra}\n`;
    if (d.obs_identificacion)  t += `  Obs: ${d.obs_identificacion}\n`;
    t += '\nPERTENENCIAS:\n';
    if (d.pertenencias)        t += `  Protocolo: ${d.pertenencias}\n`;
    if (d.obs_pertenencias)    t += `  Obs: ${d.obs_pertenencias}\n`;
    t += '\nRESPONSABLE:\n';
    if (d.responsable_nombre)  t += `  Nombre: ${d.responsable_nombre}\n`;
    if (d.responsable_usuario) t += `  Usuario: ${d.responsable_usuario}\n`;
    return t;
}

// ─────────────────────────────────────────────────────
// PYTHON BRIDGE
// ─────────────────────────────────────────────────────

function inicializarPythonBridge() {
    if (typeof window.pyWebViewApi !== 'undefined') {
        isPythonReady = true;
        console.log('✅ Python bridge disponible');
    } else {
        console.log('⚠️ Python bridge no disponible, usando almacenamiento local');
    }
}

async function enviarAPython(datos) {
    if (!isPythonReady) { console.log('📝 Simulando almacenamiento:', datos); return Promise.resolve(); }
    try {
        const response = await window.pyWebViewApi.post('/api/almacenar_fila_tsv', {
            data: datos, headers: obtenerEncabezadosTSV(),
            archivo_unico: true, timestamp: new Date().toISOString()
        });
        return response;
    } catch (error) { console.error('❌ Error enviando a Python:', error); throw error; }
}

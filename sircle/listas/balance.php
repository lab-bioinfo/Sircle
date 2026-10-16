resfrio<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$opciones = [
    'balance_periodos' => [
        ['value' => '08_12', 'display' => '08:00–12:00'],
        ['value' => '12_18', 'display' => '12:00–18:00'],
        ['value' => '18_20', 'display' => '18:00–20:00'],
        ['value' => '20_08', 'display' => '20:00–08:00']
    ],
    
    'ingresos_conceptos' => [
        ['id' => 'alimentacion', 'nombre' => 'Alimentación'],
        ['id' => 'hidratacion', 'nombre' => 'Hidratación'],
        ['id' => 'suero', 'nombre' => 'Suero'],
        ['id' => 'transfusion', 'nombre' => 'Transfusión'],
        ['id' => 'tratamiento', 'nombre' => 'Tratamiento'],
        ['id' => 'otros_ingresos', 'nombre' => 'Otros']
    ],
    
    'egresos_conceptos' => [
        ['id' => 'orina', 'nombre' => 'Orina'],
        ['id' => 'deposiciones', 'nombre' => 'Deposiciones'],
        ['id' => 'contenido_gastrico', 'nombre' => 'Contenido gástrico'],
        ['id' => 'drenaje', 'nombre' => 'Drenaje'],
        ['id' => 'diur_horaria', 'nombre' => 'Diur. horaria'],
        ['id' => 'perdidas_insensibles', 'nombre' => 'Pérdidas insensibles'],
        ['id' => 'otros_egresos', 'nombre' => 'Otros']
    ],
    
    'balance_totales_periodos' => [
        ['id' => 'total_dia', 'nombre' => 'Total 12h (día)', 'clase' => 'row-total-day'],
        ['id' => 'total_noche', 'nombre' => 'Total 12h (noche)', 'clase' => 'row-total-night']
    ],
    
    'balance_resumen' => [
        ['id' => 'bh_12a', 'nombre' => 'BALANCE HÍDRICO 12 HORAS (día)', 'target' => 'bal-12a'],
        ['id' => 'bh_12b', 'nombre' => 'BALANCE HÍDRICO 12 HORAS (noche)', 'target' => 'bal-12b'],
        ['id' => 'bh_24', 'nombre' => 'BALANCE HÍDRICO 24 HORAS', 'target' => 'bal-24']
    ]
];

echo json_encode($opciones);
?>
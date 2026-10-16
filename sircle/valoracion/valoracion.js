function abrirModalDownton() {
    document.getElementById('modal-downton').style.display = 'flex';
}
const checkboxesDownton = document.querySelectorAll('.downton');

checkboxesDownton.forEach(cb => {
  cb.addEventListener('change', calcularDownton);
});

function calcularDownton() {
  let total = 0;

  document.querySelectorAll('.downton:checked').forEach(cb => {
    total += parseInt(cb.dataset.value);
  });

  document.getElementById('puntaje-downton').textContent = total;

  let clasificacion = "Riesgo bajo";
  if (total >= 5) clasificacion = "Riesgo alto";
  else if (total >= 3) clasificacion = "Riesgo moderado";

  document.getElementById('clasificacion-downton').textContent = clasificacion;
  document.getElementById('downtonResultado').value = total;

const riesgoDiv = document.getElementById('downtonRiesgo');

if (total >= 5) {
    riesgoDiv.textContent = "Riesgo alto";
    riesgoDiv.style.color = "#dc2626";
} else if (total >= 3) {
    riesgoDiv.textContent = "Riesgo moderado";
    riesgoDiv.style.color = "#f59e0b";
} else {
    riesgoDiv.textContent = "Riesgo bajo";
    riesgoDiv.style.color = "#16a34a";
}

}

function cerrarModalDownton() {
  document.getElementById('modal-downton').style.display = 'none';
}

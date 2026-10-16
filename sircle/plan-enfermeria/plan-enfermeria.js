document.addEventListener('DOMContentLoaded', () => {

    const chips = document.querySelectorAll('#plan-enfermeria .chip');
    const hiddenInput = document.getElementById('plan-enfermeria-input');
    const otrosContainer = document.getElementById('plan-otros-texto');

    let seleccionados = [];

    chips.forEach(chip => {
        chip.addEventListener('click', () => {

            const value = chip.dataset.value;

            chip.classList.toggle('active');

            if (chip.classList.contains('active')) {
                if (!seleccionados.includes(value)) {
                    seleccionados.push(value);
                }
            } else {
                seleccionados = seleccionados.filter(v => v !== value);
            }

            hiddenInput.value = seleccionados.join(',');

            // Mostrar / ocultar "Otros"
            if (value === 'otros') {
                otrosContainer.style.display = chip.classList.contains('active')
                    ? 'block'
                    : 'none';
            }
        });
    });

});

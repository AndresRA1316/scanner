let html5QrCode = null;

function mostrarResultado(codigoTexto) {
    let resultadoFormateado = clasificarResultado(codigoTexto);
    
    document.getElementById('modalResultBody').innerHTML = resultadoFormateado;
    let resultModal = new bootstrap.Modal(document.getElementById('resultModal'), {});
    resultModal.show();

    guardarEnHistorial(codigoTexto, resultadoFormateado);
}

function clasificarResultado(codigoTexto) {
    if (codigoTexto.startsWith("WIFI:")) {
        return formatearWifi(codigoTexto);
    }
    return `<p>${codigoTexto}</p>`;
}

function formatearWifi(codigoTexto) {
    let ssid = codigoTexto.match(/S:(.*?);/)[1];
    let pass = codigoTexto.match(/P:(.*?);/)[1];
    let tipo = codigoTexto.match(/T:(.*?);/)[1];
    
    return `
        <h5>Información de WiFi</h5>
        <p><strong>SSID:</strong> ${ssid}</p>
        <p><strong>Contraseña:</strong> ${pass}</p>
        <p><strong>Tipo:</strong> ${tipo}</p>
    `;
}

function guardarEnHistorial(codigoTexto, resultadoFormateado) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.push({codigo: codigoTexto, resultado: resultadoFormateado});
    localStorage.setItem('historial', JSON.stringify(historial));

    actualizarHistorial(historial);
}

function actualizarHistorial(historial) {
    let historialUl = document.getElementById('historial');
    historialUl.innerHTML = '';
    historial.forEach((item, index) => {
        let li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `<div class="resultado">${item.resultado}</div><button class="btn btn-danger btn-sm" onclick="eliminarItemHistorial(${index})"><i class="fas fa-trash-alt"></i></button>`;
        historialUl.appendChild(li);
    });
}

function eliminarItemHistorial(index) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.splice(index, 1);
    localStorage.setItem('historial', JSON.stringify(historial));
    actualizarHistorial(historial);
}

function borrarHistorial() {
    localStorage.removeItem('historial');
    actualizarHistorial([]);
}

function lecturaCorrecta(codigoTexto, codigoObjeto) {
    console.log(`Code matched = ${codigoTexto}`, codigoObjeto);
    mostrarResultado(codigoTexto);
}

function errorLectura(error) {
    console.warn(`Code scan error = ${error}`);
}

function iniciarCamaraTrasera() {
    Html5Qrcode.getCameras().then(camaras => {
        if (camaras && camaras.length) {
            // Seleccionar la cámara trasera por defecto
            const camaraTrasera = camaras.find(camara => camara.label.toLowerCase().includes('back')) || camaras[0];
            document.getElementById("imagenReferencial").style.display = "none";
            html5QrCode = new Html5Qrcode("reader");
            html5QrCode.start(
                camaraTrasera.id, 
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                lecturaCorrecta,
                errorLectura
            ).catch(err => {
                console.error(err);
                // Mostrar imagen referencial si ocurre un error al iniciar la cámara
                document.getElementById("imagenReferencial").style.display = "block";
            });
        }
    }).catch(err => {
        console.error(err);
        // Mostrar imagen referencial si ocurre un error al obtener las cámaras
        document.getElementById("imagenReferencial").style.display = "block";
    });
}

const detenerCamara = () => {
    html5QrCode.stop().then(() => {
        document.getElementById("imagenReferencial").style.display = "block";
    }).catch(err => {
        console.error(err);
    });
}

const html5QrCode2 = new Html5Qrcode("reader-file");
const fileinput = document.getElementById('qr-input-file');
fileinput.addEventListener('change', e => {
    if (e.target.files.length == 0) {
        return;
    }
    const imageFile = e.target.files[0];

    const imageUrl = URL.createObjectURL(imageFile);

    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.className = 'img-thumbnail';
    imgElement.style.maxWidth = '150px';
    imgElement.style.height = 'auto';

    const modalBody = document.getElementById('modalResultBody');
    modalBody.innerHTML = '';
    modalBody.appendChild(imgElement);

    html5QrCode2.scanFile(imageFile, true)
        .then(lecturaCorrecta)
        .catch(err => {
            console.error(`Error scanning file. Reason: ${err}`);
        });
});

document.addEventListener('DOMContentLoaded', () => {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    actualizarHistorial(historial);
    iniciarCamaraTrasera();
});

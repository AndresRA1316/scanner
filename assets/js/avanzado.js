let html5QrCode = null;
let cameraId = null; // Variable para guardar el ID de la cámara seleccionada
let scanning = false; // Variable para evitar escaneos múltiples

function mostrarResultado(codigoTexto) {
    if (scanning) return; // Evita que se procese si ya se está escaneando
    scanning = true; // Marca como escaneando

    // Clasificar y formatear el resultado
    let resultadoFormateado = clasificarResultado(codigoTexto);
    
    // Mostrar el resultado en el modal
    document.getElementById('modalResultBody').innerHTML = resultadoFormateado;
    let resultModal = new bootstrap.Modal(document.getElementById('resultModal'), {});
    resultModal.show();

    // Limpiar el modal y reiniciar el escaneo cuando se cierra
    resultModal._element.addEventListener('hidden.bs.modal', function () {
        // Detener la cámara actual y reiniciar si está activa
        detenerCamara().then(() => {
            // Mostrar la imagen referencial y reiniciar la cámara si es necesario
            document.getElementById("imagenReferencial").style.display = "block";
            if (!scanning) { // Solo reiniciar si no se está escaneando
                iniciarCamara(); // Reiniciar la cámara trasera
            }
        }).catch(err => {
            console.error(err);
        });
        document.getElementById('modalResultBody').innerHTML = '';
        scanning = false; // Permite nuevos escaneos
    });

    // Guardar en el historial y en el local storage
    guardarEnHistorial(codigoTexto, resultadoFormateado);
}

function clasificarResultado(codigoTexto) {
    if (codigoTexto.startsWith("WIFI:")) {
        return formatearWifi(codigoTexto);
    }
    // Agregar más clasificaciones si es necesario
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

    // Actualizar el historial en la interfaz
    actualizarHistorial(historial);
}


function actualizarHistorial(historial) {
    let historialUl = document.getElementById('historial');
    historialUl.innerHTML = '';

    if (historial.length === 0) {
        historialUl.innerHTML = '<li class="list-group-item">Ups!, No hay nada aun.</li>';
    } else {
        historial.forEach((item, index) => {
            let li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `<div class="resultado">${item.resultado}</div><button class="btn btn-primary btn-sm" onclick="eliminarItemHistorial(${index})"><i class="fas fa-trash-alt"></i></button>`;
            historialUl.appendChild(li);
        });
    }
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
    // Se asegura de detener la cámara antes de iniciar una nueva instancia
    detenerCamara().then(() => {
        // Cuando se detiene la cámara, asegurarse de que la imagen referencial se muestra
        document.getElementById("imagenReferencial").style.display = "block";
    }).catch(err => {
        console.error(err);
    });
}

function errorLectura(error) {
    console.warn(`Code scan error = ${error}`);
    // Asegúrate de que el modal se cierra en caso de error
    let resultModal = new bootstrap.Modal(document.getElementById('resultModal'), {});
    resultModal.hide();
}

Html5Qrcode.getCameras().then(camaras => {
    if (camaras && camaras.length) {
        let select = document.getElementById("listaCamaras");
        let html = `<option value="" selected>Seleccione una cámara</option>`;
        camaras.forEach(camara => {
            html += `<option value="${camara.id}">${camara.label}</option>`;
        });
        select.innerHTML = html;

        // Seleccionar la cámara trasera por defecto
        cameraId = camaras.find(c => c.label.toLowerCase().includes('back'))?.id || camaras[0]?.id;
        if (cameraId) {
            camaraSeleccionada({ value: cameraId });
        }
    }
}).catch(err => {
    console.error(err);
});

const camaraSeleccionada = (elemento) => {
    let idCamaraSeleccionada = elemento.value;
    document.getElementById("imagenReferencial").style.display = "none";
    // Detener la cámara anterior si está activa
    detenerCamara().then(() => {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }
        html5QrCode.start(
            idCamaraSeleccionada, 
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            lecturaCorrecta,
            errorLectura
        ).catch(err => {
            console.error(err);
        });
    }).catch(err => {
        console.error(err);
    });
}

const detenerCamara = () => {
    return new Promise((resolve, reject) => {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                // Eliminar la instancia de Html5Qrcode solo si existe
                html5QrCode = null;
                document.getElementById("imagenReferencial").style.display = "block";
                document.getElementById("listaCamaras").value = "";
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else {
            resolve();
        }
    });
}

const iniciarCamara = () => {
    if (cameraId) {
        // Detener la cámara anterior si está activa
        detenerCamara().then(() => {
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("reader");
            }
            html5QrCode.start(
                cameraId, 
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                lecturaCorrecta,
                errorLectura
            ).catch(err => {
                console.error(err);
            });
        }).catch(err => {
            console.error(err);
        });
    } else {
        console.warn("No se ha seleccionado ninguna cámara.");
    }
}

const html5QrCode2 = new Html5Qrcode("reader-file");
const fileinput = document.getElementById('qr-input-file');
fileinput.addEventListener('change', e => {
    if (e.target.files.length == 0) {
        return;
    }
    const imageFile = e.target.files[0];

    // Crear una URL para la imagen cargada
    const imageUrl = URL.createObjectURL(imageFile);

    // Crear un elemento de imagen para mostrar la vista previa
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.className = 'img-thumbnail'; // Añade clase de Bootstrap para tamaño y estilo
    imgElement.style.maxWidth = '150px'; // Ajusta el tamaño máximo de la imagen
    imgElement.style.height = 'auto'; // Mantén la proporción de aspecto

    // Mostrar la imagen en el modal (opcional)
    const modalBody = document.getElementById('modalResultBody');
    modalBody.innerHTML = ''; // Limpiar contenido previo
    modalBody.appendChild(imgElement);

    // Scan QR Code
    html5QrCode2.scanFile(imageFile, true)
        .then(lecturaCorrecta)
        .catch(err => {
            console.error(`Error scanning file. Reason: ${err}`);
        });
});

// Cargar el historial al iniciar
document.addEventListener('DOMContentLoaded', () => {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    actualizarHistorial(historial);
});

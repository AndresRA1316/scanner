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
    } else if (isValidUrl(codigoTexto)) {
        return formatearUrl(codigoTexto);
    } else if (codigoTexto.startsWith("mailto:")) {
        return formatearEmail(codigoTexto);
    } else if (codigoTexto.startsWith("tel:")) {
        return formatearTelefono(codigoTexto);
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
        <button class="btn btn-primary" onclick="conectarWifi('${ssid}', '${pass}')">Conectar</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function formatearUrl(codigoTexto) {
    return `
        <h5>Enlace Detectado</h5>
        <p><a href="${codigoTexto}" target="_blank">${codigoTexto}</a></p>
        <button class="btn btn-primary" onclick="abrirEnlace('${codigoTexto}')">Abrir</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function formatearEmail(codigoTexto) {
    let email = codigoTexto.replace('mailto:', '');
    return `
        <h5>Correo Electrónico Detectado</h5>
        <p>${email}</p>
        <button class="btn btn-primary" onclick="enviarEmail('${email}', '', '')">Enviar Email</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function formatearTelefono(codigoTexto) {
    let telefono = codigoTexto.replace('tel:', '');
    return `
        <h5>Teléfono Detectado</h5>
        <p>${telefono}</p>
        <button class="btn btn-primary" onclick="llamarTelefono('${telefono}')">Llamar</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;  
    }
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert("Texto copiado al portapapeles");
    }).catch(err => {
        console.error("Error al copiar el texto: ", err);
    });
}

function abrirEnlace(url) {
    window.open(url, '_blank');
}

function conectarWifi(ssid, pass) {
    alert(`Conectando a la red WiFi:\nSSID: ${ssid}\nContraseña: ${pass}`);
    // Aquí puedes agregar el código para conectarse a la WiFi si es posible desde el navegador
}

function enviarEmail(to, subject, body) {
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function llamarTelefono(telefono) {
    window.location.href = `tel:${telefono}`;
}

function guardarEnHistorial(codigoTexto, resultadoFormateado) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.push({ codigoTexto, resultadoFormateado });
    localStorage.setItem('historial', JSON.stringify(historial));
    actualizarHistorial();
}

function actualizarHistorial() {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    let historialElement = document.getElementById('historial');
    historialElement.innerHTML = '';

    historial.forEach((item, index) => {
        let listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
            ${item.resultadoFormateado}
            <button class="btn btn-danger btn-sm" onclick="eliminarItemHistorial(${index})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        historialElement.appendChild(listItem);
    });
}

function eliminarItemHistorial(index) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.splice(index, 1);
    localStorage.setItem('historial', JSON.stringify(historial));
    actualizarHistorial();
}

function borrarHistorial() {
    localStorage.removeItem('historial');
    actualizarHistorial();
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
                // Eliminar la instancia de Html5Qrcode solo si se detuvo correctamente
                html5QrCode = null;
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else {
            resolve(); // Resolver si no hay instancia para detener
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

function generarQR() {
    let qrInput = document.getElementById('qr-input').value;
    let qrOutput = document.getElementById('qr-output');
    let downloadBtn = document.getElementById('download-btn');

    // Generar el código QR
    qrOutput.innerHTML = '';
    let qrCode = new QRCode(qrOutput, {
        text: qrInput,
        width: 256,
        height: 256
    });

    // Mostrar el botón de descarga
    downloadBtn.style.display = 'block';
}

function descargarQR() {
    let qrCanvas = document.querySelector('#qr-output canvas');
    if (qrCanvas) {
        let qrImage = qrCanvas.toDataURL('image/png');
        let downloadLink = document.createElement('a');
        downloadLink.href = qrImage;
        downloadLink.download = 'qr-code.png';
        downloadLink.click();
    }
}

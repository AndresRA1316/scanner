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
    } else if (codigoTexto.endsWith('.pdf')) {
        return formatearPdf(codigoTexto);
    } else if (isValidTextOrNumber(codigoTexto)) {
        return formatearTexto(codigoTexto);
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
        <button class="btn btn-secondary" onclick="copiarTexto('${pass}')">Copiar</button>
    `;
}

function formatearUrl(codigoTexto) {
    return `
        <h5>Enlace:</h5>
        <p><a href="${codigoTexto}" target="_blank">${codigoTexto}</a></p>
        <button class="btn btn-primary" onclick="abrirEnlace('${codigoTexto}')">Abrir</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function formatearEmail(codigoTexto) {
    let email = codigoTexto.replace('mailto:', '');
    return `
        <h5>Correo:</h5>
        <p>${email}</p>
        <button class="btn btn-primary" onclick="enviarEmail('${email}', '', '')">Enviar Email</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function formatearTelefono(codigoTexto) {
    let telefono = codigoTexto.replace('tel:', '');
    return `
        <h5>Teléfono:</h5>
        <p>${telefono}</p>
        <button class="btn btn-primary" onclick="llamarTelefono('${telefono}')">Llamar</button>
        <button class="btn btn-secondary" onclick="copiarTexto('${codigoTexto}')">Copiar</button>
    `;
}

function formatearPdf(codigoTexto) {
    return `
        <h5>PDF:</h5>
        <p><a href="${codigoTexto}" download>Descargar PDF</a></p>
    `;
}

function formatearTexto(codigoTexto) {
    return `
        <h5>Texto:</h5>
        <p>${codigoTexto}</p>
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

function isValidTextOrNumber(string) {
    return /^[\w\s]+$/.test(string); // Verifica si es texto o número
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        swal.fire("Texto copiado al portapapeles");
    }).catch(err => {
        console.error("Error al copiar el texto: ", err);
    });
}

function abrirEnlace(url) {
    window.open(url, '_blank');
}

function conectarWifi(ssid, pass) {
    swal.fire(`Conectando a la red WiFi:\nSSID: ${ssid}\nContraseña: ${pass}`);
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
    let mensajeVacio = document.getElementById('mensajeVacio');

    // Limpiar el contenido de la tabla, excepto la fila del mensaje vacío
    historialElement.innerHTML = '';
    historialElement.appendChild(mensajeVacio);

    // Mostrar mensaje si el historial está vacío
    if (historial.length === 0) {
        mensajeVacio.style.display = 'table-row';
    } else {
        mensajeVacio.style.display = 'none';

        historial.forEach((item, index) => {
            let row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.resultadoFormateado}</td>
                <td class="acciones">
                    <button class="btn btn-danger btn-sm" onclick="eliminarItemHistorial(${index})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            `;
            historialElement.appendChild(row);
        });
    }
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
function mostrarCampos() {
    const tipo = document.getElementById('qr-type').value;
    const campos = document.getElementById('qr-fields');
    campos.innerHTML = ''; // Limpiar campos existentes

    switch(tipo) {
        case 'url':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="qr-input" class="form-label">URL:</label>
                    <input type="text" id="qr-input" class="form-control">
                </div>
            `;
            break;
        case 'email':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="email-address" class="form-label">Email:</label>
                    <input type="email" id="email-address" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="email-subject" class="form-label">Asunto:</label>
                    <input type="text" id="email-subject" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="email-body" class="form-label">Cuerpo:</label>
                    <textarea id="email-body" class="form-control"></textarea>
                </div>
            `;
            break;
        case 'wifi':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="wifi-ssid" class="form-label">SSID:</label>
                    <input type="text" id="wifi-ssid" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="wifi-password" class="form-label">Contraseña:</label>
                    <input type="text" id="wifi-password" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="wifi-encryption" class="form-label">Tipo de Cifrado:</label>
                    <select id="wifi-encryption" class="form-select">
                        <option value="WPA">WPA</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Ninguno</option>
                    </select>
                </div>
            `;
            break;
        case 'texto':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="qr-input" class="form-label">Texto:</label>
                    <input type="text" id="qr-input" class="form-control">
                </div>
            `;
            break;
        case 'telefono':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="phone-number" class="form-label">Número de Teléfono:</label>
                    <input type="text" id="phone-number" class="form-control">
                </div>
            `;
            break;
        case 'ubicacion':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="latitude" class="form-label">Latitud:</label>
                    <input type="text" id="latitude" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="longitude" class="form-label">Longitud:</label>
                    <input type="text" id="longitude" class="form-control">
                </div>
            `;
            break;
        case 'evento':
            campos.innerHTML = `
                <div class="mb-3">
                    <label for="event-title" class="form-label">Título del Evento:</label>
                    <input type="text" id="event-title" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="event-location" class="form-label">Ubicación:</label>
                    <input type="text" id="event-location" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="event-start" class="form-label">Fecha y Hora de Inicio:</label>
                    <input type="datetime-local" id="event-start" class="form-control">
                </div>
                <div class="mb-3">
                    <label for="event-end" class="form-label">Fecha y Hora de Fin:</label>
                    <input type="datetime-local" id="event-end" class="form-control">
                </div>
            `;
            break;
        default:
            break;
    }
}

function generarQR() {
    let tipo = document.getElementById('qr-type').value;
    let qrInput;
    switch(tipo) {
        case 'url':
            qrInput = document.getElementById('qr-input').value;
            break;
        case 'email':
            let email = document.getElementById('email-address').value;
            let subject = document.getElementById('email-subject').value;
            let body = document.getElementById('email-body').value;
            qrInput = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            break;
        case 'wifi':
            let ssid = document.getElementById('wifi-ssid').value;
            let password = document.getElementById('wifi-password').value;
            let encryption = document.getElementById('wifi-encryption').value;
            qrInput = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
            break;
        case 'texto':
            qrInput = document.getElementById('qr-input').value;
            break;
        case 'telefono':
            let phoneNumber = document.getElementById('phone-number').value;
            qrInput = `tel:${phoneNumber}`;
            break;
        case 'ubicacion':
            let latitude = document.getElementById('latitude').value;
            let longitude = document.getElementById('longitude').value;
            qrInput = `geo:${latitude},${longitude}`;
            break;
        case 'evento':
            let title = document.getElementById('event-title').value;
            let location = document.getElementById('event-location').value;
            let start = document.getElementById('event-start').value;
            let end = document.getElementById('event-end').value;
            qrInput = `BEGIN:VEVENT\nSUMMARY:${title}\nLOCATION:${location}\nDTSTART:${start.replace(/-/g, '').replace(/:/g, '')}\nDTEND:${end.replace(/-/g, '').replace(/:/g, '')}\nEND:VEVENT`;
            break;
        default:
            alert('Por favor, selecciona un tipo de QR.');
            return;
    }

    let qrOutput = document.getElementById('qr-output');
    let downloadBtn = document.getElementById('download-btn');

    // Generar el código QR
    qrOutput.innerHTML = '';
    new QRCode(qrOutput, {
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

/**Close main navigator */
document.addEventListener('DOMContentLoaded', function () {
    var navLinks = document.querySelectorAll('.nav-link');
    var navbarCollapse = document.querySelector('.navbar-collapse');

    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth < 992) {
                var bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                    toggle: false
                });
                bsCollapse.hide();
            }
        });
    });
});

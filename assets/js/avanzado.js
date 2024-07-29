let html5QrCode = null;

// Función para mostrar el resultado en el modal
function mostrarResultado(codigoTexto) {
    // Clasificar y formatear el resultado
    let resultadoFormateado = clasificarResultado(codigoTexto);
    
    // Mostrar el resultado en el modal
    document.getElementById('modalResultBody').innerHTML = resultadoFormateado;
    let resultModal = new bootstrap.Modal(document.getElementById('resultModal'), {});
    resultModal.show();

    // Guardar en el historial y en el local storage
    guardarEnHistorial(codigoTexto, resultadoFormateado);
}

// Función para clasificar el resultado
function clasificarResultado(codigoTexto) {
    if (codigoTexto.startsWith("WIFI:")) {
        return formatearWifi(codigoTexto);
    }
    // Agregar más clasificaciones si es necesario
    return `<p>${codigoTexto}</p>`;
}

// Función para formatear datos de WiFi
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

// Función para guardar en el historial
function guardarEnHistorial(codigoTexto, resultadoFormateado) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.push({codigo: codigoTexto, resultado: resultadoFormateado});
    localStorage.setItem('historial', JSON.stringify(historial));

    // Actualizar el historial en la interfaz
    actualizarHistorial(historial);
}

// Función para actualizar el historial en la interfaz
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

// Función para eliminar un item del historial
function eliminarItemHistorial(index) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.splice(index, 1);
    localStorage.setItem('historial', JSON.stringify(historial));
    actualizarHistorial(historial);
}

// Función para borrar todo el historial
function borrarHistorial() {
    localStorage.removeItem('historial');
    actualizarHistorial([]);
}

// Función para manejar la lectura correcta
function lecturaCorrecta(codigoTexto, codigoObjeto) {
    console.log(`Código escaneado = ${codigoTexto}`, codigoObjeto);
    mostrarResultado(codigoTexto);
}

// Función para manejar errores de lectura
function errorLectura(error) {
    console.warn(`Error de escaneo = ${error}`);
}

// Inicializar la cámara y configurar la cámara trasera como predeterminada
Html5Qrcode.getCameras().then(camaras => {
    if (camaras && camaras.length) {
        // Encontrar la cámara trasera
        const camaraTrasera = camaras.find(camara => camara.label.toLowerCase().includes('back') || camara.label.toLowerCase().includes('rear'));
        
        if (camaraTrasera) {
            let select = document.getElementById("listaCamaras");
            let html = `<option value="${camaraTrasera.id}" selected>${camaraTrasera.label}</option>`;
            camaras.forEach(camara => {
                if (camara !== camaraTrasera) {
                    html += `<option value="${camara.id}">${camara.label}</option>`;
                }
            });
            select.innerHTML = html;

            // Iniciar la cámara trasera
            html5QrCode = new Html5Qrcode("reader");
            html5QrCode.start(
                camaraTrasera.id, 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                lecturaCorrecta,
                errorLectura
            ).catch(err => {
                console.error('Error al iniciar la cámara:', err);
            });
        } else {
            console.error('No se encontró la cámara trasera.');
        }
    }
}).catch(err => {
    console.error('Error al obtener cámaras:', err);
});

// Función para seleccionar una cámara
const camaraSeleccionada = (elemento) => {
    let idCamaraSeleccionada = elemento.value;
    document.getElementById("imagenReferencial").style.display = "none";
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        idCamaraSeleccionada, 
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        lecturaCorrecta,
        errorLectura
    ).catch(err => {
        console.error('Error al iniciar la cámara:', err);
    });
}

// Función para detener la cámara
const detenerCamara = () => {
    html5QrCode.stop().then(() => {
        document.getElementById("imagenReferencial").style.display = "block";
        document.getElementById("listaCamaras").value = "";
    }).catch(err => {
        console.error('Error al detener la cámara:', err);
    });
}

// Configurar escaneo de imágenes
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
            console.error(`Error al escanear archivo. Razón: ${err}`);
        });
});

// Cargar el historial al iniciar
document.addEventListener('DOMContentLoaded', () => {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    actualizarHistorial(historial);
});

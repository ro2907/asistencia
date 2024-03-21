let students = [];
let scanner;

document.addEventListener('DOMContentLoaded', function () {
    scanner = new Instascan.Scanner({ video: document.getElementById('preview') });

    document.getElementById('scanButton').addEventListener('click', toggleScan);

    document.getElementById('tardanzaButton').addEventListener('click', function () {
        let button = document.getElementById('tardanzaButton');
        let addTardanza = button.textContent === "Tardanza";
        button.textContent = addTardanza ? "Cancelar Tardanza" : "Tardanza";
        document.getElementById('addManualButton').disabled = addTardanza;
    });

    document.getElementById('generateExcelButton').addEventListener('click', function () {
        generateExcel();
    });

    document.getElementById('addManualButton').addEventListener('click', function () {
        let manualInput = document.getElementById('manualInput');
        let studentName = manualInput.value.trim();
        if (studentName && !students.includes(studentName)) {
            students.push(studentName);
            students.sort();
            renderStudentList();
            manualInput.value = '';
        }
    });

    renderStudentList();
});

function toggleScan() {
    let button = document.getElementById('scanButton');
    if (button.textContent === "Escanear QR") {
        startScan();
        button.textContent = "No Escanear";
        button.className = "red"
    } else {
        stopScan();
        button.textContent = "Escanear QR";
        button.classList.remove('red');
    }
}

function startScan() {
    Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
            scanner.addListener('scan', handleScan);
            scanner.start(cameras[1]);
        } else {
            console.error('No se encontraron cámaras.');
        }
    }).catch(function (e) {
        console.error(e);
    });
}

function stopScan() {
    scanner.removeListener('scan', handleScan);
    scanner.stop();
}

function handleScan(content) {
    console.log('Escaneado: ' + content);
    if (!students.includes(content)) {
        students.push(content);
        students.sort();
        renderStudentList();
        displayConfirmation(content); // Mostrar la tilde sobre el código QR
    } else {
        displayCircle();
    }
}

function displayConfirmation(content) {
    let confirmationTick = document.createElement('span');
    confirmationTick.className = 'confirmation-tick';
    confirmationTick.textContent = '✓';
    document.body.appendChild(confirmationTick); // Agregar la tilde al cuerpo del documento
    setTimeout(() => {
        document.body.removeChild(confirmationTick); // Eliminar la tilde después de unos segundos
    }, 3000); // Tiempo en milisegundos antes de eliminar la tilde (en este caso, 3 segundos)
}
function displayCircle() {
    let circle = document.createElement('div');
    circle.className = 'scanned-circle';
    document.body.appendChild(circle); // Agregar el círculo al cuerpo del documento
    setTimeout(() => {
        document.body.removeChild(circle); // Eliminar el círculo después de unos segundos
    }, 3000); // Tiempo en milisegundos antes de eliminar el círculo (en este caso, 3 segundos)
}

let colorMap = {}; // Mapa para almacenar los colores asignados a cada letra
function renderStudentList() {
    let studentListElement = document.getElementById('studentList');
    studentListElement.innerHTML = '';
    students.forEach(function (student, index) {
        let listItem = document.createElement('li');
        let firstLetter = student.charAt(0).toUpperCase(); // Obtener la primera letra del nombre
        let firstLetterColor = colorMap[firstLetter]; // Verificar si ya se ha asignado un color para esta letra
        if (!firstLetterColor) {
            firstLetterColor = getRandomColor(); // Si no se ha asignado un color, generar uno aleatorio
            colorMap[firstLetter] = firstLetterColor; // Guardar el color en el mapa
        }
        listItem.innerHTML = ` <span style="color:${firstLetterColor};">${firstLetter}</span>${student.substr(1).toUpperCase()}`;
        studentListElement.appendChild(listItem);
    });
}
function getRandomColor() {
    // Generar colores más distintos
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 50) + 50; // Ajustamos la saturación para que sea más intensa
    const lightness = Math.floor(Math.random() * 25) + 50; // Mantenemos la luminosidad más alta para mayor legibilidad
    return `hsl(${hue},${saturation}%,${lightness}%)`;
}

function generateExcel() {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString().replace(/\//g, '-');
    const worksheet = XLSX.utils.aoa_to_sheet([["Nombre del Estudiante"], ...students.map(name => [name])]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');

    // Calcular la longitud del contenido más largo en la columna A
    let maxContentLength = 0;
    students.forEach(name => {
        if (name.length > maxContentLength) {
            maxContentLength = name.length;
        }
    });

    // Calcular el ancho óptimo para la columna A
    const columnWidth = maxContentLength * 1.2; // Multiplicador para ajuste fino

    // Configurar el ancho de la columna A en el objeto de hoja de cálculo
    worksheet['!cols'] = [{ width: columnWidth }];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), `asistencia-${formattedDate}.xlsx`);
}

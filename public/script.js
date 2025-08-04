const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    mode: "htmlmixed",
    theme: "default"
});

function updatePreview() {
    const preview = document.getElementById("preview").contentWindow.document;
    preview.open();
    preview.write(editor.getValue());
    preview.close();
}

function runCode() {
    const code = editor.getValue();
    const newWindow = window.open("", "_blank");
    newWindow.document.write(code);
    newWindow.document.close();
}

async function saveFile() {
    const filename = document.getElementById("filename").value;
    if (!filename) {
        alert("Unesite naziv fajla!");
        return;
    }
    const content = editor.getValue();
    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, content })
        });
        const result = await response.json();
        alert(result.message || result.error);
        loadFileList();
    } catch (err) {
        alert('Greška pri čuvanju fajla');
    }
}

async function loadFileList() {
    try {
        const response = await fetch('/files');
        const files = await response.json();
        const fileList = document.getElementById("fileList");
        fileList.innerHTML = '<option value="">Izaberi fajl</option>';
        files.forEach(file => {
            const option = document.createElement("option");
            option.value = file;
            option.textContent = file;
            fileList.appendChild(option);
        });
    } catch (err) {
        alert('Greška pri učitavanju liste fajlova');
    }
}

async function loadFile() {
    const filename = document.getElementById("fileList").value;
    if (!filename) return;
    try {
        const response = await fetch(`/file/${filename}`);
        const result = await response.json();
        if (result.content) {
            editor.setValue(result.content);
            document.getElementById("filename").value = filename;
        } else {
            alert(result.error);
        }
    } catch (err) {
        alert('Greška pri učitavanju fajla');
    }
}

updatePreview();
editor.on("change", updatePreview);
loadFileList();

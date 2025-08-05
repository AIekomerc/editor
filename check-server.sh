#!/data/data/com.termux/files/usr/bin/bash

# Postavi radni direktorijum
cd ~/projects/editor || { echo "Greška: Direktorijum ~/projects/editor ne postoji"; exit 1; }

# Funkcija za proveru i pokretanje servera
check_server() {
    echo "Proveravam status servera..."
    # Proveri node proces
    NODE_PID=$(ps aux | grep '[n]ode.*server.js' | awk '{print $2}')
    
    if [ -n "$NODE_PID" ]; then
        echo "Server je pokrenut (PID: $NODE_PID)"
        # Pokušaj dobiti vreme pokretanja
        START_TIME=$(ps -p "$NODE_PID" -o lstart | grep -v START)
        if [ -n "$START_TIME" ] && ! echo "$START_TIME" | grep -q "1970"; then
            echo "Server pokrenut u: $START_TIME"
        else
            echo "Nije moguće dobiti tačno vreme pokretanja. Koristim tekuće vreme."
            START_TIME=$(date)
            echo "Server pokrenut u (približno): $START_TIME"
        fi
        # Proveri da li server odgovara
        if curl -s http://localhost:3000/files >/dev/null 2>&1; then
            echo "Server odgovara na http://localhost:3000"
        else
            echo "Server ne odgovara. Zaustavljam i pokrećem ponovo..."
            kill -9 "$NODE_PID" 2>/dev/null
            START_TIME=$(date)
            node server.js &
            NEW_PID=$!
            sleep 2
            if curl -s http://localhost:3000/files >/dev/null 2>&1; then
                echo "Server uspešno pokrenut (PID: $NEW_PID)"
                echo "Server pokrenut u (približno): $START_TIME"
            else
                echo "Greška: Server nije pokrenut. Proveri server.js."
                cat server.js | grep -E "express|fs|exec"
                exit 1
            fi
        fi
    else
        echo "Server nije pokrenut. Pokrećem server..."
        killall node 2>/dev/null
        START_TIME=$(date)
        node server.js &
        NEW_PID=$!
        sleep 2
        if curl -s http://localhost:3000/files >/dev/null 2>&1; then
            echo "Server uspešno pokrenut (PID: $NEW_PID)"
            echo "Server pokrenut u (približno): $START_TIME"
        else
            echo "Greška: Server nije pokrenut. Proveri server.js."
            cat server.js | grep -E "express|fs|exec"
            exit 1
        fi
    fi
}

# Funkcija za testiranje ruta
test_routes() {
    echo "Testiram rute..."
    CURL_FILES=$(curl -s http://localhost:3000/files 2>/dev/null)
    if echo "$CURL_FILES" | grep -q "moj-fajl.html"; then
        echo "Ruta /files radi: $CURL_FILES"
    else
        echo "Greška: Ruta /files ne radi. Izlaz: $CURL_FILES"
        return 1
    fi

    CURL_JAVA=$(curl -s -X POST -H "Content-Type: application/json" -d '{"filename":"Test.java"}' http://localhost:3000/run-java 2>/dev/null)
    if echo "$CURL_JAVA" | grep -q "Zdravo iz Java-e"; then
        echo "Ruta /run-java radi: $CURL_JAVA"
    else
        echo "Greška: Ruta /run-java ne radi. Izlaz: $CURL_JAVA"
        return 1
    fi

    CURL_PYTHON=$(curl -s -X POST -H "Content-Type: application/json" -d '{"filename":"test.py"}' http://localhost:3000/run-python 2>/dev/null)
    if echo "$CURL_PYTHON" | grep -q "Zdravo iz Python-a"; then
        echo "Ruta /run-python radi: $CURL_PYTHON"
    else
        echo "Greška: Ruta /run-python ne radi. Izlaz: $CURL_PYTHON"
        return 1
    fi
}

# Funkcija za kopiranje fajlova
copy_files() {
    echo "Kopiram fajlove na /sdcard..."
    mkdir -p /sdcard/editor-backup/files
    cp ~/projects/editor/files/* /sdcard/editor-backup/files/ 2>/dev/null
    ls /sdcard/editor-backup/files
}

# Funkcija za Git ažuriranje
update_git() {
    echo "Ažuriram Git repozitorijum..."
    git status
    git add .
    git commit -m "Automatsko ažuriranje: provereni server i fajlovi" || echo "Nema promena za commit."
    git push origin main || echo "Greška pri push-u na Git. Proveri mrežu ili kredencijale."
}

# Funkcija za otvaranje novog terminala
open_new_terminal() {
    echo "Pokušavam da otvorim novi terminal..."
    if command -v termux-toast >/dev/null 2>&1; then
        termux-toast "Otvaram novi terminal..."
        am start -n com.termux/.app.TermuxActivity 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "Novi terminal je pokrenut."
        else
            echo "Upozorenje: Nije moguće otvoriti novi terminal jer je Termux već aktivan ili nema odgovarajućih dozvola."
            echo "Alternativa 1: Ručno otvori Termux aplikaciju dodirom na ikonicu."
            echo "Alternativa 2: Pokreni novu bash sesiju unutar trenutnog terminala sa: bash"
            echo "Proveri Termux dozvole u Podešavanjima (npr. prikaz preko drugih aplikacija)."
        fi
    else
        echo "Termux:API nije instaliran ili nije potpuno podešen."
        echo "Pokreni: pkg install termux-api"
        echo "Takođe instaliraj Termux:API aplikaciju iz Google Play Store-a."
        echo "Alternativa 1: Ručno otvori Termux aplikaciju dodirom na ikonicu."
        echo "Alternativa 2: Pokreni novu bash sesiju unutar trenutnog terminala sa: bash"
    fi
}

# Glavni program
echo "Pokrećem proveru servera i popravku grešaka..."
check_server
test_routes || { echo "Greška u rutama. Pokušaj ponovo."; exit 1; }
copy_files
update_git
open_new_terminal

echo "Sve provere su završene. Možeš nastaviti rad u bash-u."
echo "Da zaustaviš server, koristi: killall node"
echo "Da izađeš iz Termux-a, koristi: exit"

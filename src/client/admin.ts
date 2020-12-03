import './styles.scss'
import './admin.scss'

let data = {}

let wss = new WebSocket('ws' + location.href.substr(4));
wss.onmessage = e => {
    data = {...data, ...JSON.parse(e.data as string)}

    let displayRows = document
        .getElementById('devices-section')
        .getElementsByTagName('table')[0]
        .getElementsByTagName('tbody')[0] as HTMLTableSectionElement;
    
    displayRows.innerHTML = '';

    let devices: Array<any> = data["devices"] || [];

    let now = Date.now();

    devices.forEach(device => {
        let row = displayRows.insertRow();
        if (!device['alive']) row.className = "table-warning";
        row.insertCell().innerHTML = device["host"]
        row.insertCell().innerHTML = device["ip"]
        row.insertCell().innerHTML = device["erg_count"]
        row.insertCell().innerHTML = `${Math.round((now - device["last_update"])/100)/10}s`
        
        let buttons = row.insertCell()
        let closeConnectionButton = document.createElement("button")
        closeConnectionButton.className = "btn btn-outline-danger btn-sm py-0"
        closeConnectionButton.innerHTML = `
        <i class="fa fa-${device["alive"] ? 'redo-alt' : 'times'}"></i>
        `
        closeConnectionButton.onclick = ev => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', `/admin/devices/${device["host"]}/delete`, true);
            xhr.send()
        }
        buttons.appendChild(closeConnectionButton)
    })

    let ergRows = document
        .getElementById('ergs-section')
        .getElementsByTagName('table')[0]
        .getElementsByTagName('tbody')[0] as HTMLTableSectionElement;
    
    ergRows.innerHTML = '';

    let ergs: Array<any> = data["ergs"] || [];

    console.log(ergs);
    
    ergs.forEach(erg => {
        let row = ergRows.insertRow();
        if (!erg['alive']) row.className = "table-warning";
        row.insertCell().innerHTML = erg['serial'];


    })
}
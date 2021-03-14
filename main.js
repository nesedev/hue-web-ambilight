const setupWrapper = document.getElementById('setup-wrapper');
const setupBridgeWrapper = document.getElementById('setup-bridge-wrapper');
const selectBridgeWrapper = document.getElementById('select-bridge-wrapper');
const connectBridgeWrapper = document.getElementById('connect-bridge-wrapper');
const buttonBridgeWrapper = document.getElementById('button-bridge-wrapper');

const welcomeWrapper = document.getElementById('welcome-wrapper');

let connectedBridge;

try {
  connectedBridge = JSON.parse(localStorage.getItem('bridgeData')) || {};
} catch (error) {
  connectedBridge = {}
}

// init
(function() {
  if (connectedBridge.ip == null || connectedBridge.user == null) {
    connectedBridge = {};
    setupWrapper.hidden = false;
    setupBridgeWrapper.hidden = false;
  } else {
    welcome();
  }
})();

async function selectBridge() {
  setupBridgeWrapper.hidden = true;
  selectBridgeWrapper.hidden = false;

  const bridgeSelect = document.getElementById('bridge-select');
  bridgeSelect.innerHTML = '';

  const option = document.createElement("option");
  option.text = 'No bridge found';
  option.value = -1;
  option.selected = true;
  option.disabled = true;
  bridgeSelect.add(option)

  const availableBridges = await requestWarpper({url: 'https://discovery.meethue.com'}).catch(err => console.error(err));

  const noBridgeError = document.getElementById('no-bridge-error')
  noBridgeError.hidden = true;

  if (availableBridges == null || availableBridges.length == 0) {
    noBridgeError.hidden = false;
    return;
  }

  bridgeSelect.remove(0);

  availableBridges.forEach(async bridge => {
    const bridgeConfig = await requestWarpper({url: 'http://' + bridge.internalipaddress + '/api/config'}).catch(err => console.error(err));

    const option = document.createElement("option");
    option.text = bridgeConfig.name;
    option.value = bridge.internalipaddress;
    bridgeSelect.add(option)
  });
}

async function connectBridge() {
  selectBridgeWrapper.hidden = true;
  connectBridgeWrapper.hidden = false;

  const bridgeSelect = document.getElementById('bridge-select');

  connectedBridge.ip = bridgeSelect.value;

  console.log(connectedBridge);

  // test https
  const httpsResponse = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api'}).catch(err => console.error(err));
  console.log(httpsResponse);

  // if https not available show info message
  if (httpsResponse == null) {
    const connectBridgeError = document.getElementById('connect-bridge-error');
    const connectBridgeErrorText = document.getElementById('connect-bridge-error-text');
    const connectBridgeErrorLink = document.getElementById('connect-bridge-error-link');

    connectBridgeError.hidden = false;
    connectBridgeErrorText.textContent = 'In order to establish a secure connection to your hue bridge you need to add an exception on the following page';
    connectBridgeErrorLink.href = 'https://' + connectedBridge.ip + '/api';
    connectBridgeErrorLink.textContent = 'https://' + connectedBridge.ip + '/api';
  }
}

async function buttonBridge() {
  connectBridgeWrapper.hidden = true;
  buttonBridgeWrapper.hidden = false;

  const deviceName = document.getElementById('device-name').value;
  const loginRequest = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api', method: 'POST', body: {'devicetype':'hue-web-ambilight#' + deviceName}}).catch(err => console.error(err));
  console.log(loginRequest);

  document.getElementById('button-bridge-status').textContent = 'waiting...';
}

async function checkButton() {
  const deviceName = document.getElementById('device-name').value;
  const loginRequest = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api', method: 'POST', body: {'devicetype':'hue-web-ambilight#' + deviceName}}).catch(err => console.error(err));
  console.log(loginRequest);

  if (loginRequest[0].success) {
    connectedBridge.user = loginRequest[0].success.username;
    console.log(connectedBridge);
    localStorage.setItem('bridgeData', JSON.stringify(connectedBridge));
    buttonBridgeWrapper.hidden = true;
    setupWrapper.hidden = true;
    welcome();
  } else if (loginRequest[0].error) {

  }
}

async function welcome() {
  welcomeWrapper.hidden = false;

  const bridgeConfig = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api/config'}).catch(err => console.error(err));
  document.getElementById('welcome-bridge-name').textContent = bridgeConfig.name;
}

async function requestWarpper(options) {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(options.url, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body != null ? JSON.stringify(options.body) : null
    }).catch((err) => {
      reject(err);
    });
    resolve(response.json());
  });
}

// function get(url, data, format) {
//   return new Promise(function (resolve, reject) {
//     var req = new XMLHttpRequest();
//     req.open('GET', url);
//     req.responseType = format || 'json';
//     req.onload = function() {
//       // It could be a successful response but not an OK one (e.g., 3xx, 4xx).
//       if (req.status === 200) {
//         resolve(req.response);
//       } else {
//         reject(Error(req.statusText));
//       }
//     };
//     req.onerror = function() {
//       reject(Error('Network Error'));
//     };
//     req.send(data);
//   });
// }
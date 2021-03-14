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
    setupBridge();
  } else {
    welcome();
  }
})();

function setupBridge() {
  localStorage.removeItem('bridgeData');
  connectedBridge = {};
  welcomeWrapper.hidden = true;
  setupWrapper.hidden = false;
  setupBridgeWrapper.hidden = false;
}

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


  availableBridges.forEach(async (bridge, i) => {
    const bridgeConfig = await requestWarpper({url: 'https://' + bridge.internalipaddress + '/api/config'}).catch(err => console.error(err));
    
    // if https not available show info message
    if (bridgeConfig == null) {
      const httpsError = document.getElementById('https-error');
      const httpsErrorText = document.getElementById('https-error-text');
      const httpsErrorLink = document.getElementById('https-error-link');

      httpsError.hidden = false;
      httpsErrorText.textContent = 'In order to establish a secure connection to your Hue Bridge you need to add an exception on the following page';
      httpsErrorLink.href = 'https://' + bridge.internalipaddress;
      httpsErrorLink.textContent = 'https://' + bridge.internalipaddress;

      return;
    }

    if (i == 0) bridgeSelect.remove(0);

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
}

async function buttonBridge() {
  connectBridgeWrapper.hidden = true;
  buttonBridgeWrapper.hidden = false;

  const deviceName = document.getElementById('device-name').value;
  const loginRequest = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api', method: 'POST', body: {'devicetype':'hue-web-ambilight#' + deviceName}}).catch(err => console.error(err));
  console.log(loginRequest);

  checkButton(1);
}

let checkButtonReset = false;
let checkButtonTimeout;
async function checkButton(delay) {
  document.getElementById('button-bridge-status').textContent = 'Waiting, checking again in ' + delay + ' seconds...';

  const deviceName = document.getElementById('device-name').value;
  const loginRequest = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api', method: 'POST', body: {'devicetype':'hue-web-ambilight#' + deviceName}}).catch(err => console.error(err));
  console.log(loginRequest);

  if (loginRequest[0].success) {
    clearTimeout(checkButtonTimeout);

    connectedBridge.user = loginRequest[0].success.username;
    console.log(connectedBridge);
    localStorage.setItem('bridgeData', JSON.stringify(connectedBridge));

    buttonBridgeWrapper.hidden = true;
    setupWrapper.hidden = true;
    
    welcome();
  } else if (loginRequest[0].error) {
    if (checkButtonReset) {
      clearTimeout(checkButtonTimeout);
    }

    if (!delay) delay = 1;

    checkButtonTimeout = setTimeout(function() {
      checkButton(delay+1);
    }, delay*1000);
  }
}

async function welcome() {
  welcomeWrapper.hidden = false;

  // check connection
  const publicConfig = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api/config'}).catch(err => console.error(err));

  console.log(publicConfig)

  const welcomeError = document.getElementById('welcome-error');

  if (!publicConfig) {
    console.error('could not connect to bridge');
    welcomeError.textContent = 'Could not reach bridge at ' + connectedBridge.ip;
    welcomeError.hidden = false;
    // TODO: check if ssl error, show warning
    // setupBridge();
  }
  
  document.getElementById('welcome-bridge-name').textContent = publicConfig.name;

  // check user
  const privateConfig = await requestWarpper({url: 'https://' + connectedBridge.ip + '/api/' + connectedBridge.user}).catch(err => console.error(err));

  if (!privateConfig.config) {
    console.error('could not authenticate user on bridge');
    welcomeError.textContent = 'User authentication failed';
    welcomeError.hidden = false;
  }
}

function disconnect() {
  setupBridge();
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
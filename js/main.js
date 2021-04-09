let arConnectInstalled = false;

const connectButton = document.querySelector("#connect");
const userinfo = document.querySelector("#userinfo");
const currentAddressElement = document.querySelector("#address");
const disconnectButton = document.querySelector("#disconnect");
const createTXButton = document.querySelector("#createTX");
const encryptButton = document.querySelector("#encrypt");

// wait for the ArConnect script to be injected into the window object
window.addEventListener("arweaveWalletLoaded", async () => {
  connectButton.innerHTML = "Connect to ArConnect";
  arConnectInstalled = true;

  const loggedIn = (await window.arweaveWallet.getPermissions()).length > 0;
  if(loggedIn) await loadData();
});

// update address element on active / current address update
window.addEventListener("walletSwitch", (e) => {
  const newAddress = e.detail.address;
  currentAddressElement.innerHTML = newAddress;
})

connectButton.onclick = async () => {
  // open install website if ArConnect is not installed
  if(!arConnectInstalled) return window.open("https://arconnect.io");
  try {
    // connect to ArConnect with permissions and app info
    // !!app info is not available in ArConnect 0.2.2!!
    await window.arweaveWallet.connect(["ACCESS_ADDRESS", "ACCESS_ALL_ADDRESSES", "SIGN_TRANSACTION", "ENCRYPT", "DECRYPT"], { name: "Super Cool App", logo: "https://verto.exchange/logo_dark.svg" });

    await loadData();
  } catch {
    console.log("Failed to connect to ArConnect");
  }
}

disconnectButton.onclick = async () => {
  // disconnect from ArConnect / sign out
  await window.arweaveWallet.disconnect();

  // display connect button
  connectButton.style.display = "block";
  
  // hide disconnect and tx button
  disconnect.style.display = "none";
  createTXButton.style.display = "none";
  encryptButton.style.display = "none";

  // remove user data
  userinfo.innerHTML = "";

  // remove current address
  currentAddressElement.innerHTML = "";
}

createTXButton.onclick = async () => {
  const arweave = Arweave.init();
  const tx = await arweave.createTransaction({
    data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>'
  });
  tx.addTag("Content-Type", "text/html")

  console.log("TX created: \n", tx);

  await window.arweaveWallet.sign(tx);
  console.log("TX signed: \n", tx);
};

encryptButton.onclick = async () => {
  // encrypt
  const data = await window.arweaveWallet.encrypt("Test data ", {
    algorithm: "RSA-OAEP",
    hash: "SHA-256",
  });

  console.log("Encrypted:", data);
  
  // decrypt
  const res = await window.arweaveWallet.decrypt(data, {
    algorithm: "RSA-OAEP",
    hash: "SHA-256",
  });

  console.log("Decrypted:", res);
};

// load userinfo from ArConnect
async function loadData() {
  // get the currently selected wallet's address from ArConnect
  const address = await window.arweaveWallet.getActiveAddress();

  // get all addresses from ArConnect
  const addresses = await window.arweaveWallet.getAllAddresses();

  // remove connect button
  connectButton.style.display = "none";

  // show disconnect and create tx button
  disconnect.style.display = "block";
  createTXButton.style.display = "block";
  encryptButton.style.display = "block";

  // fill data in html
  userinfo.innerHTML = `
    Addresses added to ArConnect:
    <br />
    <br />
    ${addresses.join("<br/>")}
  `;

  // fill current address element
  currentAddressElement.innerHTML = address;
}
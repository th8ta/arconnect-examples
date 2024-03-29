let arConnectInstalled = false;

const connectButton = document.querySelector("#connect");
const userinfo = document.querySelector("#userinfo");
const currentAddressElement = document.querySelector("#address");
const disconnectButton = document.querySelector("#disconnect");
const createTXButton = document.querySelector("#createTX");
const dispatchButton = document.querySelector("#dispatch");
const encryptButton = document.querySelector("#encrypt");
const signatureButton = document.querySelector("#signature");

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
    await window.arweaveWallet.connect(["ACCESS_ADDRESS", "ACCESS_ALL_ADDRESSES", "SIGN_TRANSACTION", "ENCRYPT", "DECRYPT", "SIGNATURE", "ACCESS_ARWEAVE_CONFIG", "ACCESS_PUBLIC_KEY", "DISPATCH"], { name: "Super Cool App", logo: "https://verto.exchange/logo_dark.svg" });

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
  const toSetVisible = document.getElementsByClassName("visible-on-connect");

  for (const el of toSetVisible) {
    el.style.display = "none";
  }

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

  await arweave.transactions.sign(tx);
  console.log("TX signed: \n", tx);

  let uploader = await arweave.transactions.getUploader(tx);

  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
  }

  console.log("Tx uploaded", tx.id);
};

dispatchButton.onclick = async () => {
  const arweave = Arweave.init();
  const tx = await arweave.createTransaction({
    data: "test"
  });

  tx.addTag("Content-Type", "text/plain")
  tx.addTag("App-Name", "SmartWeaveAction");
  tx.addTag("App-Version", "0.3.0");
  tx.addTag("Contract", "d2DK6QGY_YBJxuR2bkLzgMWGbqUjvS1nTe53rPDSzSE");
  tx.addTag("Input", '{"function":"mint"}');

  const res = await window.arweaveWallet.dispatch(tx);

  console.log("Tx dispatched:", res);
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

signatureButton.onclick = async () => {
  // sign
  const signature = await window.arweaveWallet.signature(new TextEncoder().encode("Data to sign"), {
    name: 'RSA-PSS',
    saltLength: 0,
  });

  console.log("Signature is:", signature);
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
  const toSetVisible = document.getElementsByClassName("visible-on-connect");

  for (const el of toSetVisible) {
    el.style.display = "block";
  }

  // get wallet names
  const walletNames = await window.arweaveWallet.getWalletNames();

  // get permissions
  const perms = await window.arweaveWallet.getPermissions();

  // get gateway info
  const config = await window.arweaveWallet.getArweaveConfig();

  // public key
  const publicKey = await window.arweaveWallet.getActivePublicKey();

  // fill data in html
  userinfo.innerHTML = `
    Addresses added to ArConnect:
    <br />
    <br />
    ${addresses.join("<br />")}
    <br /><br />Wallet names:<br /><br />
    ${Object.values(walletNames).join("<br />")}
    <br /><br />Permissions:<br /><br />
    ${perms.join("<br />")}
    <br /><br />Gateway: ${config.protocol}://${config.host}:${config.port}<br /><br />
    Public key: ${publicKey}<br />
  `;

  // fill current address element
  currentAddressElement.innerHTML = address;
}
let arConnectInstalled = false;

const connectButton = document.querySelector("#connect");
const userinfo = document.querySelector("#userinfo");
const currentAddressElement = document.querySelector("#address");
const disconnectButton = document.querySelector("#disconnect");

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
    await window.arweaveWallet.connect(["ACCESS_ADDRESS", "ACCESS_ALL_ADDRESSES"], { name: "Super Cool App", logo: "https://verto.exchange/logo_dark.svg" });

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
  
  // hide disconnect button
  disconnect.style.display = "none";

  // remove user data
  userinfo.innerHTML = "";

  // remove current address
  currentAddressElement.innerHTML = "";
}

// load userinfo from ArConnect
async function loadData() {
  // get the currently selected wallet's address from ArConnect
  const address = await window.arweaveWallet.getActiveAddress();

  // get all addresses from ArConnect
  const addresses = await window.arweaveWallet.getAllAddresses();

  // remove connect button
  connectButton.style.display = "none";

  // show disconnect button
  disconnect.style.display = "block";

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
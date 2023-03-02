// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.


function onLoad() {
  addEventListeners();
  // If metamask is not present then replace wallet connect button
  console.log("Metamask present: ", isMetamaskPresent());
  if (!isMetamaskPresent()) {
    toggleHidden("#wallet-connect-button", "#metamask-install-button", "#wallet-connect-text", "#metamask-install-text");
  }
}


// Metamask handlers

function isMetamaskPresent() {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

function connectMetamask() {
  if (!isMetamaskPresent()) return Promise.reject("Metamask is not present");
  disable("#wallet-connect-button", "#wallet-connect-text");
  return ethereum.request({ method: 'eth_requestAccounts' })
    .then(addresses => {
      if (addresses && addresses.length > 0) {
        $("#address-dropdown-button").text(addresses[0].slice(0,6)+'...'+addresses[0].slice(-4));
        toggleHidden("#wallet-connect-button", "#address-dropdown-button");
        toggleHidden("#welcome-content", "#connected-content");
      }
      enable("#wallet-connect-button", "#wallet-connect-text");
    })
}

// Event handlers

function addEventListeners() {

  let dndDragCount = 0;

  function onDndDragEnter(event) {
    if (dndDragCount++ === 0) event.currentTarget.classList.add("dnd-box-valid-dragover");
  }
  
  function onDndDragOver(event) {
    event.preventDefault();
  }
  
  function onDndDragLeave(event) {
    if (--dndDragCount === 0) event.currentTarget.classList.remove("dnd-box-valid-dragover");
  }
  
  function onDndDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    dndDragCount = 0;
    event.currentTarget.classList.remove("dnd-box-valid-dragover");
    console.log(Array.from(event.dataTransfer.files));
  }
  
  function onDndBoxClick() {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        let files =   Array.from(input.files);
        console.log(files);
      };
    input.click();
  }
  
  const dndBox = document.getElementById('dnd-box');
  dndBox.addEventListener('dragenter', onDndDragEnter);
  dndBox.addEventListener('dragover', onDndDragOver);
  dndBox.addEventListener('dragleave', onDndDragLeave);
  dndBox.addEventListener('drop', onDndDrop);
  dndBox.addEventListener('click', onDndBoxClick);
}


// CSS setters

function toggleHidden(...ids) {
  ids.forEach(id => { $(id).toggleClass('hidden') });
}

function disable(...ids) {
  ids.forEach(id => { $(id).addClass('disabled') });
}

function enable(...ids) {
  ids.forEach(id => { $(id).removeClass('disabled') });
}
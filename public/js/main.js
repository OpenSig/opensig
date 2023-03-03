// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import {opensig} from "./opensig.js";

function onLoad() {
  initialiseDndBox();

  // If metamask is not present then replace wallet connect button
  if (!isMetamaskPresent()) {
    toggleHidden("#wallet-connect-button", "#metamask-install-button", "#wallet-connect-text", "#metamask-install-text");
  }

}
window.onLoad = onLoad;


function verifyFiles(files) {
  if (files.length === 0) return;
  opensig.verify(files[0])
    .then(signatures => {
      setContent("#signature-content");
      $("#filename").text(files[0].name);
      if (signatures.length === 0) {
        hide("#signatures-label", "#signature-box")
        show("#no-signatures-label");
      }
      else {
        show("#signatures-label", "#signature-box")
        hide("#no-signatures-label");
        const sigList = $("#signature-list");
        sigList.innerHTML = '';
        signatures.forEach(sig => {
          const element = createElement('div', 'signature');
          element.appendChild(createElement('span', 'signature-date-field', "18-Jun-28 08:35"));
          element.appendChild(createElement('span', 'signature-who-field', sig.topics[0]));
          element.appendChild(createElement('span', 'signature-comment-field', sig.topics[1]));
          sigList.append(element);
        })
      }
    })
    .catch(console.error);
}


function setContent(id) {
  hide("#welcome-content", "#connected-content", "#signature-content")
  show(id);
}

function createElement(type, classes, innerHTML) {
  const element = document.createElement(type);
  element.className = classes;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

//
// Metamask interface functions
//

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
        setContent("#connected-content");
      }
      enable("#wallet-connect-button", "#wallet-connect-text");
    })
}
window.connectMetamask = connectMetamask;


//
// Drag and Drop Box functionality
//

function initialiseDndBox() {

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
    verifyFiles(Array.from(event.dataTransfer.files));
  }
  
  function onDndBoxClick() {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        verifyFiles(Array.from(input.files));
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


//
// CSS functions
//

function hide(...ids) {
  ids.forEach(id => { $(id).addClass('hidden') });
}

function show(...ids) {
  ids.forEach(id => { $(id).removeClass('hidden') });
}

function toggleHidden(...ids) {
  ids.forEach(id => { $(id).toggleClass('hidden') });
}

function disable(...ids) {
  ids.forEach(id => { $(id).addClass('disabled') });
}

function enable(...ids) {
  ids.forEach(id => { $(id).removeClass('disabled') });
}
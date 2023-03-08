// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import {opensig} from "./opensig.js";

const TRACE_ON = true;
const DEBUG_ON = true;
console.trace = TRACE_ON ? Function.prototype.bind.call(console.info, console, "[trace]") : function() {};
console.debug = DEBUG_ON ? Function.prototype.bind.call(console.info, console, "[debug]") : function() {};


//
// Controller functions
//

let currentFile = undefined;

function onLoad() {
  initialiseDndBox();

  // If metamask is present then replace wallet install button
  isMetamaskPresent()
    .then(present => {
      if (present) toggleHidden("#wallet-connect-button", "#metamask-install-button", "#wallet-connect-text", "#metamask-install-text");
    });

  setContent("#welcome-content");

}
window.onLoad = onLoad;


function verify(file) {
  clearError();
  hide("#dnd-box");
  show("#dnd-box-spinner");
  currentFile = new opensig.File(file);
  currentFile.verify()
    .then(_updateSignatureContent)
    .catch(displayError)
    .finally(() => {
      show("#dnd-box");
      hide("#dnd-box-spinner");
    });
}


function reverify() {
  if (!currentFile) return;
  clearError();
  clearSignatureContent();
  currentFile.verify()
    .then(_updateSignatureContent)
    .catch(displayError);
}
window.reverify = reverify;


function sign() {
  clearError();
  const content = $("#signature-data").val();
  const dataType = content.slice(0,2) === '0x' ? 'hex' : 'string';
  const data = {
    type: dataType,
    encrypted: $("#data-encrypt-checkbox").is(":checked"),
    content: content
  }
  const file = currentFile;
  file.sign(data)
    .then(result => {
      _appendUnconfirmedSignature(result.signatory, content);
      show("#signatures-label", "#signature-box")
      hide("#no-signatures-label");
      return result.confirmationInformer;
     })
    .then(file.verify)
    .then(_updateSignatureContent)
    .catch(error => {
      if (error.code !== 4001) displayError(error); // ignore metamask user reject
    })
}
window.sign = sign;


//
// Metamask interface functions
//

function isMetamaskPresent() {

  function detectMetamask() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  }

  return new Promise((resolve) => {
    if (detectMetamask()) resolve(true);
    else {
      let eventFired = false;
      window.addEventListener('ethereum#initialized', () => {eventFired = true; resolve(detectMetamask())}, {
        once: true,
      });
      setTimeout(() => {
        resolve(detectMetamask())
      }, 3000);
    }
  });
}

function connectMetamask() {
  if (!isMetamaskPresent()) return Promise.reject("Metamask is not present");
  disable("#wallet-connect-button", "#wallet-connect-text");
  ethereum.on('accountsChanged', setMetamaskAccount);
  return ethereum.request({ method: 'eth_requestAccounts' })
    .then(setMetamaskAccount);
}
window.connectMetamask = connectMetamask;

function setMetamaskAccount(accounts) {
  if (accounts && accounts.length > 0) {
    $("#address-dropdown-button").text(accounts[0].slice(0,6)+'...'+accounts[0].slice(-4));
    hide("#wallet-connect-button");
    show("#address-dropdown-button");
    if (currentContent === '#welcome-content') setContent("#connected-content");
  }
  enable("#wallet-connect-button", "#wallet-connect-text");
}


//
// UI update functions
//

const DATE_FORMAT_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
let currentContent = undefined;

function setContent(id) {
  hide("#welcome-content", "#connected-content", "#signature-content")
  show(id);
  currentContent = id;
}
window.setContent = setContent;

function clearSignatureContent() {
  $("#signature-list").empty();
}

function _updateSignatureContent(signatures) {
  console.trace("found signatures: ", signatures);
  setContent("#signature-content");
  $("#filename").text(currentFile.file.name);
  const sigList = $("#signature-list");
  sigList.empty();
  if (signatures.length === 0) {
    hide("#signatures-label", "#signature-box")
    show("#no-signatures-label");
  }
  else {
    show("#signatures-label", "#signature-box")
    hide("#no-signatures-label");
    signatures.forEach(sig => {
      const element = createElement('div', 'signature');
      element.appendChild(createElement('span', 'signature-date-field', new Date(sig.time*1000).toLocaleString([], DATE_FORMAT_OPTIONS)));
      element.appendChild(createElement('span', 'signature-who-field', sig.signatory));
      element.appendChild(createElement('span', 'signature-comment-field', sig.data.content)); // TODO support different data types
      sigList.append(element);
    })
  }
}

function _appendUnconfirmedSignature(signatory, data) {
  const element = createElement('div', 'signature');
  const spinnerFrame = createElement('div', 'signature-spinner-frame');
  const spinner = createElement('div', "spinner");
  spinner.appendChild(createElement('div', ''));
  spinner.appendChild(createElement('div', ''));
  spinnerFrame.appendChild(spinner);
  element.appendChild(spinnerFrame);
  element.appendChild(createElement('span', 'signature-who-field', signatory));
  element.appendChild(createElement('span', 'signature-comment-field', data)); // TODO support different data types
  const sigList = $("#signature-list");
  sigList.append(element);
}

function createElement(type, classes, innerHTML) {
  const element = document.createElement(type);
  element.className = classes;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

function displayError(error) {
  console.error(error);
  console.log("Error:", error.message || error);
  $(currentContent+"-error-message").text(error.message || error);
}

function clearError() {
  $("#connected-content-error-message").text('');
  $("#signature-content-error-message").text('');
}


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
    const files =  Array.from(event.dataTransfer.files);
    if (files.length > 0) verify(files[0]);
  }
  
  function onDndBoxClick() {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        const files =  Array.from(input.files);
        if (files.length > 0) verify(files[0]);
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
// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import {opensig} from "./opensig.js";

const TRACE_ON = true;
console.trace = (...args) => { if (TRACE_ON) console.log(args) };


//
// Controller functions
//

let currentFile = undefined;

function onLoad() {
  initialiseDndBox();

  // If metamask is not present then replace wallet connect button
  if (!isMetamaskPresent()) {
    toggleHidden("#wallet-connect-button", "#metamask-install-button", "#wallet-connect-text", "#metamask-install-text");
  }

  setContent("#welcome-content");

}
window.onLoad = onLoad;


function verify(file) {
  clearError();
  currentFile = new opensig.File(file);
  currentFile.verify()
    .then(_updateSignatureContent)
    .catch(displayError);
}


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
  console.log("sign")
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


function _updateSignatureContent(signatures) {
  console.log("found signatures: ", signatures);
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
  console.trace(error);
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
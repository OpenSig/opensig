// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.


const TRACE_ON = true;
const DEBUG_ON = true;
console.trace = TRACE_ON ? Function.prototype.bind.call(console.info, console, "[trace]") : function() {};
console.debug = DEBUG_ON ? Function.prototype.bind.call(console.info, console, "[debug]") : function() {};

const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;


//
// Controller functions
//

let currentFile = undefined;

function onLoad() {
  initialiseDndBox();
  const urlParams = new URLSearchParams(window.location.search);
  const urlFile = urlParams.get('file');
  if (urlFile) verifyUrl(urlFile);
}
window.onLoad = onLoad;


function verifyUrl(url) {
  fetch(url)
    .then(result => result.blob())
    .then(blob => { blob.name = url; return blob })
    .then(verify)
    .catch(displayError);
}

function verify(fileOrBlob) {
  clearError();
  const network = getBlockchain(137);
  if (!network) displayError("Blockchain not supported")
  else {
    hide("#dnd-box");
    show("#dnd-box-spinner");
    currentFile = new opensig.File(network, fileOrBlob);
    currentFile.verify()
      .then(_updateSignatureContent)
      .catch(displayError)
      .finally(() => {
        show("#dnd-box");
        hide("#dnd-box-spinner");
      });
  }
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
    signatures.sort((a,b) => Number(b.time) - Number(a.time)).forEach(sig => {
      const element = createElement('div', 'signature');
      const signatureDate = typeof sig.time === 'bigint' ? Number(sig.time) : sig.time;
      element.appendChild(createElement('span', 'signature-date-field', new Date(signatureDate * 1000).toLocaleString([], DATE_FORMAT_OPTIONS)));
      const signatory = createElement('span', 'signature-who-field', sig.signatory);
      const txLink = createElement('a', 'signature-who-field');
      txLink.appendChild(signatory);
      txLink.title = "Click to view this signature's blockchain transaction";
      txLink.href = currentFile.network.params.explorerUrl + sig.event.transactionHash;
      txLink.target = "_blank";
      element.appendChild(txLink);
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

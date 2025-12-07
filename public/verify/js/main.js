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
    $("#filename").text(fileOrBlob.name || fileOrBlob.url || 'Unnamed file');
    $("#filetype").text(fileOrBlob.type ? mimetypeToHumanReadable(fileOrBlob.type) : 'Binary');
    $("#filesize").text(fileOrBlob.size ? formatBytes(fileOrBlob.size) : 'Unknown size');
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
  show("#reverify-spinner");
  currentFile.verify()
    .then(_updateSignatureContent)
    .catch(displayError)
    .finally(() => {
      hide("#reverify-spinner");
    });
}
window.reverify = reverify;


//
// Helper functions
//

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function mimetypeToHumanReadable(mimeType) {
  if (mimeType === 'undefined' || !mimeType) return "Unknown";
  const fallback = mimeType.split("/").pop()?.toUpperCase() || "UNKNOWN";
  return mimeTypeToHuman[mimeType] || fallback.replace(/[-+]/g, " ").toUpperCase();
}

const mimeTypeToHuman = {
  // Documents
  "application/pdf": "PDF",
  "application/msword": "Word Document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document (DOCX)",
  "application/vnd.ms-excel": "Excel Spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet (XLSX)",
  "application/vnd.ms-powerpoint": "PowerPoint Presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation (PPTX)",
  "text/plain": "Text File",
  "text/csv": "CSV File",
  "application/rtf": "Rich Text Format",
  "application/json": "JSON File",
  "application/xml": "XML File",
  "text/html": "HTML File",
  
  // Images
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/gif": "GIF Image",
  "image/bmp": "Bitmap Image",
  "image/webp": "WebP Image",
  "image/svg+xml": "SVG Image",
  "image/heif": "HEIF Image",
  
  // Audio
  "audio/mpeg": "MP3 Audio",
  "audio/wav": "WAV Audio",
  "audio/ogg": "OGG Audio",
  "audio/webm": "WebM Audio",

  // Video
  "video/mp4": "MP4 Video",
  "video/x-msvideo": "AVI Video",
  "video/webm": "WebM Video",
  "video/quicktime": "QuickTime Video",
  "video/x-matroska": "MKV Video",

  // Compressed
  "application/zip": "ZIP Archive",
  "application/x-7z-compressed": "7-Zip Archive",
  "application/x-rar-compressed": "RAR Archive",
  "application/gzip": "GZIP Archive",
  "application/x-tar": "TAR Archive",

  // Misc
  "application/octet-stream": "Binary File",
  "application/x-sh": "Shell Script",
  "application/x-bash": "Bash Script",
};

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
  hide("#signatures-label", "#signature-box");
}

function _updateSignatureContent(signatures) {
  console.trace("found signatures: ", signatures);
  $("#signature-count").text(signatures.length);
  $("#proof-plural-suffix").text(signatures.length === 1 ? '' : 's');
  setContent("#signature-content");
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
      const signatoryRow = createElement('div', 'signature-content-row');
      const signatory = createElement('span', 'signatory', sig.signatory);
      signatoryRow.appendChild(signatory);
      const signatureDate = typeof sig.time === 'bigint' ? Number(sig.time) : sig.time;
      signatoryRow.appendChild(createElement('span', 'sigTime', new Date(signatureDate * 1000).toLocaleString([], DATE_FORMAT_OPTIONS)));
      element.appendChild(signatoryRow);
      element.appendChild(createElement('span', 'statusText', 'Verified proof'));
      element.appendChild(createElement('span', 'sigMessage', sig.data.encrypted ? `🔒 ${sig.data.content}` : sig.data.content)); // TODO support different data types
      sigList.append(element);
    })
  }
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

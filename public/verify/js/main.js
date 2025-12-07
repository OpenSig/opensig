// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.


const TRACE_ON = true;
const DEBUG_ON = true;
console.trace = TRACE_ON ? Function.prototype.bind.call(console.info, console, "[trace]") : function() {};
console.debug = DEBUG_ON ? Function.prototype.bind.call(console.info, console, "[debug]") : function() {};

//
// Setup OpenSig for Polygon Mainnet
//

const registryContract = {
  address: "0x4037E81D79aD0E917De012dE009ff41c740BB453",
  creationBlock: 40031474
};

const signer = new ethers.Wallet(
  "0xc02b59f772cb23a75b6ffb9f7602ba25fdd5d8e75ad88efcc013fec2c63b0895",  // dummy private key
  new ethers.JsonRpcProvider("https://polygon-rpc.com")  // provider used for publishing signatures
);

const POLYGON_MAINNET = new opensig.EthersProvider(
  137,
  registryContract, 
  signer, 
  new ethers.InfuraProvider("matic", "def9d47e2d744b90b2b68cf690db503a")
);

const EXPLORER_URL = "https://polygonscan.com/tx/";

console.debug(opensig);

const os = new opensig.OpenSig(POLYGON_MAINNET);


//
// Controller functions
//

let currentFile = undefined;
let currentNetwork = undefined;

function onLoad() {
  initialiseDndBox();
  initialiseModal();
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

async function verify(fileOrBlob) {
  clearError();
  $("#filename").text(fileOrBlob.name || fileOrBlob.url || 'Unnamed file');
  $("#filetype").text(fileOrBlob.type ? mimetypeToHumanReadable(fileOrBlob.type) : 'Binary');
  $("#filesize").text(fileOrBlob.size ? formatBytes(fileOrBlob.size) : 'Unknown size');
  hide("#dnd-box");
  show("#dnd-box-spinner");
  currentFile = await os.createDocument(fileOrBlob);
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
      const sigMessage = renderSignatureMessage(sig);
      element.appendChild(createElement('span', 'sigMessage', sig.data?.encrypted && sigMessage ? `🔒 ${sigMessage}` : sigMessage || ''));
      element.addEventListener('click', () => showSignatureModal(sig));
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


function formatProofTimestamp(time) {
  if (time === undefined || time === null) return 'Publishing…';
  const numericTime = typeof time === 'bigint' ? Number(time) : time;
  if (Number.isNaN(numericTime)) return 'Publishing…';
  const date = new Date(numericTime * 1000);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} (UTC)`;
}

function renderSignatureMessage(sig) {
  if (!sig?.data) return '';
  if (sig.data.type === 'string' && typeof sig.data.content === 'string') return sig.data.content || '';
  if (sig.data.type === 'object' && sig.data.content && sig.data.content.m) return sig.data.content.m;
  if (typeof sig.data.content === 'string') return sig.data.content;
  return '';
}

function initialiseModal() {
  $("#modal-close").on('click', hideSignatureModal);
  $(".modal-scrim").on('click', hideSignatureModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideSignatureModal();
  });
}

function hideSignatureModal() {
  $("#signature-modal").addClass('hidden');
}

function showSignatureModal(sig) {
  const hasTimestamp = sig.time !== undefined && sig.time !== null;
  $("#modal-status-text").text(hasTimestamp ? 'Confirmed on public record' : 'Publishing…');
  $("#modal-status-text").toggleClass('modal-status-pending', !hasTimestamp);
  $("#modal-status-icon").text(hasTimestamp ? '✓' : '⏳');

  $("#modal-signer-text").text(`Published by ${sig.signatory}`);
  $("#modal-timestamp").text(formatProofTimestamp(sig.time));
  $("#modal-signer-id").text(opensig.toOpenSigId(sig.signatory));
  $("#modal-signer-address").text(sig.signatory || '—');
  $("#modal-signature").text(sig.signature || '—');

  if (sig.txHash) {
    $("#modal-tx-row").removeClass('hidden');
    $("#modal-tx").text(sig.txHash);
  }
  else {
    $("#modal-tx-row").addClass('hidden');
    $("#modal-tx").text('');
  }

  const message = renderSignatureMessage(sig);
  const isEncrypted = Boolean(sig.data?.encrypted);
  const messageTitleSuffix = message ? (isEncrypted ? ' (encrypted)' : ' (public)') : '';
  $("#modal-message-title").text(`Signer's message${messageTitleSuffix}`);
  $("#modal-message").text(message || 'None');
  $("#modal-message").toggleClass('modal-section-muted', !message);
  $("#modal-message-helper").toggleClass('hidden', !(message && isEncrypted));
  $("#modal-proof-link").removeClass('disabled');
  $("#modal-proof-link").attr('href', EXPLORER_URL + sig.txHash + '#eventlog');
  $("#signature-modal").removeClass('hidden');
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

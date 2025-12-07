const SITE_KEY = '6Ldgqy4lAAAAAD5QHvrZJxWebQrUXvexxEdsZ4Ws';
const overlay = document.querySelector('.lead-form-overlay');
const form = document.getElementById('lead-form');
const triggers = document.querySelectorAll('.lead-form-trigger');
const closeBtn = document.querySelector('.lead-form-close');
const titleEl = document.getElementById('lead-form-title');
const subtitleEl = document.getElementById('lead-form-subtitle');
const intentInput = document.getElementById('lead-intent');
const statusEl = document.getElementById('lead-form-status');
const submitBtn = form ? form.querySelector('.lead-form-submit') : null;
const firstField = document.getElementById('lead-name');
const useCaseSelect = document.getElementById('lead-use-case');
const recaptchaInput = document.getElementById('lead-recaptcha-token');

let lastFocusedElement = null;
let currentMode = 'walkthrough';

const copyMap = {
  walkthrough: {
    title: 'Book a walkthrough',
    subtitle: 'Tell us about your workflow and we will tailor a live session.',
    submit: 'Send request',
    intent: 'Walkthrough'
  },
  earlyAccess: {
    title: 'Request early access',
    subtitle: 'Share how you plan to use OpenSig and we will follow up with next steps.',
    submit: 'Submit request',
    intent: 'Early Access'
  }
};

const setFormCopy = function (modeKey) {
  if (!titleEl || !subtitleEl || !submitBtn || !intentInput) {
    return;
  }
  const copy = copyMap[modeKey] || copyMap.walkthrough;
  currentMode = copyMap[modeKey] ? modeKey : 'walkthrough';
  titleEl.textContent = copy.title;
  subtitleEl.textContent = copy.subtitle;
  submitBtn.textContent = copy.submit;
  submitBtn.dataset.defaultText = copy.submit;
  intentInput.value = copy.intent;
};

const showStatus = function (message, type) {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message || '';
  statusEl.classList.remove('success', 'error');
  if (type) {
    statusEl.classList.add(type);
  }
};

const setSubmitState = function (disabled, temporaryLabel) {
  if (!submitBtn) {
    return;
  }
  submitBtn.disabled = !!disabled;
  if (temporaryLabel) {
    submitBtn.textContent = temporaryLabel;
  } else if (submitBtn.dataset.defaultText) {
    submitBtn.textContent = submitBtn.dataset.defaultText;
  }
};

const openLeadForm = function (modeKey) {
  if (!overlay) {
    return;
  }
  if (form) {
    form.reset();
    if (useCaseSelect) {
      useCaseSelect.selectedIndex = 0;
    }
  }
  setFormCopy(modeKey);
  showStatus('');
  setSubmitState(false);
  if (recaptchaInput) {
    recaptchaInput.value = '';
  }
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  if (typeof closeMenu === 'function') closeMenu();
  if (firstField) {
    setTimeout(function () {
      firstField.focus();
    }, 100);
  }
};

const closeLeadForm = function () {
  if (!overlay) {
    return;
  }
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  showStatus('');
  setSubmitState(false);
  if (recaptchaInput) {
    recaptchaInput.value = '';
  }
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
};

if (form) {
  setFormCopy(currentMode);
}

if (triggers && triggers.length) {
  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      const modeKey = trigger.getAttribute('data-intent') || 'walkthrough';
      openLeadForm(modeKey);
    });
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', function () {
    closeLeadForm();
  });
}

if (overlay) {
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) {
      closeLeadForm();
    }
  });
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && overlay && overlay.classList.contains('open')) {
    closeLeadForm();
  }
});

const submitForm = function () {
  if (!form) {
    return;
  }
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const endpoint = (typeof window.OPEN_SIG_LEAD_ENDPOINT === 'string' && window.OPEN_SIG_LEAD_ENDPOINT.trim().length > 0)
    ? window.OPEN_SIG_LEAD_ENDPOINT
    : form.getAttribute('data-endpoint');

  if (!endpoint) {
    showStatus('Form endpoint is not configured.', 'error');
    return;
  }

  setSubmitState(true, 'Sending...');
  showStatus('');

  const submitPayload = function () {
    const formData = new FormData(form);
    const payload = {};
    formData.forEach(function (value, key) {
      payload[key] = value;
    });

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return response.text().catch(function () {
          return '';
        });
      })
      .then(function () {
        showStatus('Thanks! We will be in touch shortly.', 'success');
        form.reset();
        if (useCaseSelect) {
          useCaseSelect.selectedIndex = 0;
        }
        setFormCopy(currentMode);
        setSubmitState(false);
        if (recaptchaInput) {
          recaptchaInput.value = '';
        }
        setTimeout(function () {
          closeLeadForm();
        }, 2400);
      })
      .catch(function () {
        showStatus('Something went wrong. Please try again or email info@opensig.net.', 'error');
        setSubmitState(false);
      });
  };

  const executeRecaptcha = function () {
    if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
      submitPayload();
      return;
    }
    window.grecaptcha.ready(function () {
      window.grecaptcha.execute(SITE_KEY, { action: 'leadForm' })
        .then(function (token) {
          if (recaptchaInput) {
            recaptchaInput.value = token;
          }
          submitPayload();
        })
        .catch(function () {
          submitPayload();
        });
    });
  };

  executeRecaptcha();
};

if (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submitForm();
  });
}
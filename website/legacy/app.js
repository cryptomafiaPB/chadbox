/**
 * Chadbox Product Landing Page - Application Logic
 * Interactive code simulation, cursor proximity lighting,
 * SVG lifecycle pipeline inspector, tabs, pricing toggles, and modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorProximityGlow();
  initTerminalSimulation();
  initDualTrackSwitcher();
  initCopyButtons();
  initArchitecturePipeline();
  initPricingToggle();
  initFaqAccordion();
  initApiKeyModal();
  initScrollReveal();
  initKeyboardShortcuts();
});

/* ==========================================================================
   1. Dynamic Proximity Lighting on Cards
   ========================================================================== */
function initCursorProximityGlow() {
  const cards = document.querySelectorAll('.glow-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mouse-x', `-999px`);
      card.style.setProperty('--mouse-y', `-999px`);
    });
  });
}

/* ==========================================================================
   2. Interactive Terminal & Simulation Engine
   ========================================================================== */
const TERMINAL_LANGUAGES = {
  python: {
    title: 'Python 3.12 (Multi-file)',
    payload: `{
  <span class="token-key">"language"</span>: <span class="token-str">"python"</span>,
  <span class="token-key">"version"</span>: <span class="token-str">"3.12.3"</span>,
  <span class="token-key">"files"</span>: [
    {
      <span class="token-key">"name"</span>: <span class="token-str">"main.py"</span>,
      <span class="token-key">"content"</span>: <span class="token-str">"from helper import evaluate\\nprint(evaluate(42))"</span>
    },
    {
      <span class="token-key">"name"</span>: <span class="token-str">"helper.py"</span>,
      <span class="token-key">"content"</span>: <span class="token-str">"def evaluate(n):\\n  return {'status': 'sanitized', 'entropy': n * 1337}"</span>
    }
  ],
  <span class="token-key">"timeout_ms"</span>: <span class="token-num">1500</span>,
  <span class="token-key">"network"</span>: <span class="token-bool">false</span>
}`,
    output: (latency) => `[cgroups] namespace initialized (pid=408221)
[squashfs] mounted python:3.12 (ro,nodev,nosuid) in 4.2ms
[seccomp] loaded 128 blocked syscalls
[exec] worker process started
--------------------------------------------------
{'status': 'sanitized', 'entropy': 56154}
--------------------------------------------------
[exit] returncode: 0 | memory_peak: 14.8MB
[cleanup] cgroup destroyed & namespace unmounted in 1.1ms`
  },
  rust: {
    title: 'Rust 1.78 (Zero-cost)',
    payload: `{
  <span class="token-key">"language"</span>: <span class="token-str">"rust"</span>,
  <span class="token-key">"version"</span>: <span class="token-str">"1.78.0"</span>,
  <span class="token-key">"files"</span>: [
    {
      <span class="token-key">"name"</span>: <span class="token-str">"main.rs"</span>,
      <span class="token-key">"content"</span>: <span class="token-str">"fn main() {\\n    let val: u64 = 42 * 1337;\\n    println!(\\"{\\\\\\"status\\\\\\": \\\\\\"sanitized\\\\\\", \\\\\\"result\\\\\\": {}\\} \\", val);\\n}"</span>
    }
  ],
  <span class="token-key">"timeout_ms"</span>: <span class="token-num">2000</span>
}`,
    output: (latency) => `[cgroups] namespace initialized (pid=409112)
[squashfs] mounted rust:1.78.0 (ro,nodev) in 3.8ms
[rustc] compiled in 22.4ms (release mode cached)
[exec] running binary inside seccomp sandbox
--------------------------------------------------
{"status": "sanitized", "result": 56154}
--------------------------------------------------
[exit] returncode: 0 | memory_peak: 4.2MB
[cleanup] cgroup destroyed in 0.8ms`
  },
  node: {
    title: 'Node.js 22 (V8 Isolate)',
    payload: `{
  <span class="token-key">"language"</span>: <span class="token-str">"javascript"</span>,
  <span class="token-key">"version"</span>: <span class="token-str">"22.2.0"</span>,
  <span class="token-key">"files"</span>: [
    {
      <span class="token-key">"name"</span>: <span class="token-str">"index.mjs"</span>,
      <span class="token-key">"content"</span>: <span class="token-str">"import crypto from 'node:crypto';\\nconsole.log({ status: 'sanitized', hash: crypto.randomBytes(4).toString('hex') });"</span>
    }
  ],
  <span class="token-key">"network"</span>: <span class="token-bool">false</span>
}`,
    output: (latency) => `[cgroups] namespace initialized (pid=409550)
[squashfs] mounted node:22.2.0 (ro,nodev) in 4.9ms
[exec] node --no-warnings index.mjs
--------------------------------------------------
{ status: 'sanitized', hash: 'e92fa1b4' }
--------------------------------------------------
[exit] returncode: 0 | memory_peak: 24.1MB
[cleanup] cgroup destroyed in 1.0ms`
  }
};

let currentLanguage = 'python';

function initTerminalSimulation() {
  const tabBtns = document.querySelectorAll('.terminal-tab-btn');
  const payloadEl = document.getElementById('terminalPayloadCode');
  const outputEl = document.getElementById('terminalOutputConsole');
  const runBtn = document.getElementById('runSimulationBtn');
  const runBtnLabel = document.getElementById('runBtnLabel');
  const statusChip = document.getElementById('terminalStatusChip');
  const latencyBadge = document.getElementById('terminalLatencyBadge');

  if (!payloadEl || !outputEl || !runBtn) return;

  // Tab switcher
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLanguage = btn.dataset.lang || 'python';

      const config = TERMINAL_LANGUAGES[currentLanguage];
      if (config) {
        payloadEl.innerHTML = `<code class="code-line">${config.payload}</code>`;
        triggerRunSimulation();
      }
    });
  });

  // Run button
  runBtn.addEventListener('click', () => {
    triggerRunSimulation();
  });

  function triggerRunSimulation() {
    if (runBtn.classList.contains('running')) return;

    runBtn.classList.add('running');
    runBtnLabel.textContent = 'Executing...';
    statusChip.className = 'status-chip';
    statusChip.style.background = 'rgba(245, 158, 11, 0.15)';
    statusChip.style.color = '#FCD34D';
    statusChip.textContent = 'RUNNING';
    latencyBadge.textContent = 'profiling...';
    outputEl.textContent = '[kernel] dispatching worker process...';

    // Fast simulated execution (300ms mock delay to feel real)
    setTimeout(() => {
      const latencyNum = (36 + Math.random() * 7.5).toFixed(1);
      const config = TERMINAL_LANGUAGES[currentLanguage] || TERMINAL_LANGUAGES.python;

      statusChip.className = 'status-chip ok';
      statusChip.style.background = '';
      statusChip.style.color = '';
      statusChip.textContent = '200 OK';
      latencyBadge.textContent = `${latencyNum}ms`;
      outputEl.textContent = config.output(latencyNum);

      runBtn.classList.remove('running');
      runBtnLabel.textContent = 'Run Execution';
      showToast(`Execution finished in ${latencyNum}ms`);
    }, 320);
  }
}

/* ==========================================================================
   3. Dual-Track Switcher
   ========================================================================== */
function initDualTrackSwitcher() {
  const tabCoreBtn = document.getElementById('tabCoreBtn');
  const tabCloudBtn = document.getElementById('tabCloudBtn');
  const trackCardCore = document.getElementById('trackCardCore');
  const trackCardCloud = document.getElementById('trackCardCloud');

  if (!tabCoreBtn || !tabCloudBtn || !trackCardCore || !trackCardCloud) return;

  tabCoreBtn.addEventListener('click', () => {
    tabCoreBtn.classList.add('active');
    tabCoreBtn.setAttribute('aria-selected', 'true');
    tabCloudBtn.classList.remove('active');
    tabCloudBtn.setAttribute('aria-selected', 'false');

    trackCardCore.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    trackCardCloud.style.borderColor = 'var(--border-subtle)';
    trackCardCore.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  tabCloudBtn.addEventListener('click', () => {
    tabCloudBtn.classList.add('active');
    tabCloudBtn.setAttribute('aria-selected', 'true');
    tabCoreBtn.classList.remove('active');
    tabCoreBtn.setAttribute('aria-selected', 'false');

    trackCardCloud.style.borderColor = 'rgba(0, 245, 155, 0.4)';
    trackCardCore.style.borderColor = 'var(--border-subtle)';
    trackCardCloud.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/* ==========================================================================
   4. Copy to Clipboard Utility & Toast
   ========================================================================== */
function initCopyButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;

    const textToCopy = btn.dataset.copy;
    if (!textToCopy) return;

    copyToClipboard(textToCopy, () => {
      const origSpan = btn.querySelector('span');
      const origText = origSpan ? origSpan.textContent : '';
      if (origSpan) origSpan.textContent = 'Copied!';
      showToast('Command copied to clipboard');

      setTimeout(() => {
        if (origSpan) origSpan.textContent = origText;
      }, 2000);
    });
  });
}

function copyToClipboard(text, callback) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(callback).catch(() => fallbackCopy(text, callback));
  } else {
    fallbackCopy(text, callback);
  }
}

function fallbackCopy(text, callback) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    if (callback) callback();
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textArea);
}

function showToast(message) {
  const toast = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/* ==========================================================================
   5. Architecture Lifecycle Pipeline & SVG Inspector
   ========================================================================== */
const PIPELINE_DATA = {
  'node-ingest': {
    title: 'HTTP POST Ingestion (/v1/execute)',
    desc: 'High-speed epoll-driven event loop parses the HTTP payload into pre-allocated memory buffers.',
    latency: '~0.4ms',
    isolation: 'Layer 7 Gateway'
  },
  'node-validate': {
    title: 'Zero-Allocation JSON Schema Validation',
    desc: 'Fast schema checker validates file structures, language identifiers, timeout limits, and memory requests.',
    latency: '~0.8ms',
    isolation: 'In-Memory Validator'
  },
  'node-gate': {
    title: 'Concurrency & RAM Gate (Backpressure)',
    desc: 'Adaptive token bucket monitors host memory headroom and cgroup limits. Queues or drops excess load before host degradation.',
    latency: '~0.3ms',
    isolation: 'cgroup v2 controller'
  },
  'node-mount': {
    title: 'Immutable SquashFS Language Mount',
    desc: 'Language root filesystem is mounted read-only via loopback in constant time using an LRU mount cache.',
    latency: '~4.2ms',
    isolation: 'RO Loop Mount'
  },
  'node-exec': {
    title: 'Sandbox Execution (cgroup v2 & namespaces)',
    desc: 'The payload process executes within dedicated mount, UTS, IPC, PID, and net namespaces with strict seccomp filters.',
    latency: '~31.2ms',
    isolation: 'L3 Kernel Isolation'
  }
};

function initArchitecturePipeline() {
  const pathButtons = document.querySelectorAll('.path-btn');
  const tracerBeam = document.getElementById('tracerBeamElement');
  const tag400 = document.getElementById('tag400');
  const tag429 = document.getElementById('tag429');
  const inspectorTitle = document.getElementById('inspectorNodeTitle');
  const inspectorDesc = document.getElementById('inspectorNodeDesc');
  const inspectorLatency = document.getElementById('inspectorLatency');
  const inspectorIsolation = document.getElementById('inspectorIsolation');
  const nodes = document.querySelectorAll('.pipeline-node');

  // Interactive path selection
  pathButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pathButtons.forEach(b => {
        b.classList.remove('active', 'success', 'warn', 'error');
      });
      const pathType = btn.dataset.path;

      if (pathType === 'success') {
        btn.classList.add('active', 'success');
        if (tracerBeam) {
          tracerBeam.setAttribute('d', 'M 80 80 L 260 80 L 460 80 L 660 80 L 860 80');
          tracerBeam.style.stroke = 'var(--accent-mint)';
        }
        updateInspector(PIPELINE_DATA['node-exec']);
      } else if (pathType === 'validation') {
        btn.classList.add('active', 'error');
        if (tracerBeam) {
          tracerBeam.setAttribute('d', 'M 80 80 L 260 80 L 260 145');
          tracerBeam.style.stroke = '#EF4444';
        }
        updateInspector({
          title: '400 Bad Request Exit',
          desc: 'Payload failed schema or syntax validation. The request terminates early before allocating cgroups or mounting disks.',
          latency: '~1.2ms',
          isolation: 'Zero Resource Waste'
        });
      } else if (pathType === 'capacity') {
        btn.classList.add('active', 'warn');
        if (tracerBeam) {
          tracerBeam.setAttribute('d', 'M 80 80 L 260 80 L 460 80 L 460 145');
          tracerBeam.style.stroke = '#F59E0B';
        }
        updateInspector({
          title: '429 Concurrency Gate Exit',
          desc: 'Host memory or concurrency ceiling reached. Graceful backpressure signals caller to retry without thrashing the server.',
          latency: '~0.5ms',
          isolation: 'Host Protection'
        });
      }
    });
  });

  // Clicking nodes
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const nodeId = node.dataset.node;
      const data = PIPELINE_DATA[nodeId];
      if (data) {
        updateInspector(data);
      }
    });
  });

  function updateInspector(data) {
    if (!inspectorTitle || !inspectorDesc || !inspectorLatency || !inspectorIsolation) return;
    inspectorTitle.textContent = data.title;
    inspectorDesc.textContent = data.desc;
    inspectorLatency.textContent = data.latency;
    inspectorIsolation.textContent = data.isolation;
  }
}

/* ==========================================================================
   6. Pricing Monthly / Annual Toggle
   ========================================================================== */
function initPricingToggle() {
  const toggleBtn = document.getElementById('billingToggleBtn');
  const priceAmount = document.getElementById('cloudPriceAmount');
  const pricePeriod = document.getElementById('cloudPricePeriod');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const annualLabel = document.getElementById('annualLabel');

  if (!toggleBtn || !priceAmount) return;

  let isAnnual = false;

  toggleBtn.addEventListener('click', () => {
    isAnnual = !isAnnual;
    toggleBtn.classList.toggle('active', isAnnual);
    toggleBtn.setAttribute('aria-checked', isAnnual.toString());

    if (isAnnual) {
      priceAmount.textContent = '$23';
      pricePeriod.textContent = '/ mo (billed annually)';
      monthlyLabel.style.color = 'var(--text-muted)';
      annualLabel.style.color = 'var(--text-primary)';
      showToast('Annual discount applied (20% off)');
    } else {
      priceAmount.textContent = '$29';
      pricePeriod.textContent = '/ month';
      monthlyLabel.style.color = 'var(--text-primary)';
      annualLabel.style.color = 'var(--text-muted)';
    }
  });
}

/* ==========================================================================
   7. Technical FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close other items
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('open');
      });

      item.classList.toggle('open', !isOpen);
    });
  });
}

/* ==========================================================================
   8. API Key Modal Dialog
   ========================================================================== */
function initApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const doneBtn = document.getElementById('modalDoneBtn');
  const tokenField = document.getElementById('modalTokenField');
  const copyTokenBtn = document.getElementById('modalCopyTokenBtn');
  const triggerBtns = [
    document.getElementById('navGetApiKeyBtn'),
    document.getElementById('heroStartFreeBtn'),
    document.getElementById('pricingCloudBtn'),
    document.getElementById('enterpriseContactBtn')
  ];

  if (!modal) return;

  function openModal() {
    // Generate fresh random key token
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const testKey = `cb_live_${randomHex}`;
    if (tokenField) tokenField.textContent = testKey;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  triggerBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (doneBtn) closeBtn && doneBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  if (copyTokenBtn && tokenField) {
    copyTokenBtn.addEventListener('click', () => {
      copyToClipboard(tokenField.textContent, () => {
        showToast('API token copied to clipboard');
      });
    });
  }
}

/* ==========================================================================
   9. Scroll Reveal with IntersectionObserver
   ========================================================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }
}

/* ==========================================================================
   10. Keyboard Shortcuts
   ========================================================================== */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Press 'R' to run the sandbox execution
    if ((e.key === 'r' || e.key === 'R') && !isInputFocused()) {
      e.preventDefault();
      const runBtn = document.getElementById('runSimulationBtn');
      if (runBtn) runBtn.click();
    }
  });

  function isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
  }
}

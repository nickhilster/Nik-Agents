const tabs = Array.from(document.querySelectorAll('.case-tab'));
const panels = Array.from(document.querySelectorAll('.case-panel'));
const evidenceToggles = Array.from(document.querySelectorAll('.evidence-toggle'));

function activateCase(target) {
  tabs.forEach((item) => {
    const active = item.dataset.case === target;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === target);
  });
}

tabs.forEach((tab) => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', String(tab.classList.contains('active')));

  tab.addEventListener('click', () => {
    activateCase(tab.dataset.case);
  });
});

evidenceToggles.forEach((button) => {
  const drawer = button.nextElementSibling;
  if (!drawer || !drawer.classList.contains('evidence-drawer')) return;

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    drawer.hidden = expanded;

    if (!expanded) {
      drawer.animate(
        [
          { opacity: 0, transform: 'translateY(-6px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 220,
          easing: 'ease-out'
        }
      );
    }
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 520,
          easing: 'cubic-bezier(.2,.7,.2,1)',
          fill: 'both'
        }
      );
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

document
  .querySelectorAll('.orbit-node, .round, .evidence-card, .case-stage, .stack > div, .experiment-grid article')
  .forEach((el) => observer.observe(el));


// =========================================================
// Scroll storytelling + directional signal system
// =========================================================
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll progress is both navigation feedback and a quiet "signal path".
const progress = document.createElement('div');
progress.className = 'scroll-story-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

let frameRequested = false;
function updatePageSignals(event) {
  if (event && !frameRequested) {
    frameRequested = true;
    requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mx', x + '%');
      document.documentElement.style.setProperty('--my', y + '%');
      frameRequested = false;
    });
  }
}
if (!reduceMotion) window.addEventListener('pointermove', updatePageSignals, { passive: true });

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, value)) + ')';
}
updateScrollProgress();
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

// Pointer-position light makes cards react locally instead of using generic hover glow.
document
  .querySelectorAll('.orbit-node, .round, .proof-item, .evidence-card, .stack > div, .experiment-grid article, .media-placeholder')
  .forEach((surface) => {
    surface.addEventListener('pointermove', (event) => {
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty('--rx', ((event.clientX - rect.left) / rect.width) * 100 + '%');
      surface.style.setProperty('--ry', ((event.clientY - rect.top) / rect.height) * 100 + '%');
    });
  });

// Turn selected display text into individually addressable signal words.
function prepareStoryLine(element, mode = 'ltr') {
  if (!element || element.dataset.storyReady === 'true') return;
  const text = element.textContent.trim();
  if (!text) return;

  const words = text.split(/\s+/);
  const midpoint = (words.length - 1) / 2;
  element.textContent = '';
  element.classList.add('story-line');
  element.dataset.storyReady = 'true';

  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'story-word';
    span.textContent = word;

    let order = index;
    if (mode === 'rtl') order = words.length - 1 - index;
    if (mode === 'center') order = Math.abs(index - midpoint);

    span.style.setProperty('--word-delay', Math.round(order * 58) + 'ms');
    element.appendChild(span);
    if (index < words.length - 1) element.appendChild(document.createTextNode(' '));
  });
}

document.querySelectorAll('.hero h1').forEach((el) => prepareStoryLine(el, 'ltr'));
document.querySelectorAll('.section-heading h2').forEach((el) => prepareStoryLine(el, 'ltr'));
document.querySelectorAll('.case-panel h3').forEach((el) => prepareStoryLine(el, 'ltr'));
document.querySelectorAll('.convergence-result strong').forEach((el) => prepareStoryLine(el, 'center'));
document.querySelectorAll('.closing h2').forEach((el) => prepareStoryLine(el, 'ltr'));

if (reduceMotion) {
  document.querySelectorAll('.story-line').forEach((el) => el.classList.add('story-active'));
} else {
  const storyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('story-active');
        storyObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.48, rootMargin: '0px 0px -8% 0px' }
  );

  document
    .querySelectorAll('.story-line:not(.case-panel .story-line)')
    .forEach((el) => storyObserver.observe(el));
}

// Sections receive a brief edge signal as they become the current narrative unit.
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-active', entry.isIntersecting);
    });
  },
  { threshold: 0.24, rootMargin: '-12% 0px -52% 0px' }
);
document.querySelectorAll('.section').forEach((section) => sectionObserver.observe(section));

// The system map behaves like a live network only while the reader is looking at it.
const orbitMap = document.querySelector('.orbit-map');
if (orbitMap) {
  const orbitObserver = new IntersectionObserver(
    ([entry]) => orbitMap.classList.toggle('is-active', entry.isIntersecting),
    { threshold: 0.34 }
  );
  orbitObserver.observe(orbitMap);
}

// The case frame scans once as the reader reaches it.
const caseStage = document.querySelector('.case-stage');
if (caseStage) {
  const caseStageObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) caseStage.classList.add('is-active');
    },
    { threshold: 0.25 }
  );
  caseStageObserver.observe(caseStage);
}

// Model -> product -> tools -> observed capability -> workflow role lights in sequence.
const stack = document.querySelector('.stack');
if (stack) {
  Array.from(stack.children).forEach((child, index) => {
    child.style.setProperty('--stack-delay', index * 170 + 'ms');
  });

  const stackObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      stack.classList.add('is-active');
      stackObserver.unobserve(stack);
    },
    { threshold: 0.32 }
  );
  stackObserver.observe(stack);
}

function playWorkflow(flow) {
  if (!flow || reduceMotion) return;
  const children = Array.from(flow.children);
  children.forEach((child, index) => {
    child.style.setProperty('--flow-delay', index * 220 + 'ms');
  });
  flow.classList.remove('flow-live');
  void flow.offsetWidth;
  flow.classList.add('flow-live');
}

const workflowObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const panel = entry.target.closest('.case-panel');
      if (!panel || !panel.classList.contains('active')) return;
      playWorkflow(entry.target);
    });
  },
  { threshold: 0.55 }
);
document.querySelectorAll('.rich-workflow').forEach((flow) => workflowObserver.observe(flow));

// Existing tab switching changes the story path; replay the new path and ignite its title.
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    requestAnimationFrame(() => {
      const panel = document.querySelector('.case-panel[data-panel="' + tab.dataset.case + '"]');
      if (!panel) return;
      const title = panel.querySelector('h3.story-line');
      if (title) {
        title.classList.remove('story-active');
        void title.offsetWidth;
        title.classList.add('story-active');
      }
      playWorkflow(panel.querySelector('.rich-workflow'));
    });
  });
});

// Ignite the initially visible case title once the case stage enters the reader's viewport.
if (caseStage) {
  const initialCaseObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      const panel = document.querySelector('.case-panel.active');
      const title = panel && panel.querySelector('h3.story-line');
      if (title) title.classList.add('story-active');
      playWorkflow(panel && panel.querySelector('.rich-workflow'));
      initialCaseObserver.disconnect();
    },
    { threshold: 0.32 }
  );
  initialCaseObserver.observe(caseStage);
}

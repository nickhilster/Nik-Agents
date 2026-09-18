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

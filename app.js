const tabs = Array.from(document.querySelectorAll('.case-tab'));
const panels = Array.from(document.querySelectorAll('.case-panel'));

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.case;

    tabs.forEach((item) => item.classList.toggle('active', item === tab));
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === target);
    });
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

document.querySelectorAll('.system-card, .round, .evidence-card, .case-stage, .stack > div').forEach((el) => {
  observer.observe(el);
});

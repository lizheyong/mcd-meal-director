const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Reveal the recorded conversation as the reader reaches each turn.
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!reducedMotion.matches) {
      entry.target.animate(
        [{ opacity: .35, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
        { duration: 550, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
    }
    observer.unobserve(entry.target);
  }
}, { threshold: .15 });
document.querySelectorAll('.section-head,.conversation-turn,.trial-cards,.install-section,.starter-message').forEach(element => observer.observe(element));

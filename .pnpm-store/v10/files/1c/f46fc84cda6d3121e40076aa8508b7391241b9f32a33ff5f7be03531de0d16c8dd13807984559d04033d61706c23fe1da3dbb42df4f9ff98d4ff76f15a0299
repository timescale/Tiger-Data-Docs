window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.stldocs-tooltip').forEach((tooltip) => {
    const target = tooltip.querySelector<HTMLDivElement>('.stldocs-tooltip-host');

    const content = tooltip.querySelector<HTMLDivElement>('.stldocs-tooltip-content');

    if (!target || !content) return;

    target.addEventListener('mouseenter', () => {
      const targetRect = target.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      let top = targetRect.bottom + window.scrollY;
      let left = targetRect.left + window.scrollX;

      if (targetRect.bottom + contentRect.height > window.innerHeight) {
        top = targetRect.top + window.scrollY - contentRect.height;
      }

      if (targetRect.left + contentRect.width > window.innerWidth) {
        left = targetRect.right + window.scrollX - contentRect.width;
      }

      if (left < window.scrollX) {
        left = window.scrollX;
      }

      content.style.top = `${top}px`;
      content.style.left = `${left}px`;
    });
  });
});

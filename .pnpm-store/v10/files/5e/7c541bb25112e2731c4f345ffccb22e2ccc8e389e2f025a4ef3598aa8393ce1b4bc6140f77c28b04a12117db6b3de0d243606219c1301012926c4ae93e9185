document.addEventListener('DOMContentLoaded', function () {
  const COLLAPSED_HEIGHT = 170;

  const container = document.querySelector<HTMLElement>('[data-stldocs-property-group="method-description"]');

  if (!container) return;

  const toggle = document?.querySelector<HTMLButtonElement>('[data-method-description-toggle]');
  if (!toggle) return;

  // If content isn't tall enough, don't show the button
  if (container.scrollHeight <= COLLAPSED_HEIGHT + 1) {
    toggle.hidden = true;
    container.dataset.collapsed = 'false';
    return;
  }

  // Only show button if content is taller than collapsed max height
  if (container.scrollHeight > COLLAPSED_HEIGHT + 1) {
    toggle.hidden = false;
  } else {
    // Not tall enough to need collapsing — show full content and hide button
    container.dataset.collapsed = 'false';
    toggle.hidden = true;
    return;
  }

  toggle.addEventListener('click', function () {
    const isCollapsed = container.dataset.collapsed !== 'false';
    container.dataset.collapsed = isCollapsed ? 'false' : 'true';
    toggle.textContent = isCollapsed ? 'Show less' : 'Show more';
  });
});

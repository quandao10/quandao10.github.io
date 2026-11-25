// Initialize medium zoom.
$(document).ready(function () {
  medium_zoom = mediumZoom('[data-zoomable]', {
    background: getComputedStyle(document.documentElement)
        .getPropertyValue('--global-bg-color') + 'ee',  // + 'ee' for trasparency.
  });

  // The sidebar table of contents is a Bootstrap .sticky-top (z-index 1020) and
  // was painting over zoomed figures. The stylesheet lifts the zoom above it;
  // this flag also drops the sticky chrome behind while a zoom is open, which
  // covers any other sticky element the theme adds later.
  medium_zoom.on('open', function () {
    document.body.classList.add('zoom-open');
  });
  medium_zoom.on('closed', function () {
    document.body.classList.remove('zoom-open');
  });
});

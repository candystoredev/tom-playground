/* Shared app menu — auto-injects hamburger button + slide-out panel.
   Usage: set window.APP_CHANGELOG (HTML string) before loading this script.
   The script finds the first .app-header / .header / header element and
   appends the ☰ button to it. */

(function () {
  var header = document.querySelector('.app-header, .header, header');
  if (!header) return;

  // ---- Hamburger button ----
  var btn = document.createElement('button');
  btn.className = 'app-menu-btn';
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '&#9776;';
  header.appendChild(btn);

  // ---- Build menu panel ----
  var changelog = window.APP_CHANGELOG || '';
  var menu = document.createElement('div');
  menu.id = 'appMenu';
  menu.className = 'app-side-menu';
  menu.innerHTML =
    '<div class="app-menu-overlay"></div>' +
    '<div class="app-menu-panel">' +
      '<div class="app-menu-head">' +
        '<h3>Menu</h3>' +
        '<button class="app-menu-x">&times;</button>' +
      '</div>' +
      '<nav class="app-menu-nav">' +
        '<a href="../">&larr; All Apps</a>' +
        '<button class="app-menu-changelog-btn">&#128203; Changelog</button>' +
      '</nav>' +
      '<div class="app-changelog">' + changelog + '</div>' +
    '</div>';
  document.body.appendChild(menu);

  // ---- Event wiring ----
  function open()  { menu.classList.add('open'); }
  function close() { menu.classList.remove('open'); }

  btn.addEventListener('click', open);
  menu.querySelector('.app-menu-overlay').addEventListener('click', close);
  menu.querySelector('.app-menu-x').addEventListener('click', close);
  menu.querySelector('.app-menu-changelog-btn').addEventListener('click', function () {
    menu.querySelector('.app-changelog').classList.toggle('show');
  });
})();

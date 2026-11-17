(function() {
  var p = (window.location.pathname || '').toLowerCase();
  if (p && p !== '/404.html' && p !== '/404') {
    if (p.indexOf('contato') !== -1 || p.indexOf('orcamento') !== -1) {
      window.location.replace('/#saiba-mais');
    } else {
      window.location.replace('/');
    }
  }
})();

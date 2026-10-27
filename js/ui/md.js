/* ======================================================================
   OBSERVATOIRE — Markdown minimal pour les fiches d'hypothèses
   Titres (#, ##, ###), paragraphes, listes (- ou 1.), citations (>), **gras**, *italique*,
   `code`, [liens](url). Le HTML brut est neutralisé.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      if (!/^(https?:|#|mailto:)/.test(u)) return t;
      var ext = /^https?:/.test(u) ? ' rel="noopener" target="_blank"' : '';
      return '<a href="' + u + '"' + ext + '>' + t + '</a>';
    });
    return s;
  }
  OBS.md = function (src) {
    var lines = String(src || '').replace(/\r\n?/g, '\n').split('\n'), out = [], para = [], list = null;
    function flush() {
      if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
      if (list) { out.push('<' + list.t + '>' + list.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + list.t + '>'); list = null; }
    }
    lines.forEach(function (l) {
      var m;
      if (!l.trim()) { flush(); return; }
      if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { flush(); var n = Math.min(3, m[1].length + 1); out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); return; }
      if ((m = l.match(/^\s*[-*]\s+(.*)$/))) { if (para.length) flush(); if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); return; }
      if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { if (para.length) flush(); if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); return; }
      if ((m = l.match(/^>\s?(.*)$/))) { flush(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); return; }
      if (list) { list.items[list.items.length - 1] += ' ' + l.trim(); return; }
      para.push(l.trim());
    });
    flush();
    return out.join('\n');
  };
  OBS.esc = esc;
})();

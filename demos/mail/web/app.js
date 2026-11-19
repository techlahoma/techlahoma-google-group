// Oogle Mail demo: the page (list, reading, compose), the Agent console for an agent in this
// browser tab, and the optional bridge to the local MCP server.
(function () {
  'use strict';

  var Mail = window.Mail;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var main = $('main');
  var selected = {}; // thread or email ids ticked in the list
  var flashIds = [];
  var activity = [];
  var LOGO_KEY = 'oogle-mail-logo';
  var DEFAULT_LOGO = 'Oogle Mail';

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ------------------------------------------------------------ logo

  var COLORS = ['l-blue', 'l-red', 'l-yellow', 'l-blue', 'l-green', 'l-red'];

  function paintLogo() {
    var text = localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO;
    var i = 0;
    $('logo').innerHTML = text
      .split('')
      .map(function (ch) {
        if (ch === ' ') return ' ';
        return '<span class="' + COLORS[i++ % COLORS.length] + '">' + esc(ch) + '</span>';
      })
      .join('');
    document.title = text + ' - demo inbox';
  }

  function editLogo() {
    var input = $('logo-edit');
    input.value = localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO;
    $('logo').hidden = true;
    input.hidden = false;
    input.focus();
    input.select();
  }

  function closeLogo(saveIt) {
    var input = $('logo-edit');
    if (input.hidden) return;
    if (saveIt) {
      var text = input.value.trim();
      if (text && text !== DEFAULT_LOGO) localStorage.setItem(LOGO_KEY, text);
      else localStorage.removeItem(LOGO_KEY);
    }
    input.hidden = true;
    $('logo').hidden = false;
    paintLogo();
  }

  // ------------------------------------------------------------ routes

  function route() {
    var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    var slash = hash.indexOf('/');
    var kind = slash < 0 ? hash : hash.slice(0, slash);
    var value = slash < 0 ? '' : hash.slice(slash + 1);
    if (kind === 'thread' || kind === 'compose' || kind === 'search') return { kind: kind, value: value };
    return { kind: 'label', value: kind === 'label' && value ? value : 'Inbox' };
  }

  function go(kind, value) {
    var next = '#' + kind + '/' + encodeURIComponent(value);
    if (location.hash === next) render();
    else location.hash = next;
  }

  var lastList = '#label/Inbox';

  // ------------------------------------------------------------ labels

  var PALETTE = [
    ['#d6e4ff', '#0f3a9c'],
    ['#d9f2d9', '#0b5c1e'],
    ['#ffe3c2', '#8a4500'],
    ['#eadcff', '#4b1f91'],
    ['#d5f0f0', '#0a5a5a'],
    ['#ffd9e6', '#8f1244'],
  ];

  function chipColors(label) {
    var lower = label.toLowerCase();
    if (lower.indexOf('phish') >= 0 || lower.indexOf('flag') >= 0 || lower.indexOf('scam') >= 0) return ['#d21c12', '#ffffff'];
    if (lower.indexOf('need') >= 0) return ['#f7a614', '#3a2500'];
    var i = Mail.state().labels.indexOf(label);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  }

  function chip(label) {
    var c = chipColors(label);
    return '<span class="chip" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(label) + '</span>';
  }

  function customLabels(email) {
    return email.labels.filter(function (l) {
      return Mail.SYSTEM.indexOf(l) < 0;
    });
  }

  function renderSide() {
    var state = Mail.state();
    var r = route();
    var current = r.kind === 'label' ? r.value : '';
    function count(label, unreadOnly) {
      return state.emails.filter(function (e) {
        return Mail.has(e, label) && (!unreadOnly || e.unread);
      }).length;
    }
    function item(label, text, n, swatch) {
      var here = current.toLowerCase() === label.toLowerCase();
      return (
        '<li><a href="#label/' + encodeURIComponent(label) + '"' + (here ? ' aria-current="page"' : '') + (n ? ' class="has-unread"' : '') + '>' +
        (swatch ? '<span class="swatch" style="background:' + chipColors(label)[0] + '"></span>' : '') +
        esc(text) + (n ? ' (' + n + ')' : '') + '</a></li>'
      );
    }
    $('system-labels').innerHTML =
      item('Inbox', 'Inbox', count('Inbox', true)) +
      item('Starred', 'Starred', 0) +
      item('Sent', 'Sent Mail', 0) +
      item('Drafts', 'Drafts', count('Drafts', false)) +
      item('All', 'All Mail', 0);
    $('custom-labels').innerHTML = state.labels
      .map(function (label) {
        return item(label, label, count(label, false), true);
      })
      .join('');
    $('owner-email').textContent = state.owner.email;
    $('activity').innerHTML = activity.length
      ? activity
          .map(function (a) {
            return '<li><time>' + esc(a.time) + '</time> ' + esc(a.text) + '</li>';
          })
          .join('')
      : '<li class="quiet">Nothing yet. Paste Prompt A into your agent.</li>';
  }

  // ------------------------------------------------------------ list

  function firstName(email) {
    if (Mail.has(email, 'Drafts')) return '<span class="draft-mark">Draft</span>';
    if (email.from.email === Mail.state().owner.email) return 'me';
    return esc(email.from.name.split(' <')[0]);
  }

  function snippet(email) {
    return email.body.replace(/\n\n-- \n[\s\S]*$/, '').replace(/\s+/g, ' ').slice(0, 140);
  }

  function byDate(a, b) {
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  }

  /** Group matching emails into conversations, newest conversation first. */
  function threadsFor(filter) {
    var state = Mail.state();
    var keep = {};
    state.emails.forEach(function (e) {
      if (filter(e)) keep[e.thread] = true;
    });
    var groups = {};
    state.emails.forEach(function (e) {
      if (!keep[e.thread]) return;
      (groups[e.thread] = groups[e.thread] || []).push(e);
    });
    return Object.keys(groups)
      .map(function (key) {
        var all = groups[key].slice().sort(byDate);
        var hits = all.filter(filter);
        return { id: key, all: all, newest: hits[hits.length - 1] };
      })
      .sort(function (a, b) {
        return byDate(b.newest, a.newest);
      });
  }

  function listToolbar(title, total) {
    var options = Mail.state().labels
      .map(function (l) {
        return '<option>' + esc(l) + '</option>';
      })
      .join('');
    return (
      '<div class="toolbar"><span class="view-title">' + esc(title) + '</span>' +
      '<button type="button" class="gbutton" data-act="archive">Archive</button>' +
      '<button type="button" class="gbutton" data-act="read">Mark as read</button>' +
      '<button type="button" class="gbutton" data-act="unread">Mark as unread</button>' +
      '<select data-act="label" aria-label="Label the ticked conversations"><option value="">Label as…</option>' + options + '<option value="__new">New label…</option></select>' +
      '<span class="count">' + (total ? '1 - ' + total + ' of ' + total : '0') + '</span></div>'
    );
  }

  function renderList(title, filter, emptyText, currentLabel) {
    var threads = threadsFor(filter);
    var rows = threads
      .map(function (t) {
        var names = [];
        t.all.forEach(function (e) {
          var n = firstName(e);
          if (names.indexOf(n) < 0) names.push(n);
        });
        var unread = t.all.some(function (e) {
          return e.unread;
        });
        var starred = t.all.some(function (e) {
          return Mail.has(e, 'Starred');
        });
        var labels = [];
        t.all.forEach(function (e) {
          customLabels(e).forEach(function (l) {
            if (labels.indexOf(l) < 0 && l !== currentLabel) labels.push(l);
          });
        });
        // Loud labels first, so they are never cut off.
        labels.sort(function (a, b) {
          return Mail.state().labels.indexOf(b) - Mail.state().labels.indexOf(a);
        });
        var changed = t.all.some(function (e) {
          return flashIds.indexOf(e.id) >= 0;
        });
        var first = t.all[0];
        return (
          '<tr data-thread="' + esc(t.id) + '" class="' + (unread ? 'unread' : '') + (changed ? ' flash' : '') + '">' +
          '<td class="c-check"><input type="checkbox" aria-label="Select conversation" data-tick="' + esc(t.id) + '"' + (selected[t.id] ? ' checked' : '') + ' /></td>' +
          '<td class="c-star"><button type="button" class="star' + (starred ? ' on' : '') + '" data-star="' + esc(t.id) + '" aria-label="' + (starred ? 'Remove star' : 'Add star') + '">' + (starred ? '★' : '☆') + '</button></td>' +
          '<td class="c-from">' + names.join(', ') + (t.all.length > 1 ? ' <span class="n">(' + t.all.length + ')</span>' : '') + '</td>' +
          '<td class="c-subject">' + labels.map(chip).join('') + esc(first.subject) + ' <span class="snippet">- ' + esc(snippet(t.newest)) + '</span></td>' +
          '<td class="c-date">' + esc(Mail.shortDate(t.newest.date)) + '</td></tr>'
        );
      })
      .join('');
    main.innerHTML =
      listToolbar(title, threads.length) +
      (threads.length ? '<table class="list"><tbody>' + rows + '</tbody></table>' : '<p class="empty">' + esc(emptyText) + '</p>');
  }

  // ------------------------------------------------------------ thread

  function looksPhishy(email) {
    return customLabels(email).some(function (l) {
      return /phish|scam|flag/i.test(l);
    });
  }

  function renderThread(threadId) {
    var all = Mail.state()
      .emails.filter(function (e) {
        return e.thread === threadId;
      })
      .sort(byDate);
    if (!all.length) {
      main.innerHTML = '<p class="empty">That conversation is gone. <a href="#label/Inbox">Back to Inbox</a></p>';
      return;
    }
    var labels = [];
    all.forEach(function (e) {
      customLabels(e).forEach(function (l) {
        if (labels.indexOf(l) < 0) labels.push(l);
      });
    });
    var cards = all
      .map(function (e) {
        var draft = Mail.has(e, 'Drafts');
        var who = draft ? 'Draft' : esc(e.from.name);
        return (
          '<article class="card' + (draft ? ' draft' : '') + (flashIds.indexOf(e.id) >= 0 ? ' flash' : '') + '">' +
          '<div class="card-head"><span class="who"><b>' + who + '</b> <span class="addr">' + (draft ? 'to ' + esc(e.to) + ' · not sent' : '&lt;' + esc(e.from.email) + '&gt; to ' + esc(e.to === Mail.state().owner.email ? 'me' : e.to)) + '</span></span>' +
          '<span class="when">' + esc(Mail.longDate(e.date)) + '</span></div>' +
          '<pre class="card-body">' + esc(e.body) + '</pre>' +
          (draft
            ? '<div class="card-actions"><button type="button" class="gbutton" data-edit="' + esc(e.id) + '">Edit draft</button><button type="button" class="gbutton" data-send="' + esc(e.id) + '">Send (demo)</button><button type="button" class="gbutton" data-discard="' + esc(e.id) + '">Discard</button></div>'
            : '') +
          '</article>'
        );
      })
      .join('');
    var last = all.filter(function (e) {
      return !Mail.has(e, 'Drafts');
    }).pop();
    main.innerHTML =
      '<div class="toolbar"><a class="view-title" href="' + esc(lastList) + '">« Back</a>' +
      '<button type="button" class="gbutton" data-tact="archive">Archive</button>' +
      '<button type="button" class="gbutton" data-tact="unread">Mark as unread</button>' +
      (last ? '<button type="button" class="gbutton" data-reply="' + esc(last.id) + '">Reply</button>' : '') +
      '</div><div class="thread" data-thread-view="' + esc(threadId) + '"><h1>' + labels.map(chip).join('') + esc(all[0].subject) + '</h1>' +
      (all.some(looksPhishy) ? '<p class="warn">Flagged as phishing. Do not pay, click, or reply. Check with the company using a phone number you already have.</p>' : '') +
      cards + '</div>';
  }

  // ------------------------------------------------------------ compose

  function renderCompose(id) {
    var draft;
    try {
      draft = Mail.find(id);
    } catch (error) {
      main.innerHTML = '<p class="empty">That draft is gone. <a href="#label/Drafts">Back to Drafts</a></p>';
      return;
    }
    main.innerHTML =
      '<div class="toolbar"><a class="view-title" href="' + esc(lastList) + '">« Back</a></div>' +
      '<form class="form" id="compose-form" data-id="' + esc(draft.id) + '">' +
      '<label>To <input type="text" name="to" value="' + esc(draft.to) + '" autocomplete="off" /></label>' +
      '<label>Subject <input type="text" name="subject" value="' + esc(draft.subject) + '" autocomplete="off" /></label>' +
      '<label>Message <textarea name="body">' + esc(draft.body) + '</textarea></label>' +
      '<div class="card-actions" style="padding:0"><button type="submit" class="gbutton primary">Send (demo)</button>' +
      '<button type="button" class="gbutton" data-save>Save Now</button><button type="button" class="gbutton" data-discard="' + esc(draft.id) + '">Discard</button></div>' +
      '<p class="hint">Demo only: Send moves this draft to Sent Mail inside this page. Nothing is really sent.</p></form>';
  }

  function saveCompose() {
    var form = $('compose-form');
    if (!form) return null;
    Mail.update(form.dataset.id, { to: form.to.value.trim(), subject: form.subject.value.trim() || '(no subject)', body: form.body.value });
    return form.dataset.id;
  }

  // ------------------------------------------------------------ render

  function render(options) {
    var r = route();
    renderSide();
    if (r.kind === 'compose' && options && options.keepCompose && $('compose-form')) return;
    if (r.kind === 'thread') {
      renderThread(r.value);
    } else if (r.kind === 'compose') {
      renderCompose(r.value);
    } else if (r.kind === 'search') {
      lastList = location.hash;
      $('q').value = r.value;
      renderList('Search: ' + r.value, function (e) {
        return Mail.matches(e, r.value);
      }, 'No mail matches "' + r.value + '".');
    } else {
      lastList = location.hash || '#label/Inbox';
      var label = r.value;
      var names = Mail.SYSTEM.concat(Mail.state().labels, ['All']);
      for (var i = 0; i < names.length; i++) if (names[i].toLowerCase() === label.toLowerCase()) label = names[i];
      var titles = { Sent: 'Sent Mail', All: 'All Mail' };
      renderList(titles[label] || label, function (e) {
        return label === 'All' || Mail.has(e, label);
      }, label === 'Inbox' ? 'No new mail! The inbox is clear.' : 'No conversations here yet.', label);
    }
    flashIds = [];
  }

  // ------------------------------------------------------------ notices + activity

  var noticeTimer = 0;

  function notice(text, source) {
    var el = $('notice');
    el.textContent = text;
    el.dataset.source = source || 'you';
    el.hidden = false;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () {
      el.hidden = true;
    }, 9000);
  }

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  function describe(change) {
    var a = change.args || {};
    var r = change.result || {};
    switch (change.tool) {
      case 'list_emails':
        return 'read ' + plural(r.count, 'email') + ' in ' + r.label + '.';
      case 'read_email':
        return 'read "' + r.subject + '".';
      case 'search_emails':
        return 'searched for "' + r.query + '" (' + r.count + ' found).';
      case 'create_draft':
        return 'saved a draft: "' + r.subject + '". Not sent.';
      case 'create_drafts':
        return 'saved ' + r.saved + '. Not sent.';
      case 'send_email':
        return 'moved a draft to Sent Mail. Demo only: nothing was really sent.';
      case 'add_label':
        return 'labeled ' + plural(r.labeled, 'email') + ' "' + r.label + '".';
      case 'remove_label':
        return 'removed "' + r.label + '" from ' + plural(r.unlabeled, 'email') + '.';
      case 'archive':
        return 'archived ' + plural(r.archived, 'email') + '.';
      case 'mark_read':
        return 'marked ' + plural(r.count, 'email') + ' ' + r.marked + '.';
      default:
        return a ? '' : '';
    }
  }

  function clock() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  }

  Mail.subscribe(function (change) {
    flashIds = flashIds.concat(change.ids || []);
    if (change.source === 'agent') {
      var text = describe(change);
      if (text) {
        notice(text.charAt(0).toUpperCase() + text.slice(1), 'agent');
        activity.unshift({ time: clock(), text: text.charAt(0).toUpperCase() + text.slice(1) });
        activity = activity.slice(0, 8);
      }
    }
    render({ keepCompose: true });
  });

  // ------------------------------------------------------------ user actions

  function threadEmailIds(threadId, onlyInbox) {
    return Mail.state()
      .emails.filter(function (e) {
        return e.thread === threadId && (!onlyInbox || Mail.has(e, 'Inbox'));
      })
      .map(function (e) {
        return e.id;
      });
  }

  function tickedIds() {
    var ids = [];
    Object.keys(selected).forEach(function (threadId) {
      if (selected[threadId]) ids = ids.concat(threadEmailIds(threadId));
    });
    return ids;
  }

  function act(kind, ids, label) {
    if (!ids.length) {
      notice('Tick a conversation first.');
      return;
    }
    if (kind === 'archive') Mail.call('archive', { ids: ids });
    if (kind === 'read') Mail.call('mark_read', { ids: ids });
    if (kind === 'unread') Mail.call('mark_read', { ids: ids, read: false });
    if (kind === 'label') Mail.call('add_label', { ids: ids, label: label });
    selected = {};
    render();
  }

  function resetInbox() {
    if (!window.confirm('Reset the demo inbox? This removes every draft and label the agent or you added.')) return;
    Mail.reset().then(function () {
      selected = {};
      activity = [];
      location.hash = '#label/Inbox';
      render();
      notice('The demo inbox was reset.');
    });
  }

  main.addEventListener('click', function (event) {
    var t = event.target;
    if (!(t instanceof Element)) return;
    var el;
    if ((el = t.closest('[data-tick]'))) {
      selected[el.getAttribute('data-tick')] = el.checked;
      return;
    }
    if ((el = t.closest('[data-star]'))) {
      var ids = threadEmailIds(el.getAttribute('data-star'));
      var on = el.classList.contains('on');
      if (on) Mail.call('remove_label', { ids: ids, label: 'Starred' });
      else Mail.call('add_label', { id: ids[ids.length - 1], label: 'Starred' });
      return;
    }
    if ((el = t.closest('[data-act]')) && el.tagName === 'BUTTON') return act(el.getAttribute('data-act'), tickedIds());
    if ((el = t.closest('[data-tact]'))) {
      var view = main.querySelector('[data-thread-view]');
      var threadId = view.getAttribute('data-thread-view');
      act(el.getAttribute('data-tact'), threadEmailIds(threadId));
      location.hash = lastList;
      return;
    }
    if ((el = t.closest('[data-reply]'))) {
      var parent = Mail.find(el.getAttribute('data-reply'));
      var made = Mail.call('create_draft', { to: parent.from.email, subject: 'Re: ' + parent.subject.replace(/^(re:\s*)+/i, ''), body: '', in_reply_to: parent.id });
      return go('compose', made.id);
    }
    if ((el = t.closest('[data-edit]'))) return go('compose', el.getAttribute('data-edit'));
    if ((el = t.closest('[data-send]'))) {
      Mail.call('send_email', { draft_id: el.getAttribute('data-send') });
      notice('Moved to Sent Mail. Demo only: nothing was really sent.');
      return;
    }
    if ((el = t.closest('[data-discard]'))) {
      Mail.discard(el.getAttribute('data-discard'));
      if (route().kind === 'compose') location.hash = lastList;
      notice('Draft discarded.');
      return;
    }
    if (t.closest('[data-save]')) {
      saveCompose();
      notice('Draft saved.');
      return;
    }
    if ((el = t.closest('tr[data-thread]'))) {
      var id = el.getAttribute('data-thread');
      var emails = Mail.state().emails.filter(function (e) {
        return e.thread === id;
      });
      if (emails.length === 1 && Mail.has(emails[0], 'Drafts')) return go('compose', emails[0].id);
      var unread = emails.filter(function (e) {
        return e.unread;
      });
      if (unread.length) Mail.call('mark_read', { ids: unread.map(function (e) { return e.id; }) });
      go('thread', id);
    }
  });

  main.addEventListener('change', function (event) {
    var t = event.target;
    if (!(t instanceof HTMLSelectElement) || t.getAttribute('data-act') !== 'label' || !t.value) return;
    var label = t.value === '__new' ? window.prompt('Name the new label:') : t.value;
    t.value = '';
    if (label && label.trim()) act('label', tickedIds(), label.trim());
  });

  main.addEventListener('submit', function (event) {
    event.preventDefault();
    var id = saveCompose();
    if (!id) return;
    Mail.call('send_email', { draft_id: id });
    location.hash = '#label/Sent';
    notice('Moved to Sent Mail. Demo only: nothing was really sent.');
  });

  $('search').addEventListener('submit', function (event) {
    event.preventDefault();
    var q = $('q').value.trim();
    if (q) go('search', q);
    else location.hash = '#label/Inbox';
  });
  $('search-clear').addEventListener('click', function () {
    $('q').value = '';
    location.hash = '#label/Inbox';
  });
  $('compose').addEventListener('click', function () {
    var made = Mail.call('create_draft', { to: '', subject: '(no subject)', body: '' });
    go('compose', made.id);
  });
  $('reset-top').addEventListener('click', resetInbox);
  $('reset-side').addEventListener('click', resetInbox);
  $('logo').addEventListener('click', editLogo);
  $('logo-edit').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') closeLogo(true);
    if (event.key === 'Escape') closeLogo(false);
  });
  $('logo-edit').addEventListener('blur', function () {
    closeLogo(true);
  });
  window.addEventListener('hashchange', function () {
    render();
  });

  // ------------------------------------------------------------ bridge to the local MCP server

  function setBridge(state, text) {
    var el = $('bridge');
    el.dataset.state = state;
    el.textContent = text;
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /** Run a tool for the agent. Several drafts land one at a time so the room can watch. */
  async function runForAgent(tool, args, silent) {
    if (silent) return Mail.call(tool, args, "check");
    if (tool === 'create_drafts' && Array.isArray(args.drafts) && args.drafts.length) {
      args.drafts.forEach(function (d) {
        if (d.in_reply_to) Mail.find(d.in_reply_to);
      });
      var ids = [];
      for (var i = 0; i < args.drafts.length; i++) {
        ids.push(Mail.call('create_draft', args.drafts[i], 'agent').id);
        if (i < args.drafts.length - 1) await sleep(280);
      }
      return { saved: ids.length + ' drafts', ids: ids, sent: false };
    }
    return Mail.call(tool, args, 'agent');
  }

  // ------------------------------------------------------------ agent console (no local server)

  var BROWSER_MODE = 'Browser mode: agents use the Agent console';
  var TOOL_NAMES = ['list_emails', 'read_email', 'search_emails', 'create_draft', 'create_drafts', 'send_email', 'add_label', 'remove_label', 'archive', 'mark_read'];

  /** For an agent that can run JavaScript in this page: await OogleMail.run("list_emails", {}). */
  window.OogleMail = {
    tools: TOOL_NAMES.slice(),
    run: function (tool, args) {
      return runForAgent(String(tool), args || {}, false);
    },
  };

  function setAgentStatus(state, text) {
    var el = $('agent-status');
    el.dataset.state = state;
    el.textContent = text;
  }

  /** Read the box, run one tool, and print the result where a browser agent can read it. */
  function runConsole() {
    var out = $('agent-result');
    var button = $('agent-run');
    var call;
    try {
      call = JSON.parse($('agent-call').value);
    } catch (error) {
      out.textContent = '';
      setAgentStatus('error', 'Not valid JSON. Use {"tool": "list_emails", "args": {}}.');
      return;
    }
    var tool = call && (call.tool || call.name);
    if (!tool || TOOL_NAMES.indexOf(tool) < 0) {
      out.textContent = '';
      setAgentStatus('error', 'Unknown tool. Use one of: ' + TOOL_NAMES.join(', ') + '.');
      return;
    }
    var args = call.args || call.arguments || {};
    button.disabled = true;
    setAgentStatus('busy', 'Running ' + tool + '…');
    runForAgent(tool, args, false).then(
      function (result) {
        out.textContent = JSON.stringify(result, null, 1);
        setAgentStatus('ok', 'Done: ' + tool + '.');
        button.disabled = false;
      },
      function (error) {
        out.textContent = '';
        setAgentStatus('error', 'Error from ' + tool + ': ' + String((error && error.message) || error));
        button.disabled = false;
      },
    );
  }

  $('agent-run').addEventListener('click', runConsole);

  var everConnected = false;

  function connect() {
    var local = location.protocol === 'http:' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
    if (!local) {
      setBridge('browser', BROWSER_MODE);
      return;
    }
    var ws;
    try {
      ws = new WebSocket('ws://' + location.host + '/__mail/ws');
    } catch (error) {
      setBridge('wait', 'Waiting for the local server…');
      setTimeout(connect, 1000);
      return;
    }
    ws.onopen = function () {
      everConnected = true;
      setBridge('on', 'Agent bridge connected');
    };
    ws.onmessage = function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (error) {
        return;
      }
      if (!msg.id || !msg.tool) return;
      runForAgent(msg.tool, msg.args || {}, msg.silent === true).then(
        function (result) {
          ws.send(JSON.stringify({ id: msg.id, ok: true, result: result }));
        },
        function (error) {
          ws.send(JSON.stringify({ id: msg.id, ok: false, error: String((error && error.message) || error) }));
        },
      );
    };
    ws.onclose = function () {
      if (everConnected) setBridge('wait', 'Waiting for the local server…');
      else setBridge('browser', BROWSER_MODE);
      setTimeout(connect, 1000);
    };
  }

  // ------------------------------------------------------------ start

  paintLogo();
  setBridge('off', 'Starting…');
  Mail.load().then(
    function () {
      render();
      connect();
    },
    function (error) {
      main.innerHTML = '<p class="empty">Could not load the demo inbox: ' + esc(error.message) + '</p>';
    },
  );
})();

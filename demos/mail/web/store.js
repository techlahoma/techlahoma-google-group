// Oogle Mail demo: the mailbox. State lives in localStorage; the tools below are the same ones
// the local MCP server exposes. No network requests except loading seed.json from this site.
(function () {
  'use strict';

  var KEY = 'oogle-mail-demo-v1';
  var SYSTEM = ['Inbox', 'Starred', 'Sent', 'Drafts'];
  var listeners = [];
  var state = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function emit(change) {
    listeners.forEach(function (fn) {
      fn(change || {});
    });
  }

  function fromSeed(seed) {
    var emails = seed.emails.map(function (e) {
      var body = Array.isArray(e.body) ? e.body.join('\n') : String(e.body || '');
      var labels = (e.labels || []).slice();
      if (e.starred && labels.indexOf('Starred') < 0) labels.push('Starred');
      return {
        id: e.id,
        thread: e.thread || e.id,
        date: e.date,
        from: e.from,
        to: e.to || seed.owner.email,
        subject: e.subject,
        body: body + '\n\n-- \n' + seed.footer,
        labels: labels,
        unread: !!e.unread,
      };
    });
    return {
      version: seed.version,
      owner: seed.owner,
      today: seed.today,
      labels: (seed.labels || []).slice(),
      emails: emails,
      nextDraft: 1,
      clock: 0,
    };
  }

  function load() {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        state = JSON.parse(raw);
        return Promise.resolve(state);
      } catch (error) {
        localStorage.removeItem(KEY);
      }
    }
    return reset();
  }

  function reset() {
    return fetch('seed.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Could not load seed.json');
        return res.json();
      })
      .then(function (seed) {
        state = fromSeed(seed);
        save();
        emit({ tool: 'reset', ids: [] });
        return state;
      });
  }

  // Another tab changed the mailbox: pick it up.
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY || !event.newValue) return;
    try {
      state = JSON.parse(event.newValue);
      emit({ tool: 'sync', ids: [] });
    } catch (error) {
      /* ignore */
    }
  });

  // ------------------------------------------------------------ helpers

  function canonLabel(name) {
    var want = String(name || '').trim();
    if (!want) throw new Error('A label name is required.');
    var lower = want.toLowerCase();
    if (lower === 'sent mail') lower = 'sent';
    if (lower === 'all mail') lower = 'all';
    var known = SYSTEM.concat(state.labels, ['All']);
    for (var i = 0; i < known.length; i++) if (known[i].toLowerCase() === lower) return known[i];
    return want.slice(0, 40);
  }

  function find(id) {
    var want = String(id || '').trim().toLowerCase();
    for (var i = 0; i < state.emails.length; i++) if (state.emails[i].id.toLowerCase() === want) return state.emails[i];
    throw new Error('No email with id "' + id + '". Call list_emails to see the ids.');
  }

  function idsOf(args) {
    var ids = [];
    if (Array.isArray(args.ids)) ids = args.ids.slice();
    else if (typeof args.ids === 'string') ids = args.ids.split(/[\s,]+/);
    if (args.id) ids.push(args.id);
    ids = ids.filter(Boolean);
    if (!ids.length) throw new Error('Pass "id" or "ids".');
    return ids.map(find);
  }

  function has(email, label) {
    return email.labels.indexOf(label) >= 0;
  }

  function matches(email, query) {
    var hay = [email.from.name, email.from.email, email.to, email.subject, email.body, email.labels.join(' ')].join(' ').toLowerCase();
    return String(query || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every(function (word) {
        return hay.indexOf(word) >= 0;
      });
  }

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parts(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso) || [0, 2026, 11, 19, 14, 0];
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
    var hour = d.getHours() % 12 || 12;
    var minute = String(d.getMinutes()).padStart(2, '0');
    return { d: d, day: DAYS[d.getDay()], month: MONTHS[d.getMonth()], time: hour + ':' + minute + ' ' + (d.getHours() < 12 ? 'AM' : 'PM') };
  }

  function longDate(iso) {
    var p = parts(iso);
    return p.day + ' ' + p.month + ' ' + p.d.getDate() + ' ' + p.d.getFullYear() + ', ' + p.time;
  }

  function shortDate(iso) {
    var p = parts(iso);
    return iso.slice(0, 10) === state.today.slice(0, 10) ? p.time : p.month + ' ' + p.d.getDate();
  }

  function view(email) {
    return {
      id: email.id,
      thread: email.thread,
      from: email.from.name + ' <' + email.from.email + '>',
      to: email.to,
      subject: email.subject,
      date: longDate(email.date),
      labels: email.labels.slice(),
      unread: email.unread,
      body: email.body,
      in_reply_to: email.in_reply_to,
    };
  }

  function byDate(a, b) {
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  }

  /** New items get "today" plus a minute per item, so they sort after the seeded mail. */
  function stamp() {
    state.clock += 1;
    var p = parts(state.today).d;
    p.setMinutes(p.getMinutes() + state.clock);
    var pad = function (n) {
      return String(n).padStart(2, '0');
    };
    return p.getFullYear() + '-' + pad(p.getMonth() + 1) + '-' + pad(p.getDate()) + 'T' + pad(p.getHours()) + ':' + pad(p.getMinutes());
  }

  function makeDraft(args) {
    var parent = null;
    if (args.in_reply_to) parent = find(args.in_reply_to);
    var subject = String(args.subject || (parent ? 'Re: ' + parent.subject.replace(/^(re:\s*)+/i, '') : '(no subject)'));
    var draft = {
      id: 'd' + state.nextDraft++,
      thread: parent ? parent.thread : 'td' + state.nextDraft,
      date: stamp(),
      from: { name: state.owner.name, email: state.owner.email },
      to: String(args.to || (parent ? parent.from.email : '')),
      subject: subject,
      body: String(args.body || '').replace(/\\n/g, '\n'),
      labels: ['Drafts'],
      unread: false,
      in_reply_to: parent ? parent.id : undefined,
    };
    state.emails.push(draft);
    return draft;
  }

  // ------------------------------------------------------------ tools

  var tools = {
    list_emails: function (args) {
      var label = canonLabel(args.label || 'Inbox');
      var out = state.emails.filter(function (e) {
        if (label !== 'All' && !has(e, label)) return false;
        if (typeof args.unread === 'boolean' && e.unread !== args.unread) return false;
        return !args.query || matches(e, args.query);
      });
      out.sort(byDate);
      return { label: label, count: out.length, owner: state.owner.name + ' <' + state.owner.email + '>', emails: out.map(view) };
    },
    read_email: function (args) {
      return view(find(args.id));
    },
    search_emails: function (args) {
      var out = state.emails
        .filter(function (e) {
          return matches(e, args.query);
        })
        .sort(byDate);
      return { query: String(args.query || ''), count: out.length, emails: out.map(view) };
    },
    create_draft: function (args) {
      var draft = makeDraft(args);
      return { saved: 'draft', id: draft.id, to: draft.to, subject: draft.subject, sent: false, changed: [draft.id] };
    },
    create_drafts: function (args) {
      var list = Array.isArray(args.drafts) ? args.drafts : [];
      if (!list.length) throw new Error('Pass "drafts": a list of {to, subject, body, in_reply_to}.');
      list.forEach(function (d) {
        if (d.in_reply_to) find(d.in_reply_to); // fail before saving anything
      });
      var made = list.map(makeDraft);
      return {
        saved: made.length + ' drafts',
        ids: made.map(function (d) {
          return d.id;
        }),
        sent: false,
        changed: made.map(function (d) {
          return d.id;
        }),
      };
    },
    send_email: function (args) {
      var draft = find(args.draft_id || args.id);
      if (!has(draft, 'Drafts')) throw new Error(draft.id + ' is not a draft.');
      draft.labels = draft.labels.filter(function (l) {
        return l !== 'Drafts';
      });
      draft.labels.push('Sent');
      draft.date = stamp();
      return { id: draft.id, moved_to: 'Sent', really_sent: false, note: 'Demo only: nothing left this computer.', changed: [draft.id] };
    },
    add_label: function (args) {
      var label = canonLabel(args.label);
      if (label === 'All') throw new Error('"All" is not a label you can add.');
      var emails = idsOf(args);
      if (SYSTEM.indexOf(label) < 0 && state.labels.indexOf(label) < 0) state.labels.push(label);
      emails.forEach(function (e) {
        if (!has(e, label)) e.labels.push(label);
      });
      return { label: label, labeled: emails.length, changed: emails.map(function (e) { return e.id; }) };
    },
    remove_label: function (args) {
      var label = canonLabel(args.label);
      var emails = idsOf(args);
      emails.forEach(function (e) {
        e.labels = e.labels.filter(function (l) {
          return l !== label;
        });
      });
      return { label: label, unlabeled: emails.length, changed: emails.map(function (e) { return e.id; }) };
    },
    archive: function (args) {
      var emails = idsOf(args);
      emails.forEach(function (e) {
        e.labels = e.labels.filter(function (l) {
          return l !== 'Inbox';
        });
      });
      return { archived: emails.length, changed: emails.map(function (e) { return e.id; }) };
    },
    mark_read: function (args) {
      var emails = idsOf(args);
      var unread = args.read === false;
      emails.forEach(function (e) {
        e.unread = unread;
      });
      return { marked: unread ? 'unread' : 'read', count: emails.length, changed: emails.map(function (e) { return e.id; }) };
    },
  };

  var READ_ONLY = { list_emails: true, read_email: true, search_emails: true };

  /** Run one tool. `source` is "agent" or "you". Throws an Error with a plain-English message. */
  function call(name, args, source) {
    if (!state) throw new Error('The inbox is still loading. Try again.');
    if (!tools[name]) throw new Error('Unknown tool: ' + name);
    var result = tools[name](args || {});
    if (!READ_ONLY[name]) save();
    emit({ tool: name, args: args || {}, result: result, ids: result.changed || [], source: source || 'you' });
    if (result.changed) delete result.changed;
    return result;
  }

  /** UI-only edits that are not agent tools. */
  function update(id, fields) {
    var email = find(id);
    Object.keys(fields).forEach(function (k) {
      email[k] = fields[k];
    });
    save();
    emit({ tool: 'update', ids: [id] });
  }

  function discard(id) {
    state.emails = state.emails.filter(function (e) {
      return e.id !== id;
    });
    save();
    emit({ tool: 'discard', ids: [] });
  }

  window.Mail = {
    SYSTEM: SYSTEM,
    load: load,
    reset: reset,
    call: call,
    update: update,
    discard: discard,
    find: function (id) {
      return find(id);
    },
    state: function () {
      return state;
    },
    has: has,
    matches: matches,
    shortDate: shortDate,
    longDate: longDate,
    subscribe: function (fn) {
      listeners.push(fn);
    },
    exportState: function () {
      return clone(state);
    },
  };
})();

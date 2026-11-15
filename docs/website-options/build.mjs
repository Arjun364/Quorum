// Builds the five landing-page options from the design-taste kit (assets/), the dealt parts in deal.json
// and the per-option palette/type blocks in opt<N>-start.txt. Run: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const deal = JSON.parse(readFileSync('deal.json', 'utf8').replace(/^﻿/, ''));
const MAIN = 'Start your organization';
const NAME = 'Quorum';

/* ------------------------------------------------------------------ fragments (kit markup, rewritten) */
const tick = '<svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5"/></svg>';
const icon = (d) => `<svg class="ui-icon" viewBox="0 0 16 16"><path d="${d}"/></svg>`;

const rows = [
  ['AN', 1, 'Anjali N.', 'Share ISO audit schedule', 'is-done', 'Confirmed', '30 Nov'],
  ['RM', 3, 'Rahul M.', 'Move UAT sign-off, Client Portal', '', 'Waiting', '12 Dec'],
  ['DS', 4, 'Divya S.', 'Update the vendor review sheet', 'is-you', 'Needs you', '5 Dec'],
  ['VK', 2, 'Vinod K.', 'Retire the old VPN', 'is-done', 'Confirmed', '20 Dec'],
  ['SM', 5, 'Suresh M.', 'Quote for the Kochi site', '', 'Waiting', '15 Dec'],
  ['LK', 3, 'Leena K.', 'Onboarding checklist, version 2', '', 'Waiting', '9 Dec'],
  ['AJ', 1, 'Arun J.', 'Server room audit', 'is-done', 'Confirmed', '28 Nov'],
  ['TK', 4, 'Thomas K.', 'Replace the shared inbox', 'is-you', 'Needs you', '18 Dec'],
  ['ME', 2, 'Meera E.', 'Phone use on the floor', 'is-done', 'Discussed', 'Standing'],
].map(
  ([i, t, who, sub, cls, st, due]) =>
    `<li class="ui-win__row" data-row><span class="ui-avatar" data-tone="${t}">${i}</span><span class="ui-win__who">${who}</span><span class="ui-win__sub">${sub}</span><span class="ui-win__st ${cls}" data-st>${st}</span><span class="ui-win__age">${due}</span></li>`,
).join('\n        ');

const windowFrag = (opts = '') => `<div class="ui ui-panel ui-win" data-ui="window"${opts}>
  <div class="ui-win__bar">
    <span class="ui-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="ui-win__crumb">Sales <i>/</i> <b>March meeting</b></span>
    <span class="ui-spacer"></span>
    <span class="ui-win__search" aria-hidden="true">${icon('M2.5 7a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0m8 3.5 3 3')}<span class="ui-win__ph">Search</span><span class="ui-kbd">/</span></span>
  </div>
  <div class="ui-win__body">
    <nav class="ui-win__side" aria-hidden="true">
      <span class="ui-win__nav is-on">${icon('M2.5 9h3l1 1.5h3l1-1.5h3M2.5 9 4 3.5h8L13.5 9v3.5h-11z')}Points<em>24</em></span>
      <span class="ui-win__nav">${icon('M5.5 6a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0M3.5 13.5c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5')}Mine<em>3</em></span>
      <span class="ui-win__nav">${icon('M2.5 8a5.5 5.5 0 1 0 11 0 5.5 5.5 0 0 0-11 0M8 5v3l2 1.5')}Waiting<em>5</em></span>
      <span class="ui-win__nav">${icon('m3.5 8.4 2.8 2.8 6.2-6.4')}Confirmed</span>
      <span class="ui-win__label">Views</span>
      <span class="ui-win__nav"><span class="ui-win__hash">#</span>Carried over</span>
      <span class="ui-win__nav"><span class="ui-win__hash">#</span>Standing</span>
    </nav>
    <div class="ui-win__main">
      <div class="ui-win__cols" aria-hidden="true"><span>Owner</span><span>Point</span><span>State</span><span>Due</span></div>
      <ul class="ui-win__rows">
        ${rows}
      </ul>
    </div>
  </div>
</div>`;

const chatFrag = `<div class="ui ui-panel ui-chat" data-ui="chat">
  <div class="ui-head"><span class="ui-agent" aria-hidden="true"></span><div class="ui-title">Share ISO audit schedule</div><span class="ui-chat__online">Version 2</span><span class="ui-spacer"></span></div>
  <div class="ui-chat__body">
    <div class="ui-chat__day">Version 1, 2 December</div>
    <div class="ui-msg ui-msg--bot"><span class="ui-agent ui-msg__av" aria-hidden="true"></span><span class="ui-msg__col"><span class="ui-chat__answer">Share ISO audit schedule with the team. Owner: <b>Anjali N.</b> Due <b>15 November</b>.</span></span></div>
    <div class="ui-chat__day">Anjali N., owner, 3 December</div>
    <div class="ui-msg ui-msg--me" data-chat-q><span class="ui-msg__text">The audit starts on 30 November, not the 15th. Please correct the date.</span></div>
    <div class="ui-msg ui-msg--bot" data-chat-a>
      <span class="ui-agent ui-msg__av" aria-hidden="true"></span>
      <span class="ui-msg__col">
        <span class="ui-chat__typing" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="ui-chat__answer">Changed. The due date is now <b>30 November</b>. Version 2 is ready for you to confirm.</span>
        <span class="ui-chat__srcs"><span class="ui-chat__src">${icon('M4 2.5h5l3 3v8H4zM9 2.5v3h3')}Version 2, by the note-taker</span></span>
      </span>
    </div>
  </div>
  <div class="ui-chat__input"><span class="ui-chat__ph">Confirm, or write what is wrong</span><span class="ui-chat__send" aria-hidden="true"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
</div>`;

const check = (done, label) =>
  `<li class="ui-check${done ? ' is-done' : ''}"><span class="ui-check__box">${tick}</span><span class="ui-check__label">${label}</span></li>`;
const checklist = (title, count, k, items) => `<div class="ui ui-panel ui-checks" data-ui="checklist">
  <div class="ui-checks__head"><div class="ui-title">${title}</div><span class="ui-spacer"></span><div class="ui-meta" data-checks-count>${count}</div></div>
  <div class="ui-checks__bar"><i data-checks-bar style="--k:${k}"></i></div>
  <ul class="ui-checks__list">
    ${items.map(([d, l]) => check(d, l)).join('\n    ')}
  </ul>
</div>`;

const note = (av, title, time, body, btn) =>
  `<li class="ui-note">${av}<span class="ui-note__text"><span class="ui-note__title">${title}<time>${time}</time></span><span class="ui-note__body">${body}</span></span>${btn ? '<span class="ui-btn ui-btn--sm ui-note__btn">Open</span>' : ''}</li>`;
const notifyFrag = `<div class="ui ui-notify" data-ui="notify"><ul class="ui-notify__list" data-notify-list>
    ${note('<span class="ui-agent ui-note__av" aria-hidden="true"></span>', 'Sales minutes are ready', 'now', '2 points are waiting for you', true)}
    ${note('<span class="ui-avatar ui-note__av" data-tone="3">RM</span>', 'Rahul M. confirmed', '4m', 'Move UAT sign-off, Client Portal')}
    ${note(`<span class="ui-note__ico">${icon('m3.5 8.4 2.8 2.8 6.2-6.4')}</span>`, 'Every owner confirmed', '12m', 'Ready for the department head')}
  </ul></div>`;

const sw = (on, label, sub) =>
  `<li class="ui-tg"><span class="ui-tg__text"><span class="ui-tg__label">${label}</span><span class="ui-tg__sub">${sub}</span></span><button class="ui-switch${on ? ' is-on' : ''}" type="button" role="switch" aria-checked="${on}" aria-label="${label}"><i></i></button></li>`;
const togglesFrag = (title, count, list) => `<div class="ui ui-panel ui-toggles" data-ui="toggles">
  <div class="ui-head"><svg class="ui-icon ui-toggles__ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13 4v3.6c0 3-2.1 5.4-5 6.6-2.9-1.2-5-3.6-5-6.6V4z"/><path d="m5.8 8 1.6 1.6 3-3.2"/></svg><div class="ui-title">${title}</div><span class="ui-spacer"></span><div class="ui-meta" data-tg-count>${count}</div></div>
  <ul class="ui-toggles__list">
    ${list.map(([o, l, s]) => sw(o, l, s)).join('\n    ')}
  </ul>
</div>`;

const attendance = togglesFrag('Who is present', '3 of 4 present', [
  [true, 'Rahul M., department head', 'Starts and approves'],
  [true, 'Anjali N.', 'Can be drawn'],
  [true, 'Divya S.', 'Can be drawn'],
  [false, 'Vinod K.', 'Absent, never drawn'],
]);
const branding = togglesFrag('Brand settings', '3 of 4 on', [
  [true, 'Your logo at sign-in', 'northwind.quorum.app'],
  [true, 'Your colours', 'Pick a preset or your own'],
  [true, 'Your company name in emails', 'Invitations and reminders'],
  [false, 'Hide Powered by Quorum', 'Set by the platform'],
]);
const approval = checklist('Head review', '3 of 4', 0.75, [
  [true, 'Every owner has answered'],
  [true, 'No point is disputed'],
  [true, '6 open points carry over'],
  [false, 'Approve the minutes'],
]);

const docFrag = `<div class="ui ui-doc" data-ui="doc">
  <article class="ui-doc__page">
    <div class="ui-doc__label">Sales minutes, March, version 2</div>
    <div class="ui-doc__title">Share ISO audit schedule</div>
    <div class="ui-doc__text">The audit starts on <mark class="ui-doc__mark is-on">30 November</mark>. Anjali N. owns this point and shares the schedule with the team.</div>
    <div class="ui-doc__text">Version 1 gave 15 November. The note-taker changed it after Anjali's comment, and she confirmed version 2.</div>
    <div class="ui-doc__text">Every version stays in the history, with who changed it and when.</div>
    <div class="ui-doc__text">Meera E. approved the minutes on 4 December. Six open points carry over to the next meeting.</div>
  </article>
  <aside class="ui-doc__note ui-panel is-on" aria-live="polite">
    <div class="ui-doc__kind"><span class="ui-doc__dot"></span><span data-doc-kind>Changed</span></div>
    <div class="ui-doc__msg" data-doc-msg>15 November became 30 November.</div>
    <div class="ui-doc__where" data-doc-where>Version 2, note-taker, 4 December</div>
  </aside>
</div>`;

/* ------------------------------------------------------------------ parts */
const arrow = '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
const mark = (m) => (m === 'wordmark' ? '' : m === 'initial' ? '<span class="mark mark--initial" aria-hidden="true">Q</span>' : `<span class="mark" data-mark="${m}" aria-hidden="true"></span>`);

function nav(d) {
  const cls = d.nav === 'nav-centre' ? 'nav nav--centre' : 'nav';
  const dark = '';
  const menu =
    d.nav === 'nav-centre'
      ? ''
      : `<div class="nav__menu"><div class="wrap grid">
            <div class="menu-col span-3"><p class="t-label">Run a meeting</p>
              <a href="#meeting">Draw a note-taker<span>Fair, from those present</span></a>
              <a href="#meeting">Confirm your points<span>Each owner, once</span></a>
              <a href="#meeting">Approve the minutes<span>The head signs off last</span></a></div>
            <div class="menu-col span-3"><p class="t-label">Your company</p>
              <a href="#brand">Brand settings<span>Logo, colours, address</span></a>
              <a href="#security">Data handling<span>What stays in the app</span></a></div>
            <a class="menu-card span-3 start-10" href="#product">
              <div class="panel" style="--p-h:160px"><div class="stage stage--fade-br"><div class="at-corner">${notifyFrag}</div></div></div>
              <span class="t-card">Minutes are ready</span><span class="t-small muted">Owners confirm in the app</span></a>
          </div></div>`;
  return `<header class="${cls}${dark}">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Skip to content</a>
    <a class="nav__logo" href="#top">${mark(d.mark)}${NAME}</a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item"><a class="nav__link" href="#product">Product${d.nav === 'nav-centre' ? '' : ' <svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</a>${menu}</div>
      <div class="nav__item"><a class="nav__link" href="#meeting">Meeting</a></div>
      <div class="nav__item"><a class="nav__link" href="#brand">Branding</a></div>
      <div class="nav__item"><a class="nav__link" href="#security">Security</a></div>
      <div class="nav__item"><a class="nav__link" href="#faq">Questions</a></div>
    </nav>
    <div class="nav__actions"><a class="nav__link" href="#contact">Sign in</a><a class="btn btn--primary" href="#contact">${MAIN}</a></div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
  </div>
</header>`;
}

const heroButtons = `<div class="btn-row"><a class="btn btn--primary" href="#contact">${MAIN}${arrow}</a><a class="btn btn--secondary" href="#meeting">See how a meeting runs</a></div>`;

function hero(kind, c) {
  if (kind === 'centred')
    return `<section class="hero hero--centred" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text">
      <div class="hero__c">
        <a class="pill" href="#meeting"><span>${c.pill[0]}</span><span class="muted">${c.pill[1]}</span></a>
        <h1 id="hero-h" aria-label="${c.h1}"><span class="ly-mark" aria-hidden="true"></span> ${c.h1}</h1>
        <p class="hero__lead">${c.lead}</p>
        ${heroButtons}
      </div>
      <div class="hero__window" role="img" aria-label="Sales March minutes: points with their owners and confirmation states">
        <div class="ly-piece" aria-hidden="true">${windowFrag()}</div>
      </div>
    </div></div>
  </section>`;
  if (kind === 'collage')
    return `<section class="hero hero--collage" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text grid hero__grid">
      <div class="hero__text span-5">
        <h1 id="hero-h">${c.h1}</h1>
        <p class="hero__lead">${c.lead}</p>
        ${heroButtons}
        <p class="hero__proof">${c.proof}</p>
      </div>
      <div class="hero__art span-6 start-7" role="img" aria-label="Sales March minutes with each point's owner and state, and a notice that the minutes are ready">
        <div class="ly-piece ly-piece--main" aria-hidden="true">${windowFrag()}</div>
        <div class="ly-piece ly-piece--note" aria-hidden="true" style="right:var(--s-5);bottom:var(--s-7);width:min(320px,70%)">${notifyFrag}</div>
      </div>
    </div></div>
  </section>`;
  if (kind === 'triptych')
    return `<section class="hero hero--triptych" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text grid hero__grid">
      <div class="span-3">
        <h1 id="hero-h">${c.h1}</h1>
        <p class="hero__lead">${c.lead}</p>
      </div>
      <div class="ly-collage span-6 start-4" role="img" aria-label="Points with owners, the people present at a meeting, and a notice that minutes are ready">
        <div class="ly-collage__set is-on">
          <div class="ly-piece" style="left:4%;top:5%;width:92%;height:66%" aria-hidden="true">${windowFrag()}</div>
          <div class="ly-piece" style="left:34%;top:56%;width:62%;height:40%" aria-hidden="true">${notifyFrag}</div>
        </div>
        <div class="ly-collage__set" aria-hidden="true">
          <div class="ly-piece" style="left:6%;top:6%;width:52%;height:70%">${attendance}</div>
          <div class="ly-piece" style="left:44%;top:34%;width:50%;height:60%">${notifyFrag}</div>
        </div>
        <div class="ly-collage__set" aria-hidden="true">
          <div class="ly-piece" style="left:4%;top:6%;width:58%;height:84%">${chatFrag}</div>
          <div class="ly-piece" style="left:50%;top:48%;width:46%;height:46%">${approval}</div>
        </div>
      </div>
      <div class="span-3 start-10 hero__cta"><a class="btn btn--primary" href="#contact">${MAIN}</a></div>
    </div></div>
  </section>`;
  // split
  return `<section class="hero hero--split" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text grid hero__grid">
      <div class="hero__text span-5">
        <p class="hero__kicker"><span class="dot" aria-hidden="true"></span>${c.kicker}</p>
        <h1 id="hero-h">${c.h1}</h1>
        <p class="hero__lead">${c.lead}</p>
        ${heroButtons}
      </div>
      <div class="hero__media span-6 start-7" role="img" aria-label="Sales March minutes with each point's owner and state">
        <div class="stage stage--fade-br"><div class="at-corner to-edge" style="--ax:40px;--ay:40px" aria-hidden="true">${windowFrag()}</div></div>
        <div class="ly-float"><div class="ly-float__row"><span class="ly-live">Sales</span><span>March</span></div><div class="ly-float__title">2 points wait for their owners</div></div>
      </div>
    </div></div>
  </section>`;
}

const appCss = `.app.ui { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); margin-top: var(--s-7); background: var(--u-bg); border: 1px solid var(--u-border); border-radius: var(--u-r); box-shadow: var(--u-shadow); }
.app > .app__pane { position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.app > .app__pane + .app__pane { border-left: 1px solid var(--u-line); }
.app > .app__pane > .ui-panel { width: 100%; border: 0; border-radius: 0; box-shadow: none; }
.app > .app__pane::after { content: ""; position: absolute; inset: auto 0 0 0; height: 64px; background: linear-gradient(transparent, var(--u-bg)); pointer-events: none; }
@media (min-width: 1024px) and (max-width: 1279px) { .app.ui { grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); } }
@media (max-width: 1023px) {
  .app.ui { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
  .app > .app__pane--list { max-height: 252px; }
  .app > .app__pane--list::after { display: none; }
  .app .ui-win__side { display: none; }
  .app .ui-win__body { grid-template-columns: minmax(0, 1fr); }
  .app > .app__pane + .app__pane { border-left: 0; border-top: 1px solid var(--u-line); }
}
@media (max-width: 639px) {
  .app.ui { grid-template-rows: minmax(0, 1fr); }
  .app > .app__pane--list { display: none; }
  .app > .app__pane + .app__pane { border-top: 0; }
}
.ly-piece > .ui-panel, .ly-piece > .ui-notify, .ly-piece > .ui { width: 100%; }
#meeting .panel { --p-h: 336px; }
@media (max-width: 639px) { #meeting .panel { --p-h: 220px; } }
#brand .frame--split .stage, #security .frame--split .stage { min-height: 100%; }
@media (max-width: 639px) { #security .frame--split { display: none; } #faq .faq__item:nth-child(n+5) { display: none; } }`;

function body(o, c, d) {
  const dark = d.rhythm === 'dark-band';
  const surf = d.rhythm === 'surface-pairs';
  const appSection = `<section class="section" id="product" style="--h:1" aria-labelledby="product-h">
    <div class="wrap">
      <div class="grid">
        <div class="span-5"><h2 id="product-h">${c.product[0]}</h2></div>
        <div class="span-6 start-7"><p class="t-lead muted">${c.product[1]}</p><p><a class="link" href="#meeting">See the steps</a></p></div>
      </div>
      <div class="ui app fill" role="img" aria-label="Sales March minutes: the list of points beside the open point, its owner's comment and the note-taker's reply" data-ui-pause-host>
        <div class="app__pane app__pane--list">${windowFrag()}</div>
        <div class="app__pane app__pane--open" data-ui-loop>${chatFrag}</div>
      </div>
    </div>
  </section>`;
  const panel = (inner, place) =>
    `<div class="panel"><div class="stage stage--fade-b"><div class="${place}">${inner}</div></div></div>`;
  const meetingSection = `<section class="section${dark ? ' ground-inverse' : ''}" id="meeting" style="--h:1;--hm:2" aria-labelledby="meeting-h">
    <div class="wrap">
      <div class="section-head"><h2 id="meeting-h">${c.steps[0]}</h2></div>
      <div class="grid">
        <article class="card card--row card--open span-4"><span class="step-num">1</span><h3>${c.titles[0]}</h3><p>${c.steps[1]}</p>
          <div class="panel"><div class="stage stage--fade-b"><div class="at-right to-edge" style="--ax:32px;--ay:40px">${attendance}</div></div></div></article>
        <article class="card card--row card--open span-4"><span class="step-num">2</span><h3>${c.titles[1]}</h3><p>${c.steps[2]}</p>
          ${panel(notifyFrag, 'at-rise fit" style="--fit-max:380px;--ax:32px;--ay:calc(100% - 180px);--ay-sm:calc(100% - 180px)')}</article>
        <article class="card card--row card--open span-4"><span class="step-num">3</span><h3>${c.titles[2]}</h3><p>${c.steps[3]}</p>
          ${panel(approval, 'at-rise fit" style="--fit-max:340px;--ax:max(24px, 50% - 170px);--ay:40px;--ay-sm:24px')}</article>
      </div>
    </div>
  </section>`;
  const brandSection = `<section class="section${surf ? ' ground-surface' : ''}" id="brand" style="--h:1" aria-labelledby="brand-h">
    <div class="wrap">
      <div class="grid grid--top">
        <div class="span-5">
          <h2 id="brand-h">${c.brand[0]}</h2>
          <p class="t-lead">${c.brand[1]}</p>
          <p class="t-small muted">${c.brand[2]}</p>
          <p><a class="link" href="#faq">Read the questions</a></p>
        </div>
        <div class="frame frame--split span-6 start-7"><div class="stage stage--fade-br"><div class="at-rise to-edge" style="--w:420px;--ay:56px">${branding}</div></div></div>
      </div>
    </div>
  </section>`;
  const securitySection = `<section class="section${surf ? ' ground-surface' : ''}" id="security" style="--h:1" aria-labelledby="security-h">
    <div class="wrap">
      <div class="grid grid--top">
        <div class="span-5">
          <h2 id="security-h">${c.security[0]}</h2>
          <ul class="rows">
            ${c.security[1].map(([n, t]) => `<li><span class="rows__name">${n}</span><p>${t}</p></li>`).join('\n            ')}
          </ul>
        </div>
        <div class="frame frame--split span-6 start-7"><div class="stage stage--fade-b"><div class="at-corner to-edge" style="--ax:40px;--ay:40px">${docFrag}</div></div></div>
      </div>
    </div>
  </section>`;
  const faqSection = `<section class="section" id="faq" style="--h:1" aria-labelledby="faq-h">
    <div class="wrap">
      <div class="grid grid--top">
        <div class="span-5"><h2 id="faq-h">Questions</h2><p class="t-lead muted">${c.faqLine}</p><p><a class="link" href="#contact">Contact the team</a></p></div>
        <div class="faq span-6 start-7">
          ${c.faq.map(([q, a]) => `<div class="faq__item"><h3>${q}</h3><p>${a}</p></div>`).join('\n          ')}
        </div>
      </div>
    </div>
  </section>`;

  const close =
    d.close === 'close-word'
      ? `<div class="closing__cta close--word">
      <div class="section-head--split">
        <div><h2 id="close-h">${c.close[0]}</h2><p class="t-lead">${c.close[1]}</p></div>
        <a class="btn btn--primary" href="#top">${MAIN}${arrow}</a>
      </div>
      <p class="close__word" aria-hidden="true">${NAME}</p>
    </div>`
      : `<div class="closing__cta close--type">
      <div class="section-head"><h2 id="close-h">${c.close[0]}</h2><p>${c.close[1]}</p></div>
      <a class="btn btn--primary btn--xl btn--wide" href="#top">${MAIN}${arrow}</a>
    </div>`;
  const links = `<div class="closing__links">
      <div class="grid">
        <div class="span-4 stack-4"><a class="nav__logo" href="#top">${mark(d.mark)}${NAME}</a><p class="footer__lede">${c.lede}</p></div>
        <div class="span-2 footer__col"><h3>Product</h3><ul><li><a href="#product">Points list</a></li><li><a href="#product">Open a point</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Meeting</h3><ul><li><a href="#meeting">Note-taker</a></li><li><a href="#meeting">Confirmation</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Company</h3><ul><li><a href="#brand">Branding</a></li><li><a href="#security">Security</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Help</h3><ul><li><a href="#faq">Questions</a></li><li><a href="#contact">Contact</a></li></ul></div>
      </div>
      <div class="footer__legal"><span>&copy; 2026 ${NAME}</span><div class="socials"></div></div>
    </div>`;
  const footCls = { 'footer-columns': 'footer closing', 'footer-dark': 'footer closing footer--dark ground-inverse', 'footer-statement': 'footer closing footer--statement' }[d.footer];
  const footer = `<footer class="${footCls}" id="contact" aria-labelledby="close-h">
  <div class="wrap">
    ${close}
    ${links}
  </div>
</footer>`;

  const sections = [appSection, meetingSection, brandSection, securitySection, faqSection].join('\n\n  ');
  return `${nav(d)}\n\n<main id="top">\n  ${hero(d.hero, c)}\n\n  ${sections}\n</main>\n\n${footer}`;
}

/* ------------------------------------------------------------------ the five options */
const options = [
  {
    hero: 'centred', ground: 'sky', voice: 'technical and dry, with proof',
    c: {
      h1: 'Meeting minutes for departments',
      pill: ['Reminder after 2 working days, flag after 4', 'See the steps'],
      lead: 'The department head starts the meeting, a note-taker drawn at random writes the points, and each owner confirms their own. Open points carry over by themselves.',
      product: ['Every point of the meeting in one list', 'One row per point with its owner, its state and its due date. Open a point to read the owner’s comment, the note-taker’s reply and every earlier version.'],
      titles: ['Draw a note-taker', 'Confirm your points', 'Approve and carry over'],
      steps: ['A meeting in three steps', 'The draw skips the head, last time’s note-taker and anyone absent. Three people present are enough to start.', 'Owners confirm the points that name them, or write what is wrong. Only those owners are asked again.', 'The head approves last. Whatever is not Done or Cancelled opens the next meeting.'],
      brand: ['Your company’s address, logo and colours', 'Each company signs in at its own address, with its own name, logo and colour theme. Choose one of three presets or set your own accent.', 'Emails and invitations carry your company name.'],
      security: ['How Quorum handles your minutes', [['Separate by company', 'Each company sees only its own organizations, departments and minutes.'], ['Links, not minutes', 'Emails say that minutes are ready and link into the app. They never contain the minutes.'], ['Hashed passwords', 'Passwords are stored hashed. A reused session token ends every session of that person.'], ['A history that stays', 'Every version of a point is kept, with who changed it and when.']]],
      faqLine: 'What people ask before they sign up.',
      faq: [['Who writes the minutes?', 'One person present, drawn at random for each meeting. The head starts the meeting and approves it, but never writes.'], ['What if an owner does not answer?', 'A reminder goes out after 2 working days and the point is flagged after 4. Your department can change both.'], ['Is Quorum a task manager?', 'No. Daily tasks stay where you keep them. Quorum records what was decided and the state of each point at every meeting.'], ['Can we use our own logo and address?', 'Yes. The company head sets the name, logo and colours, and the company gets its own address.'], ['Do emails contain the minutes?', 'No. They name the meeting and link into the app, where people confirm.']],
      close: ['Start your organization', 'Create the company account, then invite your department heads.'],
      lede: 'Minutes that each owner confirms.',
    },
  },
  {
    hero: 'collage', ground: 'sage', voice: 'facts only',
    c: {
      h1: 'Minutes app for department meetings',
      lead: 'Quorum records each point with one owner, keeps every version and carries what is open into the next meeting. Each company gets its own address, logo and colours.',
      proof: 'Heads start and approve. Note-takers are drawn from those present.',
      product: ['Points, owners and states', 'One row per point: its owner, its state and its due date. The open point shows the thread between the owner and the note-taker, with its version.'],
      titles: ['Pick the note-taker', 'Check what is written', 'Close the meeting'],
      steps: ['One meeting, three steps', 'The system draws one person present. It never picks the head, last meeting’s note-taker or an absent person.', 'Each owner sees the points that name them and confirms them or comments. Nobody confirms their own words.', 'The head approves. Open points carry over and the next meeting locks this one.'],
      brand: ['Name, logo and colours per company', 'The company head sets the name, uploads a logo and picks a theme. Everyone signs in at the company’s own address.', 'Three presets, or one accent colour of your own.'],
      security: ['What stays inside the app', [['Per company', 'No company can read another company’s data.'], ['Emails', 'They link into the app and never carry the minutes.'], ['Passwords', 'Stored hashed, with a lockout after repeated failures.'], ['History', 'Versions, approvals and role changes are recorded.']]],
      faqLine: 'Plain answers to the usual questions.',
      faq: [['How many people start a meeting?', 'At least three from the department, the head included. Guests from other departments can join but are never drawn.'], ['Who sees the minutes?', 'People in the department see them after the note-taker submits. Before that, only the head and the note-taker.'], ['Can a point be disputed?', 'After three comment rounds a point is marked disputed and shown to the head in review.'], ['Is there a price?', 'Price on request.'], ['Does it replace Zoho Projects?', 'No. Daily tasks stay in your task tool. Quorum keeps the meeting record.']],
      close: ['Start your organization', 'Create the company account and invite your department heads.'],
      lede: 'A record every owner has confirmed.',
    },
  },
  {
    hero: 'triptych', ground: 'sky', voice: 'second person, present tense',
    c: {
      h1: 'Monthly minutes for every department',
      lead: 'You start the meeting. A note-taker is drawn from the people present. Each owner confirms the points that name them, and you approve last.',
      product: ['The minutes as your people see them', 'Everyone sees the points that name them. Open one, read what was written, then confirm it or write what is wrong.'],
      titles: ['Mark who is present', 'Let owners answer', 'Approve the minutes'],
      steps: ['You run it in three steps', 'You mark who is present. The system draws the note-taker and tells you who it is.', 'Your owners get one email and a link. They confirm in the app, so a missed email costs nothing.', 'You approve the minutes. The points still open are waiting in the next meeting.'],
      brand: ['Your address, your logo, your colours', 'You register the company once. Your people sign in at your address and see your name and logo, not ours.', 'Your invitations name your company.'],
      security: ['What happens to your minutes', [['Your company only', 'Your minutes are visible to your company and nobody else.'], ['No minutes in email', 'An email names the meeting and links in.'], ['Passwords', 'Nobody, including us, can read a password.'], ['Every change', 'Each version of a point is kept.']]],
      faqLine: 'Before you start your meeting.',
      faq: [['Do I write the minutes?', 'No. A person present is drawn for each meeting. You start it, add your own notes and approve.'], ['What if the draw picks someone absent?', 'It cannot. Only people marked present are drawn.'], ['Can I move my own note-taker?', 'Yes, with a reason that is written down.'], ['Where do my people sign in?', 'At your company’s own address.'], ['Does Quorum assign tasks?', 'No. It records points and their state at each meeting.']],
      close: ['Start your organization', 'Create the company account, then invite your department heads.'],
      lede: 'Your meeting, confirmed by its owners.',
    },
  },
  {
    hero: 'split', ground: 'sand', voice: 'a stance against the spreadsheet',
    c: {
      kicker: 'For companies that keep minutes in Excel',
      h1: 'Meeting minutes without the Excel sheet',
      lead: 'Quorum replaces the spreadsheet of minutes. Each point has an owner and a state, every change is kept as a version, and open points move to the next meeting.',
      product: ['The sheet becomes a list of points', 'Where the spreadsheet had a cell of free text, each point has an owner, a state and a due date, and it keeps its history.'],
      titles: ['Let a person write', 'Confirm each line', 'Carry rows forward'],
      steps: ['Three steps replace the sheet', 'Nobody types into a shared file. The note-taker, drawn at random, writes the points.', 'Owners confirm what is written about them, so a wrong date is caught the same week.', 'Open points carry over on their own. Nobody copies rows into next month’s tab.'],
      brand: ['Under your own name', 'Your company signs in at its own address with its own logo and colours. The sheet had none of that.', 'Set it up once, as the company head.'],
      security: ['Where the data lives', [['Not in a shared file', 'Minutes stay in the app, visible to your department.'], ['Links into the app', 'Emails link into the app. No copy of the minutes travels by mail.'], ['A record', 'Versions and approvals are kept, so the old sheet’s overwritten cells do not happen.'], ['Per company', 'Each company’s data is separate.']]],
      faqLine: 'From the people who still have the sheet.',
      faq: [['Can we import our old sheet?', 'Not yet. Import of open points is planned.'], ['Is it another task manager?', 'No. Daily tasks stay in your task tool.'], ['Who fixes a wrong point?', 'The note-taker edits it as a new version, and the owner confirms again.'], ['Can the note-taker be the same person each month?', 'No. The previous note-taker is skipped in the draw.'], ['Do we keep old minutes?', 'Yes. A concluded meeting is locked once the next one starts.']],
      close: ['Start your organization', 'Create the company account, then invite your department heads.'],
      lede: 'One list of points, kept as versions.',
    },
  },
  {
    hero: 'centred', ground: 'sage', voice: 'plain and practical, led by the company brand',
    c: {
      h1: 'Minutes on your own company address',
      pill: ['Your logo and colours', 'See branding'],
      lead: 'Your company signs in at its own address, with its own logo and colours. Inside, each department runs its monthly meeting and confirms its minutes.',
      product: ['Every department’s minutes, in your colours', 'The same list in every department, under your logo. Owners confirm, heads approve, and open points move to the next meeting.'],
      titles: ['Start the meeting', 'Confirm in the app', 'Sign off the minutes'],
      steps: ['How a department meeting runs', 'The head starts the meeting and marks who is present. A note-taker is drawn from them at random.', 'Each owner confirms the points that name them, in your company’s own app.', 'The head approves the minutes, and unfinished points carry over.'],
      brand: ['Set up your company once', 'The company head registers the company, chooses its address and uploads a logo. Then comes the structure: organizations, departments and their heads.', 'Department heads invite their own people by email.'],
      security: ['Handling of company data', [['One company per address', 'Each address shows only that company’s data.'], ['Invitations', 'Each invitation works for one email address and expires.'], ['Emails', 'They name the meeting and link into the app.'], ['Records', 'Approvals, reopenings and role changes are logged.']]],
      faqLine: 'About running Quorum for a company.',
      faq: [['Who creates the company?', 'The head of the company registers it and becomes the company head.'], ['Who invites department heads?', 'The company head, by email. Each head invites their own team.'], ['What if people change department?', 'Heads of both departments agree. Across organizations the company head approves too.'], ['Can we change the colours later?', 'Yes, in the company’s brand settings.'], ['How do we get help?', 'Problems with the app go to the Quorum team. Company questions go to the department head.']],
      close: ['Start your organization', 'Create the company account, then invite your department heads.'],
      lede: 'Your meetings, under your own name.',
    },
  },
];

const startTxt = (i) => readFileSync(`opt${i}-start.txt`, 'utf8').replace(/^﻿/, '');

options.forEach((o, idx) => {
  const i = idx + 1;
  const d = { ...deal[idx], hero: o.hero };
  const root = startTxt(i);
  const title = `${NAME}: ${o.c.h1.toLowerCase().startsWith('meeting minutes') ? 'meeting minutes' : 'minutes'} for company departments`;
  const desc = 'Department head starts the meeting, a random note-taker writes the points, each owner confirms their own, and open points carry over.';
  const html = `<!doctype html>
<html lang="en" data-type="software" data-radius="soft" data-ground="${o.ground}" data-buttons="${d.buttons}" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta name="twitter:card" content="summary_large_image">
<meta name="site-kind" content="software">
<meta name="page-type" content="software">
${root}
<link rel="stylesheet" href="assets/ui/base.css">
<link rel="stylesheet" href="assets/ui/window/fragment.css">
<link rel="stylesheet" href="assets/ui/chat/fragment.css">
<link rel="stylesheet" href="assets/ui/checklist/fragment.css">
<link rel="stylesheet" href="assets/ui/notify/fragment.css">
<link rel="stylesheet" href="assets/ui/toggles/fragment.css">
<link rel="stylesheet" href="assets/ui/doc/fragment.css">
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<script src="assets/backgrounds/backgrounds.js"></script>
<style>
${appCss}
</style>
</head>
<body>
<!-- type: software · option ${i} (${o.voice})
     deal: hero ${o.hero}, nav ${d.nav}, close ${d.close}, footer ${d.footer}, rhythm ${d.rhythm}, buttons ${d.buttons}, mark ${d.mark} -->
${body(o, o.c, d)}
<script type="module" src="assets/system.js"></script>
<script type="module" src="assets/motion/motion.js"></script>
<script type="module" src="assets/layout/layout.js"></script>
</body>
</html>
`;
  writeFileSync(`option-${i}.html`, html, 'utf8');
  console.log(`option-${i}.html  hero=${o.hero} nav=${d.nav} footer=${d.footer} close=${d.close} rhythm=${d.rhythm} buttons=${d.buttons} mark=${d.mark}  (${html.length} bytes)`);
});

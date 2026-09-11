/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FindState } from "./pdf_find_controller.js";

const MATCHES_COUNT_LIMIT = 1000;

/**
 * Creates a "search bar" given a set of DOM elements that act as controls
 * for searching or for setting search preferences in the UI. This object
 * also sets up the appropriate events for the controls. Actual searching
 * is done by PDFFindController.
 */
class PDFFindBar {
  #dragPosition = null;

  constructor(options, eventBus, l10n) {
    this.opened = false;

    this.bar = options.bar;
    this.toggleButton = options.toggleButton;
    this.findField = options.findField;
    this.highlightAll = options.highlightAllCheckbox;
    this.caseSensitive = options.caseSensitiveCheckbox;
    this.matchDiacritics = options.matchDiacriticsCheckbox;
    this.entireWord = options.entireWordCheckbox;
    this.findMsg = options.findMsg;
    this.findResultsCount = options.findResultsCount;
    this.findPreviousButton = options.findPreviousButton;
    this.findNextButton = options.findNextButton;
    this.eventBus = eventBus;
    this.l10n = l10n;

    // Add event listeners to the DOM elements.
    this.toggleButton.addEventListener("click", () => {
      this.toggle();
    });

    this.findField.addEventListener("input", () => {
      this.dispatchEvent("");
    });

    this.bar.addEventListener("keydown", e => {
      switch (e.keyCode) {
        case 13: // Enter
          if (e.target === this.findField) {
            this.dispatchEvent("again", e.shiftKey);
          }
          break;
        case 27: // Escape
          this.close();
          break;
      }
    });

    this.findPreviousButton.addEventListener("click", () => {
      this.dispatchEvent("again", true);
    });

    this.findNextButton.addEventListener("click", () => {
      this.dispatchEvent("again", false);
    });

    this.highlightAll.addEventListener("click", () => {
      this.dispatchEvent("highlightallchange");
    });

    this.caseSensitive.addEventListener("click", () => {
      this.dispatchEvent("casesensitivitychange");
    });

    this.entireWord.addEventListener("click", () => {
      this.dispatchEvent("entirewordchange");
    });

    this.matchDiacritics.addEventListener("click", () => {
      this.dispatchEvent("diacriticmatchingchange");
    });

    this.#setupDragging();
  }

  reset() {
    this.updateUIState();
  }

  dispatchEvent(type, findPrev = false) {
    this.eventBus.dispatch("find", {
      source: this,
      type,
      query: this.findField.value,
      phraseSearch: true,
      caseSensitive: this.caseSensitive.checked,
      entireWord: this.entireWord.checked,
      highlightAll: this.highlightAll.checked,
      findPrevious: findPrev,
      matchDiacritics: this.matchDiacritics.checked,
    });
  }

  updateUIState(state, previous, matchesCount) {
    let findMsg = Promise.resolve("");
    let status = "";

    switch (state) {
      case FindState.FOUND:
        break;
      case FindState.PENDING:
        status = "pending";
        break;
      case FindState.NOT_FOUND:
        findMsg = this.l10n.get("find_not_found");
        status = "notFound";
        break;
      case FindState.WRAPPED:
        findMsg = this.l10n.get(`find_reached_${previous ? "top" : "bottom"}`);
        break;
    }
    this.findField.setAttribute("data-status", status);
    this.findField.setAttribute("aria-invalid", state === FindState.NOT_FOUND);

    findMsg.then(msg => {
      this.findMsg.textContent = msg;
    });

    this.updateResultsCount(matchesCount);
  }

  updateResultsCount({ current = 0, total = 0 } = {}) {
    const limit = MATCHES_COUNT_LIMIT;
    let matchCountMsg = Promise.resolve("");

    if (total > 0) {
      if (total > limit) {
        let key = "find_match_count_limit";

        if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
          // TODO: Remove this hard-coded `[other]` form once plural support has
          // been implemented in the mozilla-central specific `l10n.js` file.
          key += "[other]";
        }
        matchCountMsg = this.l10n.get(key, { limit });
      } else {
        let key = "find_match_count";

        if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
          // TODO: Remove this hard-coded `[other]` form once plural support has
          // been implemented in the mozilla-central specific `l10n.js` file.
          key += "[other]";
        }
        matchCountMsg = this.l10n.get(key, { current, total });
      }
    }
    matchCountMsg.then(msg => {
      this.findResultsCount.textContent = msg;
    });
  }

  open() {
    if (!this.opened) {
      this.opened = true;
      this.toggleButton.classList.add("toggled");
      this.toggleButton.setAttribute("aria-expanded", "true");
      this.bar.classList.remove("hidden");
      this.#applyDragPosition();
    }
    this.findField.select();
    this.findField.focus();
  }

  close() {
    if (!this.opened) {
      return;
    }
    this.opened = false;
    this.toggleButton.classList.remove("toggled");
    this.toggleButton.setAttribute("aria-expanded", "false");
    this.bar.classList.add("hidden");

    this.eventBus.dispatch("findbarclose", { source: this });
  }

  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  #applyDragPosition() {
    const offset = this.#dragPosition || { x: 0, y: 0 };
    this.bar.style.setProperty(
      "transform",
      `translate(${offset.x}px, ${offset.y}px)`,
      "important"
    );
  }

  #setupDragging() {
    const bar = this.bar;
    // Keep findbar on body so fixed positioning tracks the full viewport.
    if (bar.parentElement !== document.body) {
      document.body.appendChild(bar);
    }

    const DRAG_THRESHOLD = 3;
    const MIN_VISIBLE = 40;
    let dragging = false;
    let pending = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let baseLeft = 0;
    let baseTop = 0;
    let baseWidth = 0;
    let pointerId = null;

    const isTextOrButtonTarget = target =>
      !!target.closest(
        "input:not([type='checkbox']), button, textarea, select, a"
      );

    const clampOffset = (x, y) => {
      const minX = MIN_VISIBLE - baseWidth - baseLeft;
      const maxX = window.innerWidth - MIN_VISIBLE - baseLeft;
      const minY = -baseTop;
      const maxY = window.innerHeight - MIN_VISIBLE - baseTop;
      return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      };
    };

    const applyOffset = (x, y) => {
      this.#dragPosition = { x, y };
      this.#applyDragPosition();
    };

    const onPointerMove = e => {
      if ((!pending && !dragging) || e.pointerId !== pointerId) {
        return;
      }

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (pending) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
          return;
        }
        pending = false;
        dragging = true;
        bar.classList.add("dragging");
      }

      if (!dragging) {
        return;
      }

      const next = clampOffset(originX + dx, originY + dy);
      applyOffset(next.x, next.y);
      e.preventDefault();
    };

    const onPointerUp = e => {
      if (e.pointerId !== pointerId) {
        return;
      }

      const wasDragging = dragging;
      pending = false;
      dragging = false;
      pointerId = null;
      bar.classList.remove("dragging");

      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerUp, true);

      if (!wasDragging) {
        return;
      }

      // Suppress the click that would otherwise fire after a drag.
      const suppressClick = evt => {
        evt.preventDefault();
        evt.stopPropagation();
        bar.removeEventListener("click", suppressClick, true);
      };
      bar.addEventListener("click", suppressClick, true);
      e.preventDefault();
    };

    bar.addEventListener("pointerdown", e => {
      if (e.button !== 0 || isTextOrButtonTarget(e.target)) {
        return;
      }

      const current = this.#dragPosition || { x: 0, y: 0 };
      // Measure the untranslated box once, then restore current offset.
      bar.style.setProperty("transform", "none", "important");
      const rect = bar.getBoundingClientRect();
      baseLeft = rect.left;
      baseTop = rect.top;
      baseWidth = rect.width;
      applyOffset(current.x, current.y);

      startX = e.clientX;
      startY = e.clientY;
      originX = current.x;
      originY = current.y;
      pointerId = e.pointerId;
      pending = true;
      dragging = false;

      document.addEventListener("pointermove", onPointerMove, true);
      document.addEventListener("pointerup", onPointerUp, true);
      document.addEventListener("pointercancel", onPointerUp, true);
    });
  }
}

export { PDFFindBar };

(() => {
  // js/db.js
  var db = null;
  async function initDB() {
    const [SQL, buffer] = await Promise.all([
      initSqlJs({ locateFile: (file) => `vendor/${file}` }),
      fetch("data/beautiful_data.db").then((r) => r.arrayBuffer())
    ]);
    db = new SQL.Database(new Uint8Array(buffer));
    return db;
  }
  function query(sql, params = []) {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // js/router.js
  var routes = {};
  var currentCleanup = null;
  function register(pattern, handler) {
    routes[pattern] = handler;
  }
  function navigate(hash) {
    window.location.hash = hash;
  }
  function parseHash() {
    const hash = window.location.hash.slice(1) || "/hysa";
    const [path, qs] = hash.split("?");
    const params = new URLSearchParams(qs || "");
    return { path, params };
  }
  function matchRoute(path) {
    if (routes[path]) return { handler: routes[path], params: {} };
    for (const pattern of Object.keys(routes)) {
      const parts = pattern.split("/");
      const pathParts = path.split("/");
      if (parts.length !== pathParts.length) continue;
      const routeParams = {};
      let match = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(":")) {
          routeParams[parts[i].slice(1)] = pathParts[i];
        } else if (parts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }
      if (match) return { handler: routes[pattern], params: routeParams };
    }
    return null;
  }
  async function handleRoute() {
    const app = document.getElementById("app");
    const { path, params: queryParams } = parseHash();
    const match = matchRoute(path);
    if (typeof currentCleanup === "function") {
      currentCleanup();
      currentCleanup = null;
    }
    app.classList.add("page-exit");
    await new Promise((r) => setTimeout(r, 150));
    while (app.firstChild) {
      app.removeChild(app.firstChild);
    }
    app.classList.remove("page-exit");
    if (match) {
      const routeParams = { ...match.params };
      for (const [k, v] of queryParams) {
        routeParams[k] = v;
      }
      currentCleanup = await match.handler(app, routeParams);
    } else if (routes["*"]) {
      currentCleanup = await routes["*"](app, {});
    }
    app.classList.add("page-enter");
    app.addEventListener("animationend", () => {
      app.classList.remove("page-enter");
    }, { once: true });
    window.scrollTo(0, 0);
  }
  function startRouter() {
    window.addEventListener("hashchange", handleRoute);
    handleRoute();
  }

  // js/render.js
  function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;
      if (key === "className") {
        element.className = value;
      } else if (key === "text") {
        element.textContent = value;
      } else if (key.startsWith("on")) {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "dataset") {
        for (const [dk, dv] of Object.entries(value)) {
          element.dataset[dk] = dv;
        }
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    }
    if (typeof children === "string") {
      element.textContent = children;
    } else if (Array.isArray(children)) {
      for (const child of children) {
        if (child == null) continue;
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      }
    }
    return element;
  }
  function mount(parent, ...elements) {
    for (const element of elements) {
      if (element != null) {
        parent.appendChild(element);
      }
    }
  }
  function clear(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  // js/components/header.js
  function renderHeader() {
    const header = document.getElementById("site-header");
    while (header.firstChild) header.removeChild(header.firstChild);
    const inner = el("div", { className: "container site-header__inner" }, [
      el("a", { className: "site-header__logo", href: "#/hysa" }, [
        document.createTextNode("Credit Union "),
        el("span", {}, "Data")
      ]),
      el("nav", { className: "site-nav" }, [
        el("a", { className: "site-nav__link", href: "#/hysa", dataset: { nav: "hysa" } }, "HYSA Rates"),
        el("a", { className: "site-nav__link", href: "#/browse", dataset: { nav: "browse" } }, "Browse CUs")
      ])
    ]);
    mount(header, inner);
    updateActiveNav();
    window.addEventListener("hashchange", updateActiveNav);
  }
  function updateActiveNav() {
    const hash = window.location.hash.slice(1) || "/hysa";
    const links = document.querySelectorAll(".site-nav__link");
    links.forEach((link) => {
      const nav = link.dataset.nav;
      const isActive = hash.startsWith("/" + nav);
      link.classList.toggle("site-nav__link--active", isActive);
    });
  }

  // js/components/footer.js
  function renderFooter() {
    const footer = document.getElementById("site-footer");
    while (footer.firstChild) footer.removeChild(footer.firstChild);
    const inner = el("div", { className: "container site-footer__inner" }, [
      el("span", { className: "site-footer__text" }, "Credit Union Data Project \u2014 Open source, community-driven data."),
      el("div", { className: "site-footer__links" }, [
        el("a", {
          className: "site-footer__link",
          href: "https://github.com/atsaloli/credit-union-datasets",
          target: "_blank",
          rel: "noopener"
        }, "GitHub"),
        el("span", { className: "site-footer__link" }, "Data from NCUA")
      ])
    ]);
    mount(footer, inner);
  }

  // js/utils/format.js
  var SMALL_WORDS = /* @__PURE__ */ new Set(["of", "the", "and", "in", "for", "to", "at", "by", "a", "an", "or"]);
  function titleCase(str) {
    if (!str) return "";
    return str.toLowerCase().split(/\s+/).map((word, i) => {
      if (i === 0 || !SMALL_WORDS.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(" ");
  }
  function formatNumber(n) {
    return Number(n).toLocaleString();
  }
  function countUp(element, target, duration = 800) {
    const start = performance.now();
    let rafId;
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = (target * eased).toFixed(2);
      element.textContent = current + "%";
      if (progress < 1) {
        rafId = requestAnimationFrame(update);
      } else {
        element.textContent = target.toFixed(2) + "%";
        element.classList.add("apy-counted");
      }
    }
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }

  // js/components/card.js
  function createHysaCard(data, rank) {
    const apyNum = parseFloat(data.apy.replace("%", ""));
    const apyEl = el("div", { className: "hysa-card__apy mono" }, "0.00%");
    const infoCol = el("div", {}, [
      el("div", { className: "hysa-card__name" }, titleCase(data.credit_union_name)),
      el("div", { className: "hysa-card__meta" }, `${titleCase(data.city)}, ${data.state}`),
      el("div", { className: "hysa-card__product" }, data.product),
      el(
        "div",
        { className: "hysa-card__balance mono" },
        `${data.min_balance} \u2013 ${data.max_balance}`
      )
    ]);
    const linkCol = el("div", { style: { textAlign: "right", alignSelf: "start" } }, [
      apyEl,
      data.url ? el("a", {
        className: "hysa-card__link",
        href: data.url,
        target: "_blank",
        rel: "noopener"
      }, "View product \u2192") : null,
      el("a", {
        className: "hysa-card__link",
        href: `#/detail/${data.charter_number}`,
        style: { display: "block", marginTop: "0.5rem" }
      }, "CU details \u2192")
    ]);
    const card = el("div", { className: "hysa-card" }, [
      el("div", { className: "hysa-card__rank mono" }, `#${rank}`),
      infoCol,
      linkCol
    ]);
    let cancelCountUp;
    const timeoutId = setTimeout(() => {
      cancelCountUp = countUp(apyEl, apyNum, 800);
    }, rank * 80);
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (cancelCountUp) cancelCountUp();
    };
    return { element: card, cleanup };
  }

  // js/pages/hysa.js
  async function hysaPage(container) {
    const wrap = el("div", { className: "container" });
    const cleanups = [];
    const products = query(`
    SELECT h.*, n.credit_union_name, n.city, n.state
    FROM hysa h
    JOIN ncua_ n ON h.charter_number = n.charter_number
    ORDER BY CAST(REPLACE(h.apy, '%', '') AS REAL) DESC
  `);
    const totalCUs = query("SELECT COUNT(*) as count FROM ncua_")[0].count;
    const hysaCount = products.length;
    const statesCount = query("SELECT COUNT(DISTINCT state) FROM ncua_")[0]["COUNT(DISTINCT state)"];
    const lastUpdated = products.length > 0 ? products[0].last_updated : "N/A";
    const hero = el("div", { className: "hysa-hero reveal" }, [
      el("h1", { className: "hysa-hero__title" }, "High-Yield Savings Rates"),
      el("p", { className: "hysa-hero__subtitle" }, "Credit union HYSA products ranked by annual percentage yield."),
      el("div", { className: "hysa-hero__updated" }, `Last updated ${lastUpdated}`)
    ]);
    const stats = el("div", { className: "stats-strip reveal", style: { animationDelay: "100ms" } }, [
      el("div", { className: "stats-strip__item" }, [
        el("span", { className: "stats-strip__value" }, formatNumber(totalCUs)),
        el("span", { className: "stats-strip__label" }, "Credit Unions Tracked")
      ]),
      el("div", { className: "stats-strip__item" }, [
        el("span", { className: "stats-strip__value" }, String(hysaCount)),
        el("span", { className: "stats-strip__label" }, "HYSA Products")
      ]),
      el("div", { className: "stats-strip__item" }, [
        el("span", { className: "stats-strip__value" }, String(statesCount)),
        el("span", { className: "stats-strip__label" }, "States & Territories")
      ])
    ]);
    const leaderboard = el("div", { className: "hysa-leaderboard reveal-stagger" });
    for (let i = 0; i < products.length; i++) {
      const { element, cleanup } = createHysaCard(products[i], i + 1);
      leaderboard.appendChild(element);
      cleanups.push(cleanup);
    }
    mount(wrap, hero, stats, leaderboard);
    mount(container, wrap);
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }

  // js/utils/debounce.js
  function debounce(fn, ms = 250) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // js/components/search.js
  function createSearchBar({ onFilter, initialQuery, initialState, initialEligibility }) {
    const states = query("SELECT DISTINCT state FROM ncua_ WHERE state IS NOT NULL ORDER BY state");
    const searchInput = el("input", {
      className: "search-input",
      type: "text",
      placeholder: "Search credit unions by name or charter #...",
      value: initialQuery || ""
    });
    const searchIcon = el("span", { className: "search-wrap__icon" }, "\u2315");
    const searchWrap = el("div", { className: "search-wrap" }, [
      searchIcon,
      searchInput
    ]);
    const stateSelect = el("select", { className: "select" }, [
      el("option", { value: "" }, "All States"),
      ...states.map((s) => {
        const opt = el("option", { value: s.state }, s.state);
        if (s.state === initialState) opt.selected = true;
        return opt;
      })
    ]);
    const eligibilityOptions = ["all", "open", "limited"];
    const currentEligibility = initialEligibility || "all";
    const pills = eligibilityOptions.map((opt) => {
      const isActive = opt === currentEligibility;
      const pill = el("button", {
        className: `pill ${isActive ? "pill--active" : ""}`,
        dataset: { eligibility: opt }
      }, opt.charAt(0).toUpperCase() + opt.slice(1));
      pill.addEventListener("click", () => {
        document.querySelectorAll("[data-eligibility]").forEach((p) => {
          p.classList.remove("pill--active");
        });
        pill.classList.add("pill--active");
        triggerFilter();
      });
      return pill;
    });
    const eligibilityWrap = el("div", { className: "browse-eligibility" }, [
      el("span", { className: "text-xs text-muted", style: { marginRight: "0.25rem" } }, "Eligibility:"),
      ...pills
    ]);
    const bar = el("div", { className: "browse-filters" }, [
      searchWrap,
      stateSelect,
      eligibilityWrap
    ]);
    function getFilters() {
      const activePill = document.querySelector("[data-eligibility].pill--active");
      return {
        q: searchInput.value.trim(),
        state: stateSelect.value,
        eligibility: activePill ? activePill.dataset.eligibility : "all"
      };
    }
    function triggerFilter() {
      onFilter(getFilters());
    }
    const debouncedFilter = debounce(triggerFilter, 250);
    searchInput.addEventListener("input", debouncedFilter);
    stateSelect.addEventListener("change", triggerFilter);
    return { element: bar, getFilters };
  }

  // js/components/table.js
  function createTable(rows, { onSort, sortCol, sortDir }) {
    const columns = [
      { key: "charter_number", label: "Charter #", mono: true },
      { key: "credit_union_name", label: "Name" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "has_website", label: "Web", dot: true },
      { key: "has_membership", label: "Membership", dot: true },
      { key: "has_hysa", label: "HYSA", dot: true }
    ];
    const thead = el("thead", {}, [
      el("tr", {}, columns.map((col) => {
        const isSorted = sortCol === col.key;
        const arrow = isSorted ? sortDir === "asc" ? " \u2191" : " \u2193" : " \u2195";
        const th = el("th", {
          className: isSorted ? "sorted" : "",
          onClick: () => onSort(col.key)
        }, [
          document.createTextNode(col.label),
          el("span", { className: "sort-arrow" }, arrow)
        ]);
        return th;
      }))
    ]);
    const tbody = el("tbody");
    for (const row of rows) {
      const tr = el("tr", {
        onClick: () => navigate(`#/detail/${row.charter_number}`)
      }, [
        el("td", { className: "mono" }, String(row.charter_number)),
        el("td", { className: "font-medium" }, titleCase(row.credit_union_name)),
        el("td", {}, titleCase(row.city || "")),
        el("td", {}, row.state || ""),
        el("td", {}, [el("span", { className: `dot ${row.has_website ? "dot--active" : ""}` })]),
        el("td", {}, [el("span", { className: `dot ${row.has_membership ? "dot--active" : ""}` })]),
        el("td", {}, [el("span", { className: `dot ${row.has_hysa ? "dot--active" : ""}` })])
      ]);
      tbody.appendChild(tr);
    }
    const table = el("table", { className: "data-table" }, [thead, tbody]);
    return table;
  }
  function createMobileCards(rows) {
    const container = el("div", { className: "browse-cards" });
    for (const row of rows) {
      const card = el("div", {
        className: "browse-card",
        onClick: () => navigate(`#/detail/${row.charter_number}`)
      }, [
        el("div", { className: "browse-card__name" }, titleCase(row.credit_union_name)),
        el(
          "div",
          { className: "browse-card__meta" },
          `${titleCase(row.city || "")}, ${row.state || ""}`
        ),
        el("div", { className: "browse-card__charter mono" }, `#${row.charter_number}`),
        el("div", { className: "browse-card__dots" }, [
          el("span", { className: `dot ${row.has_website ? "dot--active" : ""}` }),
          el("span", { className: "browse-card__dot-label" }, "Web"),
          el("span", { className: `dot ${row.has_membership ? "dot--active" : ""}` }),
          el("span", { className: "browse-card__dot-label" }, "Membership"),
          el("span", { className: `dot ${row.has_hysa ? "dot--active" : ""}` }),
          el("span", { className: "browse-card__dot-label" }, "HYSA")
        ])
      ]);
      container.appendChild(card);
    }
    return container;
  }

  // js/components/pagination.js
  function createPagination({ currentPage, totalPages, totalRows, onPage }) {
    if (totalPages <= 1) {
      return el("div", { className: "pagination" }, [
        el("span", { className: "pagination__info" }, `${totalRows} results`)
      ]);
    }
    const items = [];
    items.push(el("button", {
      className: "pagination__btn",
      disabled: currentPage === 1 ? "true" : void 0,
      onClick: () => {
        if (currentPage > 1) onPage(currentPage - 1);
      }
    }, "\u2190"));
    const pages = getPaginationRange(currentPage, totalPages);
    for (const p of pages) {
      if (p === "...") {
        items.push(el("span", { className: "pagination__info" }, "\u2026"));
      } else {
        items.push(el("button", {
          className: `pagination__btn ${p === currentPage ? "pagination__btn--active" : ""}`,
          onClick: () => onPage(p)
        }, String(p)));
      }
    }
    items.push(el("button", {
      className: "pagination__btn",
      disabled: currentPage === totalPages ? "true" : void 0,
      onClick: () => {
        if (currentPage < totalPages) onPage(currentPage + 1);
      }
    }, "\u2192"));
    items.push(el("span", { className: "pagination__info" }, `${totalRows} results`));
    return el("div", { className: "pagination" }, items);
  }
  function getPaginationRange(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  }

  // js/pages/browse.js
  var PAGE_SIZE = 50;
  async function browsePage(container, routeParams) {
    const wrap = el("div", { className: "container" });
    const initialQ = routeParams.q || "";
    const initialState = routeParams.state || "";
    const initialEligibility = routeParams.eligibility || "all";
    const initialPage = parseInt(routeParams.page, 10) || 1;
    let currentPage = initialPage;
    let currentSort = { col: "credit_union_name", dir: "asc" };
    const header = el("div", { className: "browse-header reveal" }, [
      el("h1", { className: "browse-header__title" }, "Browse Credit Unions")
    ]);
    const resultsInfo = el("div", { className: "browse-results-info" });
    const tableWrap = el("div", { className: "browse-table-wrap" });
    const mobileCardsWrap = el("div");
    const paginationWrap = el("div");
    const { element: searchBar, getFilters } = createSearchBar({
      onFilter: (filters) => {
        currentPage = 1;
        updateURL(filters, currentPage);
        renderResults(filters);
      },
      initialQuery: initialQ,
      initialState,
      initialEligibility
    });
    mount(wrap, header, searchBar, resultsInfo, tableWrap, mobileCardsWrap, paginationWrap);
    mount(container, wrap);
    function buildQuery(filters, countOnly = false) {
      const select = countOnly ? "SELECT COUNT(*) as count" : `SELECT n.charter_number, n.credit_union_name, n.city, n.state,
              (w.url IS NOT NULL) as has_website,
              (m.charter_number IS NOT NULL) as has_membership,
              (h.charter_number IS NOT NULL) as has_hysa`;
      let sql = `${select}
      FROM ncua_ n
      LEFT JOIN website w ON n.charter_number = w.charter_number
      LEFT JOIN membership m ON n.charter_number = m.charter_number
      LEFT JOIN hysa h ON n.charter_number = h.charter_number`;
      const conditions = [];
      const params = [];
      if (filters.q) {
        conditions.push(`(n.credit_union_name LIKE ? OR CAST(n.charter_number AS TEXT) LIKE ?)`);
        params.push(`%${filters.q}%`, `%${filters.q}%`);
      }
      if (filters.state) {
        conditions.push("n.state = ?");
        params.push(filters.state);
      }
      if (filters.eligibility === "open") {
        conditions.push(`m.membership_eligibility = 'open'`);
      } else if (filters.eligibility === "limited") {
        conditions.push(`m.membership_eligibility = 'limited'`);
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      if (!countOnly) {
        const sortCol = currentSort.col;
        const sortDir = currentSort.dir.toUpperCase();
        const validCols = ["charter_number", "credit_union_name", "city", "state", "has_website", "has_membership", "has_hysa"];
        const safeCol = validCols.includes(sortCol) ? sortCol : "credit_union_name";
        const safeDir = sortDir === "DESC" ? "DESC" : "ASC";
        const colNeedsAlias = ["charter_number", "credit_union_name", "city", "state"];
        const orderCol = colNeedsAlias.includes(safeCol) ? `n.${safeCol}` : safeCol;
        sql += ` ORDER BY ${orderCol} ${safeDir}`;
        sql += ` LIMIT ${PAGE_SIZE} OFFSET ${(currentPage - 1) * PAGE_SIZE}`;
      }
      return { sql, params };
    }
    function renderResults(filters) {
      const { sql: countSql, params: countParams } = buildQuery(filters, true);
      const totalRows = query(countSql, countParams)[0].count;
      const totalPages = Math.ceil(totalRows / PAGE_SIZE);
      const { sql, params } = buildQuery(filters, false);
      const rows = query(sql, params);
      clear(resultsInfo);
      const start = (currentPage - 1) * PAGE_SIZE + 1;
      const end = Math.min(currentPage * PAGE_SIZE, totalRows);
      const infoText = totalRows > 0 ? `Showing ${start}\u2013${end} of ${totalRows}` : "No results found";
      if (filters.eligibility !== "all") {
        resultsInfo.appendChild(
          document.createTextNode(`${infoText} (filtering by membership data \u2014 ${query("SELECT COUNT(*) as c FROM membership")[0].c} CUs have eligibility info)`)
        );
      } else {
        resultsInfo.textContent = infoText;
      }
      clear(tableWrap);
      const table = createTable(rows, {
        sortCol: currentSort.col,
        sortDir: currentSort.dir,
        onSort: (col) => {
          if (currentSort.col === col) {
            currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
          } else {
            currentSort.col = col;
            currentSort.dir = "asc";
          }
          renderResults(getFilters());
        }
      });
      tableWrap.appendChild(table);
      clear(mobileCardsWrap);
      mobileCardsWrap.appendChild(createMobileCards(rows));
      clear(paginationWrap);
      paginationWrap.appendChild(createPagination({
        currentPage,
        totalPages,
        totalRows,
        onPage: (page) => {
          currentPage = page;
          const f = getFilters();
          updateURL(f, page);
          renderResults(f);
          window.scrollTo(0, 0);
        }
      }));
    }
    function updateURL(filters, page) {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.state) params.set("state", filters.state);
      if (filters.eligibility !== "all") params.set("eligibility", filters.eligibility);
      if (page > 1) params.set("page", page);
      const qs = params.toString();
      const hash = "/browse" + (qs ? "?" + qs : "");
      history.replaceState(null, "", "#" + hash);
    }
    renderResults(getFilters());
  }

  // js/components/pill.js
  function createEligibilityPill(eligibility) {
    if (!eligibility) return null;
    const label = eligibility.charAt(0).toUpperCase() + eligibility.slice(1);
    const className = eligibility === "open" ? "pill pill--open" : "pill pill--limited";
    return el("span", { className }, label);
  }

  // js/pages/detail.js
  async function detailPage(container, routeParams) {
    const charterNumber = routeParams.charter_number || routeParams.id;
    const wrap = el("div", { className: "container" });
    const back = el("a", { className: "detail-back", href: "#/browse" }, "\u2190 Back to Browse");
    const cu = query("SELECT * FROM ncua_ WHERE charter_number = ?", [charterNumber]);
    if (cu.length === 0) {
      mount(
        wrap,
        back,
        el("div", { className: "not-found", style: { marginTop: "4rem" } }, [
          el("div", { className: "not-found__code" }, "?"),
          el("div", { className: "not-found__message" }, `No credit union found with charter #${charterNumber}`)
        ])
      );
      mount(container, wrap);
      return;
    }
    const cuData = cu[0];
    const website = query("SELECT * FROM website WHERE charter_number = ?", [charterNumber]);
    const hysa = query("SELECT * FROM hysa WHERE charter_number = ?", [charterNumber]);
    const membership = query("SELECT * FROM membership WHERE charter_number = ?", [charterNumber]);
    const header = el("div", { className: "detail-header reveal" }, [
      el("div", { className: "detail-charter mono" }, `CHARTER #${cuData.charter_number}`),
      el("h1", { className: "detail-name" }, titleCase(cuData.credit_union_name)),
      el(
        "div",
        { className: "detail-location" },
        `${titleCase(cuData.city || "")}, ${cuData.state || ""}`
      )
    ]);
    let websiteSection = null;
    if (website.length > 0 && website[0].url) {
      websiteSection = el("div", { className: "detail-section reveal", style: { animationDelay: "100ms" } }, [
        el("div", { className: "detail-section__title" }, "Website"),
        el("a", {
          className: "ext-link",
          href: website[0].url,
          target: "_blank",
          rel: "noopener"
        }, website[0].url)
      ]);
    }
    let hysaSection = null;
    if (hysa.length > 0) {
      const h = hysa[0];
      hysaSection = el("div", { className: "detail-section reveal", style: { animationDelay: "150ms" } }, [
        el("div", { className: "detail-section__title" }, "High-Yield Savings Account"),
        el("div", { className: "detail-section__apy mono" }, h.apy),
        el("div", { className: "detail-section__row" }, [
          el("span", { className: "detail-section__label" }, "Product"),
          el("span", { className: "detail-section__value" }, h.product)
        ]),
        el("div", { className: "detail-section__row" }, [
          el("span", { className: "detail-section__label" }, "Min Balance"),
          el("span", { className: "detail-section__value mono" }, h.min_balance)
        ]),
        el("div", { className: "detail-section__row" }, [
          el("span", { className: "detail-section__label" }, "Max Balance"),
          el("span", { className: "detail-section__value mono" }, h.max_balance)
        ]),
        el("div", { className: "detail-section__row" }, [
          el("span", { className: "detail-section__label" }, "Last Updated"),
          el("span", { className: "detail-section__value mono" }, h.last_updated)
        ]),
        h.url ? el("div", { style: { marginTop: "1rem" } }, [
          el("a", {
            className: "ext-link",
            href: h.url,
            target: "_blank",
            rel: "noopener"
          }, "View product page \u2192")
        ]) : null
      ]);
    }
    let membershipSection = null;
    if (membership.length > 0) {
      const m = membership[0];
      const pill = createEligibilityPill(m.membership_eligibility);
      membershipSection = el("div", { className: "detail-section reveal", style: { animationDelay: "200ms" } }, [
        el("div", { className: "detail-section__title" }, "Membership"),
        el("div", { style: { marginBottom: "0.75rem" } }, pill ? [pill] : []),
        m.membership_field ? el("div", { className: "detail-membership-text" }, m.membership_field) : null,
        m.membership_url ? el("div", { style: { marginTop: "1rem" } }, [
          el("a", {
            className: "ext-link",
            href: m.membership_url,
            target: "_blank",
            rel: "noopener"
          }, "Membership info \u2192")
        ]) : null,
        m.membership_notes ? el("div", {
          className: "text-sm text-muted",
          style: { marginTop: "0.75rem", fontStyle: "italic" }
        }, m.membership_notes) : null
      ]);
    }
    const hasRight = hysa.length > 0 || membership.length > 0;
    const hasLeft = website.length > 0;
    const noWebsite = !websiteSection ? el("div", { className: "empty-state reveal", style: { animationDelay: "100ms" } }, "No website data available") : null;
    const noHysa = !hysaSection ? el("div", { className: "empty-state reveal", style: { animationDelay: "150ms" } }, "No HYSA data available") : null;
    const noMembership = !membershipSection ? el("div", { className: "empty-state reveal", style: { animationDelay: "200ms" } }, "No membership data available") : null;
    const grid = el("div", { className: "detail-grid" }, [
      el("div", { className: "flex flex-col gap-6" }, [
        websiteSection || noWebsite,
        membershipSection || noMembership
      ]),
      el("div", { className: "flex flex-col gap-6" }, [
        hysaSection || noHysa
      ])
    ]);
    mount(wrap, back, header, grid);
    mount(container, wrap);
  }

  // js/pages/notfound.js
  async function notFoundPage(container) {
    const wrap = el("div", { className: "container" });
    const content = el("div", { className: "not-found reveal" }, [
      el("div", { className: "not-found__code" }, "404"),
      el("div", { className: "not-found__message" }, "This page does not exist."),
      el("a", { className: "not-found__link", href: "#/hysa" }, "\u2190 Back to HYSA Dashboard")
    ]);
    mount(wrap, content);
    mount(container, wrap);
  }

  // js/app.js
  async function boot() {
    try {
      await initDB();
      renderHeader();
      renderFooter();
      register("/", hysaPage);
      register("/hysa", hysaPage);
      register("/browse", browsePage);
      register("/detail/:charter_number", detailPage);
      register("*", notFoundPage);
      startRouter();
    } catch (err) {
      console.error("Boot failed:", err);
      const app = document.getElementById("app");
      while (app.firstChild) app.removeChild(app.firstChild);
      const msg = document.createElement("div");
      msg.className = "container";
      msg.style.paddingTop = "4rem";
      msg.style.textAlign = "center";
      const p = document.createElement("p");
      p.className = "text-secondary";
      p.textContent = "Failed to load the database. Please try refreshing.";
      msg.appendChild(p);
      const pre = document.createElement("pre");
      pre.className = "mono text-xs text-muted";
      pre.style.marginTop = "1rem";
      pre.textContent = err.message;
      msg.appendChild(pre);
      app.appendChild(msg);
    }
  }
  boot();
})();

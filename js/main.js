(function () {
  function initServerTime() {
    var el = document.getElementById('server-time');
    var sgtEl = document.getElementById('server-time-sgt');
    var resetSgtEl = document.getElementById('raid-reset-sgt');
    if (!el) return;
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function formatUS(d) {
      return d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    function formatSGT(d) {
      return d.toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    function update() {
      var d = new Date();
      el.textContent = formatUS(d);
      el.setAttribute('datetime', d.toISOString());
      if (sgtEl) sgtEl.textContent = '(SGT ' + formatSGT(d) + ')';
    }
    update();
    setInterval(update, 1000);
    if (resetSgtEl) {
      var wed4amEastern = getNextWednesday4amEastern();
      var sgtStr = wed4amEastern.toLocaleString('en-SG', { timeZone: 'Asia/Singapore', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
      resetSgtEl.textContent = '(SGT ' + sgtStr + ')';
    }
    function getNextWednesday4amEastern() {
      var d = new Date();
      var utcDay = d.getUTCDay();
      var add = (utcDay === 3 && d.getUTCHours() >= 9) ? 7 : (3 - utcDay + 7) % 7;
      if (add === 0 && d.getUTCHours() >= 9) add = 7;
      var wed = new Date(d);
      wed.setUTCDate(wed.getUTCDate() + add);
      wed.setUTCHours(9, 0, 0, 0);
      return wed;
    }
  }
  initServerTime();

  const TBODY_IDS = {
    Engineering: 'engineering-tbody',
    Jewelcrafting: 'jewelcrafting-tbody',
    Enchanting: 'enchanting-tbody',
    Blacksmithing: 'blacksmithing-tbody',
    Leatherworking: 'leatherworking-tbody',
    Tailoring: 'tailoring-tbody'
  };

  function formatGold(value) {
    return Number(value).toFixed(1) + 'g';
  }

  function parseNum(val) {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  function normalizeItem(raw) {
    var wowheadId = raw.wowheadItemId != null ? parseInt(raw.wowheadItemId, 10) : null;
    if (raw.materials && Array.isArray(raw.materials)) {
      return {
        item: raw.item,
        wowheadItemId: isNaN(wowheadId) ? null : wowheadId,
        materials: raw.materials.map(function (m) {
          return { label: m.label || '', price: parseNum(m.price) };
        }),
        sellingPrice: parseNum(raw.sellingPrice)
      };
    }
    var labels = (raw.materialsNeeded || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      item: raw.item,
      wowheadItemId: isNaN(wowheadId) ? null : wowheadId,
      materials: labels.length ? labels.map(function (l) { return { label: l, price: 0 }; }) : [{ label: '—', price: 0 }],
      sellingPrice: parseNum(raw.sellingPrice != null ? raw.sellingPrice : raw.materialCost)
    };
  }

  function updateProfitCell(row) {
    const materialsContainer = row.querySelector('.materials-list');
    const sellingInput = row.querySelector('.selling-price-input');
    const profitCell = row.querySelector('.profit-cell');
    if (!materialsContainer || !sellingInput || !profitCell) return;
    var totalCost = 0;
    materialsContainer.querySelectorAll('.material-price-input').forEach(function (inp) {
      totalCost += parseNum(inp.value);
    });
    var selling = parseNum(sellingInput.value);
    var profit = selling - totalCost;
    var pct = selling > 0 ? (profit / selling * 100) : 0;
    profitCell.textContent = formatGold(profit) + ' (' + pct.toFixed(0) + '%)';
    profitCell.classList.toggle('profit-negative', profit < 0);
  }

  function renderRow(itemData) {
    const item = normalizeItem(itemData);
    const tr = document.createElement('tr');
    const materialsHtml = item.materials.map(function (m, i) {
      return '<div class="material-row">' +
        '<span class="material-label">' + escapeHtml(m.label) + '</span>' +
        '<input type="number" min="0" step="0.1" class="material-price-input" value="' + (m.price || '') + '" data-row="row" placeholder="0">' +
        '<span class="material-g-suffix">g</span>' +
      '</div>';
    }).join('');
    var itemCellHtml = '<div class="item-name">' + escapeHtml(item.item) + '</div>';
    if (item.wowheadItemId) {
      var whUrl = 'https://www.wowhead.com/wotlk/item=' + item.wowheadItemId;
      itemCellHtml += '<a href="' + escapeHtml(whUrl) + '" class="item-tooltip-link" target="_blank" rel="noopener noreferrer">View item</a>';
    }
    tr.innerHTML =
      '<td class="item-cell">' + itemCellHtml + '</td>' +
      '<td class="materials-cell"><div class="materials-list">' + materialsHtml + '</div></td>' +
      '<td class="selling-cell">' +
        '<input type="number" min="0" step="0.1" class="selling-price-input" value="' + (item.sellingPrice || '') + '" placeholder="0">' +
        '<span class="material-g-suffix">g</span>' +
      '</td>' +
      '<td class="profit-cell">' + formatGold(0) + ' (0%)</td>';
    var materialsList = tr.querySelector('.materials-list');
    var sellingInput = tr.querySelector('.selling-price-input');
    function recalc() { updateProfitCell(tr); }
    materialsList.querySelectorAll('.material-price-input').forEach(function (inp) {
      inp.addEventListener('input', recalc);
      inp.addEventListener('change', recalc);
    });
    sellingInput.addEventListener('input', recalc);
    sellingInput.addEventListener('change', recalc);
    updateProfitCell(tr);
    return tr;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderTable(professionName, items) {
    const tbodyId = TBODY_IDS[professionName];
    if (!tbodyId) return;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    items.forEach(function (item) {
      tbody.appendChild(renderRow(item));
    });
  }

  var FALLBACK_DATA = {
    Engineering: [
      { item: "Mechano-Hog / Mekgineer's Chopper", wowheadItemId: 41508, materials: [ { label: "12x Titansteel Bar", price: 0 }, { label: "40x Cobalt Bolt", price: 0 }, { label: "2x Arctic Fur", price: 0 }, { label: "1x Salvaged Iron Golem Parts", price: 0 }, { label: "1x Goblin-machined Piston", price: 0 }, { label: "1x Elementium-plated Exhaust Pipe", price: 0 } ], sellingPrice: 0 },
      { item: "Titansteel Destroyer / Bonecrusher", wowheadItemId: 41257, materials: [ { label: "8x Saronite Bar", price: 0 }, { label: "8x Titansteel Bar", price: 0 }, { label: "2x Frozen Orb", price: 0 } ], sellingPrice: 0 },
      { item: "Global Thermal Sapper Charge", wowheadItemId: 42641, materials: [ { label: "1x Saronite Bar", price: 0 }, { label: "1x Volatile Blasting Trigger", price: 0 }, { label: "1x Cobalt Bar", price: 0 }, { label: "1x Crystallized Water", price: 0 } ], sellingPrice: 0 }
    ],
    Jewelcrafting: [
      { item: "Runed Scarlet Ruby", wowheadItemId: 39998, materials: [ { label: "1x Scarlet Ruby", price: 0 }, { label: "1x Eternal Shadow", price: 0 } ], sellingPrice: 0 },
      { item: "Bright Scarlet Ruby", wowheadItemId: 39999, materials: [ { label: "1x Scarlet Ruby", price: 0 }, { label: "1x Eternal Fire", price: 0 } ], sellingPrice: 0 },
      { item: "Solid Sky Sapphire", wowheadItemId: 40008, materials: [ { label: "1x Sky Sapphire", price: 0 }, { label: "1x Eternal Earth", price: 0 } ], sellingPrice: 0 }
    ],
    Enchanting: [
      { item: "Scroll of Enchant Staff - Greater Spellpower", wowheadItemId: 45056, materials: [ { label: "1x Abyss Crystal", price: 0 }, { label: "8x Greater Cosmic Essence", price: 0 }, { label: "1x Runed Titanium Rod", price: 0 } ], sellingPrice: 0 },
      { item: "Scroll of Enchant Weapon - Major Spellpower", wowheadItemId: 38921, materials: [ { label: "8x Large Prismatic Shard", price: 0 }, { label: "8x Greater Planar Essence", price: 0 }, { label: "1x Runed Titanium Rod", price: 0 } ], sellingPrice: 0 },
      { item: "Scroll of Enchant Bracers - Major Stamina", wowheadItemId: 44947, materials: [ { label: "4x Greater Cosmic Essence", price: 0 }, { label: "1x Abyss Crystal", price: 0 }, { label: "1x Runed Titanium Rod", price: 0 } ], sellingPrice: 0 },
      { item: "Scroll of Enchant Bracers - Greater Assault", wowheadItemId: 44815, materials: [ { label: "6x Infinite Dust", price: 0 }, { label: "2x Greater Cosmic Essence", price: 0 }, { label: "1x Runed Titanium Rod", price: 0 } ], sellingPrice: 0 },
      { item: "Scroll of Enchant Shield - Greater Stamina", wowheadItemId: 38861, materials: [ { label: "8x Greater Cosmic Essence", price: 0 }, { label: "1x Runed Titanium Rod", price: 0 } ], sellingPrice: 0 }
    ],
    Blacksmithing: [
      { item: "Eternal Belt Buckle", wowheadItemId: 41611, materials: [ { label: "4x Saronite Bar", price: 0 }, { label: "1x Eternal Earth", price: 0 }, { label: "1x Eternal Shadow", price: 0 }, { label: "1x Eternal Water", price: 0 } ], sellingPrice: 0 },
      { item: "Titanium Weapon Chain", wowheadItemId: 41976, materials: [ { label: "8x Saronite Bar", price: 0 }, { label: "1x Titanium Bar", price: 0 } ], sellingPrice: 0 },
      { item: "Titanium Plating", wowheadItemId: 44936, materials: [ { label: "4x Saronite Bar", price: 0 }, { label: "1x Titanium Bar", price: 0 } ], sellingPrice: 0 },
      { item: "Spiked Titansteel Helm", wowheadItemId: 41386, materials: [ { label: "8x Saronite Bar", price: 0 }, { label: "6x Titansteel Bar", price: 0 }, { label: "2x Frozen Orb", price: 0 } ], sellingPrice: 0 }
    ],
    Leatherworking: [
      { item: "Icescale Leg Armor", wowheadItemId: 38374, materials: [ { label: "2x Arctic Fur", price: 0 }, { label: "2x Icy Dragonscale", price: 0 }, { label: "1x Frozen Orb", price: 0 } ], sellingPrice: 0 },
      { item: "Frosthide Leg Armor", wowheadItemId: 38373, materials: [ { label: "4x Arctic Fur", price: 0 }, { label: "1x Frozen Orb", price: 0 } ], sellingPrice: 0 },
      { item: "Drums of Forgotten Kings", wowheadItemId: 49633, materials: [ { label: "8x Heavy Borean Leather", price: 0 }, { label: "2x Icy Dragonscale", price: 0 }, { label: "2x Eternal Life", price: 0 } ], sellingPrice: 0 },
      { item: "Drums of the Wild", wowheadItemId: 49634, materials: [ { label: "6x Heavy Borean Leather", price: 0 }, { label: "2x Icy Dragonscale", price: 0 }, { label: "1x Eternal Life", price: 0 } ], sellingPrice: 0 }
    ],
    Tailoring: [
      { item: "Frostweave Bag", wowheadItemId: 41599, materials: [ { label: "6x Frostweave Cloth", price: 0 }, { label: "1x Infinite Dust", price: 0 } ], sellingPrice: 0 },
      { item: "Brilliant Spellthread", wowheadItemId: 41602, materials: [ { label: "4x Eternal Life", price: 0 }, { label: "4x Iceweb Spider Silk", price: 0 }, { label: "1x Frozen Orb", price: 0 } ], sellingPrice: 0 },
      { item: "Sapphire Spellthread", wowheadItemId: 41604, materials: [ { label: "4x Eternal Fire", price: 0 }, { label: "4x Iceweb Spider Silk", price: 0 }, { label: "1x Frozen Orb", price: 0 } ], sellingPrice: 0 }
    ]
  };

  function applyData(data) {
    Object.keys(TBODY_IDS).forEach(function (profession) {
      const items = data[profession];
      if (Array.isArray(items)) renderTable(profession, items);
    });
  }

  function loadWowheadTooltips() {
    if (window.whTooltips) return;
    window.whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true };
    var s = document.createElement('script');
    s.src = 'https://wow.zamimg.com/widgets/power.js';
    s.async = true;
    document.body.appendChild(s);
  }

  function loadAndRender() {
    fetch('data/items.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then(function (data) {
        applyData(data);
        loadWowheadTooltips();
      })
      .catch(function (err) {
        console.warn('Using fallback data:', err.message);
        applyData(FALLBACK_DATA);
        loadWowheadTooltips();
      });
  }

  loadAndRender();

  function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.profession-section');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const profession = btn.getAttribute('data-profession');
        tabs.forEach(function (t) {
          t.classList.toggle('active', t === btn);
          t.setAttribute('aria-selected', t === btn ? 'true' : 'false');
        });
        panels.forEach(function (panel) {
          const isMatch = panel.id === profession;
          panel.classList.toggle('is-visible', isMatch);
          panel.hidden = !isMatch;
        });
      });
    });
  }
  initTabs();

  function initTopNav() {
    const viewProfessions = document.getElementById('view-professions');
    const viewSellingTips = document.getElementById('view-selling-tips');
    const btns = document.querySelectorAll('.top-nav-btn');
    if (!viewProfessions || !viewSellingTips || !btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        viewProfessions.hidden = view !== 'professions';
        viewSellingTips.hidden = view !== 'selling-tips';
      });
    });
  }
  initTopNav();

  function initSidePanel() {
    var profBtns = document.querySelectorAll('.side-panel-prof-btn');
    var viewProfessions = document.getElementById('view-professions');
    var viewSellingTips = document.getElementById('view-selling-tips');
    var topNavBtns = document.querySelectorAll('.top-nav-btn');
    profBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var profession = btn.getAttribute('data-profession');
        if (viewSellingTips && !viewSellingTips.hidden) {
          viewProfessions.hidden = false;
          viewSellingTips.hidden = true;
          topNavBtns.forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-view') === 'professions');
          });
        }
        var tab = document.querySelector('.tab-btn[data-profession="' + profession + '"]');
        if (tab) tab.click();
      });
    });
  }
  initSidePanel();
})();

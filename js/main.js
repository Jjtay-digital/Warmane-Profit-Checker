(function () {
  function initServerTime() {
    var el = document.getElementById('server-time');
    var dateEl = document.getElementById('server-date');
    var sgtEl = document.getElementById('server-time-sgt');
    var resetSgtEl = document.getElementById('raid-reset-sgt');
    if (!el) return;
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function formatUS(d) {
      return d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    function formatUSDate(d) {
      return d.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
    }
    function formatSGT(d) {
      return d.toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    function update() {
      var d = new Date();
      if (dateEl) dateEl.textContent = formatUSDate(d);
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
    Tailoring: 'tailoring-tbody',
    Alchemy: 'alchemy-tbody',
    Inscription: 'inscription-tbody',
    Cooking: 'cooking-tbody'
  };

  var PROFESSION_KEYS = [
    'engineering', 'jewelcrafting', 'enchanting', 'blacksmithing',
    'leatherworking', 'tailoring', 'alchemy', 'inscription', 'cooking'
  ];

  var PROFESSION_LABELS = {
    engineering: 'Engineering',
    jewelcrafting: 'Jewelcrafting',
    enchanting: 'Enchanting',
    blacksmithing: 'Blacksmithing',
    leatherworking: 'Leatherworking',
    tailoring: 'Tailoring',
    alchemy: 'Alchemy',
    inscription: 'Inscription',
    cooking: 'Cooking'
  };

  var STATIC_CRAFTERS = {
    engineering: ['Mtjin'],
    jewelcrafting: ['Mtjin'],
    enchanting: ['Lynpeh', 'Mini'],
    blacksmithing: ['—'],
    leatherworking: ['—'],
    tailoring: ['Mini'],
    alchemy: ['Arats'],
    inscription: ['Arats'],
    cooking: ['Arats']
  };

  var CRAFTER_STORAGE_KEY = 'warmane-calculator-crafters';

  function getUserCrafters() {
    try {
      var raw = localStorage.getItem(CRAFTER_STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveUserCrafters(arr) {
    try {
      localStorage.setItem(CRAFTER_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function formatGold(value) {
    return Number(value).toFixed(1) + 'g';
  }

  function parseNum(val) {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  function parseQuantityFromLabel(label) {
    if (!label || typeof label !== 'string') return 1;
    var m = label.match(/^(\d+)\s*[x×]\s*/i);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
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
    materialsContainer.querySelectorAll('.material-row').forEach(function (materialRow) {
      var labelEl = materialRow.querySelector('.material-label');
      var inp = materialRow.querySelector('.material-price-input');
      if (!inp) return;
      var qty = parseInt(materialRow.getAttribute('data-qty'), 10) || 1;
      totalCost += qty * parseNum(inp.value);
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
      var qty = parseQuantityFromLabel(m.label);
      return '<div class="material-row" data-qty="' + qty + '">' +
        '<span class="material-label">' + escapeHtml(m.label) + '</span>' +
        '<input type="number" min="0" step="0.1" class="material-price-input" value="' + (m.price || '') + '" placeholder="0" title="Price per unit (g)">' +
        '<span class="material-g-suffix">g each</span>' +
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
    ],
    Alchemy: [
      { item: "Flask of the Frost Wyrm", wowheadItemId: 46376, materials: [ { label: "1x Frost Lotus", price: 0 }, { label: "7x Ice Thorn", price: 0 }, { label: "1x Crystal Vial", price: 0 } ], sellingPrice: 0 },
      { item: "Flask of Endless Rage", wowheadItemId: 46377, materials: [ { label: "1x Frost Lotus", price: 0 }, { label: "7x Lichbloom", price: 0 }, { label: "1x Crystal Vial", price: 0 } ], sellingPrice: 0 },
      { item: "Potion of Speed", wowheadItemId: 40211, materials: [ { label: "1x Imbued Vial", price: 0 }, { label: "2x Adder's Tongue", price: 0 }, { label: "1x Pygmy Oil", price: 0 } ], sellingPrice: 0 }
    ],
    Inscription: [
      { item: "Glyph of Death Coil", wowheadItemId: 42457, materials: [ { label: "1x Ink of the Sea", price: 0 }, { label: "1x Snowfall Ink", price: 0 }, { label: "1x Light Parchment", price: 0 } ], sellingPrice: 0 },
      { item: "Glyph of Psychic Scream", wowheadItemId: 42410, materials: [ { label: "1x Ink of the Sea", price: 0 }, { label: "1x Snowfall Ink", price: 0 }, { label: "1x Light Parchment", price: 0 } ], sellingPrice: 0 },
      { item: "Glyph of Execution", wowheadItemId: 43416, materials: [ { label: "1x Ink of the Sea", price: 0 }, { label: "1x Snowfall Ink", price: 0 }, { label: "1x Light Parchment", price: 0 } ], sellingPrice: 0 }
    ],
    Cooking: [
      { item: "Fish Feast", wowheadItemId: 43015, materials: [ { label: "2x Musselback Sculpin", price: 0 }, { label: "2x Glacial Salmon", price: 0 }, { label: "2x Nettlefish", price: 0 }, { label: "1x Northern Spices", price: 0 } ], sellingPrice: 0 },
      { item: "Dragonfin Filet", wowheadItemId: 43000, materials: [ { label: "1x Dragonfin Angelfish", price: 0 }, { label: "1x Northern Spices", price: 0 } ], sellingPrice: 0 },
      { item: "Great Feast", wowheadItemId: 34753, materials: [ { label: "1x Chunk o' Mammoth", price: 0 }, { label: "1x Shoveltusk Flank", price: 0 }, { label: "1x Worm Meat", price: 0 }, { label: "1x Chilled Meat", price: 0 }, { label: "1x Northern Spices", price: 0 } ], sellingPrice: 0 }
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
        if (window.applyProfessionSearchFilter) window.applyProfessionSearchFilter();
        loadWowheadTooltips();
      })
      .catch(function (err) {
        console.warn('Using fallback data:', err.message);
        applyData(FALLBACK_DATA);
        if (window.applyProfessionSearchFilter) window.applyProfessionSearchFilter();
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
        if (window.applyProfessionSearchFilter) window.applyProfessionSearchFilter();
      });
    });
  }
  initTabs();

  function applyProfessionSearchFilter() {
    var input = document.getElementById('profession-search-input');
    var panel = document.querySelector('.profession-section.is-visible');
    if (!input || !panel) return;
    var tbody = panel.querySelector('tbody');
    if (!tbody) return;
    var q = (input.value || '').trim().toLowerCase();
    tbody.querySelectorAll('tr').forEach(function (tr) {
      var itemCell = tr.querySelector('.item-cell');
      var itemText = itemCell ? itemCell.textContent : '';
      var match = !q || itemText.toLowerCase().indexOf(q) !== -1;
      tr.classList.toggle('filtered-out', !match);
    });
  }

  function initProfessionSearch() {
    var input = document.getElementById('profession-search-input');
    var clearBtn = document.getElementById('profession-search-clear');
    if (!input) return;
    window.applyProfessionSearchFilter = applyProfessionSearchFilter;
    input.addEventListener('input', applyProfessionSearchFilter);
    input.addEventListener('change', applyProfessionSearchFilter);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        input.focus();
        applyProfessionSearchFilter();
      });
    }
  }
  initProfessionSearch();

  var PRICE_TEMPLATES_KEY = 'warmane-calculator-price-templates';
  var PRICE_TEMPLATE_NAMES_KEY = 'warmane-calculator-price-template-names';
  var TEMPLATE_SLOTS = 10;

  function getTemplatesArray() {
    try {
      var raw = localStorage.getItem(PRICE_TEMPLATES_KEY);
      if (!raw) return new Array(TEMPLATE_SLOTS);
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : new Array(TEMPLATE_SLOTS);
    } catch (e) { return new Array(TEMPLATE_SLOTS); }
  }

  function getTemplateNames() {
    try {
      var raw = localStorage.getItem(PRICE_TEMPLATE_NAMES_KEY);
      if (!raw) return defaultSlotNames();
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length !== TEMPLATE_SLOTS) return defaultSlotNames();
      return arr.slice(0, TEMPLATE_SLOTS).map(function (s, i) { return (s && String(s).trim()) || 'Slot ' + (i + 1); });
    } catch (e) { return defaultSlotNames(); }
  }

  function defaultSlotNames() {
    var out = [];
    for (var i = 1; i <= TEMPLATE_SLOTS; i++) out.push('Slot ' + i);
    return out;
  }

  function saveTemplateNames(names) {
    try {
      var arr = names.slice(0, TEMPLATE_SLOTS);
      while (arr.length < TEMPLATE_SLOTS) arr.push('Slot ' + (arr.length + 1));
      localStorage.setItem(PRICE_TEMPLATE_NAMES_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function refreshTemplateSlotOptions() {
    var names = getTemplateNames();
    var saveSelect = document.getElementById('price-template-save-slot');
    var loadSelect = document.getElementById('price-template-load-slot');
    function fill(sel) {
      if (!sel) return;
      sel.innerHTML = '';
      for (var i = 0; i < TEMPLATE_SLOTS; i++) {
        var opt = document.createElement('option');
        opt.value = String(i + 1);
        opt.textContent = names[i] || ('Slot ' + (i + 1));
        sel.appendChild(opt);
      }
    }
    fill(saveSelect);
    fill(loadSelect);
  }

  function syncRenameInputFromSaveSlot() {
    var slotEl = document.getElementById('price-template-save-slot');
    var inputEl = document.getElementById('price-template-slot-name');
    if (!slotEl || !inputEl) return;
    var slot = Math.max(1, Math.min(TEMPLATE_SLOTS, parseInt(slotEl.value, 10) || 1));
    var names = getTemplateNames();
    inputEl.value = names[slot - 1] || ('Slot ' + slot);
  }

  function buildTemplateFromPage() {
    var template = { professions: {}, prospecting: {} };
    Object.keys(TBODY_IDS).forEach(function (profName) {
      var tbody = document.getElementById(TBODY_IDS[profName]);
      if (!tbody) return;
      template.professions[profName] = {};
      tbody.querySelectorAll('tr').forEach(function (tr) {
        var itemEl = tr.querySelector('.item-name');
        var itemName = itemEl ? itemEl.textContent.trim() : '';
        if (!itemName) return;
        var materials = [];
        tr.querySelectorAll('.material-price-input').forEach(function (inp) {
          materials.push(parseNum(inp.value));
        });
        var sellInp = tr.querySelector('.selling-price-input');
        template.professions[profName][itemName] = {
          materials: materials,
          sellingPrice: sellInp ? parseNum(sellInp.value) : 0
        };
      });
    });
    var stackInp = document.getElementById('prospecting-stack');
    var eyeInp = document.getElementById('prospecting-dragonseye');
    var epicInp = document.getElementById('prospecting-epic');
    var rareInp = document.getElementById('prospecting-rare');
    template.prospecting.titanium = {
      stack: stackInp ? parseNum(stackInp.value) : 0,
      dragonseye: eyeInp ? parseNum(eyeInp.value) : 0,
      epic: epicInp ? parseNum(epicInp.value) : 0,
      rare: rareInp ? parseNum(rareInp.value) : 0
    };
    var saroniteStack = document.getElementById('saronite-stack');
    var rareIds = ['saronite-rare-scarlet', 'saronite-rare-sky', 'saronite-rare-autumn', 'saronite-rare-monarch', 'saronite-rare-twilight', 'saronite-rare-forest'];
    var dustInp = document.getElementById('saronite-dust');
    var essenceInp = document.getElementById('saronite-essence');
    var uncommonInp = document.getElementById('saronite-uncommon-price');
    var craftInp = document.getElementById('saronite-craft-cost');
    var modeRaw = document.querySelector('input[name="saronite-uncommon-mode"][value="raw"]');
    template.prospecting.saronite = {
      stack: saroniteStack ? parseNum(saroniteStack.value) : 0,
      rareScarlet: parseNum(document.getElementById(rareIds[0]) && document.getElementById(rareIds[0]).value),
      rareSky: parseNum(document.getElementById(rareIds[1]) && document.getElementById(rareIds[1]).value),
      rareAutumn: parseNum(document.getElementById(rareIds[2]) && document.getElementById(rareIds[2]).value),
      rareMonarch: parseNum(document.getElementById(rareIds[3]) && document.getElementById(rareIds[3]).value),
      rareTwilight: parseNum(document.getElementById(rareIds[4]) && document.getElementById(rareIds[4]).value),
      rareForest: parseNum(document.getElementById(rareIds[5]) && document.getElementById(rareIds[5]).value),
      dust: dustInp ? parseNum(dustInp.value) : 0,
      essence: essenceInp ? parseNum(essenceInp.value) : 0,
      uncommonPrice: uncommonInp ? parseNum(uncommonInp.value) : 0,
      craftCost: craftInp ? parseNum(craftInp.value) : 0,
      mode: modeRaw && modeRaw.checked ? 'raw' : 'shuffle'
    };
    return template;
  }

  function savePriceTemplate() {
    var slotEl = document.getElementById('price-template-save-slot');
    var slot = slotEl ? Math.max(1, Math.min(TEMPLATE_SLOTS, parseInt(slotEl.value, 10) || 1)) : 1;
    var arr = getTemplatesArray();
    while (arr.length < TEMPLATE_SLOTS) arr.push(null);
    arr[slot - 1] = buildTemplateFromPage();
    try {
      localStorage.setItem(PRICE_TEMPLATES_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function loadPriceTemplate() {
    var slotEl = document.getElementById('price-template-load-slot');
    var slot = slotEl ? Math.max(1, Math.min(TEMPLATE_SLOTS, parseInt(slotEl.value, 10) || 1)) : 1;
    var arr = getTemplatesArray();
    var template = arr[slot - 1];
    if (!template) return;
    if (template.professions) {
      Object.keys(template.professions).forEach(function (profName) {
        var tbodyId = TBODY_IDS[profName];
        if (!tbodyId) return;
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        var profData = template.professions[profName];
        tbody.querySelectorAll('tr').forEach(function (tr) {
          var itemEl = tr.querySelector('.item-name');
          var itemName = itemEl ? itemEl.textContent.trim() : '';
          var data = profData[itemName];
          if (!data) return;
          var materialInputs = tr.querySelectorAll('.material-price-input');
          if (data.materials && data.materials.length === materialInputs.length) {
            materialInputs.forEach(function (inp, i) {
              inp.value = data.materials[i] || 0;
            });
          }
          var sellInp = tr.querySelector('.selling-price-input');
          if (sellInp && data.sellingPrice != null) sellInp.value = data.sellingPrice;
          updateProfitCell(tr);
        });
      });
    }
    if (template.prospecting) {
      var t = template.prospecting.titanium;
      if (t) {
        var s = document.getElementById('prospecting-stack'); if (s) s.value = t.stack;
        var e = document.getElementById('prospecting-dragonseye'); if (e) e.value = t.dragonseye;
        var ep = document.getElementById('prospecting-epic'); if (ep) ep.value = t.epic;
        var r = document.getElementById('prospecting-rare'); if (r) r.value = t.rare;
        if (s) s.dispatchEvent(new Event('input', { bubbles: true }));
      }
      var saron = template.prospecting.saronite;
      if (saron) {
        var ss = document.getElementById('saronite-stack'); if (ss) ss.value = saron.stack;
        var rareIds = ['saronite-rare-scarlet', 'saronite-rare-sky', 'saronite-rare-autumn', 'saronite-rare-monarch', 'saronite-rare-twilight', 'saronite-rare-forest'];
        var rareVals = [saron.rareScarlet, saron.rareSky, saron.rareAutumn, saron.rareMonarch, saron.rareTwilight, saron.rareForest];
        rareIds.forEach(function (id, i) { var el = document.getElementById(id); if (el) el.value = rareVals[i] != null ? rareVals[i] : 0; });
        var du = document.getElementById('saronite-dust'); if (du) du.value = saron.dust != null ? saron.dust : 0;
        var es = document.getElementById('saronite-essence'); if (es) es.value = saron.essence != null ? saron.essence : 0;
        var un = document.getElementById('saronite-uncommon-price'); if (un) un.value = saron.uncommonPrice != null ? saron.uncommonPrice : 0;
        var cr = document.getElementById('saronite-craft-cost'); if (cr) cr.value = saron.craftCost != null ? saron.craftCost : 0;
        var mode = saron.mode === 'raw' ? 'raw' : 'shuffle';
        var radio = document.querySelector('input[name="saronite-uncommon-mode"][value="' + mode + '"]');
        if (radio) radio.checked = true;
      }
      var firstSaronite = document.getElementById('saronite-stack');
      if (firstSaronite) firstSaronite.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function renamePriceTemplateSlot() {
    var slotEl = document.getElementById('price-template-save-slot');
    var inputEl = document.getElementById('price-template-slot-name');
    if (!slotEl || !inputEl) return;
    var slot = Math.max(1, Math.min(TEMPLATE_SLOTS, parseInt(slotEl.value, 10) || 1));
    var name = (inputEl.value && inputEl.value.trim()) || ('Slot ' + slot);
    var names = getTemplateNames();
    names[slot - 1] = name;
    saveTemplateNames(names);
    refreshTemplateSlotOptions();
    inputEl.value = name;
  }

  function initPriceTemplate() {
    refreshTemplateSlotOptions();
    syncRenameInputFromSaveSlot();
    var saveBtn = document.getElementById('price-template-save');
    var loadBtn = document.getElementById('price-template-load');
    var saveSlot = document.getElementById('price-template-save-slot');
    var slotNameInput = document.getElementById('price-template-slot-name');
    if (saveBtn) saveBtn.addEventListener('click', savePriceTemplate);
    if (loadBtn) loadBtn.addEventListener('click', loadPriceTemplate);
    if (saveSlot) saveSlot.addEventListener('change', syncRenameInputFromSaveSlot);
    if (slotNameInput) slotNameInput.addEventListener('blur', renamePriceTemplateSlot);
  }
  initPriceTemplate();

  function initScrollToTop() {
    var btn = document.getElementById('scroll-to-top');
    if (!btn) return;
    function updateVisibility() {
      btn.hidden = window.scrollY < 400;
    }
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  initScrollToTop();

  function initTopNav() {
    const viewProfessions = document.getElementById('view-professions');
    const viewProspecting = document.getElementById('view-prospecting');
    const viewSellingTips = document.getElementById('view-selling-tips');
    const btns = document.querySelectorAll('.top-nav-btn');
    if (!viewProfessions || !btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        viewProfessions.hidden = view !== 'professions';
        if (viewProspecting) viewProspecting.hidden = view !== 'prospecting';
        if (viewSellingTips) viewSellingTips.hidden = view !== 'selling-tips';
      });
    });
  }
  initTopNav();

  function initProspectingCalc() {
    var stackInp = document.getElementById('prospecting-stack');
    var eyeInp = document.getElementById('prospecting-dragonseye');
    var epicInp = document.getElementById('prospecting-epic');
    var rareInp = document.getElementById('prospecting-rare');
    var resultsEl = document.getElementById('prospecting-results');
    if (!stackInp || !eyeInp || !epicInp || !rareInp || !resultsEl) return;
    function parse(val) { var n = Number(val); return isNaN(n) ? 0 : n; }
    function update() {
      var pricePerStack = parse(stackInp.value);
      var priceDragonsEye = parse(eyeInp.value);
      var priceEpicGem = parse(epicInp.value);
      var priceRareGem = parse(rareInp.value);
      var costPerProspect = pricePerStack / 4;
      var powderValue = (priceDragonsEye / 10) * 0.75;
      var revenuePerProspect = (0.25 * priceEpicGem) + (1.0 * priceRareGem) + powderValue + (1.5 * 1);
      var profitPerProspect = revenuePerProspect - costPerProspect;
      var profitPerStack = profitPerProspect * 4;
      var breakEvenRevenue = (0.25 * priceEpicGem) + (1.0 * priceRareGem) + powderValue + (1.5 * 1);
      var breakEvenStack = breakEvenRevenue * 4;
      var breakEvenPerOre = breakEvenStack / 20;
      var positive = profitPerStack >= 0;
      resultsEl.innerHTML =
        '<p class="' + (positive ? 'text-green-400' : 'text-red-400') + ' font-semibold">Profit per stack (20 ore): ' + profitPerStack.toFixed(1) + 'g</p>' +
        '<p class="' + (positive ? 'text-green-400' : 'text-red-400') + ' font-semibold">Profit per 5 ore: ' + profitPerProspect.toFixed(1) + 'g</p>' +
        '<p class="text-gray-300 mt-2">Break-even ore price: <span class="text-amber-400">' + breakEvenPerOre.toFixed(1) + 'g</span> per ore (stack = ' + breakEvenStack.toFixed(1) + 'g)</p>';
    }
    [stackInp, eyeInp, epicInp, rareInp].forEach(function (inp) {
      inp.addEventListener('input', update);
      inp.addEventListener('change', update);
    });
    update();
  }
  initProspectingCalc();

  function initSaroniteCalc() {
    var stackInp = document.getElementById('saronite-stack');
    var rareIds = ['saronite-rare-scarlet', 'saronite-rare-sky', 'saronite-rare-autumn', 'saronite-rare-monarch', 'saronite-rare-twilight', 'saronite-rare-forest'];
    var dustInp = document.getElementById('saronite-dust');
    var essenceInp = document.getElementById('saronite-essence');
    var uncommonPriceInp = document.getElementById('saronite-uncommon-price');
    var craftCostInp = document.getElementById('saronite-craft-cost');
    var resultsEl = document.getElementById('saronite-results');
    var modeRaw = document.querySelector('input[name="saronite-uncommon-mode"][value="raw"]');
    if (!stackInp || !dustInp || !essenceInp || !resultsEl) return;
    function parse(val) { var n = Number(val); return isNaN(n) ? 0 : n; }
    function getRarePrices() {
      return rareIds.map(function (id) { return parse(document.getElementById(id) && document.getElementById(id).value); });
    }
    function update() {
      var pricePerStack = parse(stackInp.value);
      var prices = getRarePrices();
      var dustPrice = parse(dustInp.value);
      var essencePrice = parse(essenceInp.value);
      var avgUncommon = parse(uncommonPriceInp && uncommonPriceInp.value);
      var craftCost = parse(craftCostInp && craftCostInp.value);
      var shuffle = modeRaw && !modeRaw.checked;
      var prospectsPerStack = 4;
      var rareChancePerColor = 0.03;
      var rarePerStackPerColor = prospectsPerStack * rareChancePerColor;
      var rareRevenue = rarePerStackPerColor * (prices[0] + prices[1] + prices[2] + prices[3] + prices[4] + prices[5]);
      var scarletContribution = rarePerStackPerColor * prices[0];
      var uncommonPerStack = prospectsPerStack * 2.0;
      var uncommonRevenue;
      if (shuffle) {
        var valuePerDe = (1.5 * dustPrice) + (0.25 * essencePrice) - craftCost;
        uncommonRevenue = uncommonPerStack * valuePerDe;
      } else {
        uncommonRevenue = uncommonPerStack * avgUncommon;
      }
      var totalRevenue = rareRevenue + uncommonRevenue;
      var netProfit = totalRevenue - pricePerStack;
      var positive = netProfit >= 0;
      var scarletHtml = '<p class="text-amber-400/95 text-sm mt-1">Scarlet Ruby (red) contribution: ' + scarletContribution.toFixed(1) + 'g per stack</p>';
      resultsEl.innerHTML =
        '<p class="font-semibold text-gray-200">Total expected revenue per stack: ' + totalRevenue.toFixed(1) + 'g</p>' +
        '<p class="text-gray-400">Cost of ore (20 Saronite): ' + pricePerStack.toFixed(1) + 'g</p>' +
        '<p class="' + (positive ? 'text-green-400' : 'text-red-400') + ' font-semibold">Net profit per stack: ' + netProfit.toFixed(1) + 'g</p>' +
        scarletHtml;
    }
    rareIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', update); el.addEventListener('change', update); }
    });
    [stackInp, dustInp, essenceInp].forEach(function (inp) {
      if (inp) { inp.addEventListener('input', update); inp.addEventListener('change', update); }
    });
    if (uncommonPriceInp) { uncommonPriceInp.addEventListener('input', update); uncommonPriceInp.addEventListener('change', update); }
    if (craftCostInp) { craftCostInp.addEventListener('input', update); craftCostInp.addEventListener('change', update); }
    document.querySelectorAll('input[name="saronite-uncommon-mode"]').forEach(function (radio) {
      radio.addEventListener('change', update);
    });
    update();
  }
  initSaroniteCalc();

  function renderSidePanel() {
    var list = document.getElementById('side-panel-list');
    if (!list) return;
    var userCrafters = getUserCrafters();
    list.innerHTML = '';
    PROFESSION_KEYS.forEach(function (profKey) {
      var label = PROFESSION_LABELS[profKey];
      var li = document.createElement('li');
      li.className = 'side-panel-item';
      var profBtn = document.createElement('button');
      profBtn.type = 'button';
      profBtn.className = 'side-panel-prof-btn';
      profBtn.setAttribute('data-profession', profKey);
      profBtn.textContent = label;
      li.appendChild(profBtn);
      var staticNames = STATIC_CRAFTERS[profKey] || [];
      staticNames.forEach(function (name) {
        var wrap = document.createElement('div');
        wrap.className = 'side-panel-crafter-wrap';
        var div = document.createElement('div');
        div.className = 'side-panel-crafter';
        div.textContent = name;
        wrap.appendChild(div);
        li.appendChild(wrap);
      });
      userCrafters.forEach(function (entry) {
        if (entry.professions && entry.professions.indexOf(profKey) !== -1) {
          var wrap = document.createElement('div');
          wrap.className = 'side-panel-crafter-wrap';
          var div = document.createElement('div');
          div.className = 'side-panel-crafter';
          div.textContent = entry.name;
          wrap.appendChild(div);
          var delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'crafter-delete-btn';
          delBtn.setAttribute('data-crafter-id', entry.id);
          delBtn.textContent = '×';
          delBtn.title = 'Remove this crafter';
          wrap.appendChild(delBtn);
          li.appendChild(wrap);
        }
      });
      list.appendChild(li);
    });
    initSidePanelClicks();
  }

  function initSidePanelClicks() {
    var list = document.getElementById('side-panel-list');
    var viewProfessions = document.getElementById('view-professions');
    var viewSellingTips = document.getElementById('view-selling-tips');
    var topNavBtns = document.querySelectorAll('.top-nav-btn');
    if (!list) return;
    list.addEventListener('click', function (e) {
      var target = e.target;
      if (target.classList && target.classList.contains('crafter-delete-btn')) {
        var id = target.getAttribute('data-crafter-id');
        if (!id) return;
        var arr = getUserCrafters().filter(function (entry) { return String(entry.id) !== String(id); });
        saveUserCrafters(arr);
        renderSidePanel();
        return;
      }
      var profBtn = target.closest && target.closest('.side-panel-prof-btn');
      if (profBtn) {
        var profession = profBtn.getAttribute('data-profession');
        if (viewSellingTips && !viewSellingTips.hidden) {
          if (viewProfessions) viewProfessions.hidden = false;
          viewSellingTips.hidden = true;
          topNavBtns.forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-view') === 'professions');
          });
        }
        var tab = document.querySelector('.tab-btn[data-profession="' + profession + '"]');
        if (tab) tab.click();
      }
    });
  }

  function initCrafterFormToggle() {
    var toggle = document.getElementById('crafter-form-toggle');
    var body = document.getElementById('crafter-form-body');
    if (!toggle || !body) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      body.hidden = expanded;
    });
  }

  function initCrafterForm() {
    var form = document.getElementById('crafter-form');
    var nameInput = document.getElementById('crafter-name');
    var professionsEl = document.getElementById('crafter-form-professions');
    if (!form || !nameInput || !professionsEl) return;
    PROFESSION_KEYS.forEach(function (key) {
      var label = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.name = 'crafter-prof';
      cb.value = key;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + PROFESSION_LABELS[key]));
      professionsEl.appendChild(label);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (nameInput.value || '').trim();
      if (!name) return;
      var checked = professionsEl.querySelectorAll('input[name="crafter-prof"]:checked');
      var professions = [];
      checked.forEach(function (cb) {
        if (cb.value) professions.push(cb.value);
      });
      if (professions.length === 0) return;
      var arr = getUserCrafters();
      var id = 'crafter-' + Date.now();
      arr.push({ id: id, name: name, professions: professions });
      saveUserCrafters(arr);
      renderSidePanel();
      nameInput.value = '';
      professionsEl.querySelectorAll('input[name="crafter-prof"]:checked').forEach(function (cb) { cb.checked = false; });
    });
  }

  function initSidePanel() {
    renderSidePanel();
  }
  initCrafterFormToggle();
  initCrafterForm();
  initSidePanel();
})();

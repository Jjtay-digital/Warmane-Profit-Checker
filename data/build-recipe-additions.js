#!/usr/bin/env node
// Build data/recipe-additions.json from inline recipe list. Run: node data/build-recipe-additions.js
// Then run: node data/merge-complete-recipes.js

function e(name, id, mats) {
  return {
    item: name,
    wowheadItemId: id,
    materials: (Array.isArray(mats) ? mats : [mats]).map(m => typeof m === 'string' ? { label: m, price: 0 } : m),
    sellingPrice: 0
  };
}

const additions = {
  Engineering: [
    e('Mechano-Hog', 44412, ['2x Arctic Fur', '40x Handful of Cobalt Bolts', '1x Goblin-Machined Piston', '1x Salvaged Iron Golem Parts', '12x Titansteel Bar']),
    e("Mekgineer's Chopper", 44413, ['2x Arctic Fur', '40x Handful of Cobalt Bolts', '1x Goblin-Machined Piston', '1x Salvaged Iron Golem Parts', '12x Titansteel Bar']),
    e('Hyperspeed Accelerators', 54793, ['6x Saronite Bar', '4x Crystallized Air']),
    e('Reticulated Armor Webbing', 41110, ['4x Saronite Bar', '2x Eternal Earth']),
    e('Flexweave Underlay', 41111, ['12x Frostweave Cloth', '1x Overcharged Capacitor', '4x Cobalt Bar', '1x Crystallized Earth']),
    e('Springy Arachnoweave', 41112, ['12x Frostweave Cloth', '1x Overcharged Capacitor']),
    e('Hand-Mounted Pyro Rocket', 41091, ['6x Saronite Bar', '4x Crystallized Fire']),
    e('Nitro Boosts', 55016, ['8x Saronite Bar', '4x Crystallized Air']),
    e('Mana Injector', 41166, ['4x Saronite Bar', '2x Crystallized Water', '1x Frost Lotus']),
    e('Healing Injector', 41167, ['4x Saronite Bar', '2x Crystallized Water', '1x Frost Lotus']),
    e('Gnomish Army Knife', 40769, ['8x Saronite Bar', '2x Crystallized Air']),
    e('Mind Amplification Dish', 40868, ['8x Saronite Bar', '1x Froststeel Tube', '8x Cobalt Bar', '1x Crystallized Water']),
    e('Froststeel Tube', 41163, ['8x Saronite Bar', '2x Crystallized Water']),
    e('Hair Trigger', 39691, ['2x Cobalt Bar', '1x Crystallized Water']),
    e('Iceblade Arrow', 41165, ['2x Saronite Bar', '1x Crystallized Water']),
    e('Shatter Rounds', 41164, ['2x Saronite Bar', '1x Crystallized Air']),
    e('Electroflux Sight', 41146, ['4x Saronite Bar', '2x Crystallized Air']),
    e('Gnomish X-Ray Specs', 40866, ['8x Saronite Bar', '2x Crystallized Shadow']),
    e('Truesight Ice Blinders', 40867, ['8x Saronite Bar', '2x Crystallized Water']),
    e('Portable Mana Loom', 40869, ['8x Saronite Bar', '2x Crystallized Water']),
  ],
  Jewelcrafting: [],
  Enchanting: [
    e('Scroll of Enchant Weapon - Berserking', 44630, ['8x Abyss Crystal', '8x Infinite Dust', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Weapon - Lifeward', 44592, ['8x Abyss Crystal', '8x Infinite Dust', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Weapon - Giant Slayer', 44595, ['8x Abyss Crystal', '8x Infinite Dust', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Bracers - Greater Stats', 44635, ['8x Abyss Crystal', '8x Infinite Dust', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Bracers - Major Spirit', 44947, ['4x Greater Cosmic Essence', '1x Abyss Crystal', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Gloves - Haste', 44593, ['8x Eternal Fire', '4x Crystallized Fire', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Cloak - Mighty Armor', 44591, ['8x Infinite Dust', '1x Abyss Crystal', '1x Runed Titanium Rod']),
    e('Scroll of Enchant Shield - Defense', 44466, ['8x Eternal Earth', '4x Crystallized Earth', '1x Runed Titanium Rod']),
  ],
  Blacksmithing: [
    e('Titansteel Destroyer', 41384, ['12x Saronite Bar', '6x Titansteel Bar', '2x Frozen Orb']),
    e('Titansteel Guardian', 41383, ['12x Saronite Bar', '6x Titansteel Bar', '2x Frozen Orb']),
    e('Sunblessed Gauntlets', 42442, ['8x Saronite Bar', '4x Sun Crystal', '2x Eternal Fire']),
    e('Sunblessed Breastplate', 42443, ['12x Saronite Bar', '6x Sun Crystal', '2x Eternal Fire']),
    e('Ornate Saronite Hauberk', 41129, ['12x Saronite Bar', '4x Crystallized Shadow', '2x Frozen Orb']),
    e('Ornate Saronite Legplates', 41130, ['8x Saronite Bar', '4x Crystallized Shadow', '2x Frozen Orb']),
    e('Ornate Saronite Skullshield', 41131, ['8x Saronite Bar', '4x Crystallized Earth', '2x Frozen Orb']),
    e('Ornate Saronite Waistguard', 41132, ['8x Saronite Bar', '4x Crystallized Water', '2x Frozen Orb']),
    e('Ornate Saronite Walkers', 41133, ['8x Saronite Bar', '4x Crystallized Air', '2x Frozen Orb']),
    e('Ornate Saronite Gauntlets', 41134, ['8x Saronite Bar', '4x Crystallized Fire', '2x Frozen Orb']),
    e('Ornate Saronite Shoulders', 41135, ['8x Saronite Bar', '4x Crystallized Life', '2x Frozen Orb']),
    e('Ornate Saronite Bracers', 41136, ['6x Saronite Bar', '2x Crystallized Shadow']),
    e('Brilliant Saronite Belt', 41126, ['8x Saronite Bar', '4x Crystallized Water', '2x Frozen Orb']),
    e('Brilliant Saronite Boots', 41127, ['8x Saronite Bar', '4x Crystallized Air', '2x Frozen Orb']),
    e('Brilliant Saronite Bracers', 41128, ['6x Saronite Bar', '2x Crystallized Water']),
    e('Titanium Spikeguard', 41974, ['12x Saronite Bar', '2x Titanium Bar']),
    e('Titanium Razorplate', 41975, ['12x Saronite Bar', '2x Titanium Bar']),
  ],
  Leatherworking: [
    e('Bracers of Swift Death', 43260, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Shadow']),
    e('Boots of Wintry Endurance', 43261, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Water']),
    e('Moonshadow Armguards', 43262, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Shadow']),
    e('Nightshock Girdle', 43263, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Shadow']),
    e('Scaled Armor of the Elder', 43264, ['12x Heavy Borean Leather', '4x Icy Dragonscale', '2x Eternal Life']),
    e('Trollwoven Girdle', 43265, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Air']),
    e('Windripper Boots', 43266, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Air']),
    e('Bladeborn Leggings', 43267, ['10x Heavy Borean Leather', '4x Icy Dragonscale', '2x Eternal Earth']),
    e('Giantmaim Legguards', 43268, ['10x Heavy Borean Leather', '4x Icy Dragonscale', '2x Eternal Earth']),
    e('Revenant\'s Breastplate', 43269, ['12x Heavy Borean Leather', '4x Icy Dragonscale', '2x Eternal Shadow']),
    e('Cloak of the Frozen Wastes', 38425, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Shadow']),
    e('Arctic Wristguards', 38426, ['4x Heavy Borean Leather', '2x Icy Dragonscale']),
    e('Ice Scale Coif', 38427, ['8x Heavy Borean Leather', '2x Icy Dragonscale', '2x Eternal Water']),
    e('Nerubian Leg Armor', 38376, ['4x Arctic Fur', '2x Icy Dragonscale', '1x Frozen Orb']),
  ],
  Tailoring: [
    e('Frostwoven Strap', 41598, ['3x Frostweave Cloth', '1x Infinite Dust']),
    e('Shadowweave Leggings', 41597, ['8x Frostweave Cloth', '2x Infinite Dust']),
    e('Spellweave Gloves', 41612, ['5x Frostweave Cloth', '2x Infinite Dust']),
    e('Bolt of Imbued Frostweave', 41594, ['4x Frostweave Cloth', '1x Infinite Dust']),
    e('Abyssal Bag', 41610, ['10x Frostweave Cloth', '2x Eternium Thread', '1x Frozen Orb']),
  ],
  Alchemy: [
    e('Transmute: Earth to Water', 17559, ['1x Elemental Earth', '1x Crystal Vial']),
    e('Transmute: Water to Air', 17560, ['1x Elemental Water', '1x Crystal Vial']),
    e('Transmute: Primal Might', 32765, ['1x Primal Fire', '1x Primal Earth', '1x Primal Water', '1x Primal Air', '1x Primal Shadow']),
    e('Elixir of Armor Piercing', 44331, ['1x Crystal Vial', '2x Deadnettle', '1x Tiger Lily']),
    e('Elixir of Expertise', 44332, ['1x Crystal Vial', '2x Goldclover', '1x Tiger Lily']),
    e('Potion of Spirit', 40097, ['1x Crystal Vial', '1x Goldclover', '1x Lichbloom']),
    e('Earthen Potion', 40087, ['1x Crystal Vial', '1x Goldclover', '1x Icethorn']),
    e('Elixir of Mighty Agility', 40078, ['1x Crystal Vial', '2x Adder\'s Tongue', '1x Tiger Lily']),
    e('Elixir of Mighty Strength', 40079, ['1x Crystal Vial', '2x Deadnettle', '1x Tiger Lily']),
    e('Elixir of Lightning Speed', 40084, ['1x Crystal Vial', '2x Adder\'s Tongue', '1x Tiger Lily']),
    e('Elixir of Accuracy', 40072, ['1x Crystal Vial', '2x Deadnettle', '1x Tiger Lily']),
  ],
  Inscription: [],
  Cooking: [
    e('Shoveltusk Steak', 34754, ['1x Shoveltusk Flank']),
    e('Poached Northern Sculpin', 34756, ['1x Northern Sculpin', '1x Northern Spices']),
    e('Smoked Salmon', 34758, ['1x Glacial Salmon']),
    e('Very Burnt Worg', 34762, ['1x Worg Haunch']),
    e('Crispy Bat Wing', 33454, ['1x Bat Wing']),
  ],
};

// Remove duplicates that already exist in items.json (by item name) so we only output NEW recipes
const items = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'items.json'), 'utf8'));
Object.keys(additions).forEach(prof => {
  const existingNames = new Set((items[prof] || []).map(x => x.item));
  additions[prof] = (additions[prof] || []).filter(entry => !existingNames.has(entry.item));
});

require('fs').writeFileSync(
  require('path').join(__dirname, 'recipe-additions.json'),
  JSON.stringify(additions, null, 2)
);
console.log('Wrote recipe-additions.json');
Object.keys(additions).forEach(prof => {
  if (additions[prof].length) console.log('  ' + prof + ': ' + additions[prof].length + ' new');
});

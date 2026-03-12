#!/usr/bin/env node
// Merge data/recipe-additions.json into data/items.json (by profession, dedupe by item name).
// Run: node data/merge-complete-recipes.js

const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, 'items.json');
const additionsPath = path.join(__dirname, 'recipe-additions.json');

const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
let additions = {};
try {
  additions = JSON.parse(fs.readFileSync(additionsPath, 'utf8'));
} catch (e) {
  console.log('No recipe-additions.json or invalid JSON; skipping merge.');
  process.exit(0);
}

const professions = Object.keys(items);
let totalAdded = 0;

professions.forEach(prof => {
  const existing = items[prof] || [];
  const existingNames = new Set(existing.map(e => e.item));
  const addList = additions[prof] || [];
  let added = 0;
  addList.forEach(entry => {
    if (!existingNames.has(entry.item)) {
      existing.push(entry);
      existingNames.add(entry.item);
      added++;
    }
  });
  if (added) {
    console.log(prof + ': +' + added + ' (total ' + existing.length + ')');
    totalAdded += added;
  }
  items[prof] = existing;
});

fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2));
console.log('Merged ' + totalAdded + ' new recipes into items.json');

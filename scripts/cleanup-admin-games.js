#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'games', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all lines containing specialPrizes
const lines = content.split('\n');
const filteredLines = [];
let skipBlock = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Start skipping when we find the Special Prizes Section comment
  if (line.includes('{/* Special Prizes Section */}')) {
    skipBlock = true;
    braceCount = 0;
    continue;
  }

  // Track braces while skipping
  if (skipBlock) {
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    // Check if this line ends the special prizes block
    if (line.includes(') : null}') && braceCount <= 0) {
      skipBlock = false;
      continue;
    }

    // Skip this line
    continue;
  }

  // Skip lines with specialPrizes references
  if (line.includes('specialPrizes') ||
      line.includes('SpecialPrize') ||
      line.includes('special prizes')) {
    continue;
  }

  filteredLines.push(line);
}

// Write the cleaned content back
fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
console.log('Cleaned up admin games page - removed all special prizes references');
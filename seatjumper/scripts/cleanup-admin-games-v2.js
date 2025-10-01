#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'games', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all lines containing specialPrizes or SpecialPrize
const lines = content.split('\n');
const filteredLines = [];
let skipBlock = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Skip lines with specialPrizes references
  if (line.includes('specialPrizes') ||
      line.includes('SpecialPrize') ||
      line.includes('special prizes') ||
      line.includes('Special Prizes') ||
      line.includes('Special prizes')) {
    // If it's a start of a block, mark to skip until closing
    if (line.includes('{')) {
      skipBlock = true;
      braceCount = 0;
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
    }
    continue;
  }

  // Track braces while skipping
  if (skipBlock) {
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    // Check if this line ends the special prizes block
    if (braceCount <= 0) {
      skipBlock = false;
      // Check if the line itself should be kept
      if (!line.includes('))}') && !line.includes('});')) {
        filteredLines.push(line);
      }
    }
    // Skip this line
    continue;
  }

  // Check for orphaned closing brackets related to special prizes
  if (line.trim() === '))}' && i > 0 &&
      (lines[i-1].includes('prize') ||
       lines[i-1].includes('}') && i > 1 && lines[i-2].includes('prize'))) {
    continue;
  }

  // Skip orphaned forEach/map/filter related to prizes
  if (line.includes('const packs = prize') ||
      line.includes('prize.availablePacks') ||
      line.includes('prize.quantity') ||
      line.includes('prize.value') ||
      line.includes('prize.name') ||
      line.includes('prize.id')) {
    continue;
  }

  filteredLines.push(line);
}

// Clean up any double blank lines
let cleanedLines = [];
let prevBlank = false;
for (const line of filteredLines) {
  if (line.trim() === '') {
    if (!prevBlank) {
      cleanedLines.push(line);
      prevBlank = true;
    }
  } else {
    cleanedLines.push(line);
    prevBlank = false;
  }
}

// Write the cleaned content back
fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
console.log('Cleaned up admin games page - removed all special prizes references');
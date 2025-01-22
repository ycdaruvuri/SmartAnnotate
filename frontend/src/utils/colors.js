// Standard color palette with 50 distinct colors optimized for readability and visual distinction
export const COLOR_PALETTE = [
  // Reds
  '#ffcdd2', // Light red
  '#ef9a9a',
  '#e57373',
  '#ef5350',
  '#f44336',

  // Pinks
  '#f8bbd0', // Light pink
  '#f48fb1',
  '#f06292',
  '#ec407a',
  '#e91e63',

  // Purples
  '#e1bee7', // Light purple
  '#ce93d8',
  '#ba68c8',
  '#ab47bc',
  '#9c27b0',

  // Deep Purples
  '#d1c4e9', // Light deep purple
  '#b39ddb',
  '#9575cd',
  '#7e57c2',
  '#673ab7',

  // Blues
  '#bbdefb', // Light blue
  '#90caf9',
  '#64b5f6',
  '#42a5f5',
  '#2196f3',

  // Light Blues
  '#b3e5fc', // Lighter blue
  '#81d4fa',
  '#4fc3f7',
  '#29b6f6',
  '#03a9f4',

  // Cyans
  '#b2ebf2', // Light cyan
  '#80deea',
  '#4dd0e1',
  '#26c6da',
  '#00bcd4',

  // Teals
  '#b2dfdb', // Light teal
  '#80cbc4',
  '#4db6ac',
  '#26a69a',
  '#009688',

  // Greens
  '#c8e6c9', // Light green
  '#a5d6a7',
  '#81c784',
  '#66bb6a',
  '#4caf50',

  // Light Greens
  '#dcedc8', // Lighter green
  '#c5e1a5',
  '#aed581',
  '#9ccc65',
  '#8bc34a'
];

// Function to get unused colors from the palette
export const getUnusedColors = (usedColors) => {
  return COLOR_PALETTE.filter(color => !usedColors.includes(color));
};

// Function to get the next available color
export const getNextColor = (usedColors) => {
  const unusedColors = getUnusedColors(usedColors);
  return unusedColors[0] || COLOR_PALETTE[0];
};

// Function to get a random unused color
export const getRandomUnusedColor = (usedColors) => {
  const unusedColors = getUnusedColors(usedColors);
  if (unusedColors.length === 0) {
    // If all colors are used, return a random color from the palette
    return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  }
  return unusedColors[Math.floor(Math.random() * unusedColors.length)];
};

let currentGame = null;

// CONNECTIONS GAME
const connectionsCategories = {
  "Schools": ["John", "King", "Hill", "Kingfisher"],
  "Pets": ["Poppy", "Molly", "Bertie", "Bud"],
  "Siblings": ["William", "Louis", "Holly", "Anne"]
};

const connectionsWords = Object.values(connectionsCategories).flat();
let connectionsShuffledWords = connectionsWords.sort(() => Math.random() - 0.5);
const connectionsSelected = [];
const connectionsFoundGroups = new Set();

// STRANDS GAME
const strandsThemeWords = [
  { word: "WEDDING", positions: [[0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [1,5]] },
  { word: "VOWS", positions: [[1,0], [2,0], [3,0], [4,0]] },
  { word: "RING", positions: [[1,1], [1,2], [1,3], [1,4]] },
  { word: "AISLE", positions: [[2,1], [3,1], [4,1], [5,1], [5,0]] },
  { word: "LOVE", positions: [[2,2], [2,3], [2,4], [3,4]] },
  { word: "DANCE", positions: [[3,2], [3,3], [4,2], [4,3], [4,4]] },
  { word: "BOUQUET", positions: [[2,5], [3,5], [4,5], [5,5], [5,4], [5,3], [5,2]] }
];

let strandsGridData = Array(6).fill(null).map(() => Array(6).fill(''));
let strandsLetterDivs = {};
let strandsSelectedPath = [];
let strandsFoundWords = new Set();
let strandsLastClickIndex = -1;
let strandsLastClickTime = 0;

function initializeStrandsGrid() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  strandsGridData = Array(6).fill(null).map(() => Array(6).fill(''));
  const usedPositions = new Set();
  
  strandsThemeWords.forEach(wordObj => {
    wordObj.positions.forEach((pos, idx) => {
      const [row, col] = pos;
      strandsGridData[row][col] = wordObj.word[idx];
      usedPositions.add(`${row},${col}`);
    });
  });

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (strandsGridData[row][col] === '') {
        strandsGridData[row][col] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
}

function startGame(game) {
  currentGame = game;
  document.getElementById('menu').style.display = 'none';
  document.getElementById('gameContainer').classList.add('active');
  
  if (game === 'connections') {
    document.getElementById('connectionsGame').style.display = 'block';
    document.getElementById('strandsGame').style.display = 'none';
    initializeConnectionsGame();
  } else if (game === 'strands') {
    document.getElementById('connectionsGame').style.display = 'none';
    document.getElementById('strandsGame').style.display = 'block';
    initializeStrandsGame();
  }
}

function initializeConnectionsGame() {
  connectionsFoundGroups.clear();
  connectionsSelected.length = 0;
  connectionsShuffledWords = [...connectionsWords].sort(() => Math.random() - 0.5);
  document.getElementById('feedback').textContent = '';
  document.getElementById('found').textContent = '';
  
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  connectionsShuffledWords.forEach(word => {
    grid.appendChild(createConnectionsButton(word));
  });
}

function initializeStrandsGame() {
  initializeStrandsGrid();
  strandsSelectedPath = [];
  strandsFoundWords.clear();
  strandsLastClickIndex = -1;
  strandsLastClickTime = 0;
  document.getElementById('strandsFeedback').textContent = '';
  document.getElementById('strandsCurrentWord').textContent = '';
  document.getElementById('strandsFound').innerHTML = '';
  
  const grid = document.getElementById('strandsGrid');
  grid.innerHTML = '';
  strandsLetterDivs = {};
  
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const letterDiv = document.createElement('div');
      letterDiv.classList.add('strands-letter');
      letterDiv.textContent = strandsGridData[row][col];
      letterDiv.dataset.row = row;
      letterDiv.dataset.col = col;
      letterDiv.dataset.index = row * 6 + col;
      
      strandsLetterDivs[`${row},${col}`] = letterDiv;
      
      letterDiv.addEventListener('click', (e) => selectStrandsLetter(row, col, e));
      grid.appendChild(letterDiv);
    }
  }
}

function selectStrandsLetter(row, col, event) {
  const key = `${row},${col}`;
  const letterDiv = strandsLetterDivs[key];
  
  if (letterDiv.classList.contains('found')) return;

  const currentTime = new Date().getTime();
  const currentIndex = row * 6 + col;
  const isDoubleClick = currentIndex === strandsLastClickIndex && currentTime - strandsLastClickTime < 300;
  strandsLastClickIndex = currentIndex;
  strandsLastClickTime = currentTime;

  if (isDoubleClick && strandsSelectedPath.length > 0) {
    submitStrandsWord();
    return;
  }

  const isLastSelected = strandsSelectedPath.length > 0 && strandsSelectedPath[strandsSelectedPath.length - 1].row === row && strandsSelectedPath[strandsSelectedPath.length - 1].col === col;
  if (letterDiv.classList.contains('selected') && isLastSelected) {
    letterDiv.classList.remove('selected');
    strandsSelectedPath.pop();
    updateStrandsCurrentWord();
    return;
  }

  if (strandsSelectedPath.length === 0 || isValidNextCell(row, col)) {
    if (!letterDiv.classList.contains('selected')) {
      letterDiv.classList.add('selected');
      strandsSelectedPath.push({ row, col, letter: strandsGridData[row][col] });
    }
  }

  updateStrandsCurrentWord();
}

function isValidNextCell(row, col) {
  if (strandsSelectedPath.length === 0) return true;
  
  const lastPos = strandsSelectedPath[strandsSelectedPath.length - 1];
  const rowDiff = Math.abs(row - lastPos.row);
  const colDiff = Math.abs(col - lastPos.col);
  
  if (rowDiff > 1 || colDiff > 1) return false;
  if (rowDiff === 0 && colDiff === 0) return false;
  
  const alreadyUsed = strandsSelectedPath.some(pos => pos.row === row && pos.col === col);
  if (alreadyUsed) return false;
  
  return true;
}

function updateStrandsCurrentWord() {
  const word = strandsSelectedPath.map(pos => pos.letter).join('');
  document.getElementById('strandsCurrentWord').textContent = word;
}

function submitStrandsWord() {
  const selectedWord = strandsSelectedPath.map(pos => pos.letter).join('');
  
  let foundWord = null;
  for (const wordObj of strandsThemeWords) {
    if (wordObj.word === selectedWord && !strandsFoundWords.has(selectedWord)) {
      foundWord = wordObj;
      break;
    }
  }

  if (foundWord) {
    strandsFoundWords.add(foundWord.word);
    foundWord.positions.forEach(([row, col]) => {
      const key = `${row},${col}`;
      const letterDiv = strandsLetterDivs[key];
      letterDiv.classList.remove('selected');
      letterDiv.classList.add('found');
    });
    
    document.getElementById('strandsFeedback').textContent = `✓ Found: ${foundWord.word}`;
    updateStrandsFoundDisplay();
    
    if (strandsFoundWords.size === strandsThemeWords.length) {
      setTimeout(() => {
        document.getElementById('strandsFeedback').textContent = '🎉 You found all the words!';
      }, 500);
    }
  } else {
    if (selectedWord.length > 0) {
      document.getElementById('strandsFeedback').textContent = selectedWord + ' is not a theme word.';
    }
  }

  clearStrandsSelection();
}

function clearStrandsSelection() {
  strandsSelectedPath.forEach(pos => {
    const key = `${pos.row},${pos.col}`;
    const letterDiv = strandsLetterDivs[key];
    if (!letterDiv.classList.contains('found')) {
      letterDiv.classList.remove('selected');
    }
  });
  strandsSelectedPath = [];
  document.getElementById('strandsCurrentWord').textContent = '';
}

function updateStrandsFoundDisplay() {
  const foundHtml = Array.from(strandsFoundWords).map(word => 
    `<div class="found-word">${word}</div>`
  ).join('');
  document.getElementById('strandsFound').innerHTML = foundHtml;
}

function createConnectionsButton(word) {
  const btn = document.createElement('div');
  btn.classList.add('word-button');
  btn.textContent = word;
  btn.addEventListener('click', () => {
    if (btn.classList.contains('correct')) return;

    btn.classList.toggle('selected');
    if (btn.classList.contains('selected')) {
      connectionsSelected.push(btn);
    } else {
      const index = connectionsSelected.indexOf(btn);
      if (index > -1) connectionsSelected.splice(index, 1);
    }

    if (connectionsSelected.length === 4) checkGroup();
  });
  return btn;
}

function checkGroup() {
  const selectedWords = connectionsSelected.map(btn => btn.textContent);
  for (const [category, group] of Object.entries(connectionsCategories)) {
    if (group.every(word => selectedWords.includes(word)) && !connectionsFoundGroups.has(category)) {
      connectionsSelected.forEach(btn => {
        btn.classList.remove('selected');
        btn.classList.add('correct');
      });
      document.getElementById('feedback').textContent = `✓ Found Group: ${category}`;
      connectionsFoundGroups.add(category);
      updateConnectionsFound();
      if (connectionsFoundGroups.size === 3) {
        setTimeout(() => {
          document.getElementById('feedback').textContent = '🎉 You found all the connections!';
        }, 500);
      }
      connectionsSelected.length = 0;
      return;
    }
  }
  document.getElementById('feedback').textContent = "Try again. That group is not correct.";
  connectionsSelected.forEach(btn => btn.classList.remove('selected'));
  connectionsSelected.length = 0;
}

function updateConnectionsFound() {
  document.getElementById('found').textContent = `Found groups: ${Array.from(connectionsFoundGroups).join(', ')}`;
}

function goBackToMenu() {
  currentGame = null;
  document.getElementById('gameContainer').classList.remove('active');
  document.getElementById('menu').style.display = 'flex';
  document.getElementById('connectionsGame').style.display = 'none';
  document.getElementById('strandsGame').style.display = 'none';
  
  connectionsSelected.length = 0;
  strandsSelectedPath = [];
  connectionsFoundGroups.clear();
  strandsFoundWords.clear();
}

let currentGame = null;

// CONNECTIONS GAME
const connectionsCategories = {
  "Schools": ["John", "King", "Hill", "Kingfisher"],
  "Pets": ["Poppy", "Molly", "Bertie", "Bud"],
  "Siblings": ["William", "Louis", "Holly", "Anne"], 
  "Parents": ["Glyn", "Nicola", "Andy", "Debbie"],
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
let strandsIsDragging = false;

window.addEventListener('pointerup', () => {
  if (strandsIsDragging && strandsSelectedPath.length > 0) {
    submitStrandsWord();
  }
  strandsIsDragging = false;
});

window.addEventListener('touchend', () => {
  if (strandsIsDragging && strandsSelectedPath.length > 0) {
    submitStrandsWord();
  }
  strandsIsDragging = false;
}, { passive: false });

const wordleAnswer = 'BRIDE';
let wordleAttempts = [];
let wordleSolved = false;

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
    document.getElementById('wordleGame').style.display = 'none';
    initializeConnectionsGame();
  } else if (game === 'strands') {
    document.getElementById('connectionsGame').style.display = 'none';
    document.getElementById('strandsGame').style.display = 'block';
    document.getElementById('wordleGame').style.display = 'none';
    initializeStrandsGame();
  } else if (game === 'wordle') {
    document.getElementById('connectionsGame').style.display = 'none';
    document.getElementById('strandsGame').style.display = 'none';
    document.getElementById('wordleGame').style.display = 'block';
    initializeWordleGame();
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
      
      letterDiv.addEventListener('pointerdown', (e) => handleStrandsPointerDown(row, col, e));
      letterDiv.addEventListener('pointerenter', () => handleStrandsPointerEnter(row, col));
      
      // Touch events for mobile compatibility
      letterDiv.addEventListener('touchstart', (e) => handleStrandsTouchStart(row, col, e), { passive: false });
      letterDiv.addEventListener('touchmove', (e) => handleStrandsTouchMove(e), { passive: false });
      
      grid.appendChild(letterDiv);
    }
  }
}

function handleStrandsPointerDown(row, col, event) {
  if (event.button !== 0) return;
  event.preventDefault();
  strandsIsDragging = true;
  selectStrandsLetter(row, col, event);
}

function handleStrandsPointerEnter(row, col) {
  if (!strandsIsDragging) return;
  selectStrandsLetter(row, col, new PointerEvent('pointerenter'));
}

function handleStrandsTouchStart(row, col, event) {
  event.preventDefault();
  strandsIsDragging = true;
  selectStrandsLetter(row, col, event);
}

function handleStrandsTouchMove(event) {
  event.preventDefault();
  if (!strandsIsDragging) return;
  
  const touch = event.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  
  if (element && element.classList.contains('strands-letter') && !element.classList.contains('found')) {
    const row = parseInt(element.dataset.row);
    const col = parseInt(element.dataset.col);
    selectStrandsLetter(row, col, event);
  }
}

function initializeWordleGame() {
  wordleAttempts = [];
  wordleSolved = false;
  document.getElementById('wordleFeedback').textContent = '';
  document.getElementById('wordleGrid').innerHTML = '';
  const input = document.getElementById('wordleInput');
  input.value = '';
  input.disabled = false;
  input.focus();
  input.onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitWordleGuess();
    }
  };
}

function submitWordleGuess() {
  if (wordleSolved || wordleAttempts.length >= 6) return;

  const input = document.getElementById('wordleInput');
  const guess = input.value.trim().toUpperCase();
  if (guess.length !== 5 || !/^[A-Z]{5}$/.test(guess)) {
    document.getElementById('wordleFeedback').textContent = 'Please enter a 5-letter word.';
    return;
  }

  wordleAttempts.push(guess);
  const row = document.createElement('div');
  row.classList.add('wordle-row');

  const answerLetters = wordleAnswer.split('');
  const guessLetters = guess.split('');
  const letterCount = {};

  answerLetters.forEach(letter => {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  });

  const statuses = guessLetters.map((letter, index) => {
    if (answerLetters[index] === letter) {
      letterCount[letter] -= 1;
      return 'correct';
    }
    return '';
  });

  guessLetters.forEach((letter, index) => {
    if (statuses[index] === '') {
      if (answerLetters.includes(letter) && letterCount[letter] > 0) {
        statuses[index] = 'present';
        letterCount[letter] -= 1;
      } else {
        statuses[index] = 'absent';
      }
    }
  });

  guessLetters.forEach((letter, index) => {
    const cell = document.createElement('div');
    cell.classList.add('wordle-cell', statuses[index]);
    cell.textContent = letter;
    row.appendChild(cell);
  });

  document.getElementById('wordleGrid').appendChild(row);
  input.value = '';
  input.focus();

  if (guess === wordleAnswer) {
    wordleSolved = true;
    document.getElementById('wordleFeedback').textContent = '🎉 Correct! The word is BRIDE.';
    input.disabled = true;
    return;
  }

  if (wordleAttempts.length >= 6) {
    document.getElementById('wordleFeedback').textContent = `Game over. The word was ${wordleAnswer}.`;
    input.disabled = true;
    return;
  }

  document.getElementById('wordleFeedback').textContent = `${6 - wordleAttempts.length} guesses remaining.`;
}

function selectStrandsLetter(row, col, event) {
  const key = `${row},${col}`;
  const letterDiv = strandsLetterDivs[key];
  
  if (letterDiv.classList.contains('found')) return;

  if (strandsSelectedPath.length === 0 || isValidNextCell(row, col)) {
    if (!letterDiv.classList.contains('selected')) {
      letterDiv.classList.add('selected');
      strandsSelectedPath.push({ row, col, letter: strandsGridData[row][col] });
      updateStrandsCurrentWord();
    }
  }
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
      if (connectionsFoundGroups.size === 4) {
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
  document.getElementById('wordleGame').style.display = 'none';
  
  connectionsSelected.length = 0;
  strandsSelectedPath = [];
  connectionsFoundGroups.clear();
  strandsFoundWords.clear();
}

// Enhanced Tic Tac Toe Game with Professional Features
class TicTacToeGame {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.scores = { X: 0, O: 0, draw: 0 };
        this.gameMode = 'pvp';
        this.difficulty = 'medium';
        this.isComputerTurn = false;
        this.gameStartTime = null;
        this.gameTimer = null;
        this.moveHistory = [];
        this.gameConfig = {};
        this.moveCount = 0;
        
        this.gameStats = {
            totalGames: 0,
            totalWins: 0,
            totalTime: 0,
            currentStreak: 0,
            maxStreak: 0
        };
        
        this.settings = {
            soundEnabled: true,
            animationsEnabled: true,
            darkTheme: false
        };
        
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        
        this.initializeDOM();
    }
    
    // Initialize DOM Elements
    initializeDOM() {
        this.cells = document.querySelectorAll('.cell');
        this.statusElement = document.getElementById('status');
        this.gameTimerElement = document.getElementById('gameTimer');
        this.player1ScoreElement = document.getElementById('player1Score');
        this.player2ScoreElement = document.getElementById('player2Score');
        this.drawScoreElement = document.getElementById('scoreDraw');
        this.streakElement = document.getElementById('streak');
        this.undoButton = document.getElementById('undoMove');
        this.gameBoard = document.getElementById('gameBoard');
        
        // Audio elements
        this.moveSound = document.getElementById('moveSound');
        this.winSound = document.getElementById('winSound');
        
        this.bindEvents();
        this.loadSettings();
        this.loadStats();
        this.applySettings();
    }
    
    // Initialize with Configuration
    initializeWithConfig(config) {
        this.gameConfig = config;
        this.gameMode = config.gameMode;
        this.difficulty = config.difficulty;
        
        this.resetGame();
        this.updatePlayerDisplay();
        // Timer will be started explicitly by game manager
    }
    
    // Bind Event Listeners
    bindEvents() {
        // Cell clicks
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });
        
        // Control buttons
        document.getElementById('resetGame')?.addEventListener('click', () => this.resetGame());
        document.getElementById('undoMove')?.addEventListener('click', () => this.undoLastMove());
        document.getElementById('pauseGame')?.addEventListener('click', () => this.pauseGame());
        document.getElementById('backToMenu')?.addEventListener('click', () => this.backToMenu());
        
        // Quick actions
        document.getElementById('quickRestart')?.addEventListener('click', () => this.resetGame());
        document.getElementById('quickSettings')?.addEventListener('click', () => this.toggleSettings());
        document.getElementById('quickHelp')?.addEventListener('click', () => this.showHelp());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Settings toggle
        document.getElementById('settingsToggle')?.addEventListener('click', () => this.toggleSettings());
    }
    
    // Handle Cell Click
    handleCellClick(index) {
        if (this.board[index] !== '' || !this.gameActive || this.isComputerTurn) {
            return;
        }
        
        // Start timer on first move
        if (this.moveCount === 0 && !this.gameStartTime) {
            this.startGameTimer();
        }
        
        this.makeMove(index);
        this.moveCount++;
        
        if (this.checkWin()) {
            this.handleGameEnd('win');
        } else if (this.checkDraw()) {
            this.handleGameEnd('draw');
        } else {
            this.switchPlayer();
            this.updateStatus();
            
            if (this.gameMode === 'pvc' && this.currentPlayer === 'O') {
                this.makeComputerMove();
            }
        }
    }
    
    // Make a Move
    makeMove(index) {
        // Save move for undo
        this.moveHistory.push({
            index: index,
            player: this.currentPlayer,
            boardState: [...this.board]
        });
        
        this.board[index] = this.currentPlayer;
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        
        if (this.settings.animationsEnabled) {
            cell.classList.add('new-move');
            setTimeout(() => cell.classList.remove('new-move'), 500);
        }
        
        this.playSound('move');
        this.updateUndoButton();
        this.updateActivePlayer();
    }
    
    // Computer Move Logic
    makeComputerMove() {
        this.isComputerTurn = true;
        this.updateStatus();
        
        setTimeout(() => {
            const bestMove = this.getBestMove();
            if (bestMove !== null) {
                this.makeMove(bestMove);
                this.moveCount++;
                
                if (this.checkWin()) {
                    this.handleGameEnd('win');
                } else if (this.checkDraw()) {
                    this.handleGameEnd('draw');
                } else {
                    this.switchPlayer();
                    this.updateStatus();
                }
            }
            this.isComputerTurn = false;
        }, this.getComputerDelay());
    }
    
    // Get Best Move based on Difficulty
    getBestMove() {
        switch (this.difficulty) {
            case 'easy': return this.getEasyMove();
            case 'medium': return this.getMediumMove();
            case 'hard': return this.getHardMove();
            default: return this.getMediumMove();
        }
    }
    
    // Easy AI
    getEasyMove() {
        if (Math.random() < 0.3) {
            let move = this.findWinningMove('O');
            if (move !== null) return move;
            
            if (Math.random() < 0.5) {
                move = this.findWinningMove('X');
                if (move !== null) return move;
            }
        }
        return this.getRandomMove();
    }
    
    // Medium AI
    getMediumMove() {
        let move = this.findWinningMove('O');
        if (move !== null) return move;
        
        move = this.findWinningMove('X');
        if (move !== null) return move;
        
        if (this.board[4] === '') return 4;
        
        return this.getRandomMove();
    }
    
    // Hard AI with Minimax
    getHardMove() {
        let move = this.findWinningMove('O');
        if (move !== null) return move;
        
        move = this.findWinningMove('X');
        if (move !== null) return move;
        
        return this.minimaxMove();
    }
    
    // Minimax Implementation
    minimaxMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove !== null ? bestMove : this.getRandomMove();
    }
    
    // Minimax Algorithm
    minimax(board, depth, isMaximizing) {
        if (this.checkWinState('O')) return 10 - depth;
        if (this.checkWinState('X')) return depth - 10;
        if (board.every(cell => cell !== '')) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    // Helper Methods
    findWinningMove(player) {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            const values = [this.board[a], this.board[b], this.board[c]];
            
            if (values.filter(v => v === player).length === 2 && values.includes('')) {
                return combination[values.indexOf('')];
            }
        }
        return null;
    }
    
    getRandomMove() {
        const availableMoves = this.board.map((cell, index) => cell === '' ? index : null)
                                       .filter(val => val !== null);
        return availableMoves.length > 0 ? 
               availableMoves[Math.floor(Math.random() * availableMoves.length)] : null;
    }
    
    getComputerDelay() {
        switch (this.difficulty) {
            case 'easy': return 500;
            case 'medium': return 800;
            case 'hard': return 1200;
            default: return 800;
        }
    }
    
    checkWin() {
        return this.winningCombinations.some(combination => {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.highlightWinningCells([a, b, c]);
                return true;
            }
            return false;
        });
    }
    
    checkWinState(player) {
        return this.winningCombinations.some(combination => {
            const [a, b, c] = combination;
            return this.board[a] === player && this.board[b] === player && this.board[c] === player;
        });
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    highlightWinningCells(winningIndices) {
        winningIndices.forEach(index => {
            this.cells[index].classList.add('winning');
        });
    }
    
    // Game End Handler
    handleGameEnd(result) {
        this.gameActive = false;
        this.gameBoard.classList.add('game-over');
        this.stopGameTimer();
        
        const gameTime = this.gameStartTime ? Math.floor((Date.now() - this.gameStartTime) / 1000) : 0;
        
        this.updateGameStats(result, gameTime);
        
        if (result === 'win') {
            this.scores[this.currentPlayer]++;
            this.playSound('win');
            
            const winner = this.gameConfig.gameMode === 'pvc' && this.currentPlayer === 'X' ? 
                          this.gameConfig.player1Name : 
                          this.gameConfig.gameMode === 'pvc' && this.currentPlayer === 'O' ?
                          'Computer' :
                          this.currentPlayer === 'X' ? this.gameConfig.player1Name : this.gameConfig.player2Name;
            
            this.showResult({
                type: 'win',
                winner: winner
            }, {
                time: this.formatTime(gameTime),
                moves: this.moveCount,
                streak: this.gameStats.currentStreak
            });
        } else {
            this.scores.draw++;
            this.showResult({
                type: 'draw'
            }, {
                time: this.formatTime(gameTime),
                moves: this.moveCount,
                streak: this.gameStats.currentStreak
            });
        }
        
        this.updateScoreDisplay();
        this.saveStats();
    }
    
    // Show Game Result
    showResult(result, stats) {
        if (window.gameManager) {
            window.gameManager.showGameResult(result, stats);
        }
    }
    
    // Update Game Statistics
    updateGameStats(result, gameTime) {
        this.gameStats.totalGames++;
        this.gameStats.totalTime += gameTime;
        
        if (result === 'win') {
            if (this.gameConfig.gameMode === 'pvc' && this.currentPlayer === 'X') {
                this.gameStats.totalWins++;
                this.gameStats.currentStreak++;
                this.gameStats.maxStreak = Math.max(this.gameStats.maxStreak, this.gameStats.currentStreak);
            } else if (this.gameConfig.gameMode === 'pvp' && this.currentPlayer === 'X') {
                this.gameStats.totalWins++;
                this.gameStats.currentStreak++;
            } else {
                this.gameStats.currentStreak = 0;
            }
        } else {
            this.gameStats.currentStreak = 0;
        }
    }
    
    // UI Update Methods
    updateStatus() {
        if (!this.gameActive) return;
        
        const playerName = this.currentPlayer === 'X' ? 
                          this.gameConfig.player1Name : 
                          this.gameConfig.player2Name;
        
        if (this.gameConfig.gameMode === 'pvc' && this.currentPlayer === 'O') {
            this.statusElement.innerHTML = '<i class="fas fa-robot"></i> Computer\'s Turn...';
        } else {
            const icon = this.currentPlayer === 'X' ? 'fas fa-times' : 'far fa-circle';
            this.statusElement.innerHTML = `<i class="${icon}"></i> ${playerName}'s Turn`;
        }
        
        document.getElementById('statusPlayerName').textContent = playerName;
    }
    
    updatePlayerDisplay() {
        document.getElementById('displayPlayer1Name').textContent = this.gameConfig.player1Name;
        document.getElementById('displayPlayer2Name').textContent = this.gameConfig.player2Name;
        
        if (this.gameConfig.gameMode === 'pvc') {
            document.getElementById('player2Avatar').className = 'fas fa-robot';
        }
    }
    
    updateActivePlayer() {
        document.getElementById('player1Card').classList.toggle('active', this.currentPlayer === 'X');
        document.getElementById('player2Card').classList.toggle('active', this.currentPlayer === 'O');
    }
    
    updateScoreDisplay() {
        document.getElementById('player1Score').textContent = `${this.scores.X} wins`;
        document.getElementById('player2Score').textContent = `${this.scores.O} wins`;
        this.drawScoreElement.textContent = this.scores.draw;
        this.streakElement.textContent = this.gameStats.currentStreak;
    }
    
    // Timer Functions
    startGameTimer() {
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => this.updateGameTimer(), 1000);
    }
    
    updateGameTimer() {
        if (!this.gameActive || !this.gameStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.gameTimerElement.textContent = this.formatTime(elapsed);
    }
    
    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Game Control Methods
    resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.isComputerTurn = false;
        this.moveHistory = [];
        this.moveCount = 0;
        
        // Reset timer but don't restart it automatically
        this.stopGameTimer();
        this.gameStartTime = null;
        if (this.gameTimerElement) {
            this.gameTimerElement.textContent = '00:00';
        }
        
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning', 'new-move');
        });
        
        this.gameBoard.classList.remove('game-over');
        this.updateStatus();
        this.updateUndoButton();
        this.updateActivePlayer();
    }
    
    undoLastMove() {
        if (this.moveHistory.length === 0 || !this.gameActive) return;
        
        const lastMove = this.moveHistory.pop();
        this.board = [...lastMove.boardState];
        this.currentPlayer = lastMove.player;
        this.moveCount = Math.max(0, this.moveCount - 1);
        
        this.cells.forEach((cell, index) => {
            cell.textContent = this.board[index];
            cell.classList.remove('x', 'o', 'winning');
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase());
            }
        });
        
        this.gameBoard.classList.remove('game-over');
        this.gameActive = true;
        
        this.updateStatus();
        this.updateUndoButton();
        this.updateActivePlayer();
        this.playSound('move');
    }
    
    updateUndoButton() {
        if (this.undoButton) {
            this.undoButton.disabled = this.moveHistory.length === 0 || !this.gameActive;
        }
    }
    
    pauseGame() {
        if (window.gameManager) {
            window.gameManager.pauseGame();
        }
    }
    
    backToMenu() {
        if (window.gameManager) {
            window.gameManager.backToMenu();
        }
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }
    
    // Audio Methods
    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        try {
            if (type === 'move' && this.moveSound) {
                this.moveSound.currentTime = 0;
                this.moveSound.play().catch(() => {});
            } else if (type === 'win' && this.winSound) {
                this.winSound.currentTime = 0;
                this.winSound.play().catch(() => {});
            }
        } catch (error) {
            // Handle audio errors silently
        }
    }
    
    // Settings Methods
    loadSettings() {
        const saved = localStorage.getItem('ticTacToeProSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    saveSettings() {
        localStorage.setItem('ticTacToeProSettings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        document.body.setAttribute('data-theme', this.settings.darkTheme ? 'dark' : 'light');
    }
    
    toggleSettings() {
        const dropdown = document.getElementById('settingsDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }
    
    // Stats Methods
    loadStats() {
        const saved = localStorage.getItem('ticTacToeProStats');
        if (saved) {
            this.gameStats = { ...this.gameStats, ...JSON.parse(saved) };
        }
    }
    
    saveStats() {
        localStorage.setItem('ticTacToeProStats', JSON.stringify(this.gameStats));
    }
    
    // Keyboard Handler
    handleKeyPress(e) {
        if (e.target.tagName === 'INPUT') return;
        
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 9) {
            this.handleCellClick(keyNum - 1);
        }
        
        switch (e.key.toLowerCase()) {
            case 'r':
                this.resetGame();
                break;
            case 'u':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.undoLastMove();
                }
                break;
            case 'p':
                this.pauseGame();
                break;
            case 'escape':
                document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
                break;
        }
    }
    
    // Helper Methods
    showHelp() {
        if (window.gameManager) {
            window.gameManager.showRulesModal();
        }
    }
}

// Initialize Game Instance
window.gameInstance = new TicTacToeGame();

// Winning Combinations
const winningCombinations = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
];

// Initialize Game
function initializeGame() {
    // Load saved settings and stats
    loadSettings();
    loadStats();
    
    // Add click event listeners to all cells
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
    
    // Add event listeners to buttons
    resetGameButton.addEventListener('click', resetGame);
    resetScoreButton.addEventListener('click', resetScore);
    undoButton.addEventListener('click', undoLastMove);
    playerVsPlayerButton.addEventListener('click', () => setGameMode('pvp'));
    playerVsComputerButton.addEventListener('click', () => setGameMode('pvc'));
    
    // Difficulty buttons
    easyModeButton.addEventListener('click', () => setDifficulty('easy'));
    mediumModeButton.addEventListener('click', () => setDifficulty('medium'));
    hardModeButton.addEventListener('click', () => setDifficulty('hard'));
    
    // Settings
    settingsToggle.addEventListener('click', toggleSettings);
    soundToggle.addEventListener('change', (e) => updateSetting('soundEnabled', e.target.checked));
    animationsToggle.addEventListener('change', (e) => updateSetting('animationsEnabled', e.target.checked));
    themeToggle.addEventListener('change', (e) => updateSetting('darkTheme', e.target.checked));
    
    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.settings-panel')) {
            settingsDropdown.classList.remove('show');
        }
    });
    
    // Update display
    updateStatus();
    updateScoreDisplay();
    updateStatsDisplay();
    applySettings();
    
    // Start game timer
    startGameTimer();
}

// Load Settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('ticTacToeSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
        soundToggle.checked = settings.soundEnabled;
        animationsToggle.checked = settings.animationsEnabled;
        themeToggle.checked = settings.darkTheme;
    }
}

// Save Settings to localStorage
function saveSettings() {
    localStorage.setItem('ticTacToeSettings', JSON.stringify(settings));
}

// Load Stats from localStorage
function loadStats() {
    const savedStats = localStorage.getItem('ticTacToeStats');
    if (savedStats) {
        gameStats = { ...gameStats, ...JSON.parse(savedStats) };
    }
}

// Save Stats to localStorage
function saveStats() {
    localStorage.setItem('ticTacToeStats', JSON.stringify(gameStats));
}

// Apply Settings
function applySettings() {
    document.body.setAttribute('data-theme', settings.darkTheme ? 'dark' : 'light');
    
    if (!settings.animationsEnabled) {
        document.body.style.setProperty('--animation-duration', '0s');
    } else {
        document.body.style.removeProperty('--animation-duration');
    }
}

// Update Setting
function updateSetting(key, value) {
    settings[key] = value;
    saveSettings();
    applySettings();
}

// Toggle Settings Dropdown
function toggleSettings() {
    settingsDropdown.classList.toggle('show');
}

// Set Game Mode
function setGameMode(mode) {
    gameMode = mode;
    
    // Update button states
    playerVsPlayerButton.classList.toggle('active', mode === 'pvp');
    playerVsComputerButton.classList.toggle('active', mode === 'pvc');
    
    // Show/hide difficulty selection
    difficultySelection.style.display = mode === 'pvc' ? 'block' : 'none';
    
    // Update player 2 label and icon
    if (mode === 'pvc') {
        player2Label.textContent = 'Computer (O): ';
        player2Icon.className = 'fas fa-robot';
    } else {
        player2Label.textContent = 'Player (O): ';
        player2Icon.className = 'fas fa-user';
    }
    
    // Reset game when mode changes
    resetGame();
}

// Set Difficulty
function setDifficulty(level) {
    difficulty = level;
    
    // Update button states
    easyModeButton.classList.toggle('active', level === 'easy');
    mediumModeButton.classList.toggle('active', level === 'medium');
    hardModeButton.classList.toggle('active', level === 'hard');
    
    // Reset game when difficulty changes
    if (gameMode === 'pvc') {
        resetGame();
    }
}

// Handle Cell Click
function handleCellClick(index) {
    // Check if cell is already filled, game is not active, or it's computer's turn
    if (board[index] !== '' || !gameActive || isComputerTurn) {
        return;
    }
    
    // Save move for undo functionality
    moveHistory.push({
        index: index,
        player: currentPlayer,
        boardState: [...board]
    });
    
    // Make the move
    makeMove(index);
    
    // Play sound effect
    playSound('move');
    
    // Update undo button
    updateUndoButton();
    
    // Check for win or draw
    if (checkWin()) {
        handleGameEnd('win');
    } else if (checkDraw()) {
        handleGameEnd('draw');
    } else {
        // Switch players
        switchPlayer();
        updateStatus();
        
        // If it's computer mode and now it's O's turn, make computer move
        if (gameMode === 'pvc' && currentPlayer === 'O') {
            isComputerTurn = true;
            statusElement.innerHTML = '<i class="fas fa-robot"></i> Computer is thinking...';
            
            setTimeout(() => {
                makeComputerMove();
                isComputerTurn = false;
            }, getComputerDelay());
        }
    }
}

// Get Computer Delay based on difficulty
function getComputerDelay() {
    switch (difficulty) {
        case 'easy': return 500;
        case 'medium': return 800;
        case 'hard': return 1200;
        default: return 800;
    }
}

// Make a Move
function makeMove(index) {
    board[index] = currentPlayer;
    const cell = cells[index];
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    
    // Add animation if enabled
    if (settings.animationsEnabled) {
        cell.classList.add('new-move');
        setTimeout(() => cell.classList.remove('new-move'), 500);
    }
}

// Undo Last Move
function undoLastMove() {
    if (moveHistory.length === 0 || !gameActive) return;
    
    const lastMove = moveHistory.pop();
    board = [...lastMove.boardState];
    currentPlayer = lastMove.player;
    
    // Clear the board display and rebuild it
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.classList.remove('x', 'o', 'winning');
        if (board[index]) {
            cell.classList.add(board[index].toLowerCase());
        }
    });
    
    // Remove game-over state if it was set
    gameBoard.classList.remove('game-over');
    gameActive = true;
    
    updateStatus();
    updateUndoButton();
    playSound('move');
}

// Update Undo Button
function updateUndoButton() {
    undoButton.disabled = moveHistory.length === 0 || !gameActive;
}

// Start Game Timer
function startGameTimer() {
    gameStartTime = Date.now();
    gameTimer = setInterval(updateGameTimer, 1000);
}

// Update Game Timer
function updateGameTimer() {
    if (!gameActive || !gameStartTime) return;
    
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    gameTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Stop Game Timer
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// Play Sound Effect
function playSound(type) {
    if (!settings.soundEnabled) return;
    
    try {
        if (type === 'move' && moveSound) {
            moveSound.currentTime = 0;
            moveSound.play().catch(() => {}); // Ignore audio play errors
        } else if (type === 'win' && winSound) {
            winSound.currentTime = 0;
            winSound.play().catch(() => {}); // Ignore audio play errors
        }
    } catch (error) {
        // Silently handle audio errors
    }
}

// Show Achievement
function showAchievement(text) {
    achievementText.textContent = text;
    achievementNotification.classList.add('show');
    
    setTimeout(() => {
        achievementNotification.classList.remove('show');
    }, 3000);
}

// Check for Win
function checkWin() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            // Highlight winning cells
            highlightWinningCells([a, b, c]);
            return true;
        }
        return false;
    });
}

// Check for Draw
function checkDraw() {
    return board.every(cell => cell !== '');
}

// Highlight Winning Cells
function highlightWinningCells(winningIndices) {
    winningIndices.forEach(index => {
        cells[index].classList.add('winning');
    });
}

// Handle Game End
function handleGameEnd(result) {
    gameActive = false;
    gameBoard.classList.add('game-over');
    stopGameTimer();
    
    // Calculate game time
    const gameTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    
    // Update statistics
    gameStats.totalGames++;
    gameStats.totalTime += gameTime;
    
    if (result === 'win') {
        scores[currentPlayer]++;
        playSound('win');
        
        if (gameMode === 'pvc') {
            if (currentPlayer === 'X') {
                statusElement.innerHTML = "🎉 You Win! Excellent!";
                statusElement.style.color = 'var(--success-color)';
                gameStats.totalWins++;
                gameStats.currentStreak++;
                gameStats.maxStreak = Math.max(gameStats.maxStreak, gameStats.currentStreak);
                
                // Show achievements
                if (gameStats.currentStreak === 3) {
                    showAchievement("🔥 3 Win Streak! You're on fire!");
                } else if (gameStats.currentStreak === 5) {
                    showAchievement("🚀 5 Win Streak! Unstoppable!");
                } else if (gameStats.totalWins === 10) {
                    showAchievement("🏆 10 Wins! Tic Tac Toe Master!");
                }
            } else {
                statusElement.innerHTML = "💻 Computer Wins! Try again!";
                statusElement.style.color = 'var(--primary-color)';
                gameStats.currentStreak = 0;
            }
        } else {
            statusElement.innerHTML = `🎉 Player ${currentPlayer} Wins!`;
            statusElement.style.color = currentPlayer === 'X' ? 'var(--error-color)' : 'var(--primary-color)';
            if (currentPlayer === 'X') {
                gameStats.totalWins++;
                gameStats.currentStreak++;
            } else {
                gameStats.currentStreak = 0;
            }
        }
    } else {
        scores.draw++;
        statusElement.innerHTML = "🤝 It's a Draw! Good game!";
        statusElement.style.color = 'var(--warning-color)';
        gameStats.currentStreak = 0;
    }
    
    updateScoreDisplay();
    updateStatsDisplay();
    saveStats();
    updateUndoButton();
}

// Update Statistics Display
function updateStatsDisplay() {
    totalGamesElement.textContent = gameStats.totalGames;
    
    const winRate = gameStats.totalGames > 0 ? 
        Math.round((gameStats.totalWins / gameStats.totalGames) * 100) : 0;
    winRateElement.textContent = `${winRate}%`;
    
    const avgTime = gameStats.totalGames > 0 ? 
        Math.round(gameStats.totalTime / gameStats.totalGames) : 0;
    avgTimeElement.textContent = `${avgTime}s`;
    
    streakElement.textContent = gameStats.currentStreak;
}

// Switch Player
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

// Update Status Display
function updateStatus() {
    if (gameActive) {
        if (gameMode === 'pvc' && currentPlayer === 'O') {
            statusElement.innerHTML = '<i class="fas fa-robot"></i> Computer\'s Turn...';
            statusElement.style.color = 'var(--primary-color)';
        } else if (gameMode === 'pvc' && currentPlayer === 'X') {
            statusElement.innerHTML = '<i class="fas fa-user"></i> Your Turn';
            statusElement.style.color = 'var(--error-color)';
        } else {
            const icon = currentPlayer === 'X' ? 'fas fa-times' : 'far fa-circle';
            statusElement.innerHTML = `<i class="${icon}"></i> Player ${currentPlayer}'s Turn`;
            statusElement.style.color = currentPlayer === 'X' ? 'var(--error-color)' : 'var(--primary-color)';
        }
    }
}

// Update Score Display
function updateScoreDisplay() {
    scoreXElement.textContent = scores.X;
    scoreOElement.textContent = scores.O;
    scoreDrawElement.textContent = scores.draw;
}

// Reset Game
function resetGame() {
    // Reset game state
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    isComputerTurn = false;
    moveHistory = [];
    
    // Stop and restart timer
    stopGameTimer();
    startGameTimer();
    
    // Clear board display
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winning', 'new-move');
    });
    
    // Remove game-over class
    gameBoard.classList.remove('game-over');
    
    // Update displays
    updateStatus();
    updateUndoButton();
}

// Reset Score and Statistics
function resetScore() {
    scores = { X: 0, O: 0, draw: 0 };
    gameStats = {
        totalGames: 0,
        totalWins: 0,
        totalTime: 0,
        currentStreak: 0,
        maxStreak: 0
    };
    
    updateScoreDisplay();
    updateStatsDisplay();
    saveStats();
    
    showAchievement("📊 Statistics Reset!");
}

// Add some fun features
function addGameFeatures() {
    // Add sound effects (optional - can be enhanced later)
    function playSound(type) {
        // You can add sound effects here later
        console.log(`Playing ${type} sound`);
    }
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        // Numbers 1-9 correspond to board positions
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 9) {
            const index = keyNum - 1;
            handleCellClick(index);
        }
        
        // R key to reset game
        if (e.key.toLowerCase() === 'r') {
            resetGame();
        }
    });
}

// Computer AI Logic
function makeComputerMove() {
    if (!gameActive || currentPlayer !== 'O') return;
    
    const bestMove = getBestMove();
    if (bestMove !== null) {
        // Save move for undo functionality
        moveHistory.push({
            index: bestMove,
            player: currentPlayer,
            boardState: [...board]
        });
        
        makeMove(bestMove);
        playSound('move');
        updateUndoButton();
        
        // Check for win or draw
        if (checkWin()) {
            handleGameEnd('win');
        } else if (checkDraw()) {
            handleGameEnd('draw');
        } else {
            switchPlayer();
            updateStatus();
        }
    }
}

// Get Best Move using AI based on difficulty
function getBestMove() {
    switch (difficulty) {
        case 'easy':
            return getEasyMove();
        case 'medium':
            return getMediumMove();
        case 'hard':
            return getHardMove();
        default:
            return getMediumMove();
    }
}

// Easy AI - Random moves with occasional strategy
function getEasyMove() {
    // 30% chance to play strategically, 70% random
    if (Math.random() < 0.3) {
        // Try to win
        let move = findWinningMove('O');
        if (move !== null) return move;
        
        // Try to block (50% chance)
        if (Math.random() < 0.5) {
            move = findWinningMove('X');
            if (move !== null) return move;
        }
    }
    
    return getRandomMove();
}

// Medium AI - Balanced strategy
function getMediumMove() {
    // Try to win
    let move = findWinningMove('O');
    if (move !== null) return move;
    
    // Try to block player from winning
    move = findWinningMove('X');
    if (move !== null) return move;
    
    // Take center if available
    if (board[4] === '') return 4;
    
    // Take random corner or side
    return getRandomMove();
}

// Hard AI - Advanced strategy using minimax
function getHardMove() {
    // Try to win
    let move = findWinningMove('O');
    if (move !== null) return move;
    
    // Try to block player from winning
    move = findWinningMove('X');
    if (move !== null) return move;
    
    // Use minimax for optimal play
    return minimaxMove();
}

// Minimax Algorithm for optimal play
function minimaxMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove !== null ? bestMove : getRandomMove();
}

// Minimax recursive function
function minimax(board, depth, isMaximizing) {
    // Check for terminal states
    if (checkWinState('O')) return 10 - depth;
    if (checkWinState('X')) return depth - 10;
    if (board.every(cell => cell !== '')) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Check win state for minimax
function checkWinState(player) {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return board[a] === player && board[b] === player && board[c] === player;
    });
}

// Find Winning Move
function findWinningMove(player) {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        const values = [board[a], board[b], board[c]];
        
        // Check if two cells have the player's mark and one is empty
        if (values.filter(v => v === player).length === 2 && values.includes('')) {
            return combination[values.indexOf('')];
        }
    }
    return null;
}

// Get Random Move
function getRandomMove() {
    const availableMoves = board.map((cell, index) => cell === '' ? index : null)
                               .filter(val => val !== null);
    return availableMoves.length > 0 ? 
           availableMoves[Math.floor(Math.random() * availableMoves.length)] : null;
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    addGameFeatures();
    
    console.log('🎮 Tic Tac Toe Pro Loaded!');
    console.log('💡 Pro tips:');
    console.log('   • Use number keys 1-9 to make moves');
    console.log('   • Press R to reset game');
    console.log('   • Press U to undo last move');
    console.log('   • Try different difficulty levels!');
});

// Enhanced keyboard support and other features
function addGameFeatures() {
    // Enhanced keyboard support
    document.addEventListener('keydown', (e) => {
        // Numbers 1-9 correspond to board positions
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 9) {
            const index = keyNum - 1;
            handleCellClick(index);
        }
        
        // Keyboard shortcuts
        switch (e.key.toLowerCase()) {
            case 'r':
                resetGame();
                break;
            case 'u':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    undoLastMove();
                }
                break;
            case 'escape':
                settingsDropdown.classList.remove('show');
                break;
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    toggleSettings();
                }
                break;
        }
    });
    
    // Touch support for mobile
    cells.forEach((cell, index) => {
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleCellClick(index);
        });
    });
    
    // Prevent context menu on right click for cells
    cells.forEach(cell => {
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });
    
    // Add smooth scrolling for mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflowX = 'hidden';
    }
}

// Export functions for testing (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleCellClick,
        checkWin,
        checkDraw,
        resetGame,
        switchPlayer,
        getBestMove,
        makeComputerMove
    };
}

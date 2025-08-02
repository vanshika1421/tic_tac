// Game Manager - Professional Game State Management
class TicTacToeProManager {
    constructor() {
        this.currentScreen = 'cover';
        this.gameConfig = {
            player1Name: '',
            player2Name: '',
            gameMode: 'pvp',
            difficulty: 'medium',
            round: 1
        };
        
        this.tutorialSteps = [
            {
                title: "Welcome to Tic Tac Toe Pro!",
                text: "This tutorial will teach you how to play and use all the advanced features.",
                highlight: null
            },
            {
                title: "The Game Board",
                text: "Click on any empty square to place your mark. You can also use number keys 1-9 to play.",
                highlight: ".game-board"
            },
            {
                title: "Player Information",
                text: "Here you can see whose turn it is, the game timer, and current scores.",
                highlight: ".game-status"
            },
            {
                title: "Game Controls",
                text: "Use these buttons to start a new round, undo moves, or pause the game.",
                highlight: ".controls"
            },
            {
                title: "Ready to Play!",
                text: "You're all set! Try to get 3 in a row before your opponent. Good luck!",
                highlight: null
            }
        ];
        
        this.currentTutorialStep = 0;
        this.isGamePaused = false;
        
        this.initializeCoverPage();
    }
    
    // Initialize Cover Page
    initializeCoverPage() {
        this.bindCoverPageEvents();
    }
    
    // Bind Cover Page Events
    bindCoverPageEvents() {
        document.getElementById('enterGame')?.addEventListener('click', () => this.showWelcomeScreen());
    }
    
    // Show Welcome Screen from Cover Page
    showWelcomeScreen() {
        const coverPage = document.getElementById('coverPage');
        const welcomeScreen = document.getElementById('welcomeScreen');
        
        // Smooth transition from cover to welcome
        coverPage.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        coverPage.style.opacity = '0';
        coverPage.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            coverPage.style.display = 'none';
            welcomeScreen.style.display = 'flex';
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transform = 'scale(0.9)';
            
            // Fade in welcome screen
            setTimeout(() => {
                welcomeScreen.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                welcomeScreen.style.opacity = '1';
                welcomeScreen.style.transform = 'scale(1)';
                this.currentScreen = 'welcome';
                
                // Initialize welcome screen functionality
                this.initializeWelcomeScreen();
                
                // Focus on first input
                document.getElementById('player1Name')?.focus();
            }, 100);
        }, 800);
    }
    
    // Initialize Welcome Screen
    initializeWelcomeScreen() {
        this.bindWelcomeEvents();
        this.loadLastGameConfig();
    }
    
    // Bind Welcome Screen Events
    bindWelcomeEvents() {
        // Mode selection
        document.getElementById('welcomePvP').addEventListener('click', () => this.selectWelcomeMode('pvp'));
        document.getElementById('welcomePvC').addEventListener('click', () => this.selectWelcomeMode('pvc'));
        document.getElementById('welcomeTutorial').addEventListener('click', () => this.selectWelcomeMode('tutorial'));
        
        // Difficulty selection
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.gameConfig.difficulty = e.target.dataset.difficulty;
            });
        });
        
        // Action buttons
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('showRules').addEventListener('click', () => this.showRulesModal());
        document.getElementById('showStats').addEventListener('click', () => this.showStatsModal());
        
        // Player name inputs
        document.getElementById('player1Name').addEventListener('input', (e) => {
            this.gameConfig.player1Name = e.target.value || 'Player 1';
        });
        
        document.getElementById('player2Name').addEventListener('input', (e) => {
            this.gameConfig.player2Name = e.target.value || 'Player 2';
        });
        
        // Auto-focus first input
        document.getElementById('player1Name').focus();
    }
    
    // Select Welcome Mode
    selectWelcomeMode(mode) {
        // Update button states
        document.querySelectorAll('.welcome-mode-btn').forEach(btn => btn.classList.remove('active'));
        
        if (mode === 'pvp') {
            document.getElementById('welcomePvP').classList.add('active');
            document.getElementById('player2Setup').style.display = 'block';
            document.getElementById('welcomeDifficulty').style.display = 'none';
        } else if (mode === 'pvc') {
            document.getElementById('welcomePvC').classList.add('active');
            document.getElementById('player2Setup').style.display = 'none';
            document.getElementById('welcomeDifficulty').style.display = 'block';
            this.gameConfig.player2Name = 'Computer';
        } else if (mode === 'tutorial') {
            document.getElementById('welcomeTutorial').classList.add('active');
            document.getElementById('player2Setup').style.display = 'none';
            document.getElementById('welcomeDifficulty').style.display = 'none';
            this.gameConfig.player1Name = 'Student';
            this.gameConfig.player2Name = 'Tutor';
        }
        
        this.gameConfig.gameMode = mode;
    }
    
    // Start Game
    startGame() {
        // Validate player names
        if (!this.gameConfig.player1Name.trim()) {
            this.gameConfig.player1Name = 'Player 1';
        }
        
        if (this.gameConfig.gameMode === 'pvp' && !this.gameConfig.player2Name.trim()) {
            this.gameConfig.player2Name = 'Player 2';
        }
        
        // Save config
        this.saveGameConfig();
        
        // Hide welcome screen and show game
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        // Initialize game with config
        if (this.gameConfig.gameMode === 'tutorial') {
            this.startTutorial();
        } else {
            this.initializeMainGame();
        }
        
        this.currentScreen = 'game';
    }
    
    // Initialize Main Game
    initializeMainGame() {
        // Update UI with player names and game info
        this.updateGameUI();
        
        // Initialize the game instance with config - timer will start here
        if (window.gameInstance) {
            // Stop any existing timer first
            if (window.gameInstance.gameTimer) {
                clearInterval(window.gameInstance.gameTimer);
                window.gameInstance.gameTimer = null;
                window.gameInstance.gameStartTime = null;
            }
            
            // Initialize with configuration
            window.gameInstance.initializeWithConfig(this.gameConfig);
        }
        
        // Initialize the actual game logic
        if (window.gameInstance) {
            window.gameInstance.initializeWithConfig(this.gameConfig);
        }
    }
    
    // Update Game UI
    updateGameUI() {
        const config = this.gameConfig;
        
        // Update player names in UI
        document.getElementById('currentPlayerName').textContent = config.player1Name;
        document.getElementById('displayPlayer1Name').textContent = config.player1Name;
        document.getElementById('displayPlayer2Name').textContent = config.player2Name;
        document.getElementById('statusPlayerName').textContent = config.player1Name;
        
        // Update game mode info
        const modeText = config.gameMode === 'pvc' ? 
            `vs Computer (${config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)})` : 
            'Player vs Player';
        document.getElementById('currentMode').textContent = modeText;
        
        // Update round number
        document.getElementById('roundNumber').textContent = config.round;
        
        // Update player 2 avatar for computer
        if (config.gameMode === 'pvc') {
            document.getElementById('player2Avatar').className = 'fas fa-robot';
        }
    }
    
    // Start Tutorial
    startTutorial() {
        this.currentTutorialStep = 0;
        document.getElementById('tutorialOverlay').style.display = 'flex';
        this.showTutorialStep();
        
        // Bind tutorial controls
        document.getElementById('tutorialNext').addEventListener('click', () => this.nextTutorialStep());
        document.getElementById('tutorialPrev').addEventListener('click', () => this.prevTutorialStep());
    }
    
    // Show Tutorial Step
    showTutorialStep() {
        const step = this.tutorialSteps[this.currentTutorialStep];
        
        document.getElementById('tutorialTitle').textContent = step.title;
        document.getElementById('tutorialText').textContent = step.text;
        document.getElementById('tutorialProgress').textContent = `${this.currentTutorialStep + 1} / ${this.tutorialSteps.length}`;
        
        // Update button states
        document.getElementById('tutorialPrev').disabled = this.currentTutorialStep === 0;
        document.getElementById('tutorialNext').textContent = 
            this.currentTutorialStep === this.tutorialSteps.length - 1 ? 'Finish' : 'Next';
        
        // Highlight elements
        this.highlightTutorialElement(step.highlight);
    }
    
    // Highlight Tutorial Element
    highlightTutorialElement(selector) {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        if (selector) {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('tutorial-highlight');
            }
        }
    }
    
    // Next Tutorial Step
    nextTutorialStep() {
        if (this.currentTutorialStep < this.tutorialSteps.length - 1) {
            this.currentTutorialStep++;
            this.showTutorialStep();
        } else {
            this.finishTutorial();
        }
    }
    
    // Previous Tutorial Step
    prevTutorialStep() {
        if (this.currentTutorialStep > 0) {
            this.currentTutorialStep--;
            this.showTutorialStep();
        }
    }
    
    // Finish Tutorial
    finishTutorial() {
        document.getElementById('tutorialOverlay').style.display = 'none';
        this.gameConfig.gameMode = 'pvc';
        this.gameConfig.difficulty = 'easy';
        this.initializeMainGame();
    }
    
    // Show Rules Modal
    showRulesModal() {
        document.getElementById('rulesModal').classList.add('show');
        
        // Bind close events
        document.getElementById('closeRules').addEventListener('click', () => {
            document.getElementById('rulesModal').classList.remove('show');
        });
        
        document.getElementById('startTutorial').addEventListener('click', () => {
            document.getElementById('rulesModal').classList.remove('show');
            this.selectWelcomeMode('tutorial');
        });
    }
    
    // Show Game Result
    showGameResult(result, stats) {
        const modal = document.getElementById('matchResultModal');
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        // Update result display based on outcome
        if (result.type === 'win') {
            resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
            resultIcon.style.background = 'linear-gradient(135deg, var(--success-color), #27ae60)';
            resultTitle.textContent = '🎉 Congratulations!';
            resultMessage.textContent = `${result.winner} wins this round!`;
        } else if (result.type === 'draw') {
            resultIcon.innerHTML = '<i class="fas fa-handshake"></i>';
            resultIcon.style.background = 'linear-gradient(135deg, var(--warning-color), #e67e22)';
            resultTitle.textContent = '🤝 It\'s a Draw!';
            resultMessage.textContent = 'Great game! Nobody wins this round.';
        }
        
        // Update stats
        document.getElementById('resultTime').textContent = stats.time;
        document.getElementById('resultMoves').textContent = stats.moves;
        document.getElementById('resultStreak').textContent = stats.streak;
        
        modal.classList.add('show');
        
        // Bind result actions
        document.getElementById('playAgain').addEventListener('click', () => {
            modal.classList.remove('show');
            this.gameConfig.round++;
            this.startGame();
        });
        
        document.getElementById('backToMenuFromResult').addEventListener('click', () => {
            this.backToMenu();
        });
    }
    
    // Back to Menu
    backToMenu() {
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
        this.currentScreen = 'welcome';
        this.gameConfig.round = 1;
    }
    
    // Save Game Config
    saveGameConfig() {
        localStorage.setItem('ticTacToeProConfig', JSON.stringify(this.gameConfig));
    }
    
    // Load Last Game Config
    loadLastGameConfig() {
        const saved = localStorage.getItem('ticTacToeProConfig');
        if (saved) {
            const config = JSON.parse(saved);
            
            // Apply saved config to inputs
            if (config.player1Name) {
                document.getElementById('player1Name').value = config.player1Name;
                this.gameConfig.player1Name = config.player1Name;
            }
            
            if (config.player2Name && config.gameMode === 'pvp') {
                document.getElementById('player2Name').value = config.player2Name;
                this.gameConfig.player2Name = config.player2Name;
            }
            
            // Set game mode
            if (config.gameMode) {
                this.selectWelcomeMode(config.gameMode);
            }
            
            // Set difficulty
            if (config.difficulty) {
                document.querySelectorAll('.diff-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.difficulty === config.difficulty);
                });
                this.gameConfig.difficulty = config.difficulty;
            }
        }
    }
    
    // Pause Game
    pauseGame() {
        this.isGamePaused = true;
        document.getElementById('pauseModal').classList.add('show');
        
        // Update pause stats
        const gameTime = document.getElementById('gameTimer').textContent;
        const moves = document.querySelectorAll('.cell').length - 
                     document.querySelectorAll('.cell:empty').length;
        
        document.getElementById('pausedTime').textContent = gameTime;
        document.getElementById('pausedMoves').textContent = moves;
        
        // Bind pause actions
        document.getElementById('resumeGame').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartFromPause').addEventListener('click', () => {
            document.getElementById('pauseModal').classList.remove('show');
            if (window.gameInstance) {
                window.gameInstance.resetGame();
            }
            this.isGamePaused = false;
        });
        
        document.getElementById('exitToMenu').addEventListener('click', () => {
            this.backToMenu();
        });
    }
    
    // Resume Game
    resumeGame() {
        this.isGamePaused = false;
        document.getElementById('pauseModal').classList.remove('show');
    }
}

// Initialize Game Manager
window.gameManager = new TicTacToeProManager();

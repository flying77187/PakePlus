// Game Variables
let gameActive = false;
let gameTime = 0;
let timerInterval = null;
let carPosition = { x: 12, y: 50 }; // percentages
let carSpeed = 0;
let maxSpeed = 15;
let acceleration = 0.5;
let deceleration = 0.3;
let steeringSpeed = 1.5;
let keysPressed = {};
let bestTime = localStorage.getItem('racingBestTime') || null;

// DOM Elements
const car = document.getElementById('car');
const timerElement = document.getElementById('timer');
const positionElement = document.getElementById('position');
const speedElement = document.getElementById('speed');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const helpBtn = document.getElementById('helpBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalTimeElement = document.getElementById('finalTime');
const bestTimeElement = document.getElementById('bestTime');

// Obstacles positions (as percentages)
const obstacles = [
    { x: 30, y: 20, width: 50, height: 50 },
    { x: 60, y: 70, width: 50, height: 50 },
    { x: 45, y: 50, width: 50, height: 50 }
];

// Initialize game
function initGame() {
    updateDisplay();
    loadBestTime();
    
    // Event Listeners
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    helpBtn.addEventListener('click', showHelp);
    playAgainBtn.addEventListener('click', playAgain);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Prevent space bar from scrolling page
    document.addEventListener('keydown', function(e) {
        if(e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
}

// Start/Pause the game
function startGame() {
    if (!gameActive) {
        // Start the game
        gameActive = true;
        gameTime = 0;
        carSpeed = 0;
        carPosition = { x: 12, y: 50 };
        updateCarPosition();
        
        // Start timer
        timerInterval = setInterval(() => {
            gameTime += 0.1;
            updateDisplay();
        }, 100);
        
        startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Game';
        startBtn.classList.remove('disabled');
    } else {
        // Pause the game
        gameActive = false;
        clearInterval(timerInterval);
        startBtn.innerHTML = '<i class="fas fa-play"></i> Resume Game';
    }
}

// Reset the game
function resetGame() {
    gameActive = false;
    clearInterval(timerInterval);
    gameTime = 0;
    carSpeed = 0;
    carPosition = { x: 12, y: 50 };
    updateCarPosition();
    updateDisplay();
    
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start Game';
    startBtn.classList.remove('disabled');
}

// Handle key down events
function handleKeyDown(e) {
    // Always allow R key for reset and P for pause
    if (e.code === 'KeyR') {
        resetGame();
        return;
    }
    
    if (e.code === 'KeyP') {
        startGame(); // Toggle pause/play
        return;
    }
    
    if (!gameActive) return;
    
    keysPressed[e.code] = true;
    
    // Emergency brake with Space
    if (e.code === 'Space') {
        carSpeed = 0;
    }
}

// Handle key up events
function handleKeyUp(e) {
    keysPressed[e.code] = false;
}

// Game loop for continuous movement
function gameLoop() {
    if (!gameActive) return;
    
    // Handle acceleration
    if (keysPressed['ArrowUp']) {
        carSpeed = Math.min(carSpeed + acceleration, maxSpeed);
    } else if (keysPressed['ArrowDown']) {
        carSpeed = Math.max(carSpeed - deceleration, -maxSpeed/2);
    } else {
        // Natural deceleration
        if (carSpeed > 0) {
            carSpeed = Math.max(carSpeed - deceleration/2, 0);
        } else if (carSpeed < 0) {
            carSpeed = Math.min(carSpeed + deceleration/2, 0);
        }
    }
    
    // Handle steering
    if (keysPressed['ArrowLeft']) {
        carPosition.x = Math.max(carPosition.x - steeringSpeed * (carSpeed > 0 ? 1 : 0.5), 5);
    }
    if (keysPressed['ArrowRight']) {
        carPosition.x = Math.min(carPosition.x + steeringSpeed * (carSpeed > 0 ? 1 : 0.5), 95);
    }
    
    // Move car forward/backward based on speed
    if (carSpeed !== 0) {
        // Calculate new position (simplified - in a real game you'd use proper physics)
        carPosition.y = Math.max(5, Math.min(95, carPosition.y - carSpeed/2));
        
        // Check for collision with obstacles
        checkCollisions();
        
        // Check if reached finish line
        if (carPosition.y <= 5 && carPosition.x >= 85 && carPosition.x <= 95) {
            finishGame();
        }
    }
    
    updateCarPosition();
    updateDisplay();
}

// Update car position on screen
function updateCarPosition() {
    car.style.left = `${carPosition.x}%`;
    car.style.top = `${carPosition.y}%`;
    
    // Rotate car based on steering (simplified)
    let rotation = 0;
    if (keysPressed['ArrowLeft']) rotation = -15;
    if (keysPressed['ArrowRight']) rotation = 15;
    car.style.transform = `translateY(-50%) rotate(${rotation}deg)`;
}

// Check for collisions with obstacles
function checkCollisions() {
    for (let obstacle of obstacles) {
        const carLeft = carPosition.x;
        const carRight = carPosition.x + 4; // car width in %
        const carTop = carPosition.y;
        const carBottom = carPosition.y + 2; // car height in %
        
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + 3; // obstacle width in %
        const obstacleTop = obstacle.y;
        const obstacleBottom = obstacle.y + 3; // obstacle height in %
        
        if (carLeft < obstacleRight && 
            carRight > obstacleLeft && 
            carTop < obstacleBottom && 
            carBottom > obstacleTop) {
            
            // Collision detected - slow down and bounce back slightly
            carSpeed = Math.max(carSpeed * 0.5, 0);
            carPosition.y = Math.min(carPosition.y + 5, 95);
            
            // Visual feedback
            car.style.backgroundColor = '#ff3333';
            setTimeout(() => {
                if (gameActive) car.style.backgroundColor = 'linear-gradient(90deg, #ff6b00, #ffa500)';
            }, 200);
            
            break;
        }
    }
}

// Finish the game
function finishGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Update best time if applicable
    if (!bestTime || gameTime < bestTime) {
        bestTime = gameTime;
        localStorage.setItem('racingBestTime', bestTime);
    }
    
    // Show game over modal
    finalTimeElement.textContent = formatTime(gameTime);
    bestTimeElement.textContent = bestTime ? formatTime(bestTime) : '--:--';
    gameOverModal.style.display = 'flex';
}

// Play again
function playAgain() {
    gameOverModal.style.display = 'none';
    resetGame();
    setTimeout(() => startGame(), 500);
}

// Update display elements
function updateDisplay() {
    // Update timer
    timerElement.textContent = formatTime(gameTime);
    
    // Update position (distance to finish)
    const distanceToFinish = Math.max(0, Math.min(100, 100 - (carPosition.y / 95 * 100)));
    positionElement.textContent = `${Math.round(distanceToFinish)}%`;
    
    // Update speed
    speedElement.textContent = `${Math.abs(Math.round(carSpeed * 10))} km/h`;
}

// Format time as MM:SS
function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const tenths = Math.floor((timeInSeconds % 1) * 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

// Load best time from localStorage
function loadBestTime() {
    if (bestTime) {
        bestTime = parseFloat(bestTime);
        bestTimeElement.textContent = formatTime(bestTime);
    }
}

// Show help information
function showHelp() {
    alert(`RACING GAME CONTROLS:
    
• UP ARROW: Accelerate
• DOWN ARROW: Brake/Reverse
• LEFT/RIGHT ARROWS: Steer
• SPACE: Emergency Brake
• R: Reset Game
• P: Pause/Resume Game

GOAL:
Navigate from the START line (green) to the FINISH line (red) while avoiding obstacles.

HOW TO PLAY:
1. Click "Start Game" or press P to begin
2. Use arrow keys to control the car
3. Avoid red obstacles
4. Reach the red FINISH line at the top right
5. Try to beat your best time!

TIP:
The game saves your best time automatically!`);
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // Start the game loop using requestAnimationFrame
    function gameAnimationLoop() {
        gameLoop();
        requestAnimationFrame(gameAnimationLoop);
    }
    gameAnimationLoop();
});

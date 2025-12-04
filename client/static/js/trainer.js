
let currentWord = '';
let startTime = null;
let timerInterval = null;
let isTrainingActive = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Тренажер инициализирован');
    initializeTraining();
});

function initializeTraining() {
    setupEventListeners();
    startTraining();
}

function setupEventListeners() {
    const inputField = document.getElementById('user-input');
    const finishBtn = document.getElementById('finish-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (inputField) {
        inputField.addEventListener('input', handleInput);
        inputField.addEventListener('keydown', handleKeyDown);
        inputField.addEventListener('focus', function() {
            this.select();
        });
    }

    if (finishBtn) {
        finishBtn.addEventListener('click', finishTraining);
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
}

async function startTraining() {
    try {
        showLoading(true);

        const response = await fetch('/get_word');

        if (!response.ok) {
            throw new Error('Ошибка сервера: ' + response.status);
        }

        const data = await response.json();

        if (data.error) {
            showFeedback(data.error, 'error');
            return;
        }

        currentWord = data.word;
        displayWord(currentWord);
        updateProgress(data.progress);
        resetInput();
        startTimer();
        isTrainingActive = true;

        const inputField = document.getElementById('user-input');
        if (inputField) {
            inputField.focus();
        }

    } catch (error) {
        console.error('Ошибка при начале тренировки:', error);
        showFeedback('Ошибка загрузки слова. Попробуйте обновить страницу.', 'error');
    } finally {
        showLoading(false);
    }
}

function handleInput(event) {
    if (!isTrainingActive) return;

    const userInput = event.target.value;
    highlightText(userInput);

    if (userInput.length === currentWord.length) {
        setTimeout(() => checkWord(), 100);
    }
}

function handleKeyDown(event) {
    if (!isTrainingActive) return;

    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        checkWord();
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        resetInput();
    }
}

function highlightText(userInput) {
    const wordDisplay = document.getElementById('word-display');
    if (!wordDisplay) return;

    let highlightedHTML = '';

    for (let i = 0; i < currentWord.length; i++) {
        const currentChar = currentWord[i];
        let charSpan = document.createElement('span');
        charSpan.className = 'char';

        charSpan.textContent = currentChar;

        if (i < userInput.length) {
            if (currentChar === userInput[i]) {
                charSpan.className = 'char correct';
            } else {
                charSpan.className = 'char incorrect';
            }
        } else if (i === userInput.length) {
            charSpan.className = 'char current';
        }

        highlightedHTML += charSpan.outerHTML;
    }

    wordDisplay.innerHTML = highlightedHTML;
}

function startTimer() {
    startTime = new Date();
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;

    const currentTime = new Date();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    const endTime = new Date();
    return startTime ? Math.floor((endTime - startTime) / 1000) : 0;
}

async function checkWord() {
    if (!isTrainingActive) return;

    const userInput = document.getElementById('user-input').value.trim();
    const timeSpent = stopTimer();

    if (!userInput) {
        showFeedback('Введите слово!', 'warning');
        startTimer();
        return;
    }

    try {
        showLoading(true);

        const response = await fetch('/check_word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: userInput,
                time_spent: timeSpent
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка сервера: ' + response.status);
        }
        const result = await response.json();
        getNextWord();

    } catch (error) {
        console.error('Ошибка при проверке слова:', error);
        showFeedback('Ошибка проверки слова. Попробуйте еще раз.', 'error');
        startTimer();
    } finally {
        showLoading(false);
    }
}

async function getNextWord() {
    try {
        const response = await fetch('/get_word');

        if (!response.ok) {
            throw new Error('Ошибка сервера: ' + response.status);
        }

        const data = await response.json();

        if (data.error) {
            finishTraining();
            return;
        }

        currentWord = data.word;
        displayWord(currentWord);
        updateProgress(data.progress);
        resetInput();
        startTimer();

    } catch (error) {
        console.error('Ошибка при получении слова:', error);
        showFeedback('Ошибка загрузки следующего слова.', 'error');
    }
}

function finishTraining() {
    if (!isTrainingActive) return;

    isTrainingActive = false;
    stopTimer();

    const userInput = document.getElementById('user-input').value.trim();
    if (userInput) {
        console.log('Последнее введенное слово:', userInput);
    }

    setTimeout(() => {
        window.location.href = '/results';
    }, 500);
}

function displayWord(word) {
    const wordDisplay = document.getElementById('word-display');
    if (wordDisplay) {
        wordDisplay.textContent = word;
    }
}

function updateProgress(progress) {
    const progressElement = document.getElementById('progress');
    if (progressElement) {
        progressElement.textContent = progress;
    }
}

function resetInput() {
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.value = '';
        inputField.focus();
    }
    displayWord(currentWord);
}

function showFeedback(message, type) {
    const feedbackElement = document.getElementById('feedback');
    if (!feedbackElement) return;

    feedbackElement.textContent = message;
    feedbackElement.className = `feedback feedback-${type}`;
    feedbackElement.style.display = 'block';

    if (type !== 'error') {
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    const inputField = document.getElementById('user-input');

    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }

    if (inputField) {
        inputField.disabled = show;
    }
}

function displayDetailedErrors(errors) {
    console.log('Детали ошибок:', errors);

    let errorDetails = 'Ошибки: ';
    errors.forEach((error, index) => {
        if (error.length_mismatch) {
            errorDetails += `пропущено "${error.correct}"`;
        } else {
            errorDetails += `позиция ${error.position + 1} ("${error.typed}" вместо "${error.correct}")`;
        }
        if (index < errors.length - 1) {
            errorDetails += ', ';
        }
    });

    let errorDetailsElement = document.getElementById('error-details');
    if (!errorDetailsElement) {
        errorDetailsElement = document.createElement('div');
        errorDetailsElement.id = 'error-details';
        errorDetailsElement.className = 'error-details';
        document.querySelector('.container').appendChild(errorDetailsElement);
    }

    errorDetailsElement.textContent = errorDetails;
    errorDetailsElement.style.display = 'block';

    setTimeout(() => {
        errorDetailsElement.style.display = 'none';
    }, 5000);
}

window.addEventListener('beforeunload', function(event) {
    if (isTrainingActive) {
        const confirmationMessage = 'Тренировка еще не завершена. Вы уверены, что хотите уйти?';
        event.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});

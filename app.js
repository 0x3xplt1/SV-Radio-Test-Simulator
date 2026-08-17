// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
};

const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const reviewBtn = document.getElementById('review-btn');
const restartBtn = document.getElementById('restart-btn');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const currentQNum = document.getElementById('current-q-num');
const progressFill = document.getElementById('progress-fill');
const qCategory = document.getElementById('q-category');

const immediateExp = document.getElementById('immediate-explanation');
const immediateExpText = document.getElementById('immediate-explanation-text');

// Theme toggle
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlEl = document.documentElement;

// Initialize theme from localStorage or system preference
let isDark = localStorage.getItem('theme') === 'dark';
if (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark = true;
}
applyTheme();

themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme();
});

function applyTheme() {
    if (isDark) {
        htmlEl.setAttribute('data-theme', 'dark');
        themeIcon.src = 'icons/icons8-night-mode-48-white.png';
    } else {
        htmlEl.setAttribute('data-theme', 'light');
        themeIcon.src = 'icons/icons8-night-mode-48-black.png';
    }
}

// App State
let currentTest = [];
let currentQuestionIndex = 0;
let userAnswers = []; // store { question, selectedOption, isCorrect }
let hasAnsweredCurrent = false;

// Initialize logic
startBtn.addEventListener('click', startNewTest);
nextBtn.addEventListener('click', loadNextQuestion);
restartBtn.addEventListener('click', startNewTest);
reviewBtn.addEventListener('click', () => {
    document.getElementById('review-container').classList.remove('hidden');
    reviewBtn.classList.add('hidden');
});

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startNewTest() {
    // Select 50 A, 30 B, 20 C
    const catA = questionsData.filter(q => q.category === 'A');
    const catB = questionsData.filter(q => q.category === 'B');
    const catC = questionsData.filter(q => q.category === 'C');

    const sampleA = shuffleArray(catA).slice(0, 50);
    const sampleB = shuffleArray(catB).slice(0, 30);
    const sampleC = shuffleArray(catC).slice(0, 20);

    currentTest = shuffleArray([...sampleA, ...sampleB, ...sampleC]);
    currentQuestionIndex = 0;
    userAnswers = [];
    
    document.getElementById('review-container').classList.add('hidden');
    reviewBtn.classList.remove('hidden');

    switchScreen('quiz');
    renderQuestion();
}

const catNames = {
    'A': 'Τεχνικά Θέματα',
    'B': 'Λειτουργικοί Κανόνες',
    'C': 'Νομικό Πλαίσιο'
};

function renderQuestion() {
    hasAnsweredCurrent = false;
    nextBtn.disabled = true;
    immediateExp.classList.add('hidden');
    
    const q = currentTest[currentQuestionIndex];
    currentQNum.textContent = currentQuestionIndex + 1;
    progressFill.style.width = `${((currentQuestionIndex) / 100) * 100}%`;
    qCategory.textContent = catNames[q.category];
    
    questionText.textContent = q.question;
    optionsContainer.innerHTML = '';

    const optionsArray = Object.keys(q.options).map(key => ({
        letter: key,
        text: q.options[key]
    }));
    const shuffledOptions = shuffleArray(optionsArray);

    shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.text;
        btn.onclick = () => selectOption(btn, opt.letter, q.correct, q);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedBtn, selectedLetter, correctLetter, questionObj) {
    if (hasAnsweredCurrent) return; 
    hasAnsweredCurrent = true;

    const isCorrect = selectedLetter === correctLetter;
    
    // Save answer
    userAnswers.push({
        question: questionObj,
        selectedText: questionObj.options[selectedLetter],
        isCorrect: isCorrect
    });

    // Style buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        const isThisBtnCorrect = btn.textContent === questionObj.options[correctLetter];
        
        if (isThisBtnCorrect) {
            btn.classList.add('correct');
        } else if (btn === selectedBtn && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    // Show immediate explanation if wrong
    if (!isCorrect) {
        immediateExpText.innerHTML = `<strong>Σωστή Απάντηση:</strong> ${questionObj.options[correctLetter]}<br><br>${questionObj.explanation}`;
        immediateExp.classList.remove('hidden');
    }

    nextBtn.disabled = false;
    if (currentQuestionIndex === currentTest.length - 1) {
        nextBtn.textContent = 'Ολοκλήρωση';
    } else {
        nextBtn.textContent = 'Επόμενη Ερώτηση';
    }
}

function loadNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentTest.length) {
        renderQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    switchScreen('results');
    
    const score = userAnswers.filter(ans => ans.isCorrect).length;
    document.getElementById('final-score').textContent = score;
    
    const msgEl = document.getElementById('score-message');
    if (score >= 80) {
        msgEl.textContent = "Συγχαρητήρια! Πέρασες!";
        msgEl.className = "pass";
    } else {
        msgEl.textContent = "Δυστυχώς δεν τα κατάφερες.";
        msgEl.className = "fail";
    }

    renderReview();
}

function renderReview() {
    const list = document.getElementById('mistakes-list');
    list.innerHTML = '';
    
    const mistakes = userAnswers.filter(ans => !ans.isCorrect);
    
    if (mistakes.length === 0) {
        list.innerHTML = '<p>Δεν έκανες κανένα λάθος! Άριστα!</p>';
        return;
    }

    mistakes.forEach((mistake, index) => {
        const q = mistake.question;
        const correctText = q.options[q.correct];
        
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
            <div class="review-q">${index + 1}. ${q.question}</div>
            <div class="review-wrong">❌ Η απάντησή σου: ${mistake.selectedText}</div>
            <div class="review-correct">✅ Σωστή απάντηση: ${correctText}</div>
            <div class="review-exp"><strong>Εξήγηση:</strong> ${q.explanation}</div>
        `;
        list.appendChild(div);
    });
}

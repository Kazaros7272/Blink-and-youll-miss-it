// all the functions we have currently :3

let quizData = [];
let currentQuestionIndex = 0;
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const quizSection = document.getElementById('quiz-section');
const questionText = document.getElementById('questionText');
const userAnswerInput = document.getElementById('userAnswer');
const submitAnswerBtn = document.getElementById('submitAnswer');
const correctAnswerContainer = document.getElementById('correctAnswerContainer');
const correctAnswerSpan = document.getElementById('correctAnswer');
const assessmentContainer = document.getElementById('assessmentContainer');
const nextQuestionBtn = document.getElementById('nextQuestion');

let responses = [];

uploadBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
    alert('Please select a CSV file.');
    return;
    }
    if (file.name.slice(-4).toLowerCase() !== '.csv') {
    alert('Only CSV files are allowed.');
    return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
    const text = event.target.result;
    quizData = parseCSV(text); 
    if (quizData.length === 0) {
        alert('No valid questions found.');
        return;
    }
    try {
        localStorage.setItem('quizData', JSON.stringify(quizData));
    } catch (e) {
        console.warn('localStorage not available:', e);
    }
    document.getElementById('upload-section').classList.add('hidden');
    quizSection.classList.remove('hidden');
    showQuestion();
    };
    reader.readAsText(file);
});

function parseCSV(text) {
    const rows = text.split('\n');
    const data = [];
    rows.forEach(row => {
    const trimmedRow = row.trim();
    if (trimmedRow) {
        const columns = trimmedRow.split(',');
        if (columns.length >= 2) {
        const question = columns[0].trim();
        const answer = columns[1].trim();
        data.push({ question, answer });
        }
    }
    });
    return data;
}


function showQuestion() {
    userAnswerInput.value = '';
    correctAnswerContainer.classList.add('hidden');
    correctAnswerSpan.textContent = '';
    assessmentContainer.classList.add('hidden');
    nextQuestionBtn.classList.add('hidden');

    if (currentQuestionIndex < quizData.length) {
    const currentItem = quizData[currentQuestionIndex];
    questionText.textContent = `Question ${currentQuestionIndex + 1}: ${currentItem.question}`;
    userAnswerInput.classList.remove('hidden');
    submitAnswerBtn.classList.remove('hidden');
    } else {
    questionText.textContent = 'Quiz completed!';
    userAnswerInput.classList.add('hidden');
    submitAnswerBtn.classList.add('hidden');
    assessmentContainer.classList.add('hidden');
    nextQuestionBtn.classList.add('hidden');
    }
}

submitAnswerBtn.addEventListener('click', () => {
    const userResponse = userAnswerInput.value.trim();
    const currentItem = quizData[currentQuestionIndex];
    correctAnswerSpan.textContent = currentItem.answer;
    correctAnswerContainer.classList.remove('hidden');
    userAnswerInput.classList.add('hidden');
    submitAnswerBtn.classList.add('hidden');
    assessmentContainer.classList.remove('hidden');
    nextQuestionBtn.classList.remove('hidden');
    responses[currentQuestionIndex] = { userAnswer: userResponse, correctAnswer: currentItem.answer };
});

nextQuestionBtn.addEventListener('click', () => {
    const radioButtons = document.getElementsByName('assessment');
    let assessmentValue = null;
    for (const radio of radioButtons) {
    if (radio.checked) {
        assessmentValue = radio.value;
        break;
    }
    }
    if (!assessmentValue) {
    alert('Please select Pass or Fail before proceeding.');
    return;
    }
    responses[currentQuestionIndex].assessment = assessmentValue;
    radioButtons.forEach(radio => radio.checked = false);

    currentQuestionIndex++;
    showQuestion();
});

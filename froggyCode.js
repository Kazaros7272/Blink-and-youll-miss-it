// all the functions we have currently :3

let quizData = [];
let currentQuestionIndex = 0;
const responses = []; 
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const quizSection = document.getElementById('quiz-section');
const reviewSection = document.getElementById('review-section');
const resultsSection = document.getElementById('results-section');

const questionText = document.getElementById('questionText');
const userAnswerInput = document.getElementById('userAnswer');
const submitAnswerBtn = document.getElementById('submitAnswer');

const reviewContainer = document.getElementById('reviewContainer');
const submitAssessmentsBtn = document.getElementById('submitAssessments');

const resultsContainer = document.getElementById('resultsContainer');

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
  reader.onload = (event) => {
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

/**
 * Parses CSV text where each line has two columns (question, answer) separated by a comma.
 * @param {string} text CSV content as string.
 * @returns {Array} Array of objects with "question" and "answer" keys.
 */
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
  
  if (currentQuestionIndex < quizData.length) {
    const currentItem = quizData[currentQuestionIndex];
    questionText.textContent = `Question ${currentQuestionIndex + 1}: ${currentItem.question}`;
  } else {
    quizSection.classList.add('hidden');
    showReview();
  }
}

submitAnswerBtn.addEventListener('click', () => {
  const userResponse = userAnswerInput.value.trim();
  const currentItem = quizData[currentQuestionIndex];

  responses[currentQuestionIndex] = { 
    question: currentItem.question, 
    userAnswer: userResponse, 
    correctAnswer: currentItem.answer,
    assessment: null
  };
  
  currentQuestionIndex++;
  showQuestion();
});

function showReview() {
  reviewSection.classList.remove('hidden');
  reviewContainer.innerHTML = '';
  
  responses.forEach((response, index) => {
    const container = document.createElement('div');
    container.className = 'question-box';
    container.style.marginBottom = '15px';
    
    const qText = document.createElement('p');
    qText.className = 'question-text';
    qText.textContent = `Question ${index + 1}: ${response.question}`;
    
    const userAnsP = document.createElement('p');
    userAnsP.innerHTML = `<strong>Your Answer:</strong> ${response.userAnswer || '(no answer given)'}`;
    
    const corrAnsP = document.createElement('p');
    corrAnsP.innerHTML = `<strong>Correct Answer:</strong> ${response.correctAnswer}`;
    
    container.appendChild(qText);
    container.appendChild(userAnsP);
    container.appendChild(corrAnsP);
    
    const radioContainer = document.createElement('div');
    radioContainer.className = 'radio-container';
    
    const assessText = document.createElement('p');
    assessText.textContent = "Self-assess:";
    radioContainer.appendChild(assessText);

    const passLabel = document.createElement('label');
    const passInput = document.createElement('input');
    passInput.type = 'radio';
    passInput.name = 'assessment-' + index;
    passInput.value = 'Pass';
    passLabel.appendChild(passInput);
    passLabel.appendChild(document.createTextNode(' Pass'));

    const failLabel = document.createElement('label');
    const failInput = document.createElement('input');
    failInput.type = 'radio';
    failInput.name = 'assessment-' + index;
    failInput.value = 'Fail';
    failLabel.appendChild(failInput);
    failLabel.appendChild(document.createTextNode(' Fail'));
    
    radioContainer.appendChild(passLabel);
    radioContainer.appendChild(failLabel);
    container.appendChild(radioContainer);
    
    reviewContainer.appendChild(container);
  });
}

submitAssessmentsBtn.addEventListener('click', () => {
  for (let i = 0; i < responses.length; i++) {
    const radioGroup = document.getElementsByName('assessment-' + i);
    let assessmentValue = null;
    for (const radio of radioGroup) {
      if (radio.checked) {
        assessmentValue = radio.value;
        break;
      }
    }
    if (!assessmentValue) {
      alert(`Please select Pass or Fail for Question ${i + 1}.`);
      return;
    }
    responses[i].assessment = assessmentValue;
  }

  reviewSection.classList.add('hidden');
  showResults();
});


function showResults() {
  resultsSection.classList.remove('hidden');
  resultsContainer.innerHTML = '';
  
  const totalQuestions = responses.length;
  let numRight = 0;

  responses.forEach(response => {
    if (response.assessment === 'Pass') {
      numRight++;
    }
  });
  
  const numWrong = totalQuestions - numRight;
  const percentRight = totalQuestions > 0 ? Math.round((numRight / totalQuestions) * 100) : 0;
  
  resultsContainer.innerHTML = `
    <p><strong>Total Questions:</strong> ${totalQuestions}</p>
    <p><strong>Questions Right:</strong> ${numRight}</p>
    <p><strong>Questions Wrong:</strong> ${numWrong}</p>
    <p><strong>Percentage Correct:</strong> ${percentRight}%</p>
  `;
}

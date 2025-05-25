let quizData = [];
let currentQuestionIndex = 0;
const responses = [];

const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const reviewSection = document.getElementById('review-section');
const resultsSection = document.getElementById('results-section');

const userAnswerInput = document.getElementById('userAnswer');
const submitAnswerMcqBtn = document.getElementById('submitAnswerMcq');
const submitAnswerLongBtn = document.getElementById('submitAnswerLong');

const reviewContainer = document.getElementById('reviewContainer');
const submitAssessmentsBtn = document.getElementById('submitAssessments');
const resultsContainer = document.getElementById('resultsContainer');

let quizMode = ''; // 'long' or 'mcq'

// Elements for long answer ready-made file selection
const uploadOptionContainer = document.getElementById('uploadOptionContainer');
const ownFileContainer = document.getElementById('ownFileContainer');
const readyMadeContainer = document.getElementById('readyMadeContainer');

// --- Mode Selection ---

document.getElementById('mcqModeBtn').addEventListener('click', () => {
  quizMode = 'mcq';
  document.getElementById('mode-selection').classList.add('hidden');
  document.getElementById('upload-section').classList.remove('hidden');
  // Update instructions for MCQ (only file upload option here)
  document.getElementById('formatInstructions').innerHTML =
    "<strong>MCQ Format:</strong> Question, Answer, Option A, Option B, Option C";
  // Hide the extra long-answer options.
  uploadOptionContainer.classList.add('hidden');
  ownFileContainer.classList.remove('hidden');
  readyMadeContainer.classList.add('hidden');
});

document.getElementById('longAnswerModeBtn').addEventListener('click', () => {
  quizMode = 'long';
  document.getElementById('mode-selection').classList.add('hidden');
  document.getElementById('upload-section').classList.remove('hidden');
  // Update instructions for Long Answer mode.
  document.getElementById('formatInstructions').innerHTML =
    "<strong>Long Answer Format:</strong> Question, Answer";
  // Show the extra long-answer options.
  uploadOptionContainer.classList.remove('hidden');
  ownFileContainer.classList.remove('hidden');
  readyMadeContainer.classList.add('hidden');
});

// Toggle between "Upload your own file" and "Choose a ready-made file" for long answer mode.
document.getElementById('uploadOwn').addEventListener('change', () => {
  ownFileContainer.classList.remove('hidden');
  readyMadeContainer.classList.add('hidden');
});
document.getElementById('readyMade').addEventListener('change', () => {
  ownFileContainer.classList.add('hidden');
  readyMadeContainer.classList.remove('hidden');
});

// --- CSV Load and Parsing ---

// A helper function to process the CSV text regardless of how it was loaded.
function processCSV(text) {
  const parsed = parseCSV(text);
  // Check if file uploaded has a valid structure
  const isValid = parsed.every(row => {
    if (quizMode === 'mcq')
      return row.question && row.answer && Array.isArray(row.options) && row.options.length === 3;
    if (quizMode === 'long')
      return row.question && row.answer;
    return false;
  });
  if (!isValid || parsed.length === 0) {
    alert(
      'Invalid file format. Please check that the file follows the required format and try again.'
    );
    return;
  }
  // Proceed if valid
  quizData = parsed;
  try {
    localStorage.setItem('quizData', JSON.stringify(quizData));
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  document.getElementById('upload-section').classList.add('hidden');
  currentQuestionIndex = 0;
  showQuestion();
}

uploadBtn.addEventListener('click', () => {
  if (quizMode === 'long') {
    // Check which source type is selected.
    const sourceType = document.querySelector('input[name="sourceType"]:checked').value;
    if (sourceType === 'upload') {
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
        processCSV(text);
      };
      reader.readAsText(file);
    } else if (sourceType === 'ready-made') {
      const readyMadeSelect = document.getElementById('readyMadeFileSelect');
      const fileName = readyMadeSelect.value;
      fetch(fileName)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response not ok');
          }
          return response.text();
        })
        .then((text) => {
          processCSV(text);
        })
        .catch((error) => {
          alert('Failed to load the ready-made file: ' + error.message);
        });
    }
  } else if (quizMode === 'mcq') {
    // Only file upload option for MCQ mode.
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
      processCSV(text);
    };
    reader.readAsText(file);
  }
});

function parseCSV(text) {
  const rows = text.trim().split('\n');
  const data = [];
  rows.forEach(row => {
    const cols = row.split(',').map(col => col.trim());
    if (quizMode === 'mcq' && cols.length >= 5) {
      const [question, answer, optionA, optionB, optionC] = cols;
      data.push({ question, answer, options: [optionA, optionB, optionC] });
    } else if (quizMode === 'long' && cols.length >= 2) {
      const [question, answer] = cols;
      data.push({ question, answer });
    }
  });
  return data;
}

// --- Quiz Logic ---

function showQuestion() {
  if (currentQuestionIndex >= quizData.length) {
    // Hide quiz sections and proceed to review.
    document.getElementById('quiz-section-long').classList.add('hidden');
    document.getElementById('quiz-section-mcq').classList.add('hidden');
    showReview();
    return;
  }
  const currentItem = quizData[currentQuestionIndex];
  if (quizMode === 'mcq') {
    // Show MCQ section and hide long answer section.
    document.getElementById('quiz-section-mcq').classList.remove('hidden');
    document.getElementById('quiz-section-long').classList.add('hidden');
    // Set question text.
    document.getElementById('questionTextMcq').textContent = `Question ${
      currentQuestionIndex + 1
    }: ${currentItem.question}`;
    // Create options.
    const mcqContainer = document.getElementById('mcqOptions');
    mcqContainer.innerHTML = '';
    currentItem.options.forEach(opt => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="radio" name="mcq" value="${opt}"> ${opt}`;
      mcqContainer.appendChild(label);
      mcqContainer.appendChild(document.createElement('br'));
    });
  } else if (quizMode === 'long') {
    // Show long answer section and hide MCQ section.
    document.getElementById('quiz-section-long').classList.remove('hidden');
    document.getElementById('quiz-section-mcq').classList.add('hidden');
    // Set question text and clear input.
    document.getElementById('questionTextLong').textContent = `Question ${
      currentQuestionIndex + 1
    }: ${currentItem.question}`;
    userAnswerInput.value = '';
  }
}

submitAnswerMcqBtn.addEventListener('click', () => {
  const selected = document.querySelector('input[name="mcq"]:checked');
  if (!selected) {
    alert('Please select an option before submitting.');
    return;
  }
  const userResponse = selected.value;
  saveAnswerAndNext(userResponse);
});

submitAnswerLongBtn.addEventListener('click', () => {
  const userResponse = userAnswerInput.value.trim();
  if (!userResponse) {
    alert('Please enter an answer before submitting.');
    return;
  }
  saveAnswerAndNext(userResponse);
});

function saveAnswerAndNext(userResponse) {
  const currentItem = quizData[currentQuestionIndex];
  responses[currentQuestionIndex] = {
    question: currentItem.question,
    userAnswer: userResponse || '(no answer given)',
    correctAnswer: currentItem.answer,
    assessment: null
  };
  currentQuestionIndex++;
  showQuestion();
}

function skipCurrentQuestion() {
  if (currentQuestionIndex < quizData.length) {
    const currentItem = quizData[currentQuestionIndex];
    responses[currentQuestionIndex] = {
      question: currentItem.question,
      userAnswer: '(skipped)',
      correctAnswer: currentItem.answer,
      assessment: null
    };
    currentQuestionIndex++;
    showQuestion();
  }
}

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
    userAnsP.innerHTML = `<strong>Your Answer:</strong> ${response.userAnswer}`;

    const corrAnsP = document.createElement('p');
    corrAnsP.innerHTML = `<strong>Correct Answer:</strong> ${response.correctAnswer}`;

    container.appendChild(qText);
    container.appendChild(userAnsP);
    container.appendChild(corrAnsP);

    const radioContainer = document.createElement('div');
    const assessText = document.createElement('p');
    assessText.textContent = 'Self-assess:';
    radioContainer.appendChild(assessText);

    ['Pass', 'Fail'].forEach((value) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `assessment-${index}`;
      input.value = value;
      label.appendChild(input);
      label.append(` ${value}`);
      radioContainer.appendChild(label);
    });

    container.appendChild(radioContainer);
    reviewContainer.appendChild(container);
  });
}

submitAssessmentsBtn.addEventListener('click', () => {
  for (let i = 0; i < responses.length; i++) {
    const radios = document.getElementsByName(`assessment-${i}`);
    let selected = null;
    radios.forEach((radio) => {
      if (radio.checked) selected = radio.value;
    });
    if (!selected) {
      alert(`Please select Pass or Fail for Question ${i + 1}.`);
      return;
    }
    responses[i].assessment = selected;
  }
  reviewSection.classList.add('hidden');
  showResults();
});

function showResults() {
  resultsSection.classList.remove('hidden');
  resultsContainer.innerHTML = '';
  const total = responses.length;
  const correct = responses.filter((r) => r.assessment === 'Pass').length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  resultsContainer.innerHTML = `
    <p><strong>Total Questions:</strong> ${total}</p>
    <p><strong>Questions Right:</strong> ${correct}</p>
    <p><strong>Questions Wrong:</strong> ${total - correct}</p>
    <p><strong>Percentage Correct:</strong> ${percent}%</p>
  `;
}

/*************** Eye Tracker / Blink Detection Section ***************/
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const fpsDisplay = document.getElementById('fps');
const warningDisplay = document.getElementById('warning');
const ctx = canvas.getContext('2d');

/* Blink detection parameters */
const EAR_THRESHOLD = 0.27; // Eye Aspect Ratio threshold
let closedCtr = 0;
let dynamicClosedFrames = 1;

// MediaPipe landmark indices for left and right eyes.
const leftIdx = [362, 385, 387, 263, 373, 380];
const rightIdx = [33, 160, 158, 133, 153, 144];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const computeEAR = (landmarks, idx) =>
  (dist(landmarks[idx[1]], landmarks[idx[5]]) +
    dist(landmarks[idx[2]], landmarks[idx[4]])) /
  (2 * dist(landmarks[idx[0]], landmarks[idx[3]]));

// Set up MediaPipe FaceMesh.
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
faceMesh.onResults((results) => {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    status.textContent = 'No face detected';
    closedCtr = 0;
    return;
  }
  status.textContent = 'Tracking… Blink away!';
  const landmarks = results.multiFaceLandmarks[0];
  const earAvg =
    (computeEAR(landmarks, leftIdx) + computeEAR(landmarks, rightIdx)) / 2;
  if (earAvg < EAR_THRESHOLD) {
    closedCtr++;
  } else {
    if (closedCtr >= dynamicClosedFrames) {
      skipCurrentQuestion();
    }
    closedCtr = 0;
  }
  // Optional drawing onto the canvas.
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f0';
  landmarks.forEach((p) => {
    ctx.fillRect(p.x * canvas.width - 1, p.y * canvas.height - 1, 3, 3);
  });
});

// FPS calculation
let lastTime = performance.now();
let frameCount = 0;
function updateFPS() {
  const now = performance.now();
  frameCount++;
  if (now - lastTime >= 1000) {
    fpsDisplay.textContent = `FPS: ${frameCount}`;
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(updateFPS);
}
updateFPS();

// Start webcam and processing.
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    async function onFrame() {
      await faceMesh.send({ image: video });
      requestAnimationFrame(onFrame);
    }
    onFrame();
  } catch (e) {
    warningDisplay.textContent = 'Error accessing webcam: ' + e.message;
  }
}
startCamera();

// Global variables for quiz data, state, and statistics.
let quizData = [];
let currentQuestionIndex = 0;
const responses = [];
let blinkCount = 0; // Count the number of blinks (skipped questions)
let quizStartTime = null; // Record the timestamp when the first question is shown

// DOM Elements
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

// Elements for file selection options.
const uploadOptionContainer = document.getElementById('uploadOptionContainer');
const ownFileContainer = document.getElementById('ownFileContainer');
const readyMadeContainer = document.getElementById('readyMadeContainer');

let quizMode = ''; // 'long' or 'mcq'


// modal content for introduction
window.addEventListener('load', () => {
  const modal = document.getElementById('introModal');
  const startBtn = document.getElementById('startQuizBtn');

  // only show once per session
  if (!sessionStorage.getItem('introShown')) {
    modal.style.display = 'flex';
    sessionStorage.setItem('introShown', 'true');
  } else {
    modal.style.display = 'none';
  }

  startBtn.addEventListener('click', () => {
    document.getElementById('backToStartBtn').classList.add('hidden');
    modal.style.display = 'none';
  });
});


// --- Mode Selection ---

document.getElementById('mcqModeBtn').addEventListener('click', () => {
  quizMode = 'mcq';
  document.getElementById('mode-selection').classList.add('hidden');
  document.getElementById('upload-section').classList.remove('hidden');
  document.getElementById('backToStartBtn').classList.remove('hidden');
  document.getElementById('formatInstructions').innerHTML =
    "<strong>MCQ Format:</strong> Question, Answer, Option A, Option B, Option C";

  uploadOptionContainer.classList.remove('hidden');
  ownFileContainer.classList.remove('hidden');
  readyMadeContainer.classList.add('hidden');

  // Update ready-made file options with the MCQ question packs.
  const readyMadeSelect = document.getElementById('readyMadeFileSelect');
  readyMadeSelect.innerHTML = '';
  const mcqQuestionPacks = [
    { value: "dataMCQ1.csv", text: "food" },
    { value: "dataMCQ2.csv", text: "science" },
    { value: "dataMCQ3.csv", text: "trivia" },
    { value: "dataMCQ4.csv", text: "general" },
    { value: "dataMCQ5.csv", text: "board games" }
  ];
  mcqQuestionPacks.forEach(pack => {
    const option = document.createElement("option");
    option.value = pack.value;
    option.textContent = pack.text;
    readyMadeSelect.appendChild(option);
  });
});

document.getElementById('longAnswerModeBtn').addEventListener('click', () => {
  quizMode = 'long';
  document.getElementById('mode-selection').classList.add('hidden');
  document.getElementById('upload-section').classList.remove('hidden');
  document.getElementById('backToStartBtn').classList.remove('hidden');
  document.getElementById('formatInstructions').innerHTML =
    "<strong>Long Answer Format:</strong> Question, Answer";
  uploadOptionContainer.classList.remove('hidden');
  ownFileContainer.classList.remove('hidden');
  readyMadeContainer.classList.add('hidden');
  
  // Update ready-made file options with the Long Answer question packs.
  const readyMadeSelect = document.getElementById('readyMadeFileSelect');
  readyMadeSelect.innerHTML = '';
  const longAnswerQuestionPacks = [
    { value: "data1.csv", text: "Geography" },
    { value: "data2.csv", text: "Math" },
    { value: "data3.csv", text: "Greek Mythology" },
    { value: "data4.csv", text: "Blinking" },
    { value: "data5.csv", text: "Computer Science" }
  ];
  longAnswerQuestionPacks.forEach(pack => {
    const option = document.createElement("option");
    option.value = pack.value;
    option.textContent = pack.text;
    readyMadeSelect.appendChild(option);
  });
});

// Toggle between "Upload your own file" and "Choose a ready-made file"
document.getElementById('uploadOwn').addEventListener('change', () => {
  ownFileContainer.classList.remove('hidden');
  readyMadeContainer.classList.add('hidden');
});
document.getElementById('readyMade').addEventListener('change', () => {
  ownFileContainer.classList.add('hidden');
  readyMadeContainer.classList.remove('hidden');
});

// --- CSV Load and Parsing ---

function processCSV(text) {
  const parsed = parseCSV(text);
  const isValid = parsed.every(row => {
    if (quizMode === 'mcq')
      return row.question && row.answer && Array.isArray(row.options) && row.options.length === 3;
    if (quizMode === 'long')
      return row.question && row.answer;
    return false;
  });
  if (!isValid || parsed.length === 0) {
    alert('Invalid file format. Please check that the file follows the required format and try again.');
    return;
  }
  quizData = parsed;
  try {
    localStorage.setItem('quizData', JSON.stringify(quizData));
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  document.getElementById('upload-section').classList.add('hidden');
  currentQuestionIndex = 0;
  // Start quiz timing when first question is shown.
  showQuestion();
}

uploadBtn.addEventListener('click', () => {
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
});

document.getElementById('exitQuizBtn').addEventListener('click', () => {
  // Hide the question section
  document.getElementById('quiz-section-long').classList.add('hidden');
  document.getElementById('quiz-section-mcq').classList.add('hidden');
  // Mark unanswered questions as skipped
  for (let i = currentQuestionIndex; i < quizData.length; i++) {
    const q = quizData[i];
    responses[i] = {
      question: q.question,
      userAnswer: '(skipped)',
      correctAnswer: q.answer,
      assessment: quizMode === 'mcq' ? 'Fail' : null
    };
  }
  currentQuestionIndex = quizData.length; // Mark quiz as done
  showReview(); // Or directly showResults() if you want to skip review
});

function parseCSV(text) {
  const parsed = Papa.parse(text.trim(), { skipEmptyLines: true }).data;
  const data = [];
  parsed.forEach(cols => {
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
  // When the first question is shown, record the start time.
  if (currentQuestionIndex === 0) {
    quizStartTime = Date.now();
  }

  if (currentQuestionIndex >= quizData.length) {
    document.getElementById('quiz-section-long').classList.add('hidden');
    document.getElementById('quiz-section-mcq').classList.add('hidden');
    showReview();
    return;
  }

  const currentItem = quizData[currentQuestionIndex];
  const totalQuestions = quizData.length;

  if (quizMode === 'mcq') {
    document.getElementById('quiz-section-mcq').classList.remove('hidden');
    document.getElementById('quiz-section-long').classList.add('hidden');
    document.getElementById('questionTextMcq').textContent =
      `Question ${currentQuestionIndex + 1} of ${totalQuestions} : ${currentItem.question}`;
    const mcqContainer = document.getElementById('mcqOptions');
    mcqContainer.innerHTML = '';
    currentItem.options.forEach(opt => {
      const optionBox = document.createElement('div');
      optionBox.className = 'mcq-option';
      optionBox.textContent = opt;
      optionBox.dataset.value = opt;

      optionBox.addEventListener('click', () => {
        // Deselect all options.
        document.querySelectorAll('.mcq-option').forEach(el => el.classList.remove('selected'));
        optionBox.classList.add('selected');
      });
      mcqContainer.appendChild(optionBox);
    });

    document.addEventListener('keydown', function mcqEnterListener(e) {
      if (quizMode === 'mcq' && e.key === 'Enter') {
        const selected = document.querySelector('.mcq-option.selected');
        if (selected) {
          e.preventDefault();
          submitAnswerMcqBtn.click();
        }
      }
    });
  } else if (quizMode === 'long') {
    document.getElementById('quiz-section-long').classList.remove('hidden');
    document.getElementById('quiz-section-mcq').classList.add('hidden');
    document.getElementById('questionTextLong').textContent =
      `Question ${currentQuestionIndex + 1} of ${totalQuestions} : ${currentItem.question}`;
    userAnswerInput.value = '';
  }

  document.getElementById('exitQuizBtn').classList.remove('hidden');
}

submitAnswerMcqBtn.addEventListener('click', () => {
  const selected = document.querySelector('.mcq-option.selected');
  if (!selected) {
    alert('Please select an option before submitting.');
    return;
  }
  const userResponse = selected.dataset.value;
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

userAnswerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submit or newlines
    submitAnswerLongBtn.click(); // Simulates button click
  }
});

function saveAnswerAndNext(userResponse) {
  const currentItem = quizData[currentQuestionIndex];
  const isCorrect =
    quizMode === 'mcq' &&
    userResponse.trim().toLowerCase() === currentItem.answer.trim().toLowerCase();

  responses[currentQuestionIndex] = {
    question: currentItem.question,
    userAnswer: userResponse || '(no answer given)',
    correctAnswer: currentItem.answer,
    assessment: quizMode === 'mcq' ? (isCorrect ? 'Pass' : 'Fail') : null
  };

  currentQuestionIndex++;
  showQuestion();
}

// Global variable to guard against multiple rapid skips.
let skipLock = false;

function skipCurrentQuestion() {

  // Prevent multiple invocations if a skip is already in progress.
  if (currentQuestionIndex >= quizData.length || skipLock) return;
  skipLock = true;

  const currentItem = quizData[currentQuestionIndex];
  let answerToSubmit = "(skipped)";

  if (quizMode === 'long') {
    // Capture the user’s partially typed answer immediately.
    const partialAnswer = userAnswerInput.value;
    if (partialAnswer.trim() !== "") {
      answerToSubmit = partialAnswer;
    }
  }
  else if (quizMode === 'mcq') {
    // Try to find the selected MCQ option
    const selected = document.querySelector('.mcq-option.selected');
    if (selected) {
      answerToSubmit = selected.dataset.value;
  }
}

  responses[currentQuestionIndex] = {
    question: currentItem.question,
    userAnswer: answerToSubmit,
    correctAnswer: currentItem.answer,
    assessment: null
  };

  // Increase the blink counter when a question is skipped via blink.
  blinkCount++;
  currentQuestionIndex++;
  showQuestion();

  // Release the lock after 1 second to avoid multiple rapid skips.
  setTimeout(() => {
    skipLock = false;
  }, 1000);
}

function showReview() {
  reviewSection.classList.remove('hidden');
  reviewContainer.innerHTML = '';

  const autoMarkContainer = document.getElementById('autoMarkContainer');
  if (quizMode === 'mcq') {
    autoMarkContainer.classList.remove('hidden');
  } else {
    autoMarkContainer.classList.add('hidden');
  }

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
      const id = `assessment-${index}-${value}`;
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `assessment-${index}`;
      input.id = id;
      input.value = value;

      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.style.marginRight = '10px';
      label.textContent = value;

      radioContainer.appendChild(input);
      radioContainer.appendChild(label);
    });

    container.appendChild(radioContainer);
    reviewContainer.appendChild(container);
  });

  document.getElementById('exitQuizBtn').classList.add('hidden');
}

document.getElementById('autoMarkMcq').addEventListener('click', () => {
  if (quizMode !== 'mcq') return;
  responses.forEach((response, idx) => {
    const userAns = response.userAnswer;
    const correctAns = response.correctAnswer;
    response.assessment = userAns === correctAns ? 'Pass' : 'Fail';
  });
  document.getElementById('autoMarkContainer').classList.add('hidden');
  reviewSection.classList.add('hidden');
  showResults();
});

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

  // Compute the quiz duration based on when the first question was shown.
  const quizDurationMs = (Date.now() - (quizStartTime || Date.now()));
  const quizDurationMinutes = quizDurationMs / 60000;
  const blinksPerMinute = quizDurationMinutes > 0 ? (blinkCount / quizDurationMinutes).toFixed(2) : 0;

  resultsContainer.innerHTML = `<p><strong>Total Questions:</strong> ${total}</p>
  <p><strong>Questions Right:</strong> ${correct}</p>
  <p><strong>Questions Wrong:</strong> ${total - correct}</p>
  <p><strong>Percentage Correct:</strong> ${percent}%</p>
  <p><strong>Total Blinks:</strong> ${blinkCount}</p>
  <p><strong>Blinks Per Minute:</strong> ${blinksPerMinute}</p>`;

  // firework effects for high scorers
  if (percent >= 80) {
    launchFireworks();
  }

  document.getElementById('exitQuizBtn').classList.add('hidden');
}

// fire work effects
function launchFireworks() {
  const duration = 5 * 1000; // 5 seconds
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start from top half of the screen
    confetti(Object.assign({}, defaults, { 
      particleCount, 
      origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
    }));
  }, 250);
}

// Restart Quiz - allow a retake of the same quiz.
document.getElementById('restartQuizBtn').addEventListener('click', () => {
  currentQuestionIndex = 0;
  responses.length = 0;
  resultsSection.classList.add('hidden');
  reviewSection.classList.add('hidden');
  document.getElementById('autoMarkContainer').classList.add('hidden');
  userAnswerInput.value = '';

  // Reset the blink count and the quiz start time.
  blinkCount = 0;
  quizStartTime = null;

  if (quizMode === 'mcq') {
    document.getElementById('quiz-section-mcq').classList.remove('hidden');
    document.getElementById('quiz-section-long').classList.add('hidden');
  } else if (quizMode === 'long') {
    document.getElementById('quiz-section-long').classList.remove('hidden');
    document.getElementById('quiz-section-mcq').classList.add('hidden');
  }
  showQuestion();
});

document.getElementById('backToStartBtn').addEventListener('click', () => {
  // Hide all sections
  document.getElementById('results-section').classList.add('hidden');
  document.getElementById('review-section').classList.add('hidden');
  document.getElementById('quiz-section-long').classList.add('hidden');
  document.getElementById('quiz-section-mcq').classList.add('hidden');
  document.getElementById('autoMarkContainer').classList.add('hidden');
  document.getElementById('upload-section').classList.add('hidden');
  document.getElementById('exitQuizBtn').classList.add('hidden');

  // Reset UI and internal state
  quizMode = '';
  quizData = [];
  responses.length = 0;
  currentQuestionIndex = 0;
  blinkCount = 0;
  quizStartTime = null;
  userAnswerInput.value = '';

  //Reset radio selection to default
  //document.querySelectorAll('input[name="sourceType"]').forEach(el => el.checked = false);
  const radios = document.querySelectorAll('input[name="sourceType"]');
  radios.forEach(radio => {
    radio.checked = (radio.value === 'upload'); // check only the upload option
    radio.dispatchEvent(new Event('change'));  // trigger change event
  });


  // Show start page
  document.getElementById('mode-selection').classList.remove('hidden');
  document.getElementById('backToStartBtn').classList.add('hidden');
});

/* Export results */
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  exportResultsToCSV(responses);
});
document.getElementById('exportPdfBtn').addEventListener('click', () => {
  exportResultsToPDF(responses);
});

function exportResultsToCSV(responses) {
  if (!responses.length) {
    alert("No responses to export!");
    return;
  }
  const headers = ['Question', 'Your Answer', 'Correct Answer', 'Correct'];
  const rows = responses.map(r => [
    `"${r.question.replace(/"/g, '""')}"`,
    `"${r.userAnswer.replace(/"/g, '""')}"`,
    `"${r.correctAnswer.replace(/"/g, '""')}"`,
    r.assessment === 'Pass' ? 'Yes' : 'No'
  ]);
  const totalQuestions = responses.length;
  const totalCorrect = responses.filter(r => r.assessment === 'Pass').length;
  const scorePercent = totalQuestions ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : 0;
  const summaryRows = [
    [],
    ['Total Questions', totalQuestions],
    ['Total Correct', totalCorrect],
    ['Score Percentage (%)', scorePercent]
  ];
  const csvContent =
    headers.join(',') + '\n' +
    rows.map(r => r.join(',')).join('\n') + '\n' +
    summaryRows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quiz_results.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportResultsToPDF(responses) {
  if (!responses.length) {
    alert("No responses to export!");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const marginLeft = 10;
  let y = 10;
  const lineHeight = 8;
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(16);
  doc.text('Quiz Results', marginLeft, y);
  y += 12;
  doc.setFontSize(12);
  responses.forEach((r, index) => {
    const questionText = `${index + 1}. Question: ${r.question}`;
    const questionLines = doc.splitTextToSize(questionText, 180);
    if (y + questionLines.length * lineHeight > pageHeight - 20) {
      doc.addPage();
      y = 10;
    }
    doc.text(questionLines, marginLeft, y);
    y += questionLines.length * lineHeight;
    if (y + 4 * lineHeight > pageHeight - 20) {
      doc.addPage();
      y = 10;
    }
    doc.text(`Your Answer: ${r.userAnswer}`, marginLeft + 5, y);
    y += lineHeight;
    doc.text(`Correct Answer: ${r.correctAnswer}`, marginLeft + 5, y);
    y += lineHeight;
    doc.text(`Correct: ${r.assessment === 'Pass' ? 'Yes' : 'No'}`, marginLeft + 5, y);
    y += lineHeight + 5;
  });
  const totalQuestions = responses.length;
  const totalCorrect = responses.filter(r => r.assessment === 'Pass').length;
  const scorePercent = totalQuestions ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : 0;
  if (y + 4 * lineHeight > pageHeight - 20) {
    doc.addPage();
    y = 10;
  }
  doc.setFontSize(14);
  doc.text('Summary', marginLeft, y);
  y += lineHeight + 5;
  doc.setFontSize(12);
  doc.text(`Total Questions: ${totalQuestions}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Total Correct: ${totalCorrect}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Score Percentage: ${scorePercent}%`, marginLeft, y);
  // Compute blink statistics
  const quizDurationMs = (Date.now() - (quizStartTime || Date.now()));
  const quizDurationMinutes = quizDurationMs / 60000;
  const blinksPerMinute = quizDurationMinutes > 0 ? (blinkCount / quizDurationMinutes).toFixed(2) : 0;
  y += lineHeight;
  doc.text(`Total Blinks: ${blinkCount}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Blinks Per Minute: ${blinksPerMinute}`, marginLeft, y);
  doc.save('quiz_results.pdf');
}

/*************** Eye Tracker / Blink Detection Section ***************/
const video = document.getElementById('video');

function flashBlinkBorder() {
  video.classList.add('blink-registered');
  setTimeout(() => {
    video.classList.remove('blink-registered');
  }, 300);
}

const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const fpsDisplay = document.getElementById('fps');
const warningDisplay = document.getElementById('warning');
const ctx = canvas.getContext('2d');

const EAR_THRESHOLD = 0.27; // Eye Aspect Ratio threshold
let closedCtr = 0;
let dynamicClosedFrames = 1;
const leftIdx = [362, 385, 387, 263, 373, 380];
const rightIdx = [33, 160, 158, 133, 153, 144];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const computeEAR = (landmarks, idx) =>
  (dist(landmarks[idx[1]], landmarks[idx[5]]) +
   dist(landmarks[idx[2]], landmarks[idx[4]])) /
  (2 * dist(landmarks[idx[0]], landmarks[idx[3]]));

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
      flashBlinkBorder();
      skipCurrentQuestion();
    }
    closedCtr = 0;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f0';
  landmarks.forEach((p) => {
    ctx.fillRect(p.x * canvas.width - 1, p.y * canvas.height - 1, 3, 3);
  });
});

// Global variables for FPS averaging:
let lastFrameTime = performance.now();
let fpsSamples = []; // Array to hold FPS samples {time, fps}

// inside your Camera onFrame callback:
const cam = new Camera(video, {
  onFrame: async () => {
    const now = performance.now();
    const delta = now - lastFrameTime;
    const currentFps = 1000 / delta;
    lastFrameTime = now;
    
    // Add the current FPS sample with its timestamp:
    fpsSamples.push({ time: now, fps: currentFps });
    
    // Remove samples older than 10 seconds:
    const tenSecondsAgo = now - 10000;
    fpsSamples = fpsSamples.filter(sample => sample.time >= tenSecondsAgo);
    
    // Calculate the mean FPS over the last 10 seconds:
    const sumFps = fpsSamples.reduce((sum, sample) => sum + sample.fps, 0);
    const meanFps = fpsSamples.length > 0 ? sumFps / fpsSamples.length : 0;
    
    // Display the mean FPS:
    fpsDisplay.textContent = `FPS (10s avg): ${meanFps.toFixed(1)}`;
    
    // Adjust dynamicClosedFrames if needed – using the instantaneous FPS or the mean FPS:
    dynamicClosedFrames = Math.max(1, Math.floor(meanFps * 0.1));
    
    if (meanFps < 8) {
      warningDisplay.textContent = "Warning: Low FPS (<8) -- detections may be inaccurate.";
    } else {
      warningDisplay.textContent = "";
    }
    
    await faceMesh.send({ image: video });
  },
  width: 480,
  height: 360
});
cam.start()
  .then(() => { status.textContent = 'Camera on -- position your face in view'; })
  .catch(e => { status.textContent = 'Camera error: ' + e.message; });

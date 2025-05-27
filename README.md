# Blink and you'll miss it

Kackathon Kings is a fun and simple web application that gamifies answering Long Answer and Multiple Choice Questions (MCQs) by introducing a unique challenge: you must answer each question without blinking! If you blink, the question is skipped, making the quiz experience more engaging and challenging.

## Features

- **Question Type Selection**: Choose between Long Answer or MCQ question modes.
- **Flexible Input**: Upload your own questions or use a preset provided by the site.
- **One-at-a-Time Display**: Questions are presented individually for better focus.
- **Blink Detection**: Uses MediaPipe to detect blinks. Blinking during a question skips it automatically.
- **Self Assessment**: After the quiz, assess your answers manually. MCQs can also be auto-graded.
- **Statistics Dashboard**: View your performance, including blink statistics.
- **Export Results**: Download your results as `.pdf` or `.csv` for later review.

## How It Works

1. **Choose Question Type**: Select either Long Answer or MCQ mode.
2. **Load Questions**: Upload a file or use a preset.
3. **Quiz Session**: Each question is displayed one at a time. Submit your answer without blinking—if you blink, the current question is skipped.
4. **Assessment**: Self-assess your answers after the quiz. MCQs can be assessed automatically.
5. **Statistics & Export**: View your performance statistics and export results as a PDF or CSV file.

## Technology Details

- **Frontend/Backend**: The project is implemented using basic web technologies (HTML, CSS, JavaScript). 
- **Blink Detection**: MediaPipe is used to detect blinks via your webcam.
- **File Upload Format**:
  - **Long Answer**: `Question, Answer`
  - **MCQ**: `Question, Answer, Option 1, Option 2, Option 3`
- **PDF/CSV Export**: Done via JavaScript functions using [jsPDF](https://github.com/parallax/jsPDF) (for PDF) and manual string generation (for CSV).

## Setup & Usage

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kazaros7272/Blink-and-youll-miss-it.git
   cd Kackathon-Kings
   ```
2. **Open the main HTML file in your browser** (no build or server required).
3. **Allow webcam access** for blink detection.
4. **Follow on-screen instructions** to select question type, upload questions or use a preset, and complete the quiz.

## Limitations & Notes

- **No live demo or deployment instructions**—simply run locally by opening the HTML file.
- **Webcam access required** for blink detection.
- **Input file format must match the expected question types** (see above).
- **No user authentication or persistent storage**—all data is local to your session.

## Contributors

- [Kazaros7272](https://github.com/Kazaros7272)
- [redjkh](https://github.com/redjkh)
- [lammyuwuu](https://github.com/lammyuwuu)

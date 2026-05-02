import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectCurrentToken } from '../store/slices/authSlice';
import './ChapterQuiz.css';

const API = 'https://fields-and-waves-visualization-lab.onrender.com';

interface Question {
  _id: string;
  type: 'MCQ' | 'BLANK';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  timeLimitSeconds?: number;   // ← NEW: per-question time contribution
  imageUrl?: string;
  solutionImageUrl?: string;
}

interface UserAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  points: number;
}

interface Quiz {
  _id: string;
  module: string;
  chapter: string;
  questions: Question[];
}

// ─── Randomly pick up to `n` items from an array ───────────
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Build the quiz set: up to 3 easy, 4 medium, 3 hard ────
function selectQuizQuestions(allQuestions: Question[]): Question[] {
  const easy   = allQuestions.filter(q => q.difficulty === 'EASY');
  const medium = allQuestions.filter(q => q.difficulty === 'MEDIUM');
  const hard   = allQuestions.filter(q => q.difficulty === 'HARD');

  const selected = [
    ...pickRandom(easy,   Math.min(3, easy.length)),
    ...pickRandom(medium, Math.min(4, medium.length)),
    ...pickRandom(hard,   Math.min(3, hard.length)),
  ];

  return selected.sort(() => Math.random() - 0.5);
}

// ─── Calculate total quiz time from all selected questions ──
function calcTotalSeconds(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + (q.timeLimitSeconds ?? 120), 0);
}

// ─── Format seconds → mm:ss string ─────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ChapterQuiz = () => {
  const navigate = useNavigate();
  const { moduleName = '', chapterName = '' } = useParams<{ moduleName: string; chapterName: string }>();

  const [rawQuiz, setRawQuiz]           = useState<Quiz | null>(null);
  const [quiz, setQuiz]                 = useState<Quiz | null>(null);
  const [loading, setLoading]           = useState(true);
  const [intro, setIntro]               = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered]         = useState(false);
  const [isCorrect, setIsCorrect]       = useState(false);
  const [skipped, setSkipped]           = useState(false);
  const [score, setScore]               = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults]   = useState(false);
  const [showReview, setShowReview]     = useState(false);
  const [userAnswers, setUserAnswers]   = useState<UserAnswer[]>([]);
  const [submitted, setSubmitted]       = useState(false);
  const [aiTutorAnswers, setAiTutorAnswers] = useState<Record<string, string>>({});
  const [aiTutorLoadingId, setAiTutorLoadingId] = useState<string | null>(null);

  // ── Timer state ─────────────────────────────────────────────
  const [timeLeft, setTimeLeft]         = useState<number>(0);
  const [timerActive, setTimerActive]   = useState(false);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUser = useSelector(selectCurrentUser);
  const token       = useSelector(selectCurrentToken);

  // ── Fetch quiz ───────────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const url =
          !chapterName || chapterName === 'common'
            ? `${API}/api/quizzes/module/${moduleName}/common`
            : `${API}/api/quizzes/module/${moduleName}/chapter/${chapterName}`;

        const res = await axios.get(url);
        const fullQuiz: Quiz = {
          _id:       res.data.data._id,
          module:    res.data.data.module,
          chapter:   res.data.data.chapter,
          questions: res.data.data.questions,
        };

        setRawQuiz(fullQuiz);
        const selectedQuestions = selectQuizQuestions(fullQuiz.questions);
        setQuiz({ ...fullQuiz, questions: selectedQuestions });
      } catch (err) {
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [moduleName, chapterName]);

  // ── submitQuizResult (stable ref via useCallback) ────────────
  const submitQuizResult = useCallback(async (
    finalScore: number,
    finalCorrectCount: number,
    finalUserAnswers: UserAnswer[]
  ) => {
    if (submitted || !currentUser?._id || !quiz?._id) return;
    try {
      await axios.post(
        `${API}/api/quizresult/save`,
        {
          userId:         currentUser._id,
          quizId:         quiz._id,
          score:          finalScore,
          correctAnswers: finalCorrectCount,
          totalQuestions: quiz.questions.length,
          accuracy:       Math.round((finalCorrectCount / quiz.questions.length) * 100),
          module:         quiz.module,
          chapter:        quiz.chapter,
          userAnswers:    finalUserAnswers,
        },
        {
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSubmitted(true);
    } catch (err) {
      console.error('❌ Error submitting quiz result:', err);
    }
  }, [submitted, currentUser, quiz, token]);

  // ── Auto-submit when timer hits 0 ────────────────────────────
  // We need refs to the latest score/correctCount/userAnswers values
  // so the timer callback (which closes over stale state) can read them.
  const scoreRef         = useRef(score);
  const correctCountRef  = useRef(correctCount);
  const userAnswersRef   = useRef(userAnswers);

  useEffect(() => { scoreRef.current        = score;        }, [score]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);
  useEffect(() => { userAnswersRef.current  = userAnswers;  }, [userAnswers]);

  // Start / stop countdown
  useEffect(() => {
    if (!timerActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up → auto-submit with whatever we have right now
          clearInterval(timerRef.current!);
          setTimerActive(false);
          submitQuizResult(
            scoreRef.current,
            correctCountRef.current,
            userAnswersRef.current
          ).then(() => setShowResults(true));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, submitQuizResult]);

  // ── Start quiz (called from intro screen) ────────────────────
  const startQuiz = () => {
    if (!quiz) return;
    const total = calcTotalSeconds(quiz.questions);
    setTimeLeft(total);
    setTimerActive(true);
    setIntro(false);
  };

  const currentQuestion = quiz?.questions[currentIndex];

  const handleOptionSelect = (opt: string) => {
    if (!answered) setSelectedOption(opt);
  };

  const handleCheck = () => {
    if (!selectedOption || !currentQuestion || answered) return;

    const isAnswerCorrect = Array.isArray(currentQuestion.correctAnswer)
      ? currentQuestion.correctAnswer.includes(selectedOption)
      : currentQuestion.correctAnswer === selectedOption;

    setIsCorrect(isAnswerCorrect);
    setAnswered(true);

    const pts = isAnswerCorrect ? currentQuestion.points : 0;
    setScore(prev => prev + pts);
    if (isAnswerCorrect) setCorrectCount(prev => prev + 1);

    setUserAnswers(prev => [...prev, {
      questionId:     currentQuestion._id,
      selectedAnswer: selectedOption,
      isCorrect:      isAnswerCorrect,
      points:         pts,
    }]);
  };

  const handleSkip = () => {
    if (!currentQuestion || answered) return;
    setSkipped(true);
    setAnswered(true);
    setIsCorrect(false);
    setUserAnswers(prev => [...prev, {
      questionId:     currentQuestion._id,
      selectedAnswer: 'SKIPPED',
      isCorrect:      false,
      points:         0,
    }]);
  };

  const handleNext = async () => {
    if (!quiz) return;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= quiz.questions.length) {
      setTimerActive(false);
      await submitQuizResult(score, correctCount, userAnswers);
      setShowResults(true);
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
    setSkipped(false);
  };

  const getCorrectAnswer = (question: Question): string =>
    Array.isArray(question.correctAnswer)
      ? question.correctAnswer[0]
      : question.correctAnswer;

  const askAiTutor = async (question: Question, selectedAnswer: string) => {
    if (!token || !currentUser?._id) {
      alert('Please sign in to use the AI Quiz Tutor.');
      return;
    }

    const answerKey = `${question._id}:${selectedAnswer}`;
    if (aiTutorAnswers[answerKey]) return;

    setAiTutorLoadingId(answerKey);

    try {
      const correctAnswer = getCorrectAnswer(question);
      const response = await fetch(`${API}/api/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: `quiz-tutor-${currentUser._id}`,
          query: `Act as an AI quiz tutor for an electromagnetic fields and waves student.
Module: ${quiz?.module}
Chapter: ${quiz?.chapter}
Difficulty: ${question.difficulty}
Question: ${question.question}
Student answer: ${selectedAnswer}
Correct answer: ${correctAnswer}
Existing explanation: ${question.explanation || 'Not provided'}

Explain why the student's answer is wrong or incomplete, why the correct answer works, and give one quick memory tip. Keep the response clear and concise.`,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setAiTutorAnswers((prev) => ({
        ...prev,
        [answerKey]: data.answer || 'No AI explanation was returned.',
      }));
    } catch (error) {
      console.error('AI tutor error:', error);
      setAiTutorAnswers((prev) => ({
        ...prev,
        [answerKey]: 'AI Tutor is unavailable right now. Please try again in a bit.',
      }));
    } finally {
      setAiTutorLoadingId(null);
    }
  };

  const renderAiTutorPanel = (question: Question, selectedAnswer: string) => {
    const answerKey = `${question._id}:${selectedAnswer}`;
    const aiAnswer = aiTutorAnswers[answerKey];
    const isLoadingTutor = aiTutorLoadingId === answerKey;

    return (
      <div className="ai-tutor-panel">
        <button
          type="button"
          className="ai-tutor-btn"
          onClick={() => askAiTutor(question, selectedAnswer)}
          disabled={isLoadingTutor}
        >
          {isLoadingTutor ? 'AI Tutor is thinking...' : 'Ask AI Tutor'}
        </button>
        {aiAnswer && <div className="ai-tutor-answer">{aiAnswer}</div>}
      </div>
    );
  };

  const getDifficultyCounts = () => {
    if (!quiz) return { easy: 0, medium: 0, hard: 0 };
    return {
      easy:   quiz.questions.filter(q => q.difficulty === 'EASY').length,
      medium: quiz.questions.filter(q => q.difficulty === 'MEDIUM').length,
      hard:   quiz.questions.filter(q => q.difficulty === 'HARD').length,
    };
  };

  // ── Timer colour: green → yellow → red ──────────────────────
  const getTimerClass = (): string => {
    if (!quiz) return '';
    const total = calcTotalSeconds(quiz.questions);
    const pct   = timeLeft / total;
    if (pct > 0.5)  return 'timer-green';
    if (pct > 0.25) return 'timer-yellow';
    return 'timer-red';
  };

  // ── Review screen ────────────────────────────────────────────
  const renderReview = () => {
    if (!quiz) return null;
    const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0);
    const skippedCount = userAnswers.filter(a => a.selectedAnswer === 'SKIPPED').length;

    return (
      <div className="quiz-review">
        <h2>Review Answers</h2>
        <div className="review-summary">
          <p><strong>Score:</strong> {score} / {totalPoints} points</p>
          <p><strong>Correct:</strong> {correctCount} &nbsp;|&nbsp; <strong>Incorrect:</strong> {userAnswers.filter(a => !a.isCorrect && a.selectedAnswer !== 'SKIPPED').length} &nbsp;|&nbsp; <strong>Skipped:</strong> {skippedCount}</p>
        </div>

        {quiz.questions.map((question, i) => {
          const userAnswer  = userAnswers[i];
          const correctAnswer = getCorrectAnswer(question);

          return (
            <div key={question._id} className="review-question">
              <h4>
                Question {i + 1}
                <span className={`review-q-badge ${!userAnswer ? 'badge-skipped' : userAnswer.selectedAnswer === 'SKIPPED' ? 'badge-skipped' : userAnswer.isCorrect ? 'badge-correct' : 'badge-incorrect'}`}>
                  {!userAnswer ? 'Skipped' : userAnswer.selectedAnswer === 'SKIPPED' ? 'Skipped' : userAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
                <span className={`review-diff-tag diff-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
              </h4>

              <p>{question.question}</p>
              {question.imageUrl && <div className="question-image"><img src={question.imageUrl} alt="Question" /></div>}

              {question.type === 'MCQ' && question.options && (
                <div className="review-options">
                  {question.options.map((opt, j) => {
                    const isCorrectOpt  = opt === correctAnswer;
                    const isUserAnswer  = userAnswer?.selectedAnswer === opt;
                    let cls = 'review-option';
                    if (isCorrectOpt)                           cls += ' correct-answer';
                    else if (isUserAnswer && !userAnswer.isCorrect) cls += ' user-incorrect';
                    return (
                      <div key={j} className={cls}>
                        <span className="option-label">{String.fromCharCode(65 + j)}.</span> {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              {userAnswer?.selectedAnswer === 'SKIPPED' && (
                <div className="skipped-indicator">
                  <strong>You skipped this question</strong>
                  <div className="review-option correct-answer" style={{ marginTop: 8 }}>
                    <span className="option-label">✓</span> Correct answer: {correctAnswer}
                  </div>
                </div>
              )}

              <div className={`review-result ${userAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
                <strong>
                  {!userAnswer || userAnswer.selectedAnswer === 'SKIPPED'
                    ? 'Skipped — 0 points'
                    : userAnswer.isCorrect
                    ? `Correct — +${userAnswer.points} points`
                    : `Incorrect — 0 / ${question.points} points`}
                </strong>
              </div>

              {question.explanation && (
                <div className="review-explanation">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
              {userAnswer && !userAnswer.isCorrect && (
                renderAiTutorPanel(question, userAnswer.selectedAnswer)
              )}
              {question.solutionImageUrl && (
                <div className="solution-image"><img src={question.solutionImageUrl} alt="Solution" /></div>
              )}
            </div>
          );
        })}

        <div className="review-buttons">
          <button onClick={() => window.location.reload()}>Reattempt Quiz</button>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  };

  // ── Guards ───────────────────────────────────────────────────
  if (loading || !quiz) return <div className="quiz-loading">Loading quiz...</div>;

  if (quiz.questions.length === 0) {
    return (
      <div className="quiz-intro-page">
        <div className="quiz-intro">
          <h2>No Questions Available</h2>
          <p>This quiz doesn't have enough questions yet. Please check back later.</p>
          <button className="start-btn" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  // ── Intro screen ─────────────────────────────────────────────
  if (intro) {
    const counts     = getDifficultyCounts();
    const totalSecs  = calcTotalSeconds(quiz.questions);
    const totalMins  = Math.ceil(totalSecs / 60);

    return (
      <div className="quiz-intro-page">
        <div className="quiz-intro">
          <h2>
            {chapterName === 'common'
              ? `Course Challenge: ${moduleName.replace(/-/g, ' ').toUpperCase()}`
              : 'Course Challenge'}
          </h2>
          <p className="intro-subtitle">Ready for a challenge?</p>
          <p>Test your knowledge and earn points for what you already know!</p>
          <p>
            <strong>{quiz.questions.length} questions</strong> —{' '}
            {counts.easy   > 0 && <span className="intro-diff easy">{counts.easy} Easy</span>}
            {counts.medium > 0 && <><span style={{ color: '#718096' }}> · </span><span className="intro-diff medium">{counts.medium} Medium</span></>}
            {counts.hard   > 0 && <><span style={{ color: '#718096' }}> · </span><span className="intro-diff hard">{counts.hard} Hard</span></>}
          </p>

          {/* ── Total time display ── */}
          <p className="intro-timer-info">
            ⏱ <strong>Total time:</strong>{' '}
            {totalMins < 60
              ? `${totalMins} minute${totalMins !== 1 ? 's' : ''}`
              : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`}
            {' '}({formatTime(totalSecs)})
          </p>

          <p><em>Note: You get only one attempt per question. The timer starts when you click Let's go.</em></p>
          <button className="start-btn" onClick={startQuiz}>Let's go</button>
        </div>
      </div>
    );
  }

  if (showReview) return renderReview();

  // ── Results screen ───────────────────────────────────────────
  if (showResults) {
    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    return (
      <div className="quiz-results">
        <h2>Quiz Completed! 🎉</h2>
        <div className="results-grid">
          <div className="result-stat">
            <span className="result-stat-value">{score}</span>
            <span className="result-stat-label">Points Scored</span>
          </div>
          <div className="result-stat">
            <span className="result-stat-value">{correctCount}/{quiz.questions.length}</span>
            <span className="result-stat-label">Correct Answers</span>
          </div>
          <div className="result-stat">
            <span className="result-stat-value">{accuracy}%</span>
            <span className="result-stat-label">Accuracy</span>
          </div>
        </div>
        <div className="result-buttons">
          <button onClick={() => setShowReview(true)}>Review Answers</button>
          <button onClick={() => window.location.reload()}>Reattempt</button>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  // ── Quiz question screen ─────────────────────────────────────
  const correctAnswer = getCorrectAnswer(currentQuestion!);

  return (
    <div className="quiz-page">
      {/* ── Small fixed timer badge — top right corner ── */}
      <div className={`quiz-timer-badge ${getTimerClass()}`}>
        <span className="quiz-timer-icon">⏱</span>
        <span className="quiz-timer-value">{formatTime(timeLeft)}</span>
      </div>

      <div className="quiz-container">

        <div className="quiz-card">
          <span className={`q-diff-tag diff-${currentQuestion!.difficulty.toLowerCase()}`}>
            {currentQuestion!.difficulty}
          </span>

          <h3 className="question-text">{currentQuestion?.question}</h3>

          {currentQuestion?.imageUrl && (
            <div className="question-image">
              <img src={currentQuestion.imageUrl} alt="Question" />
            </div>
          )}

          <p className="instruction">Choose 1 answer:</p>

          <div className="options-list">
            {currentQuestion?.options?.map((opt, i) => {
              const isSelected      = selectedOption === opt;
              const isCorrectOption = correctAnswer === opt;

              let className = 'option-item';
              if (answered && isSelected) {
                className += isCorrectOption ? ' correct selected' : ' incorrect selected';
              } else if (answered && isCorrectOption) {
                className += ' correct';
              } else if (isSelected) {
                className += ' selected';
              }

              return (
                <div key={i}>
                  <label className={className}>
                    <input
                      type="radio"
                      name="option"
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(opt)}
                      disabled={answered}
                    />
                    <span className="option-label">{String.fromCharCode(65 + i)}.</span> {opt}
                  </label>
                  {answered && isSelected && (
                    <div className={`explanation ${isCorrectOption ? 'correct' : 'incorrect'}`}>
                      <strong>{isCorrectOption ? 'Correct!' : 'Incorrect.'}</strong>
                      {!isCorrectOption && currentQuestion.explanation && (
                        <span> {currentQuestion.explanation}</span>
                      )}
                    </div>
                  )}
                  {answered && !isSelected && isCorrectOption && (
                    <div className="explanation correct">
                      <strong>This was the correct answer.</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {answered && !isCorrect && currentQuestion && (
            renderAiTutorPanel(currentQuestion, skipped ? 'SKIPPED' : selectedOption || 'Not answered')
          )}

          <div className="quiz-footer">
            <div className="progress">
              {currentIndex + 1} of {quiz.questions.length}
            </div>
            <div className="quiz-actions">
              {!answered && (
                <>
                  <button onClick={handleSkip} className="skip-btn">Skip</button>
                  <button
                    onClick={handleCheck}
                    className="check-btn"
                    disabled={!selectedOption}
                  >
                    Check
                  </button>
                </>
              )}
              {answered && (
                <button onClick={handleNext} className="check-btn">
                  {currentIndex + 1 === quiz.questions.length ? 'Finish' : 'Next'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterQuiz;

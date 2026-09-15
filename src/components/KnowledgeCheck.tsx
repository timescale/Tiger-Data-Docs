'use client';

import React, { useState } from 'react';
import styles from './KnowledgeCheck.module.css';

interface Answer {
  label: string;
  correct: boolean;
}

interface Resource {
  title: string;
  url: string;
  type?: 'docs' | 'blog' | 'external';
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
  explanation: string;
  resources?: Resource[];
}

interface KnowledgeCheckProps {
  questions: Question[];
  title?: string;
}

export const KnowledgeCheck: React.FC<KnowledgeCheckProps> = ({ questions, title = 'Knowledge Check' }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionId = currentQuestion.id;
  const selectedAnswerIndex = selectedAnswers[currentQuestionId];
  const selectedAnswer = selectedAnswerIndex !== undefined ? currentQuestion.answers[selectedAnswerIndex] : null;

  const handleSelectAnswer = (index: number) => {
    if (!showResults) {
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestionId]: index
      }));
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIndex === undefined) {
      alert('Please select an answer');
      return;
    }
    setShowResults(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResults(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsComplete(false);
  };

  const score = Object.keys(selectedAnswers).filter(id => {
    const question = questions.find(q => q.id === id);
    const answerIndex = selectedAnswers[id];
    return question && question.answers[answerIndex]?.correct;
  }).length;

  const incorrectQuestions = questions.filter(q => {
    const answerIndex = selectedAnswers[q.id];
    return answerIndex !== undefined && !q.answers[answerIndex]?.correct;
  });

  const suggestedResources = Array.from(
    new Map(
      incorrectQuestions
        .flatMap(q => (q.resources || []).map(r => ({ ...r, questionText: q.text })))
        .map(r => [r.url, r])
    ).values()
  );

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className={styles.container}>
        <div className={styles.completion}>
          <h3>Quiz Complete! 🎉</h3>
          <div className={styles.scoreDisplay}>
            <div className={styles.scoreCircle}>
              <span className={styles.percentage}>{percentage}%</span>
              <span className={styles.scoreText}>{score}/{questions.length}</span>
            </div>
          </div>
          <p>
            {percentage === 100
              ? 'Perfect score! You\'ve mastered this material.'
              : percentage >= 80
              ? 'Great job! You understand the key concepts.'
              : percentage >= 60
              ? 'Good effort! Consider reviewing the material.'
              : 'Keep learning! Review the module and try again.'}
          </p>

          {suggestedResources.length > 0 && (
            <div className={styles.suggestedResources}>
              <h4>📚 Suggested Reading</h4>
              <p className={styles.suggestionsSubtext}>
                Here are some resources to help you with the concepts you found challenging:
              </p>
              <ul className={styles.resourcesList}>
                {suggestedResources.map((resource, index) => (
                  <li key={`${resource.url}-${index}`}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.resourceLink}
                    >
                      <span className={styles.resourceTitle}>{resource.title}</span>
                      {resource.type && (
                        <span className={`${styles.resourceBadge} ${styles[`badge-${resource.type}`]}`}>
                          {resource.type === 'docs' ? '📖' : resource.type === 'blog' ? '📝' : '🔗'}
                          {' '}{resource.type}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className={styles.button} onClick={handleRestart}>
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <div className={styles.progress}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className={styles.question}>
        <h4>
          {String.fromCharCode(65 + currentQuestionIndex)}. {currentQuestion.text}
        </h4>

        <div className={styles.answers}>
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              className={`${styles.answerButton} ${
                selectedAnswerIndex === index ? styles.selected : ''
              } ${
                showResults && selectedAnswerIndex === index
                  ? answer.correct
                    ? styles.correct
                    : styles.incorrect
                  : ''
              } ${showResults && answer.correct ? styles.correctAnswer : ''}`}
              onClick={() => handleSelectAnswer(index)}
              disabled={showResults}
            >
              <span className={styles.answerLabel}>
                {String.fromCharCode(65 + index)})
              </span>
              <span className={styles.answerText}>{answer.label}</span>
              {showResults && selectedAnswerIndex === index && (
                <span className={styles.icon}>
                  {answer.correct ? '✓' : '✗'}
                </span>
              )}
              {showResults && answer.correct && selectedAnswerIndex !== index && (
                <span className={styles.icon}>✓</span>
              )}
            </button>
          ))}
        </div>

        {showResults && selectedAnswer && (
          <div className={`${styles.explanation} ${selectedAnswer.correct ? styles.correctExplanation : styles.incorrectExplanation}`}>
            <strong>{selectedAnswer.correct ? 'Correct!' : 'Incorrect'}</strong>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        <div className={styles.actions}>
          {!showResults ? (
            <button className={styles.button} onClick={handleSubmitAnswer} disabled={selectedAnswerIndex === undefined}>
              Check Answer
            </button>
          ) : (
            <button className={styles.button} onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

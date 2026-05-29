import { useState } from 'react';
import { Plus, Trash2, Download, Save, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import type { Question, Quiz } from '../types';
import { cn } from '../utils/cn';

export const QuizBuilder = () => {
  const [quiz, setQuiz] = useState<Quiz>({
    quizTitle: '',
    questions: [
      {
        id: crypto.randomUUID(),
        questionText: '',
        timeLimit: 20,
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
      },
    ],
  });

  const addQuestion = () => {
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          questionText: '',
          timeLimit: 20,
          options: ['', '', '', ''],
          correctAnswerIndex: 0,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    if (quiz.questions.length <= 1) return;
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    }));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const validateQuiz = (): string | null => {
    if (!quiz.quizTitle.trim()) return 'Bitte gib einen Titel für dein Quiz ein.';

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.questionText.trim()) return `Frage ${i + 1} hat keinen Text.`;

      const filledOptions = q.options.filter(opt => opt.trim() !== '');
      if (filledOptions.length < 2) return `Frage ${i + 1} benötigt mindestens 2 Antwortmöglichkeiten.`;

      if (q.correctAnswerIndex === -1 || !q.options[q.correctAnswerIndex].trim()) {
        return `Bitte wähle eine gültige korrekte Antwort für Frage ${i + 1}.`;
      }
    }

    return null;
  };

  const exportQuiz = () => {
    const error = validateQuiz();
    if (error) {
      alert(error);
      return;
    }

    // Clean up empty options and remap correct answer index before export
    const cleanQuiz = {
      ...quiz,
      questions: quiz.questions.map(q => {
        const correctText = q.options[q.correctAnswerIndex];
        const cleanOptions = q.options.filter(opt => opt.trim() !== '');
        const newCorrectIndex = cleanOptions.indexOf(correctText);

        return {
          ...q,
          options: cleanOptions,
          correctAnswerIndex: newCorrectIndex
        };
      })
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanQuiz, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${quiz.quizTitle.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quiz-Builder</h1>
          <p className="text-gray-500">Erstelle dein eigenes Quiz und exportiere es als Datei.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addQuestion} className="gap-2">
            <Plus className="w-4 h-4" /> Frage hinzufügen
          </Button>
          <Button onClick={exportQuiz} className="gap-2">
            <Download className="w-4 h-4" /> Quiz exportieren
          </Button>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <Card>
          <Input
            label="Quiz-Titel"
            placeholder="z.B. Allgemeinwissen Klasse 9"
            value={quiz.quizTitle}
            onChange={(e) => setQuiz({ ...quiz, quizTitle: e.target.value })}
          />
        </Card>

        {quiz.questions.map((q, qIndex) => (
          <Card key={q.id} className="relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(qIndex)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Input
                    label={`Frage ${qIndex + 1}`}
                    placeholder="Deine Frage..."
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Zeitlimit (Sek.)"
                    type="number"
                    min="5"
                    max="120"
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(qIndex, { timeLimit: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        label={`Option ${oIndex + 1}`}
                        placeholder={`Antwortmöglichkeit ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => updateQuestion(qIndex, { correctAnswerIndex: oIndex })}
                      className={cn(
                        "h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all",
                        q.correctAnswerIndex === oIndex
                          ? "bg-primary border-primary text-text-dark"
                          : "border-gray-100 text-gray-300 hover:border-primary/50"
                      )}
                      title="Als richtige Antwort markieren"
                    >
                      <Save className={cn("w-5 h-5", q.correctAnswerIndex === oIndex ? "opacity-100" : "opacity-30")} />
                    </button>
                  </div>
                ))}
              </div>

              {q.options.filter(o => o.trim() !== '').length < 2 && (
                <p className="text-xs text-orange-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Mindestens 2 Antworten benötigt.
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pb-12">
        <Button variant="outline" size="lg" onClick={addQuestion} className="gap-2">
          <Plus className="w-5 h-5" /> Weitere Frage hinzufügen
        </Button>
      </div>
    </div>
  );
};

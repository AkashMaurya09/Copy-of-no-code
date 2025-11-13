import React, { useState, useEffect } from 'react';
import { GradingCriteria, GradingQuestion, GradingStep, GradingKeyword, StudentSubmission } from '../types';
import { PlusIcon, TrashIcon } from './icons';
import { GradedQuestionResult } from '../types';

interface ProfessorViewProps {
  gradingCriteria: GradingCriteria | null;
  setGradingCriteria: (criteria: GradingCriteria) => void;
  studentSubmissions: StudentSubmission[];
  gradeSubmission: (submissionIndex: number) => Promise<void>;
  updateGrade: (submissionIndex: number, questionIndex: number, newMarks: number, resolutionComment?: string) => void;
  toggleDispute: (submissionIndex: number, questionIndex: number) => void;
}

const initialQuestionState: GradingQuestion = {
  questionNumber: '',
  maxMarks: 10,
  finalAnswer: '',
  steps: [{ description: '', marks: 0 }],
  keywords: [{ keyword: '', marks: 0 }],
};

const initialCriteriaState: GradingCriteria = {
  examName: 'Calculus Midterm',
  totalMarks: 100,
  questions: [initialQuestionState],
};

const ExamSetup = ({ initialCriteria, onSave }: { initialCriteria: GradingCriteria, onSave: (criteria: GradingCriteria) => void }) => {
  const [criteria, setCriteria] = useState<GradingCriteria>(initialCriteria);

  const handleCriteriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCriteria(prev => ({ ...prev, [name]: name === 'totalMarks' ? parseInt(value) || 0 : value }));
  };

  const handleQuestionChange = <T,>(qIndex: number, field: keyof GradingQuestion, value: T) => {
    setCriteria(prev => {
      const newQuestions = [...prev.questions];
      (newQuestions[qIndex] as any)[field] = value;
      return { ...prev, questions: newQuestions };
    });
  };
  
  const handleNestedChange = (qIndex: number, type: 'steps' | 'keywords', nIndex: number, field: string, value: string | number) => {
    setCriteria(prev => {
      const newQuestions = [...prev.questions];
      const nestedArray = newQuestions[qIndex][type];
      (nestedArray[nIndex] as any)[field] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    setCriteria(prev => ({ ...prev, questions: [...prev.questions, { ...initialQuestionState, questionNumber: `${prev.questions.length + 1}` }] }));
  };
  
  const removeQuestion = (qIndex: number) => {
    setCriteria(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));
  };

  const addNested = (qIndex: number, type: 'steps' | 'keywords') => {
    setCriteria(prev => {
        const newQuestions = [...prev.questions];
        if (type === 'steps') {
            newQuestions[qIndex].steps.push({ description: '', marks: 0 });
        } else {
            newQuestions[qIndex].keywords.push({ keyword: '', marks: 0 });
        }
        return { ...prev, questions: newQuestions };
    });
  };

  const removeNested = (qIndex: number, type: 'steps' | 'keywords', nIndex: number) => {
     setCriteria(prev => {
        const newQuestions = [...prev.questions];
        newQuestions[qIndex][type] = newQuestions[qIndex][type].filter((_, i) => i !== nIndex) as any;
        return { ...prev, questions: newQuestions };
    });
  }


  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Exam Grading Criteria</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="examName" className="block text-sm font-medium text-gray-600 mb-1">Exam Name</label>
            <input type="text" name="examName" value={criteria.examName} onChange={handleCriteriaChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/>
          </div>
          <div>
            <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-600 mb-1">Total Marks</label>
            <input type="number" name="totalMarks" value={criteria.totalMarks} onChange={handleCriteriaChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/>
          </div>
        </div>
        
        {criteria.questions.map((q, qIndex) => (
          <div key={qIndex} className="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">Question {q.questionNumber || qIndex + 1}</h3>
                <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700 transition"><TrashIcon className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Question No. (e.g., 1a)" value={q.questionNumber} onChange={(e) => handleQuestionChange(qIndex, 'questionNumber', e.target.value)} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"/>
                <input type="number" placeholder="Max Marks" value={q.maxMarks} onChange={(e) => handleQuestionChange(qIndex, 'maxMarks', parseInt(e.target.value))} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"/>
            </div>
             <textarea placeholder="Expected final answer or key concepts" value={q.finalAnswer} onChange={(e) => handleQuestionChange(qIndex, 'finalAnswer', e.target.value)} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md h-20 placeholder:text-gray-400"/>

             <div>
                <h4 className="font-medium text-gray-600 mb-2">Step-wise Marking</h4>
                {q.steps.map((step, sIndex) => (
                    <div key={sIndex} className="flex items-center gap-2 mb-2">
                        <input type="text" placeholder="Step description" value={step.description} onChange={(e) => handleNestedChange(qIndex, 'steps', sIndex, 'description', e.target.value)} className="flex-grow bg-white px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"/>
                        <input type="number" placeholder="Marks" value={step.marks} onChange={(e) => handleNestedChange(qIndex, 'steps', sIndex, 'marks', parseInt(e.target.value))} className="w-24 bg-white px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"/>
                        <button onClick={() => removeNested(qIndex, 'steps', sIndex)} className="text-red-500 hover:text-red-600 p-1"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
                <button onClick={() => addNested(qIndex, 'steps')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Step</button>
             </div>
             
             <div>
                <h4 className="font-medium text-gray-600 mb-2">Keyword-based Marking</h4>
                {q.keywords.map((kw, kIndex) => (
                     <div key={kIndex} className="flex items-center gap-2 mb-2">
                        <input type="text" placeholder="Keyword" value={kw.keyword} onChange={(e) => handleNestedChange(qIndex, 'keywords', kIndex, 'keyword', e.target.value)} className="flex-grow bg-white px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"/>
                        <input type="number" placeholder="Marks" value={kw.marks} onChange={(e) => handleNestedChange(qIndex, 'keywords', kIndex, 'marks', parseInt(e.target.value))} className="w-24 bg-white px-3 py-2 border border-gray-300 rounded-md placeholder:text-gray-400"/>
                        <button onClick={() => removeNested(qIndex, 'keywords', kIndex)} className="text-red-500 hover:text-red-600 p-1"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
                <button onClick={() => addNested(qIndex, 'keywords')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Keyword</button>
             </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-4">
          <button onClick={addQuestion} className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition flex items-center gap-2"><PlusIcon className="w-5 h-5" /> Add Question</button>
          <button onClick={() => onSave(criteria)} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm">Save Grading Criteria</button>
        </div>
      </div>
    </div>
  );
};


// FIX: Define a props interface for StudentAnswerCard and type the component as React.FC to correctly handle the 'key' prop.
interface StudentAnswerCardProps {
    answer: GradedQuestionResult & { submissionIndex: number; questionIndex: number; studentName: string; };
    updateGrade: (submissionIndex: number, questionIndex: number, newMarks: number, resolutionComment?: string) => void;
    toggleDispute: (submissionIndex: number, questionIndex: number) => void;
}

const StudentAnswerCard: React.FC<StudentAnswerCardProps> = ({ answer, updateGrade, toggleDispute }) => {
  const [isResolvingDispute, setIsResolvingDispute] = useState<boolean>(false);
  const [resolutionForm, setResolutionForm] = useState({ marks: '', comment: '' });
  
  const handleSimpleGradeChange = (newMarks: string) => {
    updateGrade(answer.submissionIndex, answer.questionIndex, parseInt(newMarks));
  };
    
  const handleReviewDisputeClick = () => {
    setIsResolvingDispute(true);
    setResolutionForm({ marks: String(answer.marksAwarded), comment: '' });
  };

  const handleCancelDispute = () => {
    setIsResolvingDispute(false);
    setResolutionForm({ marks: '', comment: '' });
  };

  const handleResolveDispute = () => {
    updateGrade(answer.submissionIndex, answer.questionIndex, parseInt(resolutionForm.marks), resolutionForm.comment);
    handleCancelDispute();
  };

  return (
    <div className={`p-4 rounded-lg ${answer.isDisputed ? 'bg-yellow-50 border border-yellow-300' : 'bg-white shadow-sm border border-gray-100'}`}>
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-700">{answer.studentName}</h4>
        {!isResolvingDispute && (
            <div className="flex items-center gap-2">
                <input type="number" value={answer.marksAwarded} onChange={e => handleSimpleGradeChange(e.target.value)} className="w-20 bg-white text-right font-bold text-lg p-1 border rounded-md"/>
                <span className="text-gray-500">/ {answer.maxMarks}</span>
            </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-2 italic">Feedback: "{answer.feedback}"</p>
      
      <div className="mt-3 flex justify-between items-end">
        <div>
          {isResolvingDispute ? (
              <div className="p-3 bg-indigo-50 rounded-md space-y-3 border border-indigo-200">
                  <h5 className="font-semibold text-gray-700">Resolve Dispute</h5>
                  <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Override Grade</label>
                      <div className="flex items-center gap-2">
                          <input type="number" value={resolutionForm.marks} onChange={e => setResolutionForm({...resolutionForm, marks: e.target.value})} className="w-20 bg-white text-right font-bold text-lg p-1 border rounded-md" />
                          <span className="text-gray-500">/ {answer.maxMarks}</span>
                      </div>
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Professor's Comment</label>
                      <textarea value={resolutionForm.comment} onChange={e => setResolutionForm({...resolutionForm, comment: e.target.value})} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md h-20 placeholder:text-gray-400" placeholder="Explain the grading decision..."></textarea>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handleResolveDispute} className="px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700">Save Resolution</button>
                      <button onClick={handleCancelDispute} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300">Cancel</button>
                  </div>
              </div>
          ) : answer.isDisputed ? (
                <div className="p-3 bg-yellow-100 rounded-md">
                  <p className="font-semibold text-yellow-800">Dispute Raised by Student</p>
                  <button onClick={handleReviewDisputeClick} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      Review and Resolve
                  </button>
              </div>
          ) : answer.disputeResolutionComment ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-semibold text-green-800">Dispute Resolved</p>
                  <p className="text-sm text-gray-600 mt-1 italic">"{answer.disputeResolutionComment}"</p>
              </div>
          ) : null}
        </div>
        {!isResolvingDispute && (
            <button
                onClick={() => toggleDispute(answer.submissionIndex, answer.questionIndex)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${
                    answer.isDisputed
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
                {answer.isDisputed ? 'Dispute Active' : 'Raise Dispute'}
            </button>
        )}
      </div>
    </div>
  );
};


const QuestionCentricReview = ({ gradingCriteria, submissions, updateGrade, toggleDispute }: {
  gradingCriteria: GradingCriteria;
  submissions: StudentSubmission[];
  updateGrade: (submissionIndex: number, questionIndex: number, newMarks: number, resolutionComment?: string) => void;
  toggleDispute: (submissionIndex: number, questionIndex: number) => void;
}) => {
  
  const questionsWithAnswers = gradingCriteria.questions.map((question) => {
    const studentAnswers = submissions
      .map((sub, subIndex) => {
        if (!sub.gradedResult) return null;
        
        const qResIndex = sub.gradedResult.questions.findIndex(q => q.questionNumber === question.questionNumber);
        if (qResIndex === -1) return null;

        const gradedQuestion = sub.gradedResult.questions[qResIndex];

        return {
          studentName: sub.studentName,
          ...gradedQuestion,
          submissionIndex: subIndex,
          questionIndex: qResIndex,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null); 

    return {
      ...question,
      studentAnswers,
    };
  });

  return (
    <div className="space-y-8">
      {questionsWithAnswers.map((q, index) => (
        <div key={index}>
          <div className="pb-4 border-b border-gray-200 mb-4">
            <h3 className="text-xl font-bold text-gray-800">Question {q.questionNumber}</h3>
            <p className="text-sm text-gray-600">Max Marks: {q.maxMarks}</p>
             <p className="text-sm text-gray-500 mt-1">Expected: "{q.finalAnswer}"</p>
          </div>
          <div className="space-y-4">
            {q.studentAnswers.length > 0 ? (
              q.studentAnswers.map(ans => (
                <StudentAnswerCard key={`${ans.studentName}-${ans.submissionIndex}`} answer={ans} updateGrade={updateGrade} toggleDispute={toggleDispute} />
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No graded answers for this question yet.</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


const SubmissionReview = ({ gradingCriteria, submissions, gradeSubmission, updateGrade, toggleDispute }: { 
    gradingCriteria: GradingCriteria, 
    submissions: StudentSubmission[], 
    gradeSubmission: (submissionIndex: number) => Promise<void>, 
    updateGrade: (submissionIndex: number, questionIndex: number, newMarks: number, resolutionComment?: string) => void,
    toggleDispute: (submissionIndex: number, questionIndex: number) => void;
}) => {
    const [viewMode, setViewMode] = useState<'student' | 'question'>('student');
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [editingDisputeIndex, setEditingDisputeIndex] = useState<number | null>(null);
    const [resolutionForm, setResolutionForm] = useState({ marks: '', comment: '' });

    // Memoize derived lists to prevent re-calculations on every render
    const uniqueStudentNames = React.useMemo(() => 
        Array.from(new Set(submissions.map(s => s.studentName))), 
    [submissions]);

    const submissionsForSelectedStudent = React.useMemo(() => 
        submissions
            .filter(s => s.studentName === selectedStudent)
            .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()),
    [submissions, selectedStudent]);
    
    const selectedSubmission = React.useMemo(() => 
        submissions.find(s => s.id === selectedSubmissionId),
    [submissions, selectedSubmissionId]);

    const selectedSubmissionGlobalIndex = React.useMemo(() =>
        selectedSubmission ? submissions.findIndex(s => s.id === selectedSubmission.id) : -1,
    [submissions, selectedSubmission]);


    const handleSelectStudent = (studentName: string) => {
        setSelectedStudent(studentName);
        setSelectedSubmissionId(null); // Reset submission selection when student changes
        setEditingDisputeIndex(null);
    }

    const handleSelectSubmission = (submissionId: string) => {
        setSelectedSubmissionId(submissionId);
        setEditingDisputeIndex(null);
    }

    const handleGradeClick = async (submissionId: string) => {
        const globalIndex = submissions.findIndex(s => s.id === submissionId);
        if (globalIndex === -1) return;
        setIsLoading(true);
        await gradeSubmission(globalIndex);
        setIsLoading(false);
    }
    
    const handleSimpleGradeChange = (qIndex: number, newMarks: string) => {
        if (selectedSubmissionGlobalIndex !== -1) {
            updateGrade(selectedSubmissionGlobalIndex, qIndex, parseInt(newMarks));
        }
    };
    
    const handleReviewDisputeClick = (qIndex: number, currentMarks: number) => {
        setEditingDisputeIndex(qIndex);
        setResolutionForm({ marks: String(currentMarks), comment: '' });
    };

    const handleCancelDispute = () => {
        setEditingDisputeIndex(null);
        setResolutionForm({ marks: '', comment: '' });
    };

    const handleResolveDispute = (qIndex: number) => {
        if (selectedSubmissionGlobalIndex !== -1) {
            updateGrade(selectedSubmissionGlobalIndex, qIndex, parseInt(resolutionForm.marks), resolutionForm.comment);
            handleCancelDispute();
        }
    };


    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Review Submissions</h2>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                    <button
                        onClick={() => setViewMode('student')}
                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${viewMode === 'student' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        By Student
                    </button>
                    <button
                        onClick={() => setViewMode('question')}
                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${viewMode === 'question' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        By Question
                    </button>
                </div>
            </div>

            {viewMode === 'student' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Student List */}
                    <div className="md:col-span-1">
                        <ul className="space-y-3">
                            {uniqueStudentNames.map((studentName) => (
                                <li key={studentName} onClick={() => handleSelectStudent(studentName)} className={`p-4 rounded-lg cursor-pointer transition border-2 ${selectedStudent === studentName ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                                    <p className="font-semibold text-gray-800">{studentName}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Submission Detail */}
                    <div className="md:col-span-2">
                        {!selectedStudent ? (
                            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-10">
                                <p className="text-gray-500">Select a student to see their submissions.</p>
                            </div>
                        ) : !selectedSubmissionId ? (
                            <div className="h-full">
                                 <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedStudent}'s Submissions</h3>
                                 <ul className="space-y-3">
                                    {submissionsForSelectedStudent.map((sub) => (
                                        <li key={sub.id} onClick={() => handleSelectSubmission(sub.id)} className={`p-4 rounded-lg cursor-pointer transition border-2 bg-white hover:border-indigo-400 hover:bg-indigo-50`}>
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-gray-700">
                                                    Submitted on: {new Date(sub.submissionDate).toLocaleString()}
                                                </p>
                                                {!sub.gradedResult && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleGradeClick(sub.id); }} disabled={isLoading} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 disabled:opacity-50">Grade</button>
                                                )}
                                            </div>
                                             {sub.gradedResult ? (
                                                <p className="text-sm font-medium text-green-600">Graded: {sub.gradedResult.totalMarksAwarded}/{sub.gradedResult.totalMaxMarks}</p>
                                            ) : (
                                                <p className="text-sm text-yellow-600">Pending Grading</p>
                                            )}
                                        </li>
                                    ))}
                                 </ul>
                            </div>
                        ) : selectedSubmission ? (
                            <div className="h-full">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="bg-gray-100 rounded-lg p-2 sticky top-4">
                                        <img src={selectedSubmission.answerSheetUrl} alt={`${selectedSubmission.studentName}'s answer sheet`} className="w-full h-auto rounded-md object-contain"/>
                                    </div>
                                    <div>
                                    {selectedSubmission.gradedResult ? (
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                            {selectedSubmission.gradedResult.questions.map((q, qIndex) => (
                                                <div key={qIndex} className={`p-4 rounded-lg ${q.isDisputed ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-semibold text-gray-700">Q{q.questionNumber}</h4>
                                                        {editingDisputeIndex !== qIndex && (
                                                            <div className="flex items-center gap-2">
                                                                <input type="number" value={q.marksAwarded} onChange={e => handleSimpleGradeChange(qIndex, e.target.value)} className="w-20 bg-white text-right font-bold text-lg p-1 border rounded-md"/>
                                                                <span className="text-gray-500">/ {q.maxMarks}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-2">{q.feedback}</p>
                                                    
                                                    <div className="mt-3 flex justify-between items-end">
                                                        <div>
                                                            {editingDisputeIndex === qIndex ? (
                                                                <div className="p-3 bg-indigo-50 rounded-md space-y-3 border border-indigo-200">
                                                                    <h5 className="font-semibold text-gray-700">Resolve Dispute for Q{q.questionNumber}</h5>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600 block mb-1">Override Grade</label>
                                                                        <div className="flex items-center gap-2">
                                                                            <input type="number" value={resolutionForm.marks} onChange={e => setResolutionForm({...resolutionForm, marks: e.target.value})} className="w-20 bg-white text-right font-bold text-lg p-1 border rounded-md" />
                                                                            <span className="text-gray-500">/ {q.maxMarks}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-sm font-medium text-gray-600 block mb-1">Professor's Comment</label>
                                                                        <textarea value={resolutionForm.comment} onChange={e => setResolutionForm({...resolutionForm, comment: e.target.value})} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md h-20 placeholder:text-gray-400" placeholder="Explain the grading decision..."></textarea>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => handleResolveDispute(qIndex)} className="px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700">Save Resolution</button>
                                                                        <button onClick={handleCancelDispute} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300">Cancel</button>
                                                                    </div>
                                                                </div>
                                                            ) : q.isDisputed ? (
                                                                <div className="p-3 bg-yellow-100 rounded-md">
                                                                    <p className="font-semibold text-yellow-800">Dispute Raised by Student</p>
                                                                    <button onClick={() => handleReviewDisputeClick(qIndex, q.marksAwarded)} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                                                        Review and Resolve
                                                                    </button>
                                                                </div>
                                                            ) : q.disputeResolutionComment ? (
                                                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                                    <p className="font-semibold text-green-800">Dispute Resolved</p>
                                                                    <p className="text-sm text-gray-600 mt-1 italic">"{q.disputeResolutionComment}"</p>
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        {editingDisputeIndex !== qIndex && (
                                                            <button
                                                                onClick={() => toggleDispute(selectedSubmissionGlobalIndex, qIndex)}
                                                                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${
                                                                    q.isDisputed
                                                                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                            >
                                                                {q.isDisputed ? 'Dispute Active' : 'Raise Dispute'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg"><p className="text-gray-500">Not graded yet.</p></div>}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <QuestionCentricReview 
                    gradingCriteria={gradingCriteria} 
                    submissions={submissions} 
                    updateGrade={updateGrade}
                    toggleDispute={toggleDispute}
                />
            )}
        </div>
    );
};


export const ProfessorView: React.FC<ProfessorViewProps> = ({ gradingCriteria, setGradingCriteria, studentSubmissions, gradeSubmission, updateGrade, toggleDispute }) => {
    const [isEditingCriteria, setIsEditingCriteria] = useState(!gradingCriteria);

    useEffect(() => {
        setIsEditingCriteria(!gradingCriteria);
    }, [gradingCriteria]);

    const handleSave = (criteria: GradingCriteria) => {
        setGradingCriteria(criteria);
        setIsEditingCriteria(false);
    }

    return (
        <div>
            {isEditingCriteria || !gradingCriteria ? (
                 <ExamSetup 
                    initialCriteria={gradingCriteria || initialCriteriaState} 
                    onSave={handleSave} 
                />
            ) : (
                <>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{gradingCriteria.examName}</h2>
                                <p className="text-gray-600">Total Marks: {gradingCriteria.totalMarks}</p>
                            </div>
                            <button 
                                onClick={() => setIsEditingCriteria(true)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50"
                            >
                                Edit Criteria
                            </button>
                        </div>
                    </div>
                    <SubmissionReview 
                        gradingCriteria={gradingCriteria} 
                        submissions={studentSubmissions} 
                        gradeSubmission={gradeSubmission} 
                        updateGrade={updateGrade}
                        toggleDispute={toggleDispute}
                    />
                </>
            )}
        </div>
    );
};
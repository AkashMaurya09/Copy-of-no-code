import React, { useState, useCallback } from 'react';
import { StudentSubmission, GradedResult, GradedQuestionResult, GradingQuestion, GradingCriteria } from '../types';
import { UploadIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon, AlertTriangleIcon } from './icons';

interface StudentViewProps {
  submissions: StudentSubmission[];
  onUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  toggleDispute: (submissionId: string, questionIndex: number) => void;
  gradingCriteria: GradingCriteria | null;
}

const AnswerSheetUpload = ({ onUpload, isLoading }: { onUpload: (file: File) => void, isLoading: boolean }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (file) {
      onUpload(file);
      setFile(null); // Reset file input after upload
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Submit Your Answer Sheet</h2>
      <p className="text-gray-500 mb-6">Upload a clear image of your completed exam paper to begin the grading process.</p>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
        <label htmlFor="file-upload" className="cursor-pointer">
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-indigo-600 font-semibold">{file ? file.name : 'Click to select a file'}</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
        </label>
      </div>
      <button 
        onClick={handleUploadClick} 
        disabled={!file || isLoading}
        className="mt-6 w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-all shadow-md"
      >
        {isLoading ? 'Grading in Progress...' : 'Submit and Grade'}
      </button>
    </div>
  );
};

const GradedResultDisplay = ({ submissionId, result, toggleDispute, gradingCriteria }: { submissionId: string, result: GradedResult, toggleDispute: (submissionId: string, questionIndex: number) => void, gradingCriteria: GradingCriteria | null }) => {
    const scorePercentage = (result.totalMarksAwarded / result.totalMaxMarks) * 100;
    
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-500';
        if (percentage >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b">
                <h2 className="text-3xl font-bold text-gray-800">Results</h2>
                <div className="text-center mt-4 md:mt-0">
                    <p className="text-sm text-gray-500">Total Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(scorePercentage)}`}>
                        {result.totalMarksAwarded} <span className="text-2xl text-gray-400">/ {result.totalMaxMarks}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {result.questions.map((q, index) => {
                    const originalQuestion = gradingCriteria?.questions.find(ogQ => ogQ.questionNumber === q.questionNumber);
                    return <QuestionResult 
                        key={index} 
                        question={q} 
                        onDispute={() => toggleDispute(submissionId, index)} 
                        rubric={originalQuestion || null}
                    />
                })}
            </div>
        </div>
    );
};

interface QuestionResultProps {
  question: GradedQuestionResult;
  onDispute: () => void;
  rubric: GradingQuestion | null;
}

const QuestionResult: React.FC<QuestionResultProps> = ({ question, onDispute, rubric }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'rubric'>('feedback');
  
  const isCorrect = question.marksAwarded === question.maxMarks;
  const isPartial = question.marksAwarded > 0 && question.marksAwarded < question.maxMarks;
  
  const getIcon = () => {
      if (isCorrect) return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      if (isPartial) return <MinusCircleIcon className="w-6 h-6 text-yellow-500" />;
      return <XCircleIcon className="w-6 h-6 text-red-500" />;
  };

  return (
    <div className={`p-5 rounded-xl transition-all duration-300 ${question.isDisputed ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'} ${isExpanded ? 'shadow-md' : ''}`}>
        <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-3">
                {getIcon()}
                <h3 className="text-lg font-semibold text-gray-800">Question {question.questionNumber}</h3>
            </div>
             <div className="flex items-center gap-4">
                <div className="text-lg font-bold text-gray-700 text-right">
                    {question.marksAwarded} <span className="text-gray-400 font-medium">/ {question.maxMarks}</span>
                </div>
                <svg className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
        
        {isExpanded && (
        <div className="ml-9 mt-4 pt-4 border-t border-gray-200 animate-fade-in-down">
          <div className="flex border-b border-gray-200 mb-4">
            <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'feedback' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Detailed Feedback
            </button>
            <button onClick={() => setActiveTab('rubric')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'rubric' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Grading Rubric
            </button>
          </div>

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div>
                  <h4 className="font-semibold text-sm text-gray-600">Overall Feedback</h4>
                  <p className="text-gray-700">{question.feedback}</p>
              </div>
              
              {question.steps && question.steps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Step-by-Step Breakdown</h4>
                  <ul className="space-y-2">
                    {question.steps.map(step => (
                      <li key={step.step} className="flex items-start gap-3">
                        {step.correct ? <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/> : <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>}
                        <div className="flex-grow">
                          <p className="text-gray-700">{step.description}</p>
                          <p className="text-xs text-gray-500">Marks awarded: {step.marks}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.keywordsFound && question.keywordsFound.length > 0 && (
                  <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-2">Keywords Identified</h4>
                      <div className="flex flex-wrap gap-2">
                          {question.keywordsFound.map(kw => (
                              <span key={kw} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">{kw}</span>
                          ))}
                      </div>
                  </div>
              )}

              <div>
                  <h4 className="font-semibold text-sm text-gray-600">Area for Improvement</h4>
                  <p className="text-gray-700 font-medium text-indigo-700">{question.areaForImprovement}</p>
              </div>
            </div>
          )}

          {activeTab === 'rubric' && (
             <div>
                {rubric ? (
                   <div className="space-y-4">
                     <div>
                       <h4 className="font-semibold text-sm text-gray-600">Expected Answer / Concepts</h4>
                       <p className="text-gray-700 italic">"{rubric.finalAnswer}"</p>
                     </div>
                     {rubric.steps && rubric.steps.length > 0 && (
                       <div>
                         <h4 className="font-semibold text-sm text-gray-600 mb-2">Step-wise Rubric</h4>
                         <ul className="divide-y divide-gray-200">
                           {rubric.steps.map((step, i) => (
                             <li key={i} className="flex justify-between py-2">
                               <span className="text-gray-700">{step.description}</span>
                               <span className="font-medium text-gray-600">{step.marks} marks</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                     {rubric.keywords && rubric.keywords.length > 0 && (
                        <div>
                           <h4 className="font-semibold text-sm text-gray-600 mb-2">Keyword Rubric</h4>
                           <ul className="divide-y divide-gray-200">
                           {rubric.keywords.map((kw, i) => (
                             <li key={i} className="flex justify-between py-2">
                               <span className="text-gray-700">Keyword: "{kw.keyword}"</span>
                               <span className="font-medium text-gray-600">{kw.marks} marks</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                ) : (
                  <p className="text-gray-500">Grading rubric for this question could not be loaded.</p>
                )}
             </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button 
                onClick={onDispute}
                className={`text-sm font-medium flex items-center gap-2 transition ${question.isDisputed ? 'text-yellow-700' : 'text-gray-500 hover:text-gray-800'}`}
             >
                <AlertTriangleIcon className="w-4 h-4"/>
                {question.isDisputed ? 'Dispute Raised' : 'Raise a Dispute'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// FIX: Define a props interface for SubmissionHistoryItem and type the component as React.FC to correctly handle the 'key' prop.
interface SubmissionHistoryItemProps {
    submission: StudentSubmission;
    toggleDispute: (submissionId: string, questionIndex: number) => void;
    gradingCriteria: GradingCriteria | null;
}

const SubmissionHistoryItem: React.FC<SubmissionHistoryItemProps> = ({ submission, toggleDispute, gradingCriteria }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`rounded-2xl border ${isExpanded ? 'bg-white shadow-md' : 'bg-gray-50'}`}>
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">
                        Submitted: {new Date(submission.submissionDate).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4">
                        {submission.gradedResult && (
                             <p className="font-bold text-lg text-gray-700">
                                {submission.gradedResult.totalMarksAwarded}
                                <span className="text-base text-gray-400 font-medium"> / {submission.gradedResult.totalMaxMarks}</span>
                             </p>
                        )}
                        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
            {isExpanded && submission.gradedResult && (
                <div className="p-4 border-t border-gray-200 animate-fade-in-down">
                    <GradedResultDisplay submissionId={submission.id} result={submission.gradedResult} toggleDispute={toggleDispute} gradingCriteria={gradingCriteria}/>
                </div>
            )}
            {isExpanded && !submission.gradedResult && (
                 <div className="p-6 text-center border-t border-gray-200">
                    <p className="text-gray-500">This submission has not been graded yet.</p>
                </div>
            )}
        </div>
    )
}

export const StudentView: React.FC<StudentViewProps> = ({ submissions, onUpload, isLoading, error, toggleDispute, gradingCriteria }) => {
  // Sort submissions by date, newest first
  const sortedSubmissions = [...submissions].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

  return (
    <div className="w-full space-y-8">
        <AnswerSheetUpload onUpload={onUpload} isLoading={isLoading} />
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        {isLoading && (
            <div className="mt-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Gemini is grading your paper. This may take a moment...</p>
            </div>
        )}
        
        {sortedSubmissions.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Submission History</h2>
                <div className="space-y-4">
                    {sortedSubmissions.map(sub => (
                        <SubmissionHistoryItem 
                            key={sub.id}
                            submission={sub}
                            toggleDispute={toggleDispute}
                            gradingCriteria={gradingCriteria}
                        />
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
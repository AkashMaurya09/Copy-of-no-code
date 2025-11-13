import React, { useState, useEffect } from 'react';
import { Role, GradingCriteria, StudentSubmission, GradedResult } from './types';
import { ProfessorView } from './components/ProfessorView';
import { StudentView } from './components/StudentView';
import { gradeAnswerSheet, fileToBase64 } from './services/geminiService';
import { saveState, loadState } from './services/storageService';


const App: React.FC = () => {
    const [role, setRole] = useState<Role>(Role.PROFESSOR);
    const [gradingCriteria, setGradingCriteria] = useState<GradingCriteria | null>(null);
    const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load state from storage on initial render
    useEffect(() => {
        const loadedState = loadState();
        if (loadedState) {
            setGradingCriteria(loadedState.gradingCriteria);
            setStudentSubmissions(loadedState.studentSubmissions);
        }
    }, []);

    // Save state to storage whenever it changes
    useEffect(() => {
        // We only save if there's something to save to avoid overwriting with initial state
        if (gradingCriteria || studentSubmissions.length > 0) {
            saveState({ gradingCriteria, studentSubmissions });
        }
    }, [gradingCriteria, studentSubmissions]);

    const handleGradingCriteriaSave = (criteria: GradingCriteria) => {
        setGradingCriteria(criteria);
        // Add some default submissions if none exist for demo purposes
        if(studentSubmissions.length === 0) {
             setStudentSubmissions([
                {
                    id: 'sub-alice-1',
                    studentName: 'Alice Johnson',
                    submissionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
                    answerSheetUrl: 'https://picsum.photos/seed/alice1/800/1100',
                    answerSheetBase64: '',
                    gradedResult: null // Example of an ungraded submission
                },
                 {
                    id: 'sub-alice-2',
                    studentName: 'Alice Johnson',
                    submissionDate: new Date(Date.now() - 86400000).toISOString(),
                    answerSheetUrl: 'https://picsum.photos/seed/alice2/800/1100',
                    answerSheetBase64: '',
                    gradedResult: { // Example of a graded submission
                        totalMarksAwarded: 78,
                        totalMaxMarks: 100,
                        questions: [
                            { questionNumber: "1", marksAwarded: 8, maxMarks: 10, feedback: "Good start, but missed a key concept.", steps: [], keywordsFound: ["calculus"], areaForImprovement: "Review integration by parts.", isDisputed: true },
                            { questionNumber: "2", marksAwarded: 70, maxMarks: 90, feedback: "Well done.", steps: [], keywordsFound: [], areaForImprovement: "None.", isDisputed: false }
                        ]
                    }
                },
                {
                    id: 'sub-bob-1',
                    studentName: 'Bob Williams',
                    submissionDate: new Date().toISOString(),
                    answerSheetUrl: 'https://picsum.photos/seed/bob/800/1100',
                    answerSheetBase64: '',
                    gradedResult: null
                }
            ]);
        }
    };

    const handleGradeSubmission = async (submissionIndex: number) => {
        if (!gradingCriteria) {
            alert("Please set up the grading criteria first.");
            return;
        }
        
        const fakeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        
        try {
            const result = await gradeAnswerSheet(fakeBase64, 'image/png', gradingCriteria);
            
            setStudentSubmissions(prev =>
                prev.map((sub, index) =>
                    index === submissionIndex ? { ...sub, gradedResult: result } : sub
                )
            );
        } catch (e) {
            console.error(e);
            alert((e as Error).message);
        }
    };
    
    const handleUpdateGrade = (submissionIndex: number, questionIndex: number, newMarks: number, resolutionComment?: string) => {
        setStudentSubmissions(prev => {
            const newSubmissions = [...prev];
            const submission = newSubmissions[submissionIndex];
            if (submission && submission.gradedResult) {
                const newQuestions = JSON.parse(JSON.stringify(submission.gradedResult.questions));
                const questionToUpdate = newQuestions[questionIndex];
                
                questionToUpdate.marksAwarded = newMarks;

                if (typeof resolutionComment === 'string') {
                    questionToUpdate.isDisputed = false; 
                    questionToUpdate.disputeResolutionComment = resolutionComment;
                }
                
                const newTotal = newQuestions.reduce((acc: number, q: { marksAwarded: number; }) => acc + q.marksAwarded, 0);
                submission.gradedResult.questions = newQuestions;
                submission.gradedResult.totalMarksAwarded = newTotal;
            }
            return newSubmissions;
        });
    };


    const handleStudentUpload = async (file: File) => {
        if (!gradingCriteria) {
            setError("The professor has not set up the grading criteria yet. Please wait.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const base64 = await fileToBase64(file);
            const result = await gradeAnswerSheet(base64, file.type, gradingCriteria);
            
            const newSubmission: StudentSubmission = {
                id: `sub-${Date.now()}`,
                studentName: 'Current Student',
                submissionDate: new Date().toISOString(),
                answerSheetUrl: URL.createObjectURL(file),
                answerSheetBase64: base64,
                gradedResult: result
            };
            setStudentSubmissions(prev => [...prev, newSubmission]);

        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentToggleDispute = (submissionId: string, questionIndex: number) => {
        setStudentSubmissions(prev =>
            prev.map(sub => {
                if (sub.id === submissionId && sub.gradedResult) {
                    const newGradedResult = { ...sub.gradedResult };
                    const newQuestions = [...newGradedResult.questions];
                    const currentDisputeState = newQuestions[questionIndex].isDisputed;
                    newQuestions[questionIndex] = {
                        ...newQuestions[questionIndex],
                        isDisputed: !currentDisputeState,
                    };
                     if (!currentDisputeState) { // If student is raising a dispute
                        delete newQuestions[questionIndex].disputeResolutionComment;
                    }
                    newGradedResult.questions = newQuestions;
                    return { ...sub, gradedResult: newGradedResult };
                }
                return sub;
            })
        );
    };

    
    const handleProfessorToggleDispute = (submissionIndex: number, questionIndex: number) => {
        setStudentSubmissions(prev => 
            prev.map((sub, sIndex) => {
                if (sIndex !== submissionIndex || !sub.gradedResult) {
                    return sub;
                }
    
                const newQuestions = sub.gradedResult.questions.map((q, qIndex) => {
                    if (qIndex !== questionIndex) {
                        return q;
                    }
                    const newQuestion = {...q, isDisputed: !q.isDisputed};
                    // If professor raises a dispute, clear any old resolution comment
                    if (newQuestion.isDisputed) {
                        delete newQuestion.disputeResolutionComment;
                    }
                    return newQuestion;
                });
    
                return {
                    ...sub,
                    gradedResult: {
                        ...sub.gradedResult,
                        questions: newQuestions,
                    },
                };
            })
        );
    };


    return (
        <div className="bg-indigo-50 min-h-screen text-gray-900">
            <header className="bg-white shadow-sm">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h1 className="text-2xl font-bold text-gray-800">Gemini Auto-Grader</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
                        <button
                            onClick={() => setRole(Role.PROFESSOR)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${role === Role.PROFESSOR ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Professor
                        </button>
                        <button
                            onClick={() => setRole(Role.STUDENT)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${role === Role.STUDENT ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Student
                        </button>
                    </div>
                </nav>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    {role === Role.PROFESSOR ? (
                        <ProfessorView 
                            gradingCriteria={gradingCriteria} 
                            setGradingCriteria={handleGradingCriteriaSave}
                            studentSubmissions={studentSubmissions}
                            gradeSubmission={handleGradeSubmission}
                            updateGrade={handleUpdateGrade}
                            toggleDispute={handleProfessorToggleDispute}
                        />
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            <StudentView 
                                submissions={studentSubmissions.filter(s => s.studentName === 'Current Student')}
                                onUpload={handleStudentUpload}
                                isLoading={isLoading}
                                error={error}
                                toggleDispute={handleStudentToggleDispute}
                                gradingCriteria={gradingCriteria}
                             />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
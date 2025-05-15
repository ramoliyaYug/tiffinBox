// Mock data for the application

export const mockExams = [
    {
        id: "exam1",
        name: "Introduction to Computer Science",
        duration: 60, // minutes
        questionCount: 20,
        completed: false,
    },
    {
        id: "exam2",
        name: "Data Structures and Algorithms",
        duration: 90,
        questionCount: 25,
        completed: false,
    },
    {
        id: "exam3",
        name: "Web Development Basics",
        duration: 45,
        questionCount: 15,
        completed: true,
        score: "85%",
        completedDate: "2025-04-20",
    },
]

export const mockStudents = [
    {
        id: "student1",
        name: "John Doe",
        status: "active",
        warnings: 0,
        timeLeft: 45,
    },
    {
        id: "student2",
        name: "Jane Smith",
        status: "warning",
        warnings: 1,
        timeLeft: 38,
    },
    {
        id: "student3",
        name: "Bob Johnson",
        status: "active",
        warnings: 0,
        timeLeft: 42,
    },
    {
        id: "student4",
        name: "Alice Brown",
        status: "warning",
        warnings: 2,
        timeLeft: 30,
    },
    {
        id: "student5",
        name: "Charlie Wilson",
        status: "active",
        warnings: 0,
        timeLeft: 40,
    },
]

export const mockQuestions = [
    {
        id: "q1",
        examId: "exam1",
        text: "What does CPU stand for?",
        options: ["Central Processing Unit", "Computer Personal Unit", "Central Process Utility", "Central Processor Unit"],
        correctAnswer: 0,
    },
    {
        id: "q2",
        examId: "exam1",
        text: "Which of the following is not a programming language?",
        options: ["Java", "Python", "HTML", "Microsoft Word"],
        correctAnswer: 3,
    },
    {
        id: "q3",
        examId: "exam1",
        text: "What is the binary representation of the decimal number 10?",
        options: ["1010", "1000", "1100", "1001"],
        correctAnswer: 0,
    },
    {
        id: "q4",
        examId: "exam2",
        text: "Which data structure operates on a LIFO principle?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        correctAnswer: 1,
    },
    {
        id: "q5",
        examId: "exam2",
        text: "What is the time complexity of binary search?",
        options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"],
        correctAnswer: 2,
    },
]

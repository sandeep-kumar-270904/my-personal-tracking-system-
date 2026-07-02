const mongoose = require('mongoose');
require('dotenv').config();
const Resource = require('./models/Resource');
const connectDB = require('./config/db');

const defaultResources = [
  // Web Dev
  { title: 'Roadmap.sh', category: 'Web Dev', url: 'https://roadmap.sh/', description: 'Step by step guides and paths to learn different tools or technologies.', icon: 'Monitor', difficulty: 'Beginner' },
  { title: 'Frontend Masters', category: 'Web Dev', url: 'https://frontendmasters.com/', description: 'In-depth, advanced courses on JavaScript, React, CSS, and modern web architectures.', icon: 'Monitor', difficulty: 'Advanced' },
  { title: 'FreeCodeCamp Responsive Web Design', category: 'Web Dev', url: 'https://www.freecodecamp.org/learn/responsive-web-design/', description: 'The best place to start learning HTML and CSS from scratch for free.', icon: 'Monitor', difficulty: 'Beginner' },
  { title: 'Full Stack Open', category: 'Web Dev', url: 'https://fullstackopen.com/en/', description: 'Deep dive into modern web development with React, Redux, Node.js, MongoDB, and GraphQL.', icon: 'Monitor', difficulty: 'Intermediate' },
  { title: 'JavaScript30', category: 'Web Dev', url: 'https://javascript30.com/', description: 'Build 30 things in 30 days with vanilla JS. No frameworks, no compilers, no boilerplate.', icon: 'Monitor', difficulty: 'Beginner' },

  // Official Docs
  { title: 'React Documentation', category: 'Official Docs', url: 'https://react.dev/', description: 'The official documentation for React. Excellent for learning hooks and modern patterns.', icon: 'BookOpen', difficulty: 'Beginner' },
  { title: 'MDN Web Docs', category: 'Official Docs', url: 'https://developer.mozilla.org/', description: 'The gold standard reference for HTML, CSS, and JavaScript.', icon: 'BookOpen', difficulty: 'Intermediate' },
  { title: 'Next.js Documentation', category: 'Official Docs', url: 'https://nextjs.org/docs', description: 'Comprehensive guide to building full-stack React applications with Next.js.', icon: 'BookOpen', difficulty: 'Intermediate' },
  { title: 'Tailwind CSS Docs', category: 'Official Docs', url: 'https://tailwindcss.com/docs', description: 'Utility-first CSS framework documentation. Very well written with great examples.', icon: 'BookOpen', difficulty: 'Beginner' },
  
  // System Design
  { title: 'ByteByteGo', category: 'System Design', url: 'https://bytebytego.com/', description: 'Excellent resource for learning system design concepts and preparing for architecture rounds.', icon: 'Server', difficulty: 'Advanced' },
  { title: 'Grokking the System Design', category: 'System Design', url: 'https://www.designgurus.io/course/grokking-the-system-design-interview', description: 'A highly recommended course for understanding distributed systems and scaling concepts.', icon: 'Server', difficulty: 'Intermediate' },
  { title: 'System Design Primer', category: 'System Design', url: 'https://github.com/donnemartin/system-design-primer', description: 'Massive open-source guide to learning how to design large-scale systems.', icon: 'Server', difficulty: 'Advanced' },
  { title: 'High Scalability', category: 'System Design', url: 'http://highscalability.com/', description: 'Articles on how the biggest companies architect their systems.', icon: 'Server', difficulty: 'Advanced' },

  // DSA
  { title: 'NeetCode', category: 'DSA', url: 'https://neetcode.io/', description: 'The best platform for leetcode pattern-based preparation with excellent video explanations.', icon: 'Code', difficulty: 'Intermediate' },
  { title: 'Striver’s SDE Sheet', category: 'DSA', url: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/', description: 'A curated list of top coding interview questions by TakeUForward, frequently asked by top product companies.', icon: 'Code', difficulty: 'Advanced' },
  { title: 'LeetCode', category: 'DSA', url: 'https://leetcode.com/', description: 'The industry standard for practicing data structures and algorithms.', icon: 'Code', difficulty: 'Intermediate' },
  { title: 'Algorithm Visualizer', category: 'DSA', url: 'https://algorithm-visualizer.org/', description: 'Interactive online platform that visualizes algorithms from code.', icon: 'Code', difficulty: 'Beginner' },
  
  // CS Core
  { title: 'CS50', category: 'CS Core', url: 'https://pll.harvard.edu/course/cs50-introduction-computer-science', description: 'Harvard’s famous introductory course covering C, Python, SQL, and algorithms.', icon: 'Database', difficulty: 'Beginner' },
  { title: 'Nand to Tetris', category: 'CS Core', url: 'https://www.nand2tetris.org/', description: 'Build a modern computer system from the ground up, from boolean logic to an OS.', icon: 'Database', difficulty: 'Advanced' },
  { title: 'Operating Systems: Three Easy Pieces', category: 'CS Core', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', description: 'One of the best free books for understanding OS virtualization, concurrency, and persistence.', icon: 'Database', difficulty: 'Intermediate' },
  { title: 'Teach Yourself Computer Science', category: 'CS Core', url: 'https://teachyourselfcs.com/', description: 'A curated curriculum for self-taught software engineers to master CS fundamentals.', icon: 'Database', difficulty: 'Intermediate' },

  // App Dev
  { title: 'Flutter Official Docs', category: 'App Dev', url: 'https://flutter.dev/docs', description: 'Learn how to build cross-platform native apps using Dart and Flutter.', icon: 'Monitor', difficulty: 'Beginner' },
  { title: 'Android Developer Guides', category: 'App Dev', url: 'https://developer.android.com/guide', description: 'The official source for Android development using Kotlin and Jetpack Compose.', icon: 'Monitor', difficulty: 'Intermediate' },
  { title: 'React Native Docs', category: 'App Dev', url: 'https://reactnative.dev/docs/getting-started', description: 'Learn to build mobile apps using React and JavaScript.', icon: 'Monitor', difficulty: 'Intermediate' },
  
  // AI/ML
  { title: 'Fast.ai', category: 'AI/ML', url: 'https://www.fast.ai/', description: 'Practical Deep Learning for Coders. One of the best hands-on ML courses available.', icon: 'Database', difficulty: 'Intermediate' },
  { title: 'Hugging Face Course', category: 'AI/ML', url: 'https://huggingface.co/course', description: 'Learn about natural language processing and Transformers with the Hugging Face ecosystem.', icon: 'Database', difficulty: 'Intermediate' },
  { title: 'Machine Learning by Andrew Ng', category: 'AI/ML', url: 'https://www.coursera.org/specializations/machine-learning-introduction', description: 'The classic Stanford course that introduces the mathematical foundations of ML.', icon: 'Database', difficulty: 'Beginner' },
  
  // Aptitude
  { title: 'IndiaBix', category: 'Aptitude', url: 'https://www.indiabix.com/', description: 'Massive collection of quantitative aptitude, logical reasoning, and verbal questions.', icon: 'Briefcase', difficulty: 'Beginner' },
  { title: 'GeeksforGeeks Aptitude', category: 'Aptitude', url: 'https://www.geeksforgeeks.org/placements-gq/', description: 'Aptitude preparation specifically tailored for IT company placement drives.', icon: 'Briefcase', difficulty: 'Intermediate' },
  { title: 'PrepInsta', category: 'Aptitude', url: 'https://prepinsta.com/', description: 'Company-specific placement preparation materials and mock tests.', icon: 'Briefcase', difficulty: 'Intermediate' },

  // Interview Prep
  { title: 'Pramp', category: 'Interview Prep', url: 'https://www.pramp.com/', description: 'Practice mock interviews for free with peers. Great for getting comfortable talking while coding.', icon: 'Briefcase', difficulty: 'Intermediate' },
  { title: 'Interviewing.io', category: 'Interview Prep', url: 'https://interviewing.io/', description: 'Anonymous technical mock interviews with senior engineers from FAANG.', icon: 'Briefcase', difficulty: 'Advanced' },
  { title: 'Tech Interview Handbook', category: 'Interview Prep', url: 'https://www.techinterviewhandbook.org/', description: 'Curated materials for acing your coding interviews, including resume parsing and behavioral questions.', icon: 'Briefcase', difficulty: 'Beginner' },
  { title: 'STAR Method Guide', category: 'Interview Prep', url: 'https://www.themuse.com/advice/star-interview-method', description: 'Mastering behavioral interviews using the Situation, Task, Action, Result framework.', icon: 'Briefcase', difficulty: 'Beginner' }
];

const seed = async () => {
  try {
    await connectDB();
    await Resource.deleteMany({});
    await Resource.insertMany(defaultResources);
    console.log('Seeded resources successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();

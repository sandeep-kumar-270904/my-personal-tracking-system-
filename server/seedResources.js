const mongoose = require('mongoose');
require('dotenv').config();
const Resource = require('./models/Resource');

const defaultResources = [
  { title: 'NeetCode', category: 'DSA', url: 'https://neetcode.io/', description: 'The best platform for leetcode pattern-based preparation with excellent video explanations.', icon: 'Code', difficulty: 'Intermediate' },
  { title: 'Roadmap.sh', category: 'Web Dev', url: 'https://roadmap.sh/', description: 'Step by step guides and paths to learn different tools or technologies.', icon: 'Monitor', difficulty: 'Beginner' },
  { title: 'ByteByteGo', category: 'System Design', url: 'https://bytebytego.com/', description: 'Excellent resource for learning system design concepts and preparing for architecture rounds.', icon: 'Server', difficulty: 'Advanced' },
  { title: 'CS50', category: 'CS Core', url: 'https://pll.harvard.edu/course/cs50-introduction-computer-science', description: 'Harvard’s famous introductory course covering C, Python, SQL, and algorithms.', icon: 'Database', difficulty: 'Beginner' },
  { title: 'Pramp', category: 'Interview Prep', url: 'https://www.pramp.com/', description: 'Practice mock interviews for free with peers. Great for getting comfortable talking while coding.', icon: 'Briefcase', difficulty: 'Intermediate' },
  { title: 'Striver’s SDE Sheet', category: 'DSA', url: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/', description: 'A curated list of top coding interview questions by TakeUForward, frequently asked by top product companies.', icon: 'Code', difficulty: 'Advanced' },
  { title: 'Frontend Masters', category: 'Web Dev', url: 'https://frontendmasters.com/', description: 'In-depth, advanced courses on JavaScript, React, CSS, and modern web architectures.', icon: 'Monitor', difficulty: 'Advanced' },
  { title: 'Grokking the System Design', category: 'System Design', url: 'https://www.designgurus.io/course/grokking-the-system-design-interview', description: 'A highly recommended course for understanding distributed systems and scaling concepts.', icon: 'Server', difficulty: 'Intermediate' }
];

const connectDB = require('./config/db');

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

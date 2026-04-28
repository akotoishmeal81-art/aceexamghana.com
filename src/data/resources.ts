/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SyllabusTopic {
  id: string;
  subject: string;
  title: string;
  description: string;
  subtopics: string[];
}

export const SYLLABUS_DATA: SyllabusTopic[] = [
  {
    id: 'math-1',
    subject: 'Core Mathematics',
    title: 'Numbers and Numeration',
    description: 'Master the fundamentals of number systems, operations, and fractions.',
    subtopics: ['Sets and Operations', 'Fractions and Decimals', 'Percentages and Ratios', 'Bases and Approximation']
  },
  {
    id: 'math-2',
    subject: 'Core Mathematics',
    title: 'Algebra',
    description: 'Understand variables, expressions, and solving equations.',
    subtopics: ['Algebraic Expressions', 'Linear Equations', 'Inequalities', 'Quadratic Equations']
  },
  {
    id: 'science-1',
    subject: 'Integrated Science',
    title: 'Inorganic Chemistry',
    description: 'Study matter, atomic structure, and chemical reactions.',
    subtopics: ['Atomic Structure', 'Chemical Bonds', 'Acids, Bases and Salts', 'Metals and Non-metals']
  },
  {
    id: 'science-2',
    subject: 'Integrated Science',
    title: 'Ecology',
    description: 'Explore the interactions between living organisms and their environment.',
    subtopics: ['Ecosystems', 'Food Chains and Webs', 'Pollution', 'Soil Conservation']
  },
  {
    id: 'english-1',
    subject: 'English Language',
    title: 'Grammar and Structure',
    description: 'Master the rules of the English language for effective communication.',
    subtopics: ['Parts of Speech', 'Tenses', 'Sentence Structure', 'Concord']
  },
  {
    id: 'english-2',
    subject: 'English Language',
    title: 'Literature Appreciation',
    description: 'Analyze themes, plots, and literary devices in prescribed texts.',
    subtopics: ['Poetry Analysis', 'Drama and Prose', 'Literary Devices', 'Prescribed Texts']
  },
  {
    id: 'social-1',
    subject: 'Social Studies',
    title: 'Our Environment',
    description: 'Understand the physical and human environment of Ghana and West Africa.',
    subtopics: ['The Solar System', 'Physical Features of Ghana', 'Environmental Degradation', 'Natural Resources']
  },
  {
    id: 'social-2',
    subject: 'Social Studies',
    title: 'Governance and Politics',
    description: 'Explore the political history and government structures of Ghana.',
    subtopics: ['Citizenship', 'Human Rights', 'Democracy', 'International Relations']
  },
  {
    id: 'econ-1',
    subject: 'Economics',
    title: 'Theory of Demand and Supply',
    description: 'Analyze how markets work through the interaction of demand and supply.',
    subtopics: ['Laws of Demand and Supply', 'Elasticity', 'Price Determination', 'Market Structures']
  },
  {
    id: 'gov-1',
    subject: 'Government',
    title: 'Basic Concepts of Government',
    description: 'Foundational concepts used in the study of government and politics.',
    subtopics: ['Power and Authority', 'Sovereignty', 'Rule of Law', 'Separation of Powers']
  },
  {
    id: 'emath-1',
    subject: 'Elective Mathematics',
    title: 'Algebra and Calculus',
    description: 'Advanced mathematical concepts for science and engineering paths.',
    subtopics: ['Functions and Relations', 'Matrices and Determinants', 'Differentiation', 'Integration']
  },
  {
    id: 'bio-1',
    subject: 'Biology',
    title: 'Cell Biology and Genetics',
    description: 'Study of the basic building blocks of life and inheritance.',
    subtopics: ['Cell Structure', 'Enzymes', 'Mendelian Genetics', 'DNA and RNA']
  }
];

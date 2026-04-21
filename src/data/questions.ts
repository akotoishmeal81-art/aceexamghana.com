/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: '1',
    exam_type: 'BECE',
    subject_type: 'Core',
    subject: 'Integrated Science',
    year: 2022,
    question: 'Which of the following is a balanced diet component?',
    options: ['Carbohydrates', 'Minerals', 'Vitamins', 'All of the above'],
    correct_answer: 'All of the above',
    explanation: 'A balanced diet consists of all the seven food substances in their right proportions: carbohydrates, proteins, fats and oils, vitamins, minerals, water, and roughage.'
  },
  {
    id: '2',
    exam_type: 'BECE',
    subject_type: 'Core',
    subject: 'Mathematics',
    year: 2021,
    question: 'Find the value of x in the equation: 2x + 5 = 15',
    options: ['5', '10', '7.5', '20'],
    correct_answer: '5',
    explanation: '2x + 5 = 15 => 2x = 15 - 5 => 2x = 10 => x = 5.'
  },
  {
    id: '3',
    exam_type: 'WASSCE',
    subject_type: 'Core',
    subject: 'English Language',
    year: 2023,
    question: 'Choose the word that is nearest in meaning to the underlined word: The witness gave a "vivid" account of the accident.',
    options: ['Cloudy', 'Clear', 'Dull', 'Boring'],
    correct_answer: 'Clear',
    explanation: '"Vivid" means producing powerful feelings or strong, clear images in the mind.'
  },
  {
    id: '4',
    exam_type: 'WASSCE',
    subject_type: 'Elective',
    subject: 'Economics',
    year: 2020,
    question: 'What is the primary motive for holding money according to Keynes?',
    options: ['Transaction motive', 'Precautionary motive', 'Speculative motive', 'All of the above'],
    correct_answer: 'All of the above',
    explanation: 'John Maynard Keynes identified three motives for people to hold money: the transactions motive, the precautionary motive, and the speculative motive.'
  },
  {
    id: '5',
    exam_type: 'BECE',
    subject_type: 'Core',
    subject: 'Social Studies',
    year: 2018,
    question: 'The main reason for the migration of the Ewes into Ghana was ___',
    options: ['Search for fertile land', 'To escape from the tyranny of King Agorkoli', 'To trade with the Europeans', 'To find a better climate'],
    correct_answer: 'To escape from the tyranny of King Agorkoli',
    explanation: 'The Ewes migrated from Notsie (Togo) to escape the cruel and tyrannical rule of King Agorkoli.'
  },
  {
    id: '6',
    exam_type: 'WASSCE',
    subject_type: 'Elective',
    subject: 'Biology',
    year: 2024,
    question: 'Which of the following organelle is known as the powerhouse of the cell?',
    options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Endoplasmic Reticulum'],
    correct_answer: 'Mitochondrion',
    explanation: 'Mitochondria are often referred to as the powerhouses of the cell because they generate most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy.'
  },
  {
    id: '7',
    exam_type: 'BECE',
    subject_type: 'Core',
    subject: 'R.M.E',
    year: 2015,
    question: 'The five pillars of Islam include the following EXCEPT ___',
    options: ['Salat', 'Zakat', 'Hajj', 'Ablution'],
    correct_answer: 'Ablution',
    explanation: 'The five pillars are Shahada (Faith), Salat (Prayer), Zakat (Almsgiving), Sawm (Fasting), and Hajj (Pilgrimage). Ablution (Wudu) is a prerequisite for prayer but not a pillar itself.'
  },
  {
    id: '8',
    exam_type: 'WASSCE',
    subject_type: 'Core',
    subject: 'Core Mathematics',
    year: 2010,
    question: 'What is the sum of the interior angles of a pentagon?',
    options: ['360°', '540°', '720°', '900°'],
    correct_answer: '540°',
    explanation: 'Sum of interior angles = (n-2) * 180°. For a pentagon (n=5), Sum = (5-2) * 180° = 3 * 180° = 540°.'
  },
  {
    id: '9',
    exam_type: 'BECE',
    subject_type: 'Core',
    subject: 'Information & Communication Technology',
    year: 2019,
    question: 'Which of the following is an input device?',
    options: ['Monitor', 'Printer', 'Scanner', 'Speaker'],
    correct_answer: 'Scanner',
    explanation: 'A scanner is an input device that captures images or text from paper and converts it into digital data.'
  },
  {
    id: '10',
    exam_type: 'WASSCE',
    subject_type: 'Elective',
    subject: 'Chemistry',
    year: 2025,
    question: 'Which element has the atomic number 6?',
    options: ['Oxygen', 'Nitrogen', 'Carbon', 'Hydrogen'],
    correct_answer: 'Carbon',
    explanation: 'Carbon is the chemical element with the symbol C and atomic number 6.'
  }
];

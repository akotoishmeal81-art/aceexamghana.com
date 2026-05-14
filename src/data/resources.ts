/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: string;
  title: string;
  content: string;
  duration?: string;
}

export interface SyllabusTopic {
  id: string;
  subject: string;
  title: string;
  description: string;
  subtopics: string[];
  lessons: Lesson[];
}

export const SYLLABUS_DATA: SyllabusTopic[] = [
  {
    id: 'math-1',
    subject: 'Core Mathematics',
    title: 'Numbers and Numeration',
    description: 'Master the fundamentals of number systems, operations, and fractions.',
    subtopics: ['Sets and Operations', 'Fractions and Decimals', 'Percentages and Ratios', 'Bases and Approximation'],
    lessons: [
      {
        id: 'm1-l1',
        title: 'Introduction to Sets',
        duration: '10 mins',
        content: `
# Understanding Sets
A set is a well-defined collection of distinct objects. These objects are called members or elements of the set.

## Types of Sets
1. **Finite Set**: A set with a countable number of elements.
2. **Infinite Set**: A set with elements that cannot be counted.
3. **Empty Set (Null Prompt)**: A set containing no elements, denoted by { } or Ø.

## Basic Operations
- **Union (A ∪ B)**: Elements in A or B or both.
- **Intersection (A ∩ B)**: Elements common to both A and B.
- **Complement (A')**: Elements in the universal set that are not in A.
        `
      },
      {
        id: 'm1-l2',
        title: 'Decimals and Fractions',
        duration: '15 mins',
        content: `
# Decimals and Fractions
Decimals and fractions are two ways of representing parts of a whole.

## Converting Fractions to Decimals
To convert a fraction to a decimal, divide the numerator by the denominator.
Example: 1/4 = 1 ÷ 4 = 0.25.

## Recurring Decimals
A decimal where one or more digits at the end repeat infinitely.
Example: 1/3 = 0.333... (denoted as 0.3̇)
        `
      }
    ]
  },
  {
    id: 'science-1',
    subject: 'Integrated Science',
    title: 'Inorganic Chemistry',
    description: 'Study matter, atomic structure, and chemical reactions.',
    subtopics: ['Atomic Structure', 'Chemical Bonds', 'Acids, Bases and Salts', 'Metals and Non-metals'],
    lessons: [
      {
        id: 's1-l1',
        title: 'The Structure of the Atom',
        duration: '12 mins',
        content: `
# The Atom
The atom is the smallest particle of an element that can take part in a chemical reaction.

## Sub-atomic Particles
1. **Protons**: Positively charged, found in the nucleus.
2. **Neutrons**: No charge (neutral), found in the nucleus.
3. **Electrons**: Negatively charged, orbit the nucleus in shells.

## Atomic Number vs Mass Number
- **Atomic Number (Z)**: Number of protons in the nucleus.
- **Mass Number (A)**: Total number of protons and neutrons.
        `
      },
      {
        id: 's1-l2',
        title: 'Acids, Bases and Salts',
        duration: '10 mins',
        content: `
# Acids and Bases
## Acids
Acids are substances that produce hydrogen ions (H+) in aqueous solution.
- Properties: Sour taste, turn blue litmus red, pH < 7.

## Bases
Bases are substances that react with acids to form salt and water only. Solurable bases are called **Alkalis**.
- Properties: Bitter taste, soapy feel, turn red litmus blue, pH > 7.
        `
      }
    ]
  },
  {
    id: 'ict-1',
    subject: 'Elective ICT',
    title: 'Web Foundations',
    description: 'Master the basics of computer networks and web development.',
    subtopics: ['HTML Basics', 'CSS Styling', 'Web Architecture', 'Internet Safety'],
    lessons: [
      {
        id: 'i1-l1',
        title: 'Introduction to HTML',
        duration: '8 mins',
        content: `
# HTML Basics
HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.

## Basic Structure
\`\`\`html
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>
<h1>My First Heading</h1>
<p>My first paragraph.</p>
</body>
</html>
\`\`\`

## Common Tags
- \`<h1>\` to \`<h6>\`: Headings
- \`<p>\`: Paragraphs
- \`<a>\`: Hyperlinks
- \`<img>\`: Images
        `
      }
    ]
  },
  {
    id: 'english-1',
    subject: 'English Language',
    title: 'Grammar and Structure',
    description: 'Master the rules of the English language for effective communication.',
    subtopics: ['Parts of Speech', 'Tenses', 'Sentence Structure', 'Concord'],
    lessons: [
      {
        id: 'e1-l1',
        title: 'Nouns and Pronouns',
        duration: '12 mins',
        content: `
# Nouns and Pronouns
## Nouns
A noun is a word that names a person, place, thing, or idea.
- **Common Nouns**: boy, city, chair.
- **Proper Nouns**: Kofi, Accra, Monday.

## Pronouns
A pronoun is a word that takes the place of a noun.
- **Personal Pronouns**: I, you, he, she, it, we, they.
        `
      }
    ]
  },
  {
    id: 'social-1',
    subject: 'Social Studies',
    title: 'Our Environment',
    description: 'Understand the physical and human environment of Ghana and West Africa.',
    subtopics: ['The Solar System', 'Physical Features of Ghana', 'Environmental Degradation'],
    lessons: [
      {
        id: 'so1-l1',
        title: 'The Solar System',
        duration: '15 mins',
        content: `
# The Solar System
The Solar System consists of the Sun and everything that orbits it.

## The Planets
There are eight planets in order from the Sun:
1. Mercury
2. Venus
3. Earth
4. Mars
5. Jupiter
6. Saturn
7. Uranus
8. Neptune
        `
      }
    ]
  }
];

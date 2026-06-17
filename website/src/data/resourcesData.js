export const resourcesData = [
  {
    id: '1',
    title: 'Introduction to Data Structures & Algorithms',
    description:
      'A comprehensive guide covering arrays, linked lists, trees, graphs, and sorting algorithms with code examples in Python.',
    fileUrl: '#',
    fileType: 'application/pdf',
    fileSize: 2500000,
    category: 'study_material',
    tags: ['DSA', 'Python', 'Algorithms', 'Beginner'],
    difficultyLevel: 'beginner',
    uploadedBy: 'Ayush Sharma',
    downloads: 342,
    votes: ['user1', 'user2', 'user5'],
    rating: 3,
    status: 'approved',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Web Development Project Template - MERN Stack',
    description:
      'A ready-to-use MERN stack project template with authentication, CRUD operations, and responsive design patterns.',
    fileUrl: '#',
    fileType: 'application/zip',
    fileSize: 8500000,
    category: 'project_template',
    tags: ['MERN', 'React', 'Node.js', 'MongoDB', 'Full Stack'],
    difficultyLevel: 'intermediate',
    uploadedBy: 'Tanishk Bansal',
    downloads: 189,
    votes: ['user1', 'user3'],
    rating: 2,
    status: 'approved',
    createdAt: '2026-05-28T08:00:00.000Z',
  },
  {
    id: '3',
    title: 'Previous Year Papers - GATE CSE 2024-2025',
    description:
      'Compilation of GATE Computer Science previous year question papers with solutions and answer keys.',
    fileUrl: '#',
    fileType: 'application/pdf',
    fileSize: 12000000,
    category: 'past_papers',
    tags: ['GATE', 'CSE', 'Exam Prep', 'Previous Year'],
    difficultyLevel: 'advanced',
    uploadedBy: 'Swayam Dwivedi',
    downloads: 567,
    votes: ['user4', 'user5', 'user6', 'user7'],
    rating: 4,
    status: 'approved',
    createdAt: '2026-05-20T09:00:00.000Z',
  },
  {
    id: '4',
    title: 'Machine Learning Lecture Notes - Complete Semester',
    description:
      'Handwritten and typed notes covering regression, classification, neural networks, CNNs, RNNs, and Transformers.',
    fileUrl: '#',
    fileType: 'application/pdf',
    fileSize: 4500000,
    category: 'notes',
    tags: ['ML', 'Deep Learning', 'Neural Networks', 'AI'],
    difficultyLevel: 'intermediate',
    uploadedBy: 'Vartika Sharma',
    downloads: 234,
    votes: ['user2', 'user4'],
    rating: 2,
    status: 'approved',
    createdAt: '2026-05-15T11:00:00.000Z',
  },
  {
    id: '5',
    title: 'KSS #153 - Impact of AI: Key Takeaways',
    description:
      "Recorded session and slides from the Knowledge Sharing Session on AI's impact on modern software development.",
    fileUrl: '#',
    fileType: 'video/mp4',
    fileSize: 250000000,
    category: 'recorded_sessions',
    tags: ['AI', 'Knowledge Sharing', 'Session Recording'],
    difficultyLevel: 'beginner',
    uploadedBy: 'Core Team',
    downloads: 89,
    votes: ['user1', 'user3', 'user5'],
    rating: 3,
    status: 'approved',
    createdAt: '2026-05-10T14:00:00.000Z',
  },
];

export const categories = [
  { value: 'study_material', label: 'Study Material', icon: 'BookOpen' },
  { value: 'project_template', label: 'Project Templates', icon: 'FolderGit2' },
  { value: 'notes', label: 'Notes', icon: 'FileText' },
  { value: 'past_papers', label: 'Past Papers', icon: 'ScrollText' },
  { value: 'recorded_sessions', label: 'Recorded Sessions', icon: 'Video' },
  { value: 'other', label: 'Other', icon: 'File' },
];

export const difficultyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export function getFileIcon(fileType) {
  if (!fileType) return 'File';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar'))
    return 'Archive';
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('video')) return 'Video';
  if (fileType.includes('text') || fileType.includes('markdown')) return 'FileText';
  if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('python'))
    return 'Code';
  return 'File';
}

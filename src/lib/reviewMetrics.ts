export const reviewMetrics = {
  difficulty: {
    key: 'difficulty', label: '课程难度', preference: 'lower',
    levels: ['很简单', '较简单', '适中', '较难', '很难'],
  },
  homework: {
    key: 'homework', label: '作业负担', preference: 'lower',
    levels: ['作业很少', '作业较少', '作业适中', '作业较多', '作业很多'],
  },
  grade: {
    key: 'grade', label: '给分情况', preference: 'higher',
    levels: ['给分很严', '给分偏严', '给分一般', '给分偏宽', '给分很宽'],
  },
  reward: {
    key: 'reward', label: '学习收获', preference: 'higher',
    levels: ['收获很少', '收获较少', '收获一般', '收获较多', '收获很多'],
  },
} as const

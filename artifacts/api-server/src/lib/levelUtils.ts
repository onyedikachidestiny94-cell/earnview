export const LEVEL_CONFIG = [
  { level: 1, name: "Beginner", minXp: 0, maxXp: 100 },
  { level: 2, name: "Active User", minXp: 100, maxXp: 300 },
  { level: 3, name: "Pro User", minXp: 300, maxXp: 700 },
  { level: 4, name: "Elite Member", minXp: 700, maxXp: Infinity },
];

export function getLevelInfo(xp: number) {
  let current = LEVEL_CONFIG[0];
  for (const l of LEVEL_CONFIG) {
    if (xp >= l.minXp) current = l;
  }
  const xpToNextLevel = current.maxXp === Infinity ? 0 : current.maxXp - xp;
  const range = current.maxXp === Infinity ? 1 : current.maxXp - current.minXp;
  const xpProgress =
    current.maxXp === Infinity
      ? 100
      : Math.min(100, Math.max(0, ((xp - current.minXp) / range) * 100));

  return {
    level: current.level,
    levelName: current.name,
    xpToNextLevel,
    xpProgress,
  };
}

export const ACHIEVEMENT_DEFINITIONS = [
  {
    badgeName: "First Step",
    description: "Complete your first task",
    icon: "Medal",
    requirement: "tasks_completed",
    requirementValue: 1,
    xpReward: 50,
  },
  {
    badgeName: "Getting Started",
    description: "Complete 10 tasks",
    icon: "Target",
    requirement: "tasks_completed",
    requirementValue: 10,
    xpReward: 100,
  },
  {
    badgeName: "Century Club",
    description: "Complete 100 tasks",
    icon: "Star",
    requirement: "tasks_completed",
    requirementValue: 100,
    xpReward: 500,
  },
  {
    badgeName: "On Fire",
    description: "Maintain a 7-day streak",
    icon: "Flame",
    requirement: "streak_days",
    requirementValue: 7,
    xpReward: 100,
  },
  {
    badgeName: "Unstoppable",
    description: "Maintain a 30-day streak",
    icon: "Zap",
    requirement: "streak_days",
    requirementValue: 30,
    xpReward: 300,
  },
  {
    badgeName: "Recruiter",
    description: "Refer your first friend",
    icon: "Users",
    requirement: "referrals",
    requirementValue: 1,
    xpReward: 75,
  },
  {
    badgeName: "Network Builder",
    description: "Refer 5 friends",
    icon: "Network",
    requirement: "referrals",
    requirementValue: 5,
    xpReward: 200,
  },
  {
    badgeName: "First Ten",
    description: "Earn your first $10",
    icon: "DollarSign",
    requirement: "earnings",
    requirementValue: 10,
    xpReward: 100,
  },
  {
    badgeName: "Elite",
    description: "Reach Elite Member level",
    icon: "Diamond",
    requirement: "level",
    requirementValue: 4,
    xpReward: 1000,
  },
];

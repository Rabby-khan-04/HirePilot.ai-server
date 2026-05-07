export type TRoadmap = {
  week: number;
  days: [
    {
      day: number;
      title: string;

      tasks: [
        {
          text: string;
          isCompleted: boolean;
        },
      ];
    },
  ];
};

type TLearningRoadmap = {
  userId: string;
  analysisId: string;

  title: string;
  duration: string;

  roadmap: TRoadmap[];

  progress: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
  };
};

export default TLearningRoadmap;

import { Schema, model } from "mongoose";

import TLearningRoadmap, {
  TDay,
  TTask,
  TWeek,
} from "./learningRoadmap.interface.js";

const taskSchema = new Schema<TTask>(
  {
    text: {
      type: String,
      required: [true, "Task text is required"],
      trim: true,
    },

    resource: {
      type: String,
      default: "",
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  },
);

const daySchema = new Schema<TDay>(
  {
    day: {
      type: Number,
      required: [true, "Day number is required"],
    },

    title: {
      type: String,
      required: [true, "Day title is required"],
      trim: true,
    },

    tasks: {
      type: [taskSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const weekSchema = new Schema<TWeek>(
  {
    week: {
      type: Number,
      required: [true, "Week number is required"],
    },

    focus: {
      type: String,
      required: [true, "Week focus is required"],
      trim: true,
    },

    days: {
      type: [daySchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const learningRoadmapSchema = new Schema<TLearningRoadmap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "AiAnalyses",
      required: [true, "Analysis ID is required"],
    },

    title: {
      type: String,
      required: [true, "Roadmap title is required"],
      trim: true,
    },

    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
    },

    roadmap: {
      type: [weekSchema],
      default: [],
    },

    progress: {
      totalTasks: {
        type: Number,
        default: 0,
      },

      completedTasks: {
        type: Number,
        default: 0,
      },

      percentage: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

const LearningRoadmap = model<TLearningRoadmap>(
  "LearningRoadmap",
  learningRoadmapSchema,
);

export default LearningRoadmap;

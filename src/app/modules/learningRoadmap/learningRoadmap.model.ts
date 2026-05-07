import { Schema, model, Types } from "mongoose";
import TLearningRoadmap, {
  TDay,
  TRoadmap,
  TTask,
} from "./learningRoadmap.interface.js";

const taskSchema = new Schema<TTask>(
  {
    text: {
      type: String,
      required: [true, "Task text is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
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
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
  },
  { _id: false },
);

const roadmapSchema = new Schema<TRoadmap>(
  {
    week: {
      type: Number,
      required: [true, "Week number is required"],
    },
    days: {
      type: [daySchema],
      default: [],
    },
  },
  { _id: false },
);

const learningRoadmapSchema = new Schema<TLearningRoadmap>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    analysisId: {
      type: String,
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
    },

    roadmap: {
      type: [roadmapSchema],
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

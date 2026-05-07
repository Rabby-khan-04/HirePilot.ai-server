import { Types } from "mongoose";

type TJobApplication = {
  userId: Types.ObjectId;

  companyName: string;
  roleTitle: string;

  jobUrl?: string;
  location?: string;

  status: "saved" | "applied" | "interview" | "offer" | "rejected";

  appliedDate?: string;
  notes?: string;
};

export default TJobApplication;

type TJobApplication = {
  userId: string;

  companyName: string;
  roleTitle: string;

  jobUrl?: string;
  location?: string;

  status: "saved" | "applied" | "interview" | "offer" | "rejected";

  appliedDate?: string;
  notes?: string;
};

export default TJobApplication;

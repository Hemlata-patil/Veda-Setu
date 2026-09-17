/**
 * Application domain types, status helpers, and lifecycle validation
 */

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "selected"
  | "withdrawn";

export const APPLICATION_STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "herbal" | "saffron" | "parchment";
    description: string;
  }
> = {
  applied: {
    label: "Applied",
    variant: "parchment",
    description: "Application submitted and queued for industry review.",
  },
  under_review: {
    label: "Under Review",
    variant: "saffron",
    description: "Application is actively being evaluated by the industry partner.",
  },
  shortlisted: {
    label: "Shortlisted",
    variant: "herbal",
    description: "Candidate meets core requirements and is shortlisted for selection.",
  },
  selected: {
    label: "Selected",
    variant: "herbal",
    description: "Candidate successfully selected for this opportunity.",
  },
  rejected: {
    label: "Not Selected",
    variant: "outline",
    description: "Application did not match current cohort requirements.",
  },
  withdrawn: {
    label: "Withdrawn",
    variant: "outline",
    description: "Application withdrawn by candidate.",
  },
};

/**
 * Validates whether a requested status transition is allowed
 * based on the caller role and the state machine.
 */
export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  role: "student" | "industry"
): { allowed: boolean; reason?: string } {
  if (currentStatus === newStatus) {
    return { allowed: true };
  }

  // Terminal states cannot be changed
  if (["selected", "rejected", "withdrawn"].includes(currentStatus)) {
    return {
      allowed: false,
      reason: `Application in '${currentStatus}' status is in a terminal state and cannot be modified.`,
    };
  }

  if (role === "student") {
    // Student can only withdraw from applied or under_review
    if (newStatus !== "withdrawn") {
      return {
        allowed: false,
        reason: "Students are only permitted to withdraw their application.",
      };
    }
    if (!["applied", "under_review"].includes(currentStatus)) {
      return {
        allowed: false,
        reason: `Application cannot be withdrawn while in '${currentStatus}' status.`,
      };
    }
    return { allowed: true };
  }

  if (role === "industry") {
    if (currentStatus === "applied") {
      if (newStatus === "under_review") return { allowed: true };
      return {
        allowed: false,
        reason: "New applications must first be marked 'Under Review'.",
      };
    }

    if (currentStatus === "under_review") {
      if (newStatus === "shortlisted" || newStatus === "rejected") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Under-review applications can only be transitioned to 'Shortlisted' or 'Rejected'.",
      };
    }

    if (currentStatus === "shortlisted") {
      if (newStatus === "selected" || newStatus === "rejected") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Shortlisted candidates can only be transitioned to 'Selected' or 'Rejected'.",
      };
    }
  }

  return {
    allowed: false,
    reason: `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
  };
}

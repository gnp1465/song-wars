import type { OnlineRoundStatus } from "../../types/onlineRoom";

export const MAX_ONLINE_TOPIC_LENGTH = 80;

export interface OnlineTopicSubmissionState {
  currentMemberId?: string;
  isMutating: boolean;
  judgeMemberId?: string;
  roundStatus?: OnlineRoundStatus;
  topicInput: string;
}

export function normalizeOnlineTopic(topicInput: string): string {
  return topicInput.trim();
}

export function canSubmitOnlineTopic({
  currentMemberId,
  isMutating,
  judgeMemberId,
  roundStatus,
  topicInput,
}: OnlineTopicSubmissionState): boolean {
  const normalizedTopic = normalizeOnlineTopic(topicInput);

  return Boolean(
    currentMemberId &&
      judgeMemberId &&
      currentMemberId === judgeMemberId &&
      roundStatus === "waiting_for_topic" &&
      normalizedTopic.length > 0 &&
      normalizedTopic.length <= MAX_ONLINE_TOPIC_LENGTH &&
      !isMutating,
  );
}

// services/snsSubscribeService.js
import { SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
import { logger } from "../utils/logger.js";

const REGION = process.env.AWS_REGION || process.env.AWS_REGION || "us-east-1";
const client = new SNSClient({ region: REGION });

export async function subscribePhoneToTopic(phone, topicArn) {
  if (!phone || !topicArn) throw new Error("phone and topicArn required");
  try {

    const cmd = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: "sms",
      Endpoint: phone,
      ReturnSubscriptionArn: true,
    });
    const resp = await client.send(cmd);
    logger.info("SNS Subscribe result", { phone, topic: topicArn, resp });
    return resp;
  } catch (err) {
    logger.warn("SNS subscribe failed (non-fatal)", { phone, err: err?.message || err });
    return null;
  }
}
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";

const REGION = process.env.AWS_REGION || "us-east-1";
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE || "EmergencyIncidents";
const client = new DynamoDBClient({ region: REGION });

export async function logIncident({ incidentId, text, parsed, location, userId }) {
  const id = incidentId || uuidv4();
  const item = {
    IncidentId: id,
    Text: text,
    Parsed: parsed ? JSON.stringify(parsed) : null,
    Location: location ? JSON.stringify(location) : null,
    UserId: userId || null,
    CreatedAt: new Date().toISOString()
  };
  try {
    await client.send(new PutItemCommand({ TableName: INCIDENTS_TABLE, Item: marshall(item, { removeUndefinedValues: true }) }));
    logger.info("DynamoDB: logged incident", { incidentId: id });
    return id;
  } catch (err) {
    logger.warn("DynamoDB logIncident failed", err);
    throw err;
  }
}
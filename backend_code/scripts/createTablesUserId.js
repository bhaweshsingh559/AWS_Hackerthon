// scripts/createTablesUserId.js
import dotenv from "dotenv";
dotenv.config();
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region: REGION });

async function createTables() {
  try {
    // Users table with UserId PK
    const usersParams = {
      TableName: "Users",
      AttributeDefinitions: [{ AttributeName: "UserId", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "UserId", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    };
    console.log("Creating Users table...");
    await client.send(new CreateTableCommand(usersParams));
    console.log("Created Users table.");

    // Incidents table
    const incidentsParams = {
      TableName: "EmergencyIncidents",
      AttributeDefinitions: [{ AttributeName: "IncidentId", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "IncidentId", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    };
    console.log("Creating EmergencyIncidents table...");
    await client.send(new CreateTableCommand(incidentsParams));
    console.log("Created EmergencyIncidents table.");

  } catch (e) {
    console.error("createTables error:", e);
  }
}

createTables();
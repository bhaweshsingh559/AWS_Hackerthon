import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";

const REGION = process.env.AWS_REGION || "us-east-1";
const USERS_TABLE = process.env.USERS_TABLE || "Users";
const USERS_TABLE_KEY = process.env.USERS_TABLE_KEY || "UserId";

const client = new DynamoDBClient({ region: REGION });
const SALT_ROUNDS = 10;

function wrapDynamoError(err) {
  if (err && err.name === "ResourceNotFoundException") {
    const e = new Error(`DynamoDB table "${USERS_TABLE}" not found in region ${REGION}.`);
    e.code = "TABLE_NOT_FOUND";
    return e;
  }
  return err;
}

export async function createUser({ name, email, password, phone, location, emergencyContacts }) {
  try {
    if (!email || !password) throw new Error("email and password required");
    const userId = uuidv4();
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const normalizedEmail = (email || "").trim();

    const item = {
      UserId: userId,
      Email: normalizedEmail,
      email: normalizedEmail,
      Name: name || null,
      PasswordHash: hashed,
      Phone: phone || null,
      Location: location ? JSON.stringify(location) : null,
      EmergencyContacts: JSON.stringify(Array.isArray(emergencyContacts) ? emergencyContacts : []),
      CreatedAt: new Date().toISOString(),
    };

    if (USERS_TABLE_KEY && USERS_TABLE_KEY !== "UserId" && USERS_TABLE_KEY !== "Email" && USERS_TABLE_KEY !== "email") {
      item[USERS_TABLE_KEY] = userId;
    } else if (USERS_TABLE_KEY === "email") {
      item.email = normalizedEmail;
    } else if (USERS_TABLE_KEY === "Email") {
      item.Email = normalizedEmail;
    }

    await client.send(new PutItemCommand({ TableName: USERS_TABLE, Item: marshall(item, { removeUndefinedValues: true }) }));

    logger.info("User created", { userId, email: normalizedEmail, primaryKey: USERS_TABLE_KEY });
    return {
      userId,
      email: normalizedEmail,
      name: item.Name,
      phone: item.Phone,
      emergencyContacts: JSON.parse(item.EmergencyContacts),
      createdAt: item.CreatedAt
    };
  } catch (err) {
    throw wrapDynamoError(err);
  }
}

export async function getUserByEmail(email) {
  try {
    if (!email) return null;
    if (USERS_TABLE_KEY === "email") {
      const resp = await client.send(new GetItemCommand({ TableName: USERS_TABLE, Key: marshall({ email }) }));
      if (!resp.Item) return null;
      return unmarshall(resp.Item);
    }

    const resp = await client.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "Email = :e",
      ExpressionAttributeValues: { ":e": { S: email } },
      Limit: 1
    }));
    const items = resp.Items || [];
    if (items.length === 0) return null;
    return unmarshall(items[0]);
  } catch (err) {
    throw wrapDynamoError(err);
  }
}

export async function getUserById(userId) {
  try {
    if (!userId) return null;
    if (USERS_TABLE_KEY === "UserId") {
      const resp = await client.send(new GetItemCommand({ TableName: USERS_TABLE, Key: marshall({ UserId: userId }) }));
      if (!resp.Item) return null;
      return unmarshall(resp.Item);
    }

    const tryKey = {};
    tryKey[USERS_TABLE_KEY] = userId;
    try {
      const resp2 = await client.send(new GetItemCommand({ TableName: USERS_TABLE, Key: marshall(tryKey) }));
      if (resp2?.Item) return unmarshall(resp2.Item);
    } catch (e) { }

    const resp = await client.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "UserId = :u",
      ExpressionAttributeValues: { ":u": { S: userId } },
      Limit: 1
    }));
    const items = resp.Items || [];
    if (items.length === 0) return null;
    return unmarshall(items[0]);
  } catch (err) {
    throw wrapDynamoError(err);
  }
}

export async function verifyPassword(user, password) {
  if (!user) return false;
  const hash = user.PasswordHash || user.passwordHash || user.Password || null;
  if (!hash) return false;
  return await bcrypt.compare(password, hash);
}

export async function updateUserProfile(userIdOrKeyValue, updates = {}) {
  try {
    let keyObj = {};
    if (USERS_TABLE_KEY === "UserId") keyObj = { UserId: userIdOrKeyValue };
    else keyObj[USERS_TABLE_KEY] = userIdOrKeyValue;

    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const updateExpr = [];

    if (updates.name !== undefined) {
      ExpressionAttributeNames["#N"] = "Name"; ExpressionAttributeValues[":n"] = { S: updates.name }; updateExpr.push("#N = :n");
    }
    if (updates.phone !== undefined) {
      ExpressionAttributeNames["#P"] = "Phone"; ExpressionAttributeValues[":p"] = { S: updates.phone }; updateExpr.push("#P = :p");
    }
    if (updates.location !== undefined) {
      ExpressionAttributeNames["#L"] = "Location"; ExpressionAttributeValues[":l"] = { S: JSON.stringify(updates.location) }; updateExpr.push("#L = :l");
    }
    if (updates.emergencyContacts !== undefined) {
      ExpressionAttributeNames["#C"] = "EmergencyContacts"; ExpressionAttributeValues[":c"] = { S: JSON.stringify(Array.isArray(updates.emergencyContacts) ? updates.emergencyContacts : []) }; updateExpr.push("#C = :c");
    }

    if (updateExpr.length === 0) {
      return await getUserById(userIdOrKeyValue);
    }

    const cmd = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall(keyObj),
      UpdateExpression: "SET " + updateExpr.join(", "),
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW"
    });

    const resp = await client.send(cmd);
    return unmarshall(resp.Attributes);
  } catch (err) {
    throw wrapDynamoError(err);
  }
}
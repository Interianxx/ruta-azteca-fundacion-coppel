import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { AWS_REGION, awsCredentials } from '@/lib/aws-config'

const client = new DynamoDBClient({
  region:      AWS_REGION,
  credentials: awsCredentials,
})

export const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

export const TABLE_NAME    = process.env.DYNAMODB_TABLE_NAME ?? 'ruta-azteca-dev'
export const GSI_STATUS    = 'status-index'
export const GSI_CATEGORIA = 'categoria-index'

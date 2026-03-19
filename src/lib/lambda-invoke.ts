import { LambdaClient, InvokeCommand, LogType } from '@aws-sdk/client-lambda'

const lambda = new LambdaClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
})

export async function invokeLambda<T>(
  functionName: string,
  payload: unknown,
): Promise<T> {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
    LogType: LogType.None,
  })

  const response = await lambda.send(command)

  if (!response.Payload) {
    throw new Error(`Lambda ${functionName} no retornó payload`)
  }

  const result = JSON.parse(Buffer.from(response.Payload).toString())

  if (result.errorMessage) {
    throw new Error(`Lambda ${functionName}: ${result.errorMessage}`)
  }

  return result as T
}

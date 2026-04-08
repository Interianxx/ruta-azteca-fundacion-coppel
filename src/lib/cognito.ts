import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { AWS_REGION, awsCredentials } from '@/lib/aws-config'

export const cognitoClient = new CognitoIdentityProviderClient({
  region:      AWS_REGION,
  credentials: awsCredentials,
})

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? ''

/** Mueve un usuario de un grupo a otro atómicamente */
export async function moverAGrupo(
  username: string,
  grupoAnterior: string,
  grupoNuevo: string,
) {
  await cognitoClient.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username:   username,
      GroupName:  grupoAnterior,
    }),
  )
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username:   username,
      GroupName:  grupoNuevo,
    }),
  )
}

/** Agrega un usuario a un grupo (primer login → turista) */
export async function agregarAGrupo(username: string, grupo: string) {
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username:   username,
      GroupName:  grupo,
    }),
  )
}

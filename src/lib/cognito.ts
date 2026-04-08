import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
})

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? ''

/** Mueve un usuario de un grupo a otro atómicamente */
export async function moverAGrupo(
  username: string,
  grupoAnterior: string,
  grupoNuevo: string,
) {
  await cognito.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: grupoAnterior,
    }),
  )
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: grupoNuevo,
    }),
  )
}

/** Agrega un usuario a un grupo (primer login → turista) */
export async function agregarAGrupo(username: string, grupo: string) {
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: grupo,
    }),
  )
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  lastKey?: string // DynamoDB LastEvaluatedKey serializado
  count: number
}

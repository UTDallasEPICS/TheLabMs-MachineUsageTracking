declare module 'bcrypt' {
  export function compare(data: string, encrypted: string): Promise<boolean>
}

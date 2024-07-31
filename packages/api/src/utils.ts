export function createBasic(username: string, password: string) {
  const userInfo = `${username}:${password}`;

  return `Basic ${Buffer.from(userInfo).toString('base64')}`;
}

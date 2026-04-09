let _isNewDriverSignUp = false;

export function markNewDriverSignUp(): void {
  _isNewDriverSignUp = true;
}

export function consumeNewDriverSignUp(): boolean {
  const val = _isNewDriverSignUp;
  _isNewDriverSignUp = false;
  return val;
}

function formatSessionCount(value?: number) {
  const count = Number(value || 0);
  return count <= 0 ? "0" : String(count);
}

export { formatSessionCount };

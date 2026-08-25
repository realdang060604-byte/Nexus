const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export const getVietnamDayRange = (
  referenceDate = new Date()
) => {
  const shifted = new Date(referenceDate.getTime() + VIETNAM_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const from = new Date(
    Date.UTC(year, month, day) - VIETNAM_OFFSET_MS
  );
  const to = new Date(
    Date.UTC(year, month, day + 1) - VIETNAM_OFFSET_MS
  );

  return { from, to };
};

import { useEffect, useMemo, useState } from 'react';

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function useCountdown(targetTime: string | number | Date | null) {
  const resolvedTargetTime = useMemo(() => {
    if (!targetTime) {
      return 0;
    }

    if (typeof targetTime === 'number') {
      return targetTime;
    }

    if (targetTime instanceof Date) {
      return targetTime.getTime();
    }

    const parsed = Date.parse(targetTime);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [targetTime]);

  const [timeRemaining, setTimeRemaining] = useState(() => Math.max(0, resolvedTargetTime - Date.now()));

  useEffect(() => {
    const updateRemaining = () => {
      setTimeRemaining(Math.max(0, resolvedTargetTime - Date.now()));
    };

    updateRemaining();

    const timer = window.setInterval(updateRemaining, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [resolvedTargetTime]);

  const formatted = useMemo(() => formatTimeRemaining(timeRemaining), [timeRemaining]);

  return {
    timeRemaining,
    formatted,
    isExpired: timeRemaining <= 0,
  };
}

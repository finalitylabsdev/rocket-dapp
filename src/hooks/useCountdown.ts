import { useEffect, useMemo, useState } from 'react';

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
}

function toCountdownParts(ms: number): CountdownParts {
  if (ms <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
    };
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalHours: (days * 24) + hours,
  };
}

function formatTimeRemaining(ms: number): string {
  const parts = toCountdownParts(ms);

  return [parts.totalHours, parts.minutes, parts.seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function formatDetailedTimeRemaining(ms: number): string {
  const parts = toCountdownParts(ms);

  return [parts.days, parts.hours, parts.minutes, parts.seconds]
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
  const formattedDetailed = useMemo(() => formatDetailedTimeRemaining(timeRemaining), [timeRemaining]);
  const parts = useMemo(() => toCountdownParts(timeRemaining), [timeRemaining]);

  return {
    timeRemaining,
    formatted,
    formattedDetailed,
    parts,
    isExpired: timeRemaining <= 0,
  };
}

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', icon: '🌅', period: 'morning' };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: 'Good afternoon', icon: '☀️', period: 'afternoon' };
  }
  if (hour >= 17 && hour < 22) {
    return { greeting: 'Good evening', icon: '🌆', period: 'evening' };
  }
  return { greeting: 'Good night', icon: '🌙', period: 'night' };
}

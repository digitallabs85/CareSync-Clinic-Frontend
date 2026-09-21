export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }
};
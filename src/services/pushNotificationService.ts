import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// ── Helpers ──────────────────────────────────────────────────

/** Convertit la clé VAPID base64url en Uint8Array pour l'API Push */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── Service ──────────────────────────────────────────────────

export const pushNotificationService = {

  /** Vérifie si le navigateur supporte les push notifications */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  /** Vérifie l'état actuel de la permission */
  getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  /** Demande la permission pour les notifications */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
  },

  /** S'abonne aux push notifications et sauvegarde dans Supabase */
  async subscribe(userId: string): Promise<boolean> {
    try {
      if (!this.isSupported() || !VAPID_PUBLIC_KEY) {
        console.warn('Push notifications non supportées ou VAPID key manquante');
        return false;
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permission notifications refusée');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // Vérifier si déjà abonné
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Créer un nouvel abonnement
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Sauvegarder dans Supabase
      const subscriptionJSON = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscriptionJSON.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh || '',
          auth: subscriptionJSON.keys?.auth || '',
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Erreur sauvegarde push subscription:', error);
        return false;
      }

      console.log('Push notification souscrit avec succès');
      return true;
    } catch (error) {
      console.error('Erreur subscription push:', error);
      return false;
    }
  },

  /** Se désabonne des push notifications */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Supprimer de Supabase
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint);
      }

      return true;
    } catch (error) {
      console.error('Erreur unsubscribe push:', error);
      return false;
    }
  },

  /** Vérifie si l'utilisateur est déjà abonné */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported()) return false;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },

  /** Envoie une notification de test locale (sans passer par le serveur) */
  async sendTestNotification(): Promise<boolean> {
    try {
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') return false;
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Jang - Test', {
        body: 'Les notifications push fonctionnent correctement ! 🎉',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
      });

      return true;
    } catch (error) {
      console.error('Erreur test notification:', error);
      return false;
    }
  },
};

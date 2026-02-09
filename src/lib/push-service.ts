// Serviço de envio de notificações push
import webpush from 'web-push';

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

webpush.setVapidDetails(
  'mailto:admin@gestornaval.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function enviarPush(subscription: any, titulo: string, mensagem: string) {
  const payload = JSON.stringify({ title: titulo, body: mensagem });
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (err) {
    console.error('Erro ao enviar push:', err);
    return false;
  }
}

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Crear el cliente de Supabase
const supabase = createClient('https://<your-supabase-url>', '<your-supabase-key>');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // Aquí va tu token de Telegram

export default async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send('No message received');
  }

  const chatId = message.chat.id;
  const text = message.text;

  // Si el usuario quiere agregar una tarea
  if (text.startsWith('Añadir tarea:')) {
    const task = text.slice(14).trim(); // Elimina el prefijo "Añadir tarea:"
    
    // Guardar la tarea en Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ chat_id: chatId, task: task }]);

    if (error) {
      return res.status(500).send('Error guardando tarea');
    }

    // Responder al usuario
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Tarea añadida: ${task}`,
      }),
    });

    return res.status(200).send('Tarea añadida');
  }

  // Si el usuario quiere ver sus tareas
  if (text === 'Mis tareas') {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('chat_id', chatId);

    if (error) {
      return res.status(500).send('Error obteniendo tareas');
    }

    const tasksList = data.map((task) => `- ${task.task}`).join('\n');

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: tasksList || 'No tienes tareas pendientes.',
      }),
    });

    return res.status(200).send('Tareas enviadas');
  }

  return res.status(200).send('Comando no reconocido');
};


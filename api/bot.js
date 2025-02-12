import fetch from 'node-fetch'; // Para interactuar con la API de Telegram
import { createClient } from '@supabase/supabase-js'; // Para interactuar con Supabase

// Token del bot de Telegram desde las variables de entorno
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// Conexión a Supabase desde las variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Establece un tamaño adecuado de cuerpo
    },
  },
};

export default async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send('No message received');
  }

  const text = message.text;
  const chatId = message.chat.id; // Obtener el chat_id desde el mensaje recibido

  // Si quieres gestionar tareas (sin guardar chat_id):
  if (text.startsWith('/add') && text.length > 5) {
    const task = text.slice(5).trim(); // Extraer tarea del mensaje

    // Almacenar la tarea en Supabase
    const { data, error } = await supabase
    .from('tasks')
    .insert([{ chat_id: message.chat.id, task }]);


    if (error) {
      return res.status(500).send('Error guardando la tarea');
    }

    // Responder al usuario en Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Tarea añadida: ${task}`,
      }),
    });

    return res.status(200).send(`Tarea añadida: ${task}`);
  }

  // Si quieres ver las tareas (sin chat_id):
  if (text === '/tasks') {
    const { data, error } = await supabase.from('tasks').select();

    if (error) {
      return res.status(500).send('Error al obtener las tareas');
    }

    if (data.length === 0) {
      return res.status(200).send('No tienes tareas pendientes.');
    }

    let tasksMessage = 'Tus tareas:\n';
    data.forEach((task, index) => {
      tasksMessage += `${index + 1}. ${task.task}\n`;
    });

    // Responder al usuario con las tareas
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: tasksMessage,
      }),
    });

    return res.status(200).send(tasksMessage);
  }

  return res.status(200).send('Comando no reconocido');
};

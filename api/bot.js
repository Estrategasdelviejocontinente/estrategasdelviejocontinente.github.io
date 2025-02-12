import fetch from 'node-fetch'; // Para interactuar con la API de Telegram
import { createClient } from '@supabase/supabase-js'; // Para interactuar con Supabase

// Token del bot de Telegram desde las variables de entorno
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// Conexión a Supabase desde las variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send('No message received');
  }

  const text = message.text;

  // Si quieres gestionar tareas (sin guardar chat_id):
  if (text.startsWith('/add')) {
    const task = text.replace('/add ', ''); // Extraer tarea del mensaje
    // Aquí solo almacenarías la tarea en Supabase sin el chat_id
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ task }]);  // Solo insertamos la tarea, sin el chat_id

    if (error) {
      return res.status(500).send('Error guardando la tarea');
    }

    return res.status(200).send(`Tarea añadida: ${task}`);
  }
console.log("Conectando a Supabase...");
const { data, error } = await supabase
  .from('tasks')
  .insert([{ task }]);

if (error) {
  console.error("Error al insertar tarea:", error);
  return res.status(500).send("Error al guardar la tarea");
}

console.log("Tarea guardada:", data);
return res.status(200).send(`Tarea añadida: ${task}`);

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

    return res.status(200).send(tasksMessage);
  }

  return res.status(200).send('Comando no reconocido');
};


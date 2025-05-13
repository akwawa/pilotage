import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';

interface Task {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
  participants: string[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  participants: string[];
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (tasks && tasks.length > 0 && ganttRef.current) {
      const ganttTasks = tasks.map(task => ({
        id: task.id,
        name: task.title,
        start: task.start_date,
        end: task.end_date,
        progress: 0,
      }));

      if (ganttInstance.current) {
        ganttInstance.current.refresh(ganttTasks);
      } else {
        ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
          view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
          view_mode: 'Week',
          date_format: 'YYYY-MM-DD',
          on_click: (task: any) => {
            console.log(task);
          },
        });
      }
    }
  }, [tasks]);

  if (!project) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{project.title}</h2>
        <p className="text-gray-600 mb-4">{project.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <p>Start Date: {new Date(project.start_date).toLocaleDateString()}</p>
            <p>End Date: {new Date(project.end_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p>Participants:</p>
            <ul className="list-disc list-inside">
              {project.participants.map((participant, index) => (
                <li key={index}>{participant}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Tasks</h3>
        <div ref={ganttRef} className="gantt-container"></div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Task List</h3>
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div key={task.id} className="border rounded p-4">
              <h4 className="font-semibold">{task.title}</h4>
              <p className="text-gray-600">{task.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>Start: {new Date(task.start_date).toLocaleDateString()}</p>
                <p>End: {new Date(task.end_date).toLocaleDateString()}</p>
                <p>Participants: {task.participants.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}